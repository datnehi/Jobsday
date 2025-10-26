package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}
