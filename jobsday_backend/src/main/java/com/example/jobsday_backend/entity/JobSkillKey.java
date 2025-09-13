package com.example.jobsday_backend.entity;

import jakarta.persistence.Embeddable;
import lombok.Data;

import java.io.Serializable;

@Embeddable
@Data
public class JobSkillKey implements Serializable {
    private Long jobId;
    private Long skillId;
}

