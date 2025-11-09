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

//    @Modifying
//    @Query("UPDATE UserEntity u SET u.isOnline = :online, u.lastOnlineAt = CASE WHEN :online = false THEN :lastAt ELSE u.lastOnlineAt END WHERE u.id = :id")
//    void updateOnline(@Param("id") Long id, @Param("online") boolean online, @Param("lastAt") java.time.Instant lastAt);
}
