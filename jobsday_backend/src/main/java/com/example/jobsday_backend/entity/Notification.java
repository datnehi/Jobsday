package com.example.jobsday_backend.entity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_from", nullable = false)
    private Long userFrom;

    @Column(name = "user_to", nullable = false)
    private Long userTo;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    private String url;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
