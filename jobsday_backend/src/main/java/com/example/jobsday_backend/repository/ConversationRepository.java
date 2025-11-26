package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query(value = """
    SELECT
        c.id,
        c.company_id,
        c.candidate_id,
        c.created_at,
        c.updated_at,
        c.last_message,
        c.last_message_at,
        p.name AS company_name,
        p.logo AS company_logo_url,
        COALESCE(unread.count_unread, 0) AS unread_count
    FROM conversations c
    JOIN companies p ON c.company_id = p.id

    LEFT JOIN (
        SELECT
            m.conversation_id,
            COUNT(*) AS count_unread
        FROM messages m
        JOIN conversations c2 ON c2.id = m.conversation_id
        WHERE m.sender_id IN (SELECT user_id FROM company_members WHERE company_id = c2.company_id)
          AND m.created_at > COALESCE(c2.candidate_last_read_at, '1970-01-01')
        GROUP BY m.conversation_id
    ) unread ON unread.conversation_id = c.id

    WHERE c.candidate_id = :candidateId
        AND (:text IS NULL OR p.name ILIKE CONCAT('%', :text, '%'))
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC NULLS LAST
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> findByCandidateId(
            @Param("candidateId") Long candidateId,
            @Param("text") String text,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM conversations c
            JOIN companies p ON c.company_id = p.id
            WHERE c.candidate_id = :candidateId
                AND (:text IS NULL OR p.name ILIKE CONCAT('%', :text, '%'))
            """, nativeQuery = true)
    long countFindByCandidateId(
            @Param("candidateId") Long candidateId,
            @Param("text") String text
    );

    @Query(value = """
    SELECT
        c.id,
        c.company_id,
        c.candidate_id,
        c.created_at,
        c.updated_at,
        c.last_message,
        c.last_message_at,
        u.full_name AS candidate_name,
        u.avatar_url AS candidate_avatar_url,
        COALESCE(unread.count_unread, 0) AS unread_count
    FROM conversations c
    JOIN users u ON c.candidate_id = u.id

    LEFT JOIN (
        SELECT
            m.conversation_id,
            COUNT(*) AS count_unread
        FROM messages m
        JOIN conversations c2 ON c2.id = m.conversation_id
        WHERE m.sender_id = c2.candidate_id
          AND m.created_at > COALESCE(c2.company_last_read_at, '1970-01-01')
        GROUP BY m.conversation_id
    ) unread ON unread.conversation_id = c.id

    WHERE c.company_id = :companyId
        AND (:text IS NULL OR u.full_name ILIKE CONCAT('%', :text, '%'))
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC NULLS LAST
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> findByCompanyId(
            @Param("companyId") Long companyId,
            @Param("text") String text,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM conversations c
            JOIN users u ON c.candidate_id = u.id
            WHERE c.company_id = :companyId
                AND (:text IS NULL OR u.full_name ILIKE CONCAT('%', :text, '%'))
            """, nativeQuery = true)
    long countFindByCompanyId(
            @Param("companyId") Long companyId,
            @Param("text") String text
    );

    @Modifying
    @Transactional
    @Query(value = """
            UPDATE conversations
            SET company_last_read_at = :lastRead
            WHERE id = :convId
            """, nativeQuery = true)
    void markHrRead(@Param("convId") Long convId, @Param("lastRead") LocalDateTime lastRead);

    @Modifying
    @Transactional
    @Query(value = """
            UPDATE conversations
            SET candidate_last_read_at = :lastRead
            WHERE id = :convId
            """, nativeQuery = true)
    void markCandidateRead(@Param("convId") Long convId, @Param("lastRead") LocalDateTime lastRead);

    @Query(value = """
    SELECT
        c.id,
        c.company_id,
        c.candidate_id,
        c.created_at,
        c.updated_at,
        c.last_message,
        c.last_message_at,
        CASE 
            WHEN :viewerRole = 'HR' THEN u.full_name
            ELSE p.name
        END AS name,
        CASE 
            WHEN :viewerRole = 'HR' THEN u.avatar_url
            ELSE p.logo
        END AS avatar_or_logo,
        COALESCE(unread.count_unread, 0) AS unread_count

    FROM conversations c
    LEFT JOIN users u ON c.candidate_id = u.id
    LEFT JOIN companies p ON c.company_id = p.id
    LEFT JOIN (
        SELECT
            m.conversation_id,
            COUNT(*) AS count_unread
        FROM messages m
        JOIN conversations c2 ON c2.id = m.conversation_id
        WHERE 
            (
                :viewerRole = 'HR'
                AND m.sender_id = c2.candidate_id
                AND m.created_at > COALESCE(c2.company_last_read_at, '1970-01-01')
            )
            OR
            (
                :viewerRole = 'CANDIDATE'
                AND m.sender_id IN (SELECT user_id FROM company_members WHERE company_id = c2.company_id)
                AND m.created_at > COALESCE(c2.candidate_last_read_at, '1970-01-01')
            )
        GROUP BY m.conversation_id
    ) unread ON unread.conversation_id = c.id

    WHERE c.id = :conversationId
    """, nativeQuery = true)
    Object findConversationById(
            @Param("conversationId") Long conversationId,
            @Param("viewerRole") String viewerRole
    );

    @Query(value = """
    SELECT
        c.id,
        c.company_id,
        c.candidate_id,
        c.created_at,
        c.updated_at,
        c.last_message,
        c.last_message_at,
        p.name AS company_name,
        p.logo AS company_logo_url,
        COALESCE(unread.count_unread, 0) AS unread_count
    FROM conversations c
    JOIN companies p ON c.company_id = p.id

    LEFT JOIN (
        SELECT
            m.conversation_id,
            COUNT(*) AS count_unread
        FROM messages m
        JOIN conversations c2 ON c2.id = m.conversation_id
        WHERE m.sender_id IN (SELECT user_id FROM company_members WHERE company_id = c2.company_id)
          AND m.created_at > COALESCE(c2.candidate_last_read_at, '1970-01-01')
        GROUP BY m.conversation_id
    ) unread ON unread.conversation_id = c.id

    WHERE c.candidate_id = :candidateId
        AND p.id = :companyId
    """, nativeQuery = true)
    Object getByCandidateIdAndCompany(
            @Param("candidateId") Long candidateId,
            @Param("companyId") Long companyId
    );

    @Query(value = """
    SELECT COUNT(*)
    FROM conversations
    WHERE (:isCompany = TRUE AND company_id = :id 
                AND (last_message_at IS NOT NULL AND (company_last_read_at IS NULL OR last_message_at > company_last_read_at)))
        OR
            (:isCompany = FALSE AND candidate_id = :id 
                AND (last_message_at IS NOT NULL AND (candidate_last_read_at IS NULL OR last_message_at > candidate_last_read_at)))
    """, nativeQuery = true)
    long countUnreadConversations(@Param("id") Long id, @Param("isCompany") boolean isCompany);
}
