package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query(value = """
            SELECT *
            FROM messages
            WHERE conversation_id = :conversationId
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, int limit, int offset);

    @Query(value = """
            SELECT COUNT(*)
            FROM messages
            WHERE conversation_id = :conversationId
            """, nativeQuery = true)
    long countByConversationId(Long conversationId);
}
