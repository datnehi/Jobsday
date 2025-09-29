package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.entity.SavedJob;
import com.example.jobsday_backend.repository.SavedJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class SavedJobService {
    @Autowired
    private SavedJobRepository savedJobRepository;

    public boolean isJobSaved(Long candidateId, Long jobId) {
        return savedJobRepository.existsByCandidateIdAndJobId(candidateId, jobId);
    }

    @Transactional
    public void saveJob(Long candidateId, Long jobId) {
        if (savedJobRepository.existsByCandidateIdAndJobId(candidateId, jobId)) {
            throw new IllegalStateException("Job already saved");
        }
        SavedJob savedJob = new SavedJob();
        savedJob.setCandidateId(candidateId);
        savedJob.setJobId(jobId);
        savedJobRepository.save(savedJob);
    }

    @Transactional
    public void unsaveJob(Long candidateId, Long jobId) {
        savedJobRepository.deleteByCandidateIdAndJobId(candidateId, jobId);
    }

    public PageResultDto<JobItemDto> getSavedJobs(
            Long candidateId,
            int page,
            int size
    ) {
        int offset = page * size;
        List<Object[]> rows =  savedJobRepository.findJobsByCandidateId(candidateId, size, offset);

        List<JobItemDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            String jobTitle = (String) row[1];
            String companyName = (String) row[2];
            Job.Location jobLocation = Job.Location.valueOf((String) row[3]);
            Job.Salary jobSalary = Job.Salary.valueOf((String) row[4]);
            Job.Level jobLevel = Job.Level.valueOf((String) row[5]);
            Job.JobType jobJobType = Job.JobType.valueOf((String) row[6]);
            String updatedAt = row[7].toString();
            String savedAt = row[8].toString();

            String skillsStr = (String) row[9];
            String[] skills = (skillsStr == null || skillsStr.isBlank())
                    ? new String[0]
                    : skillsStr.split(",");
            boolean applied = row[10] != null && Boolean.parseBoolean(row[10].toString());

            result.add(JobItemDto.builder()
                    .id(id)
                    .title(jobTitle)
                    .companyName(companyName)
                    .location(jobLocation)
                    .salary(jobSalary)
                    .level(jobLevel)
                    .jobType(jobJobType)
                    .postedAt(updatedAt)
                    .savedAt(savedAt)
                    .skills(skills)
                    .applied(applied)
                    .build());
        }

        long totalElements = savedJobRepository.countSavedJobOfCandidate(candidateId);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                result,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }
}

