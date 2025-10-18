package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Cvs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CvsRepository extends JpaRepository<Cvs, Long> {
    public List<Cvs> findByUserId(Long userId);

    @Query(value = """
        SELECT COUNT(DISTINCT cvs.id)
        FROM cvs
        WHERE cvs.user_id = :candidateId
        """, nativeQuery = true)
    int countCvOfCandidate(@Param("candidateId") long candidateId);

    public Cvs findTopByUserIdOrderByUpdatedAtDesc(Long userId);
}
