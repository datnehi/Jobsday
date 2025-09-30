package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.CompanyItemDto;
import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.Job;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SearchService {

    @PersistenceContext
    private EntityManager em;

    public PageResultDto<JobItemDto> findJobs(
            String q,
            Job.Location location,
            Job.Experience experience,
            Job.Level level,
            Job.Salary salary,
            Job.JobType jobType,
            Job.ContractType contractType,
            Long candidateId,
            int page,
            int size
    ) {
        StringBuilder baseSql = new StringBuilder("""
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            LEFT JOIN job_skills js ON js.job_id = j.id
            LEFT JOIN skills sk ON sk.id = js.skill_id
        """);

        if (candidateId != null) {
            baseSql.append("""
            LEFT JOIN applications a
                ON a.job_id = j.id AND a.candidate_id = :candidateId
            LEFT JOIN saved_jobs sj
                ON sj.job_id = j.id AND sj.candidate_id = :candidateId
            """);
        }

        baseSql.append(" WHERE j.status = 'ACTIVE' ");

        Map<String, Object> params = new HashMap<>();

        if (q != null && !q.isBlank()) {
            baseSql.append("""
                AND (
                    j.search_tsv @@ to_tsquery('english', :q || ':*')
                    OR j.search_tsv @@ to_tsquery('simple', :q || ':*')
                    OR c.search_tsv @@ to_tsquery('simple', :q || ':*')
                    OR c.search_tsv @@ to_tsquery('english', :q || ':*')
            
                    OR similarity(j.title, :q) > 0.3
                    OR similarity(j.description, :q) > 0.3
                    OR similarity(c.name, :q) > 0.3
                )
                """);
            params.put("q", q);
        } 

        if (location != null) {
            baseSql.append(" AND j.location = :location ");
            params.put("location", location.name());
        }
        if (experience != null) {
            baseSql.append(" AND j.experience = :experience ");
            params.put("experience", experience.name());
        }
        if (level != null) {
            baseSql.append(" AND j.level = :level ");
            params.put("level", level.name());
        }
        if (salary != null) {
            baseSql.append(" AND j.salary = :salary ");
            params.put("salary", salary.name());
        }
        if (jobType != null) {
            baseSql.append(" AND j.job_type = :jobType ");
            params.put("jobType", jobType.name());
        }
        if (contractType != null) {
            baseSql.append(" AND j.contract_type = :contractType ");
            params.put("contractType", contractType.name());
        }
        if (candidateId != null) {
            params.put("candidateId", candidateId);
        }

        // 1. Count query
        String countSql = "SELECT COUNT(DISTINCT j.id) " + baseSql;
        Query countQuery = em.createNativeQuery(countSql);
        params.forEach(countQuery::setParameter);
        long totalElements = ((Number) countQuery.getSingleResult()).longValue();

        // 2. Data query
        StringBuilder dataSql = new StringBuilder();
        if (candidateId != null) {
            dataSql.append("""
                SELECT j.id, j.title, c.name as company_name, c.logo as company_logo, j.location, j.salary, j.level,
                       j.job_type, j.updated_at,
                       COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills,
                       BOOL_OR(a.id IS NOT NULL) AS applied,
                       BOOL_OR(sj.id IS NOT NULL) AS saved
            """);
        } else {
            dataSql.append("""
                SELECT j.id, j.title, c.name as company_name, c.logo as company_logo, j.location, j.salary, j.level,
                       j.job_type, j.updated_at,
                       COALESCE(string_agg(DISTINCT sk.name, ','), '') AS skills,
                       false as applied,
                       false as saved
            """);
        }

        dataSql.append(baseSql);
        dataSql.append(" GROUP BY j.id, c.name, c.logo ORDER BY j.created_at DESC ");
        dataSql.append(" LIMIT :limit OFFSET :offset ");
        Query query = em.createNativeQuery(dataSql.toString());
        params.forEach(query::setParameter);
        query.setParameter("limit", size);
        query.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        List<JobItemDto> content = new ArrayList<>();
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            String title = (String) row[1];
            String companyName = (String) row[2];
            String companyLogo = (String) row[3];
            Job.Location jobLocation = Job.Location.valueOf((String) row[4]);
            Job.Salary jobSalary = Job.Salary.valueOf((String) row[5]);
            Job.Level jobLevel = Job.Level.valueOf((String) row[6]);
            Job.JobType jobJobType = Job.JobType.valueOf((String) row[7]);
            String postedAt = row[8].toString();

            String skillsStr = (String) row[9];
            String[] skills = (skillsStr == null || skillsStr.isBlank())
                    ? new String[0]
                    : skillsStr.split(",");

            boolean applied = row[10] != null && Boolean.parseBoolean(row[10].toString());
            boolean saved = row[11] != null && Boolean.parseBoolean(row[11].toString());

            content.add(JobItemDto.builder()
                    .id(id)
                    .title(title)
                    .companyName(companyName)
                    .companyLogo(companyLogo)
                    .location(jobLocation)
                    .salary(jobSalary)
                    .level(jobLevel)
                    .jobType(jobJobType)
                    .postedAt(postedAt)
                    .skills(skills)
                    .applied(applied)
                    .saved(saved)
                    .build());
        }

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                content,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

    public PageResultDto<CompanyItemDto> findCompanies(String q, Company.Location location, int page, int size) {
        StringBuilder baseSql = new StringBuilder("""
        FROM companies c
        LEFT JOIN company_skills cs ON cs.company_id = c.id
        LEFT JOIN skills sk ON sk.id = cs.skill_id
        WHERE c.status = 'APPROVED'
        """);

        Map<String, Object> params = new HashMap<>();

        // tìm kiếm theo q
        if (q != null && !q.isBlank()) {
            baseSql.append("""
            AND (
                c.search_tsv @@ (plainto_tsquery('english', :q) || plainto_tsquery('simple', :q))
                OR c.description ILIKE :q
                OR EXISTS (
                    SELECT 1
                    FROM company_skills cs2
                    JOIN skills sk2 ON sk2.id = cs2.skill_id
                    WHERE cs2.company_id = c.id
                      AND sk2.name ILIKE :q
                )
            )
            """);
            params.put("q", "%" + q.trim() + "%");
        }

        // lọc theo location
        if (location != null) {
            baseSql.append(" AND c.location ILIKE :location ");
            params.put("location",  location.name());
        }

        // ========= COUNT QUERY =========
        String countSql = "SELECT COUNT(DISTINCT c.id) " + baseSql;
        Query countQuery = em.createNativeQuery(countSql);
        params.forEach(countQuery::setParameter);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        if (total == 0) {
            return new PageResultDto<>(Collections.emptyList(), page, size, 0, 0, true);
        }

        // ========= DATA QUERY =========
        String dataSql = """
        SELECT
            c.id,
            c.name,
            c.location,
            c.logo,
            COALESCE(array_to_string(ARRAY_AGG(DISTINCT sk.name), ','), '') AS skills
        """ + baseSql + """
        GROUP BY c.id, c.name, c.address
        ORDER BY c.created_at DESC
        LIMIT :limit OFFSET :offset
        """;

        Query query = em.createNativeQuery(dataSql);
        params.forEach(query::setParameter);
        query.setParameter("limit", size);
        query.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        List<CompanyItemDto> content = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            String name = (String) row[1];
            Company.Location companyLocation = Company.Location.valueOf((String) row[2]);
            String logo = (String) row[3];

            String skillsStr = (String) row[4];
            String[] skills = skillsStr == null || skillsStr.isBlank()
                    ? new String[0]
                    : skillsStr.split(",");

            content.add(CompanyItemDto.builder()
                    .id(id)
                    .name(name)
                    .location(companyLocation)
                    .logo(logo)
                    .skills(skills)
                    .build());
        }

        int totalPages = (int) Math.ceil((double) total / size);
        boolean last = (page + 1) >= totalPages;

        return new PageResultDto<>(content, page, size, total, totalPages, last);
    }

}
