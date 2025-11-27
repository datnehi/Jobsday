package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CvResult {
    private String jobTitle;
    private String level;
    private String experience;
    private List<String> skills;
}


