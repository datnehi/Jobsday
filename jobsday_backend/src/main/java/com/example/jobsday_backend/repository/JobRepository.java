package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.entity.Job.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    Job findJobById(Long id);

    @Query(value = """
        SELECT
             j.id,
             j.title,
             c.name AS company_name,
             j.location,
             j.salary,
             j.level,
             j.job_type,
             j.updated_at,
             COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills,
             (
                 ts_rank(j.search_tsv, (phraseto_tsquery('english', q.title) || plainto_tsquery('simple', q.title))) * 5
                 + ts_rank(j.search_tsv, (plainto_tsquery('english', q.title) || plainto_tsquery('simple', q.title))) * 2
                 + CASE WHEN j.location = q.location THEN 1 ELSE 0 END
                 + CASE WHEN j.level = q.level THEN 0.5 ELSE 0 END
                 + COUNT(DISTINCT CASE WHEN sk.name IN (
                             SELECT sk2.name
                             FROM job_skills js2
                             JOIN skills sk2 ON sk2.id = js2.skill_id
                             WHERE js2.job_id = q.id
                         ) THEN sk.name END) * 0.25
             ) AS score,
             CASE WHEN :candidateId IS NOT NULL AND sj.id IS NOT NULL THEN TRUE ELSE FALSE END AS saved
         FROM jobs j
         JOIN companies c ON j.company_id = c.id
         LEFT JOIN job_skills js ON js.job_id = j.id
         LEFT JOIN skills sk ON sk.id = js.skill_id
         -- join saved_jobs nếu có candidate
         LEFT JOIN saved_jobs sj
                ON sj.job_id = j.id
               AND (:candidateId IS NOT NULL AND sj.candidate_id = :candidateId)
         -- join applications nếu có candidate
         LEFT JOIN applications a
                ON a.job_id = j.id
               AND (:candidateId IS NOT NULL AND a.candidate_id = :candidateId)
         CROSS JOIN (
             SELECT
                 id,
                 title,
                 level,
                 location
             FROM jobs
             WHERE id = :jobId
         ) q
         WHERE j.id <> q.id
           AND (:candidateId IS NULL OR a.id IS NULL)
           AND j.status = 'ACTIVE'
           AND j.deadline > NOW()
         GROUP BY j.id, c.name, q.level, q.location, q.title, sj.id
         ORDER BY score DESC, j.updated_at DESC
         LIMIT 10
        """, nativeQuery = true)
    List<Object[]> findTopSimilarJobsRaw(@Param("jobId") Long jobId, @Param("candidateId") Long candidateId);

    @Query(value = """
            SELECT
                j.id,
                j.title,
                j.location,
                j.salary,
                j.level,
                j.job_type,
                j.updated_at,
                COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills,
                CASE WHEN :candidateId IS NOT NULL AND a.id IS NOT NULL THEN TRUE ELSE FALSE END AS applied,
                CASE WHEN :candidateId IS NOT NULL AND sj.id IS NOT NULL THEN TRUE ELSE FALSE END AS saved
            FROM jobs j
            LEFT JOIN job_skills js ON js.job_id = j.id
            LEFT JOIN skills sk ON sk.id = js.skill_id
            LEFT JOIN saved_jobs sj ON sj.job_id = j.id
                AND (:candidateId IS NULL OR sj.candidate_id = :candidateId)
            LEFT JOIN applications a ON a.job_id = j.id
                AND (:candidateId IS NULL OR a.candidate_id = :candidateId)
            WHERE j.company_id = :companyId
                AND j.status = 'ACTIVE'
                AND j.deadline > NOW()
                AND (
                    :q IS NULL
                    OR j.search_tsv @@ to_tsquery('english', :q || ':*')
                    OR j.search_tsv @@ to_tsquery('simple', :q || ':*')
                    OR similarity(j.title, :q) > 0.3
                    OR similarity(j.description, :q) > 0.3
                )
            GROUP BY j.id, j.level, j.location, a.id, sj.id
            ORDER BY j.updated_at DESC
            LIMIT :limit OFFSET :offset""",
            nativeQuery = true)
    List<Object[]> findJobOfCompanyByStatus(@Param("companyId") long companyId,
                                            @Param("candidateId") Long candidateId,
                                            @Param("q") String q,
                                            @Param ("limit") int limit,
                                            @Param("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(DISTINCT j.id)
        FROM jobs j
        WHERE j.company_id = :companyId
          AND j.status = 'ACTIVE'
          AND j.deadline > NOW()
          AND (
            :q IS NULL
            OR j.search_tsv @@ to_tsquery('english', :q || ':*')
            OR j.search_tsv @@ to_tsquery('simple', :q || ':*')
            OR similarity(j.title, :q) > 0.3
            OR similarity(j.description, :q) > 0.3
            )
        GROUP BY j.id, j.level, j.location, a.id, sj.id
    """, nativeQuery = true)
    int countJobOfCompanyByStatus(@Param("companyId") long companyId,
                                  @Param("q") String q);

}
