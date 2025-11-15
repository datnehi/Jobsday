package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopCompanyJobDto {
    private String company;
    private long jobs;
}

