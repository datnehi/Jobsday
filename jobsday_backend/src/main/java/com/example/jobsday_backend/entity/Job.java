package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String requirement;

    @Column(nullable = false)
    private String benefit;

    @Column(nullable = false)
    private String workingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Location location;

    @Column(nullable = false)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Salary salary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Experience experience;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ================== ENUMS ==================

    public enum JobStatus { ACTIVE, HIDDEN, CLOSED }

    public enum Location {
        HANOI,
        DANANG,
        HOCHIMINH
    }

    public enum JobType {
        IN_OFFICE,
        HYBRID,
        REMOTE
    }

    public enum Level {
        FRESHER,
        INTERN,
        JUNIOR,
        SENIOR
    }

    public enum ContractType {
        FULL_TIME,
        PART_TIME,
        FREELANCE
    }

    public enum Salary {
        DUOI_10_TRIEU,
        TU_10_DEN_15_TRIEU,
        TU_15_DEN_20_TRIEU,
        TU_20_DEN_25_TRIEU,
        TU_25_DEN_30_TRIEU,
        TU_30_DEN_50_TRIEU,
        TREN_50_TRIEU,
        THOA_THUAN
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

    // ================== HOOKS ==================
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
}
