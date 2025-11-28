package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "user_id"})
})
@Data
public class CompanyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String position;

    @Column(name = "is_admin", nullable = false)
    private Boolean isAdmin = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberStatusEnum status = MemberStatusEnum.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum MemberStatusEnum {
        PENDING, APPROVED, REJECTED, INACTIVE
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
