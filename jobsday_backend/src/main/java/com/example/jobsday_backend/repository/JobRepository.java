package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Job;
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
            COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN job_skills js ON js.job_id = j.id
        LEFT JOIN skills sk ON sk.id = js.skill_id
        WHERE j.id <> :jobId
        GROUP BY j.id, c.name
        ORDER BY
            (
                CASE WHEN (
                    j.search_tsv @@ (plainto_tsquery('english', :title) || plainto_tsquery('simple', :title))
                ) THEN 1 ELSE 0 END
                + CASE WHEN j.level = :level THEN 1 ELSE 0 END
                + CASE WHEN j.location = :location THEN 1 ELSE 0 END
            ) DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> findTopSimilarJobsRaw(@Param("jobId") Long jobId,
                                         @Param("title") String title,
                                         @Param("level") String level,
                                         @Param("location") String location);

}
