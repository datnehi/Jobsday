package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findById(long id);
    User findByEmail(String email);
    boolean existsByEmail(String email);

    @Query(value = """
            SELECT * FROM users
            WHERE role != 'ADMIN'
                AND (:textSearch IS NULL 
                   OR full_name ILIKE CONCAT('%', :textSearch, '%') 
                   OR email ILIKE CONCAT('%', :textSearch, '%')
                   OR phone ILIKE CONCAT('%', :textSearch, '%'))
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<User> getALl(
            @Param("textSearch") String textSearch,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*) FROM users
            WHERE role != 'ADMIN'
                AND (:textSearch IS NULL 
                   OR full_name ILIKE CONCAT('%', :textSearch, '%') 
                   OR email ILIKE CONCAT('%', :textSearch, '%')
                   OR phone ILIKE CONCAT('%', :textSearch, '%'))
        """, nativeQuery = true)
    long countAllNonAdminUsers(@Param("textSearch") String textSearch);

    @Query(value = """
        SELECT COUNT(*) 
        FROM users 
        WHERE role = 'CANDIDATE'
          AND DATE(created_at) = CURRENT_DATE
          AND email_verified = TRUE
    """, nativeQuery = true)
    long newCandidatesToday();

    @Query(value = """
        SELECT u.full_name, COUNT(a.id)
        FROM users u
        JOIN applications a ON a.candidate_id = u.id
        GROUP BY u.id, u.full_name
        ORDER BY COUNT(a.id) DESC
        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> topCandidates();
}
