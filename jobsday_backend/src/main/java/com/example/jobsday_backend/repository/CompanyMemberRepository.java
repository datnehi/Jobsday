package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.CompanyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyMemberRepository extends JpaRepository<CompanyMember, Long> {
    @Query(value = """
            SELECT cm.id, cm.position, cm.is_admin, u.full_name, u.role
            FROM company_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.company_id = :companyId AND cm.status = 'APPROVED' AND u.status = 'ACTIVE'
            """, nativeQuery = true)
    List<Object[]> findAllMemberByCompanyId(Long companyId);

    @Query(value = """
            SELECT cm.id, cm.position, cm.is_admin, u.full_name, u.role, c.name AS company_name
            FROM company_members cm
            JOIN users u ON cm.user_id = u.id
            JOIN companies c ON cm.company_id = c.id
            WHERE u.id = :memberId
            """, nativeQuery = true)
    Object findByMemberId(Long memberId);

    CompanyMember findByUserId(Long userId);

    @Query(value = """
        SELECT cm.id, cm.user_id, u.full_name, u.email, cm.position, cm.is_admin, cm.status
        FROM company_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.company_id = :companyId
          AND (:isAdmin IS NULL OR cm.is_admin = :isAdmin)
          AND (cm.status = 'APPROVED' OR cm.status = 'INACTIVE')
          AND (:textSearch IS NULL 
               OR u.full_name ILIKE CONCAT('%', :textSearch, '%') 
               OR u.email ILIKE CONCAT('%', :textSearch, '%'))
        ORDER BY cm.updated_at DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> findMemberByCompanyId(
            @Param("companyId") Long companyId,
            @Param("isAdmin") Boolean isAdmin,
            @Param("textSearch") String textSearch,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM company_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.company_id = :companyId
              AND cm.is_admin = false
              AND (cm.status = 'APPROVED' OR cm.status = 'INACTIVE')
              AND (:textSearch IS NULL 
                   OR u.full_name ILIKE CONCAT('%', :textSearch, '%') 
                   OR u.email ILIKE CONCAT('%', :textSearch, '%'))
            """, nativeQuery = true)
    Long countMemberByCompanyId(
            @Param("companyId") Long companyId,
            @Param("textSearch") String textSearch
    );

    @Query(value = """
        SELECT cm.id, cm.user_id, u.full_name, u.email, cm.position, cm.updated_at, cm.status
        FROM company_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.company_id = :companyId
          AND cm.is_admin = false
          AND cm.status = 'PENDING'
        ORDER BY cm.updated_at DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> findMemberRequest(
            @Param("companyId") Long companyId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM company_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.company_id = :companyId
              AND cm.is_admin = false
              AND cm.status = 'PENDING'
            """, nativeQuery = true)
    Long countMemberRequest(
            @Param("companyId") Long companyId
    );

    List<CompanyMember> findByCompanyId(Long companyId);

    @Query("SELECT COUNT(cm) FROM CompanyMember cm JOIN User u ON u.id = cm.userId WHERE cm.companyId = :companyId AND u.isOnline = true")
    int countOnlineHrByCompanyId(@Param("companyId") Long companyId);
}
