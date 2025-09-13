package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    public List<JobItemDto> findTopSimilarJobs(Long jobId, String title, Job.Level level, Job.Location location) {
        List<Object[]> rows = jobRepository.findTopSimilarJobsRaw(jobId, title, level.name(), location.name());

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
                    .build());
        }

        return result;
    }

}
