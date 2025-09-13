package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);

    Application findByJobIdAndCandidateId(Long jobId, Long candidateId);
}

