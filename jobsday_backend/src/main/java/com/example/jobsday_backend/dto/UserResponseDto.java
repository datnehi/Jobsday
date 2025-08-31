package com.example.jobsday_backend.dto;

import com.example.jobsday_backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private LocalDate dob;
    private String avatarUrl;
    private User.Role role;
    private User.Status status;

    public UserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.dob = user.getDob();
        this.avatarUrl = user.getAvatarUrl();
        this.role = user.getRole();
        this.status = user.getStatus();
    }
}
