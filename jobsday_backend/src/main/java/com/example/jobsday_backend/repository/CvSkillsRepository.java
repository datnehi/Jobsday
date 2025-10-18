package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.CvSkillKey;
import com.example.jobsday_backend.entity.CvSkills;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CvSkillsRepository extends JpaRepository<CvSkills, CvSkillKey> {
    boolean existsById_CvIdAndId_SkillId(Long cvId, Long skillId);
}