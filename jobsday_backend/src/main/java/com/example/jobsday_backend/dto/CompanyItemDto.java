package com.example.jobsday_backend.dto;

import com.example.jobsday_backend.entity.Company;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CompanyItemDto {
    private Long id;
    private String name;
    private String logo;
    private Company.Location location;
    private String[] skills;
}
