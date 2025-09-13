package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Skills;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillsRepository extends JpaRepository<Skills, Long> {
}
