package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.Message;
import com.example.jobsday_backend.repository.ConversationRepository;
import com.example.jobsday_backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Transactional
    public Message saveMessage(Long conversationId, Long senderId, String content) {
        Message m = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(m);

        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setLastMessage(content);
            conv.setLastMessageAt(LocalDateTime.now());
            conversationRepository.save(conv);
        });

        return m;
    }

    public PageResultDto<Message> getMessages(Long conversationId, int page, int size) {
        int offset = page * size;
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, size, offset);
        long totalElements = messageRepository.countByConversationId(conversationId);
        int totalPages = (int) Math.ceil((double) totalElements / size);
        return new PageResultDto<>(
                messages,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }
}
