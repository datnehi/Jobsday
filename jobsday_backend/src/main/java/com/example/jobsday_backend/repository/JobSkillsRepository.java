package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.JobSkillKey;
import com.example.jobsday_backend.entity.JobSkills;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobSkillsRepository extends JpaRepository<JobSkills, JobSkillKey> {
    List<JobSkills> findByIdJobId(Long jobId);
}
