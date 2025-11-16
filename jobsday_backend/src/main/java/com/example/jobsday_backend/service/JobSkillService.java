package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.JobSkillKey;
import com.example.jobsday_backend.entity.JobSkills;
import com.example.jobsday_backend.entity.Skills;
import com.example.jobsday_backend.repository.JobSkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class JobSkillService {

    @Autowired
    private JobSkillsRepository jobSkillsRepository;

    @Autowired
    private SkillService skillService;

    public List<Skills> getSkillsByJobId(Long jobId) {
        List<JobSkills> jobSkills = jobSkillsRepository.findByIdJobId(jobId);

        return jobSkills.stream()
                .map(js -> skillService.findSkillById(js.getId().getSkillId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateJobSkills(Long jobId, List<Long> newSkillIds) {
        jobSkillsRepository.deleteById_JobId(jobId);
        List<JobSkills> entities = newSkillIds.stream()
                .map(skillId -> new JobSkills(new JobSkillKey(jobId, skillId)))
                .toList();

        jobSkillsRepository.saveAll(entities);

    }


}

