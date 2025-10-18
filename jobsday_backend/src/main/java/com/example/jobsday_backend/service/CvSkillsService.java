package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.CvSkillKey;
import com.example.jobsday_backend.entity.CvSkills;
import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.repository.CvSkillsRepository;
import com.example.jobsday_backend.repository.SkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CvSkillsService {
    @Autowired
    private CvSkillsRepository cvSkillsRepository;

    @Autowired
    private SkillsRepository skillRepository;

    @Transactional
    public void saveCvSkills(Long cvId, String content) {
        if (content == null || content.isBlank()) return;

        List<Skills> allSkills = skillRepository.findAll();

        for (Skills skill : allSkills) {
            String skillName = skill.getName();
            if (containsIgnoreCase(content, skillName)) {
                boolean exists = cvSkillsRepository.existsById_CvIdAndId_SkillId(cvId, skill.getId());
                if (!exists) {
                    CvSkills cvSkill = new CvSkills();
                    CvSkillKey cvSkillKey = new CvSkillKey(cvId, skill.getId());
                    cvSkill.setId(cvSkillKey);
                    cvSkillsRepository.save(cvSkill);
                }
            }
        }
    }

    private boolean containsIgnoreCase(String text, String sub) {
        return text.toLowerCase().contains(sub.toLowerCase());
    }

}
