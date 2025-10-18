package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.service.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {
    @Autowired
    private SkillService skillService;

    @GetMapping
    public ResponseEntity<ResponseDto> getAllSkills() {
        List<Skills> skills = skillService.findAllSkills();
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get all skills successfully", skills)
        );
    }
}
