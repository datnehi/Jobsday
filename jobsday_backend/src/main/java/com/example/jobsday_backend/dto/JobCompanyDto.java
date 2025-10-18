package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobCompanyDto {
    private Long id;
    private String title;
    private String location;
    private String address;
    private String description;
    private String requirement;
    private String benefit;
    private String workingTime;
    private String jobType;
    private String level;
    private String contractType;
    private String salary;
    private String experience;
    private Integer quantity;
    private Date deadline;
    private String status;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private Long memberId;
    private String memberName;
    private String memberPosition;
    private String skills;
}
