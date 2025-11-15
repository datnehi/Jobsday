package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OverviewDto {
    private long newCompaniesToday;
    private long newCandidatesToday;
    private long activeJobs;
    private long totalApplicationsNow;
}

