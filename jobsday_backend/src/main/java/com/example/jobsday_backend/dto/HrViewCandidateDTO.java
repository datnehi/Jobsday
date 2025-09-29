package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HrViewCandidateDTO {
    private String hrName;
    private Long companyId;
    private String companyName;
    private String companyLogo;
    private String viewedAt;
}
