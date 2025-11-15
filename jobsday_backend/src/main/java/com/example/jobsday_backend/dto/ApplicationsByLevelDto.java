package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApplicationsByLevelDto {
    private String level;
    private long applications;
}

