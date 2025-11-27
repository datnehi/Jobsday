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
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CvSkillsService {
    @Autowired
    private CvSkillsRepository cvSkillsRepository;

    @Autowired
    private SkillsRepository skillRepository;

    @Transactional
    public void saveCvSkills(Long cvId, List<String> skills) {
        if (skills == null || skills.isEmpty()) return;

        List<Skills> allSkills = skillRepository.findAll();

        Map<String, Skills> skillMap = allSkills.stream()
                .collect(Collectors.toMap(s -> s.getName().toLowerCase(), Function.identity()));

        for (String skillName : skills) {
            if (skillName == null || skillName.isBlank()) continue;

            Skills skillEntity = skillMap.get(skillName.toLowerCase());
            if (skillEntity == null) continue;
            boolean exists = cvSkillsRepository.existsById_CvIdAndId_SkillId(cvId, skillEntity.getId());
            if (!exists) {
                CvSkills cvSkill = new CvSkills();
                CvSkillKey cvSkillKey = new CvSkillKey(cvId, skillEntity.getId());
                cvSkill.setId(cvSkillKey);
                cvSkillsRepository.save(cvSkill);
            }
        }
    }
}
