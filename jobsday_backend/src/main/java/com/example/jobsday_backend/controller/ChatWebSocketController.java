package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.entity.Message;
import com.example.jobsday_backend.service.ChatService;
import com.example.jobsday_backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
public class ChatWebSocketController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
        String correlationId = (String) payload.get("correlationId");
        Number convNum = (Number) payload.get("conversationId");
        String content = Optional.ofNullable((String) payload.get("content")).orElse("").trim();

        if (principal == null) {
            messagingTemplate.convertAndSendToUser(
                    "anonymous", "/queue/errors", Map.of("code",401, "message","Unauthorized"));
            return;
        }

        Long senderId;
        try {
            senderId = Long.valueOf(principal.getName());
        } catch (Exception ex) {
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                    Map.of("code",401,"message","Invalid principal"));
            return;
        }

        if (convNum == null || content.isEmpty() || content.length() > 2000) {
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                    Map.of("code",400,"message","Invalid payload"));
            return;
        }
        Long conversationId = convNum.longValue();

        try {
            Message saved = messageService.saveMessage(conversationId, senderId, content);

            Map<String,Object> resp = new HashMap<>();
            resp.put("status", 200);
            resp.put("message", saved);
            if (correlationId != null) resp.put("correlationId", correlationId);

            chatService.notifyConversation(conversationId, saved);

        } catch (Exception ex) {
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                    Map.of("code",500,"message","Server error"));
        }
    }
}
