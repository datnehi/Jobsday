package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyCountDto {
    private String day;
    private long count;
}

