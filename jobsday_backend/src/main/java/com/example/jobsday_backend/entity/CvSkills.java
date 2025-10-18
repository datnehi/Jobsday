package com.example.jobsday_backend.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cv_skills")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CvSkills {
    @EmbeddedId
    private CvSkillKey id;
}
