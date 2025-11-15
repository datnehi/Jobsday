package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopCandidateDto {
    private String name;
    private long applications;
}

