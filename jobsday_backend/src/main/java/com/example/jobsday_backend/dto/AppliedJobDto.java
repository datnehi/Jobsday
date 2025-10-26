package com.example.jobsday_backend.dto;

import com.example.jobsday_backend.entity.Application;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppliedJobDto {
    private Long id;
    private Long jobId;
    private String title;
    private Long companyId;
    private String companyName;
    private String companyLogo;
    private Application.ApplicationStatus status;
    private String cvUrl;
    private String fileName;
    private String coverLetter;
    private String appliedAt;
    private String updatedAt;
}
