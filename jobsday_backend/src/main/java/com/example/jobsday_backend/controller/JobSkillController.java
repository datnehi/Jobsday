package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.service.JobSkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobskill")
@RequiredArgsConstructor
public class JobSkillController {
    @Autowired
    private JobSkillService jobSkillService;

    @GetMapping("/{jobId}")
    public ResponseEntity<ResponseDto> getSkillsByJobId(@PathVariable Long jobId) {
        List<Skills> skills =  jobSkillService.getSkillsByJobId(jobId);
        if (skills == null || skills.isEmpty()) {
            return ResponseEntity.ok(
                    new ResponseDto(HttpStatus.OK.value(), "Skills is empty", null)
            );
        };
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find company successfully", skills)
        );
    }
}
