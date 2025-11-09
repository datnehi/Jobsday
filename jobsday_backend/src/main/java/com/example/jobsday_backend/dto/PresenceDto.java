package com.example.jobsday_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PresenceDto {
    private Long userId;
    private String status;
    private LocalDateTime lastOnlineAt;
}
