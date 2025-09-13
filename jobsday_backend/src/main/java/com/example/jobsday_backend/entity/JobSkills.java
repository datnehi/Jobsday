package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "job_skills")
@Data
public class JobSkills {
    @EmbeddedId
    private JobSkillKey id;
}
