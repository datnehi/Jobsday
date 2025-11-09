package com.example.jobsday_backend.config;

import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceHandler {

    private final ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        Long userId = getUserId(accessor);
        Long companyId = (Long) accessor.getSessionAttributes().get("companyId");
        User.Role role = (User.Role) accessor.getSessionAttributes().get("role");
        String sessionId = accessor.getSessionId();
        if (role == User.Role.HR && companyId != null) {
            chatService.userConnected(companyId, sessionId, role.name());
        } else {
            chatService.userConnected(userId, sessionId, role.name());
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        Long userId = getUserId(accessor);
        Long companyId = (Long) accessor.getSessionAttributes().get("companyId");
        User.Role role = (User.Role) accessor.getSessionAttributes().get("role");
        String sessionId = accessor.getSessionId();

        if (role == User.Role.HR && companyId != null) {
            chatService.userDisconnected(companyId, sessionId, role.name());
        } else {
            chatService.userDisconnected(userId, sessionId, role.name());
        }
    }

    private Long getUserId(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            try {
                return Long.valueOf(accessor.getUser().getName());
            } catch (Exception ignored) {}
        }
        return null;
    }

}

