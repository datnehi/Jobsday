package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/company")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDto> getById(@PathVariable Long id) {
        Company company = companyService.getById(id);
        if (company == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Company not found", null));
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find company successfully", company)
        );
    }

    @PutMapping
    public ResponseEntity<ResponseDto> update(@RequestBody Company company) {
        Company companyInfo = companyService.getById(company.getId());
        if (companyInfo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Company not found", null));
        }
        companyInfo.setName(company.getName());
        companyInfo.setLocation(company.getLocation());
        companyInfo.setAddress(company.getAddress());
        companyInfo.setWebsite(company.getWebsite());
        companyInfo.setTaxCode(company.getTaxCode());
        companyInfo.setEmail(company.getEmail());
        companyInfo.setDescription(company.getDescription());
        Company updatedCompany = companyService.create(company);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update company successfully", updatedCompany)
        );
    }

    @PutMapping("/update-logo/{companyId}")
    public ResponseEntity<ResponseDto> updateLogo(
            @PathVariable Long companyId,
            @RequestParam("file") MultipartFile file) {
        companyService.updateLogo(companyId, file);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update avatar successfully", null)
        );
    }
}