package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.CompanyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyMemberRepository extends JpaRepository<CompanyMember, Long> {
    List<CompanyMember> findByCompanyId(Long companyId);
    CompanyMember findByCompanyIdAndUserId(Long companyId, Long userId);
}
