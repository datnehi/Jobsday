package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {
    @Autowired
    private CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public List<Company> getAll() {
        return companyRepository.findAll();
    }

    public Company getById(Long id) {
        return companyRepository.findCompanyById(id);
    }

    public Company create(Company company) {
        return companyRepository.save(company);
    }

//    public Company update(Long id, Company updated) {
//        Company company = getById(id);
//        company.setName(updated.getName());
//        company.setAddress(updated.getAddress());
//        company.setTaxCode(updated.getTaxCode());
//        company.setWebsite(updated.getWebsite());
//        company.setDescription(updated.getDescription());
//        company.setStatus(updated.getStatus());
//        return companyRepository.save(company);
//    }
//
//    public boolean delete(Long id) {
//        if (!companyRepository.existsById(id)) {
//            return false;
//        }
//        companyRepository.deleteById(id);
//        return true;
//    }

}
