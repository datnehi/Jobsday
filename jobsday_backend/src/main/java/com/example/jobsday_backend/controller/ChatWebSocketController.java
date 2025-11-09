package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.entity.Message;
import com.example.jobsday_backend.service.ChatService;
import com.example.jobsday_backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class ChatWebSocketController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private MessageService messageService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
        Long conversationId = ((Number) payload.get("conversationId")).longValue();
        String content = (String) payload.get("content");

        Long senderId = null;
        if (principal != null) {
            try { senderId = Long.valueOf(principal.getName()); } catch (Exception ignored) {}
        }
        if (senderId == null) {
            return;
        }

        Message saved = messageService.saveMessage(conversationId, senderId, content);
        chatService.notifyConversation(conversationId, saved);
    }
}
