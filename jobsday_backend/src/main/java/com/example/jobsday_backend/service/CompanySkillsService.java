package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.CompanySkillKey;
import com.example.jobsday_backend.entity.CompanySkills;
import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.repository.CompanySkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class CompanySkillsService {
    @Autowired
    private CompanySkillsRepository companySkillsRepository;

    @Autowired
    private SkillService skillService;

    public List<Skills> getSkillsByCompanyId(Long companyId) {
        List<CompanySkills> jobSkills = companySkillsRepository.findById_CompanyId(companyId);

        return jobSkills.stream()
                .map(js -> skillService.findSkillById(js.getId().getSkillId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateCompanySkills(Long companyId, List<Long> newSkillIds) {
        companySkillsRepository.deleteById_CompanyId(companyId);
        List<CompanySkills> entities = newSkillIds.stream()
                .map(skillId -> new CompanySkills(new CompanySkillKey(companyId, skillId)))
                .toList();

        companySkillsRepository.saveAll(entities);

    }
}
