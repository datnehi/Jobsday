package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Company findCompanyById(Long id);

    Company findCompanyByIdAndStatus(Long id, Company.CompanyStatusEnum status);
}
