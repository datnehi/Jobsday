package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Data
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column( nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Location location;

    private String logo;

    @Column( nullable = false)
    private String address;

    private String website;

    @Column(name = "tax_code", nullable = false)
    private String taxCode;

    private String email;

    private String description;

    @Enumerated(EnumType.STRING)
    private CompanyStatusEnum status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum CompanyStatusEnum {
        PENDING, APPROVED, INACTIVE, REJECTED
    }

    public enum Location {
        HANOI,
        DANANG,
        HOCHIMINH
    }

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
