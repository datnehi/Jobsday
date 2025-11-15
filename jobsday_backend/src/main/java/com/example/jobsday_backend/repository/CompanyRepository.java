package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Company findCompanyById(Long id);

    @Query(value = """
        SELECT * FROM companies
        WHERE (status = 'APPROVED' OR status = 'INACTIVE')
            AND ( :text IS NULL
                OR search_tsv @@ (plainto_tsquery('english', :text) || plainto_tsquery('simple', :text))
                OR description ILIKE :text
                OR name ILIKE %:text%
                OR address ILIKE %:text%)
            AND ( :location IS NULL
                OR location = :location)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Company> findAll(
            @RequestParam("text") String text,
            @RequestParam("location") String location,
            @RequestParam("limit") int limit,
            @RequestParam("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(id) FROM companies
        WHERE (status = 'APPROVED' OR status = 'INACTIVE')
            AND ( :text IS NULL
                OR search_tsv @@ (plainto_tsquery('english', :text) || plainto_tsquery('simple', :text))
                OR description ILIKE :text
                OR name ILIKE %:text%
                OR address ILIKE %:text%)
            AND ( :location IS NULL
                OR location = :location)
    """, nativeQuery = true)
    long countFindAll(
            @RequestParam("text") String text,
            @RequestParam("location") String location
    );

    @Query(value = """
        SELECT * FROM companies
        WHERE status = 'PENDING'
            AND ( :text IS NULL
                OR search_tsv @@ (plainto_tsquery('english', :text) || plainto_tsquery('simple', :text))
                OR description ILIKE :text
                OR name ILIKE %:text%
                OR address ILIKE %:text%)
            AND ( :location IS NULL
                OR location = :location)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Company> findAllPending(
            @RequestParam("text") String text,
            @RequestParam("location") String location,
            @RequestParam("limit") int limit,
            @RequestParam("offset") int offset
    );

    @Query(value = """
        SELECT COUNT(id) FROM companies
        WHERE status = 'PENDING'
            AND ( :text IS NULL
                OR search_tsv @@ (plainto_tsquery('english', :text) || plainto_tsquery('simple', :text))
                OR description ILIKE :text
                OR name ILIKE %:text%
                OR address ILIKE %:text%)
            AND ( :location IS NULL
                OR location = :location)
    """, nativeQuery = true)
    long countFindAllPending(
            @RequestParam("text") String text,
            @RequestParam("location") String location
    );

    @Modifying
    @Query("UPDATE Company c SET c.isOnline = :online WHERE c.id = :companyId")
    void updateCompanyOnline(@Param("companyId") Long companyId, @Param("online") boolean online);

    @Query(value = """
        SELECT COUNT(*) 
        FROM companies 
        WHERE DATE(created_at) = CURRENT_DATE
    """, nativeQuery = true)
    long newCompaniesToday();

    @Query(value = """
        SELECT c.name, 
               COUNT(DISTINCT j.id) AS jobs
        FROM companies c
        LEFT JOIN jobs j ON j.company_id = c.id
        WHERE j.created_at >= NOW() - make_interval(days => :days)
        GROUP BY c.id, c.name
        ORDER BY jobs DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> topCompaniesJob(@Param("days") int days);

    @Query(value = """
        SELECT c.name, 
               COUNT(DISTINCT a.candidate_id) AS applicants
        FROM companies c
        LEFT JOIN jobs j ON j.company_id = c.id
        LEFT JOIN applications a ON a.job_id = j.id
        WHERE a.applied_at >= NOW() - make_interval(days => :days)
        GROUP BY c.id, c.name
        ORDER BY applicants DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> topCompaniesApplication(@Param("days") int days);
}
