package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HrStatsDto {
    public long activeJobs;
    public long totalApplications;
    public double fitRate;
    public double avgResponseHours;
    public List<DailyCountDto> growth;
    public List<TopJobDto> topJobs;
    public List<TopItem> topHr;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopItem {
        private String label;
        private int total;
    }
}
