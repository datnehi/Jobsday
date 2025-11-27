package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.service.CompanySkillsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companyskill")
@RequiredArgsConstructor
public class CompanySkillController {
    @Autowired
    private CompanySkillsService companySkillsService;

    @GetMapping("/{companyId}")
    public ResponseEntity<ResponseDto> getSkillsByCompanyId(@PathVariable Long companyId) {
        List<Skills> skills =  companySkillsService.getSkillsByCompanyId(companyId);
        if (skills == null || skills.isEmpty()) {
            return ResponseEntity.ok(
                    new ResponseDto(HttpStatus.OK.value(), "Skills is empty", null)
            );
        };
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find company successfully", skills)
        );
    }

    @PutMapping("/update/{companyId}")
    public ResponseEntity<ResponseDto> updateJobSkills(
            @PathVariable Long companyId,
            @RequestBody List<Long> newSkillIds) {
        companySkillsService.updateCompanySkills(companyId, newSkillIds);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update Company Skills successfully", null)
        );
    }
}

