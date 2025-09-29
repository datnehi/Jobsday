package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);

    Application findByJobIdAndCandidateId(Long jobId, Long candidateId);

    @Query(value = """
        SELECT a.id, j.title, c.name, a.status, a.cv_url, a.file_name, a.file_type, a.applied_at , a.updated_at
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        WHERE a.candidate_id = :candidateId
            AND a.status = :status
        ORDER BY a.applied_at DESC
        LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> findApplicationsByCandidateIdAndStatus(
            @Param("candidateId") Long candidateId,
            @Param("status") String status,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
        SELECT a.id, j.title, c.name, a.status, a.cv_url, a.file_name, a.file_type, a.applied_at , a.updated_at
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        WHERE a.candidate_id = :candidateId
        ORDER BY a.applied_at DESC
        LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> findApplicationsByCandidateId(
            @Param("candidateId") Long candidateId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(a.id)
        FROM applications a
        WHERE a.candidate_id = :candidateId
          AND a.status = :status
    """, nativeQuery = true)
    long countApplicationsByCandidateIdAndStatus(
            @Param("candidateId") long candidateId,
            @Param("status") String status
    );

    @Query(value = """
        SELECT COUNT(a.id)
        FROM applications a
        WHERE a.candidate_id = :candidateId
    """, nativeQuery = true)
    long countApplicationsByCandidateId(
            @Param("candidateId") long candidateId
    );

}

