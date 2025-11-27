package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.CompanySkillKey;
import com.example.jobsday_backend.entity.CompanySkills;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CompanySkillsRepository extends JpaRepository<CompanySkills, CompanySkillKey> {
    List<CompanySkills> findById_CompanyId(Long companyId);

    @Modifying
    @Query("DELETE FROM CompanySkills cs WHERE cs.id.companyId = ?1")
    void deleteById_CompanyId(Long companyId);
}