package com.example.jobsday_backend.config;

import com.example.jobsday_backend.dto.PresenceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class PresenceEventListener implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String body = new String(message.getBody());
        String[] parts = body.split(":");
        Long userId = Long.valueOf(parts[0]);
        String status = parts[1];

        messagingTemplate.convertAndSend("/topic/presence", new PresenceDto(userId, status, LocalDateTime.now()));
    }
}

