package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/company")
public class CompanyController {
    @Autowired
    private CompanyService companyService;

    // Lấy danh sách công ty
//    @GetMapping
//    public ResponseEntity<ResponseDto> getAll() {
//        List<Company> companies = companyService.getAll();
//        return ResponseEntity.ok(
//                new ResponseDto(HttpStatus.OK.value(), "Get all companies successfully", companies)
//        );
//    }

    // Lấy chi tiết công ty
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

    // Tạo mới công ty
    @PostMapping
    public ResponseEntity<ResponseDto> create(@RequestBody Company company) {
        Company createdCompany = companyService.create(company);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "Create company successfully", createdCompany));
    }

//    // Cập nhật công ty
//    @PutMapping("/{id}")
//    public ResponseEntity<ResponseDto> update(@PathVariable Long id, @RequestBody Company company) {
//        Company updatedCompany = companyService.update(id, company);
//        if (updatedCompany == null) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Company not found", null));
//        }
//        return ResponseEntity.ok(
//                new ResponseDto(HttpStatus.OK.value(), "Update company successfully", updatedCompany)
//        );
//    }
//
//    // Xóa công ty
//    @DeleteMapping("/{id}")
//    public ResponseEntity<ResponseDto> delete(@PathVariable Long id) {
//        boolean deleted = companyService.delete(id);
//        if (!deleted) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Company not found", null));
//        }
//        return ResponseEntity.ok(
//                new ResponseDto(HttpStatus.OK.value(), "Delete company successfully", null)
//        );
//    }
}