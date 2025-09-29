package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.entity.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

    void deleteByCandidateIdAndJobId(Long candidateId, Long jobId);

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
            sj.saved_at,
            COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills,
            CASE WHEN :candidateId IS NOT NULL AND a.id IS NOT NULL THEN TRUE ELSE FALSE END AS applied
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN job_skills js ON js.job_id = j.id
        LEFT JOIN skills sk ON sk.id = js.skill_id
        LEFT JOIN applications a
                ON a.job_id = j.id
               AND  a.candidate_id = :candidateId
        WHERE sj.candidate_id = :candidateId
        GROUP BY j.id, c.name, j.level, j.location, j.title, j.salary, j.job_type, j.updated_at, sj.saved_at, applied
        ORDER BY sj.saved_at DESC
        LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> findJobsByCandidateId(
            @Param("candidateId") Long candidateId,
            @Param ("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(DISTINCT sj.id)
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.id
        WHERE sj.candidate_id = :candidateId
        """, nativeQuery = true)
    long countSavedJobOfCandidate(@Param("candidateId") long userId);
}

