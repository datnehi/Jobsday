package com.example.jobsday_backend.dto;

import com.example.jobsday_backend.entity.User;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequestDto {
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private LocalDate dob;
    private String avatar_url;
    private User.Role role;
}