package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CandidateSearchDto {
    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String address;
    private String phone;
    private String avatarUrl;
    private String fileUrl;
    private String level;
    private String experience;
}
