package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.HrViewCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface HrViewCandidateRepository extends JpaRepository<HrViewCandidate, Long> {
    @Query(value = """
        SELECT u.full_name AS hrName,
               c.id AS companyId,
               c.name AS companyName,
               c.logo AS companyLogo,
               hvc.updated_at AS viewedAt
        FROM hr_view_candidate hvc
        JOIN company_members hr ON hvc.hr_id = hr.id
        JOIN users u ON hr.user_id = u.id
        JOIN companies c ON hr.company_id = c.id
        WHERE hvc.candidate_id = :candidateId
        ORDER BY hvc.updated_at DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> findHrViewsByCandidate(
            @Param("candidateId") Long candidateId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(DISTINCT hvc.id)
        FROM hr_view_candidate hvc
        WHERE hvc.candidate_id = :candidateId
        """, nativeQuery = true)
    long countHrViewsByCandidate(@Param("candidateId") Long candidateId);
}
