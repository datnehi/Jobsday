package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.JobSkillKey;
import com.example.jobsday_backend.entity.JobSkills;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobSkillsRepository extends JpaRepository<JobSkills, JobSkillKey> {
    List<JobSkills> findByIdJobId(Long jobId);
}
