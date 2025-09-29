package com.example.jobsday_backend.dto;

import com.example.jobsday_backend.entity.Job;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JobItemDto {
    private Long id;
    private String title;
    private String companyName;
    private String companyLogo;
    private Job.Location location;
    private Job.Salary salary;
    private Job.Level level;
    private Job.JobType jobType;
    private String postedAt;
    private String[] skills;
    private boolean applied;
    private String savedAt;
    private boolean saved;
}
