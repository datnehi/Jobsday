package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "hr_view_candidate", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"hr_id", "candidate_id"})
})
@Data
public class HrViewCandidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hr_id", nullable = false)
    private Long hrId;

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

}