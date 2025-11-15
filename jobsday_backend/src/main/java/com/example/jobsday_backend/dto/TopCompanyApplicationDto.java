package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopCompanyApplicationDto {
    private String company;
    private long applications;
}
