package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    Conversation findByCompanyIdAndCandidateId(Long companyId, Long candidateId);

    @Modifying
    @Transactional
    @Query(value = """
            UPDATE conversations
            SET company_last_read_at = NOW()
            WHERE id = :convId
            """, nativeQuery = true)
    int markHrRead(@Param("convId") Long convId);

    @Modifying
    @Transactional
    @Query(value = """
            UPDATE conversations
            SET candidate_last_read_at = NOW()
            WHERE id = :convId
            """, nativeQuery = true)
    int markCandidateRead(@Param("convId") Long convId);

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
    FROM conversations c
    WHERE EXISTS (
        SELECT 1
        FROM messages m
        WHERE m.conversation_id = c.id
          AND (
                (:isCompany = TRUE AND c.company_id = :id 
                    AND m.sender_id = c.candidate_id 
                    AND (c.company_last_read_at IS NULL OR m.created_at > c.company_last_read_at))
             OR
                (:isCompany = FALSE AND c.candidate_id = :id 
                    AND m.sender_id = c.company_id 
                    AND (c.candidate_last_read_at IS NULL OR m.created_at > c.candidate_last_read_at))
          )
    )
    """, nativeQuery = true)
    long countUnreadConversations(@Param("id") Long id, @Param("isCompany") boolean isCompany);
}
