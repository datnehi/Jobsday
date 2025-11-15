package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Application findByJobIdAndCandidateId(Long jobId, Long candidateId);

    @Query(value = """
                SELECT a.id, a.job_id, j.title, c.id, c.name, c.logo, a.status, a.cv_url, a.file_name, a.cover_letter, a.applied_at , a.updated_at
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
                SELECT a.id, a.job_id, j.title, c.id, c.name, c.logo, a.status, a.cv_url, a.file_name, a.cover_letter, a.applied_at , a.updated_at
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

    @Query(value = """
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

    @Query(value = """
            SELECT COUNT(a.id)
            FROM applications a
            WHERE a.job_id = :jobId
            """,
            nativeQuery = true
    )
    long countByJobId(@Param("jobId") Long jobId);

    List<Application> findByJobId(Long jobId);

    @Query(value = """
                SELECT 
                    to_char(a.applied_at, 'YYYY-MM-DD') AS day,
                    COUNT(*) AS count
                FROM applications a
                WHERE a.applied_at >= now() - make_interval(days => :days)
                GROUP BY day
                ORDER BY day
            """, nativeQuery = true)
    List<Object[]> countApplicationsByDay(@Param("days") int days);

    @Query(value = """
            SELECT COUNT(*) FROM applications
            WHERE applied_at >= now() - make_interval(days => :days)
            """, nativeQuery = true)
    long totalApplications(@Param("days") int days);

    @Query(value = """
                SELECT COUNT(*)
                FROM applications
                WHERE status IN ('SUITABLE', 'UNSUITABLE')
                    AND applied_at >= now() - make_interval(days => :days)
            """, nativeQuery = true)
    long totalEmployerResponses(@Param("days") int days);

    @Query(value = """
                SELECT j.title, COUNT(a.id)
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                WHERE a.applied_at >= now() - make_interval(days => :days)
                GROUP BY j.title
                ORDER BY COUNT(a.id) DESC
                LIMIT 10
            """, nativeQuery = true)
    List<Object[]> topJobs(@Param("days") int days);

    @Query(value = """
                SELECT j.level, COUNT(a.id)
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                WHERE a.applied_at >= now() - make_interval(days => :days)
                GROUP BY j.level
                ORDER BY COUNT(a.id) DESC
            """, nativeQuery = true)
    List<Object[]> applicationsByLevel(@Param("days") int days);

    @Query(value = """
            SELECT COUNT(*) FROM applications
            WHERE applied_at = now()
            """, nativeQuery = true)
    long totalApplicationsNow();

    @Query(value = """
                SELECT 
                    s.name AS skill_name,
                    COUNT(a.id) AS application_count
                FROM applications a
                JOIN job_skills js ON js.job_id = a.job_id
                JOIN skills s ON s.id = js.skill_id
                WHERE a.applied_at >= NOW() - make_interval(days => :days)
                GROUP BY s.name
                ORDER BY application_count DESC
                LIMIT 10
            """, nativeQuery = true)
    List<Object[]> topSkillsByApplications(@Param("days") int days);

    @Query(value = """
        SELECT COUNT(a.id)
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = :companyId
            AND a.applied_at >= now() - make_interval(days => :days)
    """, nativeQuery = true)
    long countTotalApplications(@Param("companyId") Long companyId, @Param("days") int days);

    @Query(value = """
        SELECT COUNT(a.id)
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = :companyId
          AND a.status = 'SUITABLE'
            AND a.applied_at >= now() - make_interval(days => :days)
    """, nativeQuery = true)
    long countFitApplications(long companyId, int days);

    @Query(value = """
        SELECT 
            DATE(a.applied_at) AS day,
            COUNT(*) AS total
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = :companyId
          AND a.applied_at >= NOW() - make_interval(days => :days)
        GROUP BY DATE(a.applied_at)
        ORDER BY day ASC
    """, nativeQuery = true)
    List<Object[]> getApplicationGrowth(long companyId, int days);

    @Query(value = """
        SELECT j.title, COUNT(a.id) AS total
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = :companyId
          AND a.applied_at >= NOW() - make_interval(days => :days)
        GROUP BY j.id, j.title
        ORDER BY total DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> getTopJobs(long companyId, int days);

    @Query(value = """
        SELECT 
            u.full_name AS hr_name,
            COUNT(a.id) AS fit_count
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN company_members cm ON j.member_id = cm.id
        JOIN users u ON cm.user_id = u.id
        WHERE j.company_id = :companyId
          AND a.status = 'SUITABLE'
          AND a.applied_at >= NOW() - make_interval(days => :days)
        GROUP BY u.id
        ORDER BY fit_count DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> getTopHrFit(long companyId, int days);

}

