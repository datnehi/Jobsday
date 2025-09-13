package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.repository.SkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SkillService {
    @Autowired
    private SkillsRepository skillsRepository;

    public Skills findSkillById(Long id) {
        return skillsRepository.findById(id).orElse(null);
    }
}
