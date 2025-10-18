package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "job_skills")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobSkills {
    @EmbeddedId
    private JobSkillKey id;
}
