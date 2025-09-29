package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cvs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Cvs {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String title;
    private String fileUrl;
    private String fileType;
    private String address;
    private String jobTitle;
    @Enumerated(EnumType.STRING)
    private Level level;
    @Enumerated(EnumType.STRING)
    private Experience experience;

    @Column(columnDefinition = "TEXT")
    private String content; // text đã parse

    private Boolean isPublic = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Getter
    public enum Experience {
        KHONG_YEU_CAU,
        DUOI_1_NAM,
        MOT_NAM,
        HAI_NAM,
        BA_NAM,
        BON_NAM,
        NAM_NAM,
        TREN_5_NAM
    }

    public enum Level {
        FRESHER,
        INTERN,
        JUNIOR,
        SENIOR
    }
}
