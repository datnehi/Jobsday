package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopSkillDto {
    private String skillName;
    private long applicationCount;
}
