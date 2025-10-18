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
        SELECT a.id, a.job_id, j.title, c.name, c.logo, a.status, a.cv_url, a.file_name, a.applied_at , a.updated_at
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
        SELECT a.id, a.job_id, j.title, c.name, c.logo, a.status, a.cv_url, a.file_name, a.applied_at , a.updated_at
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

    @Query( value = """
        SELECT a.id, a.candidate_id, a.cover_letter, a.status, a.applied_at,
               u.full_name AS candidate_name, u.avatar_url AS candidate_avatar,
               u.email AS candidate_email, u.phone AS candidate_phone
        FROM applications a
        JOIN users u ON a.candidate_id = u.id
        WHERE a.job_id = :jobId
        ORDER BY a.applied_at DESC
        LIMIT :limit OFFSET :offset
        """,
        nativeQuery = true
    )
    List<Object[]> findByJobId(
            @Param("jobId") Long jobId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query( value = """
        SELECT COUNT(a.id)
        FROM applications a
        WHERE a.job_id = :jobId
        """,
        nativeQuery = true
    )
    long countByJobId(@Param("jobId") Long jobId);
}

