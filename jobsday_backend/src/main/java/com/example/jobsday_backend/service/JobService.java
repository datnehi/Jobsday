package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public Job findJobById(Long id) {
        return jobRepository.findJobById(id);
    }

    public List<JobItemDto> findTopSimilarJobs(Long jobId, Long candidateId) {
        List<Object[]> rows = jobRepository.findTopSimilarJobsRaw(jobId, candidateId);

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

            String skillsStr = (String) row[8];
            String[] skills = (skillsStr == null || skillsStr.isBlank())
                    ? new String[0]
                    : skillsStr.split(",");
            boolean saved = row[10] != null && Boolean.parseBoolean(row[10].toString());

            result.add(JobItemDto.builder()
                    .id(id)
                    .title(jobTitle)
                    .companyName(companyName)
                    .location(jobLocation)
                    .salary(jobSalary)
                    .level(jobLevel)
                    .jobType(jobJobType)
                    .postedAt(updatedAt)
                    .skills(skills)
                    .saved(saved)
                    .build());
        }

        return result;
    }

    public PageResultDto<JobItemDto> findJobsByCompanyId(
            Long companyId,
            Long candidateId,
            String q,
            int page,
            int size
    ) {
        int offset = page * size;

        List<Object[]> rows = jobRepository.findJobOfCompanyByStatus(companyId, candidateId, q, size, offset);

        List<JobItemDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            String jobTitle = (String) row[1];
            Job.Location jobLocation = Job.Location.valueOf((String) row[2]);
            Job.Salary jobSalary = Job.Salary.valueOf((String) row[3]);
            Job.Level jobLevel = Job.Level.valueOf((String) row[4]);
            Job.JobType jobJobType = Job.JobType.valueOf((String) row[5]);
            String updatedAt = row[6].toString();

            String skillsStr = (String) row[7];
            String[] skills = (skillsStr == null || skillsStr.isBlank())
                    ? new String[0]
                    : skillsStr.split(",");

            boolean applied = row[8] != null && Boolean.parseBoolean(row[8].toString());
            boolean saved = row[9] != null && Boolean.parseBoolean(row[9].toString());

            result.add(JobItemDto.builder()
                    .id(id)
                    .title(jobTitle)
                    .location(jobLocation)
                    .salary(jobSalary)
                    .level(jobLevel)
                    .jobType(jobJobType)
                    .postedAt(updatedAt)
                    .skills(skills)
                    .applied(applied)
                    .saved(saved)
                    .build());
        }

        long totalElements = jobRepository.countJobOfCompanyByStatus(companyId, q);
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
