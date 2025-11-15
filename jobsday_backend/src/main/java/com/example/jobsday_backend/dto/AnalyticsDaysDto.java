package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AnalyticsDaysDto {
    private List<DailyCountDto> applications;
    private long totalApplications;
    private long responseRate;
    private List<TopJobDto> topJobs;
    private List<TopCompanyJobDto> topCompaniesJobs;
    private List<TopCompanyApplicationDto> topCompaniesApplications;
    private List<DailyCountDto> jobsCreated;
    private List<TopCandidateDto> topCandidates;
    private List<TopSkillDto> topSkills;
}
