package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.JobCompanyDto;
import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.repository.JobRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.*;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private S3Service s3Service;

    @PersistenceContext
    private EntityManager em;

    private final String prefixCvApplications = "cvApplications";

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

    public PageResultDto<JobCompanyDto> findJobsByCompany(
            Long companyId,
            Long memberId,
            Job.Location location,
            String deadline,
            Job.JobStatus status,
            String q,
            int page,
            int size
    ) {
        StringBuilder baseSql = new StringBuilder("""
        FROM jobs j
        JOIN company_members c ON j.member_id = c.id
        LEFT JOIN users u ON u.id = c.user_id
        LEFT JOIN job_skills js ON js.job_id = j.id
        LEFT JOIN skills sk ON sk.id = js.skill_id
        WHERE j.company_id = :companyId
    """);

        Map<String, Object> params = new HashMap<>();
        params.put("companyId", companyId);

        if (memberId != null) {
            baseSql.append(" AND j.member_id = :memberId ");
            params.put("memberId", memberId);
        }
        if (location != null) {
            baseSql.append(" AND j.location = :location ");
            params.put("location", location.name());
        }
        if (deadline != null ) {
            if (deadline.equalsIgnoreCase("ACTIVE")) {
                baseSql.append(" AND j.deadline >= now() ");
            } else {
                baseSql.append(" AND j.deadline < now() ");
            }
        }
        if (status != null) {
            baseSql.append(" AND j.status = :status ");
            params.put("status", status.name());
        }
        if (q != null && !q.isBlank()) {
            baseSql.append(" AND j.title ILIKE CONCAT('%', :q, '%') ");
            params.put("q", q);
        }

        // 1. Count query
        String countSql = "SELECT COUNT(DISTINCT j.id) " + baseSql;
        Query countQuery = em.createNativeQuery(countSql);
        params.forEach(countQuery::setParameter);
        long totalElements = ((Number) countQuery.getSingleResult()).longValue();

        // 2. Data query
        String dataSql = """
        SELECT j.id, j.title, j.location, j.address, j.description, j.requirement,
               j.benefit, j.working_time, j.job_type, j.level, j.contract_type,
               j.salary, j.experience, j.quantity, j.deadline, j.status,
               j.created_at, j.updated_at,
               c.id AS member_id,
               u.full_name AS member_name,
               c.position AS member_position,
               COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills
    """ + baseSql + """
        GROUP BY j.id, u.full_name, c.id, c.position
        ORDER BY j.updated_at DESC
        LIMIT :limit OFFSET :offset
    """;

        Query query = em.createNativeQuery(dataSql);
        params.forEach(query::setParameter);
        query.setParameter("limit", size);
        query.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        List<JobCompanyDto> jobs = new ArrayList<>();
        for (Object[] row : rows) {
            JobCompanyDto dto = new JobCompanyDto();
            dto.setId(((Number) row[0]).longValue());
            dto.setTitle((String) row[1]);
            dto.setLocation((String) row[2]);
            dto.setAddress((String) row[3]);
            dto.setDescription((String) row[4]);
            dto.setRequirement((String) row[5]);
            dto.setBenefit((String) row[6]);
            dto.setWorkingTime((String) row[7]);
            dto.setJobType((String) row[8]);
            dto.setLevel((String) row[9]);
            dto.setContractType((String) row[10]);
            dto.setSalary((String) row[11]);
            dto.setExperience((String) row[12]);
            dto.setQuantity((Integer) row[13]);
            dto.setDeadline((Date) row[14]);
            dto.setStatus((String) row[15]);
            dto.setCreatedAt((Timestamp) row[16]);
            dto.setUpdatedAt((Timestamp) row[17]);
            dto.setMemberId(((Number) row[18]).longValue());
            dto.setMemberName((String) row[19]);
            dto.setMemberPosition((String) row[20]);
            dto.setSkills((String) row[21]);

            jobs.add(dto);
        }

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                jobs,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

    public Job updateJob(Job job) {
        try {
            return jobRepository.save(job);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @Transactional
    public void deleteJob(Long id) {
        try {
            String prefix = prefixCvApplications + "/" + id + "_";
            s3Service.deleteAllByPrefix(prefix);
        } catch (Exception e) {
            throw new RuntimeException("Không thể xoá các file CV ứng tuyển trên S3", e);
        }

        jobRepository.deleteJobById(id);
    }

    public boolean checkJobOwn(Long jobId, Long memberId) {
        Job job = jobRepository.findJobById(jobId);
        return job != null && job.getMemberId().equals(memberId);
    }

    List<Job> getJobsByCompanyId(Long companyId) {
        return jobRepository.findJobsByCompanyId(companyId);
    }
}
