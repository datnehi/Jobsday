package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.PresenceDto;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.Message;
import com.example.jobsday_backend.repository.ConversationRepository;
import com.example.jobsday_backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@Slf4j
public class ChatService {

    @Autowired
    private ConversationRepository convRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CompanyService companyService;

    private final ConcurrentMap<Long, Set<String>> presence = new ConcurrentHashMap<>();

    public void notifyConversation(Long conversationId, Message message) {
        messagingTemplate.convertAndSend("/topic/conversation." + conversationId, toDto(message));
        convRepo.findById(conversationId).ifPresent(conv -> {
            messagingTemplate.convertAndSendToUser(String.valueOf(conv.getCandidateId()), "/queue/messages", toDto(message));
            messagingTemplate.convertAndSend("/topic/company." + conv.getCompanyId() + ".messages", toDto(message));
        });
    }

    private Object toDto(Message m) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", m.getId());
        dto.put("conversationId", m.getConversationId());
        dto.put("senderId", m.getSenderId());
        dto.put("content", m.getContent());
        dto.put("createdAt", m.getCreatedAt());
        return dto;
    }

    public void userConnected(Long id, String sessionId, String role) {
        presence.compute(id, (k, set) -> {
            if (set == null) set = ConcurrentHashMap.newKeySet();
            set.add(sessionId);
            return set;
        });
        if (presence.get(id).size() == 1) {
            if (role != null && role.equals("HR")) {
                Company company = companyService.getById(id);
                if (company != null) {
                    company.setIsOnline(true);
                    companyService.create(company);
                    messagingTemplate.convertAndSend("/topic/presence." + company.getId(), new PresenceDto(company.getId(), "ONLINE", LocalDateTime.now()));
                }
            } else {
                userRepo.findById(id).ifPresent(u -> {
                    u.setIsOnline(true);
                    userRepo.save(u);
                    messagingTemplate.convertAndSend("/topic/presence." + id, new PresenceDto(id, "ONLINE", LocalDateTime.now()));
                });
            }
        }
    }

    public void userDisconnected(Long id, String sessionId, String role) {
        presence.computeIfPresent(id, (k, set) -> {
            set.remove(sessionId);
            return set.isEmpty() ? null : set;
        });
        if (!presence.containsKey(id)) {
            if (role != null && role.equals("HR")) {
                Company company = companyService.getById(id);
                if (company != null) {
                    company.setIsOnline(false);
                    company.setLastOnlineAt(LocalDateTime.now());
                    companyService.create(company);
                    messagingTemplate.convertAndSend("/topic/presence." + company.getId(), new PresenceDto(company.getId(), "OFFLINE", LocalDateTime.now()));
                }
            } else {
                userRepo.findById(id).ifPresent(u -> {
                    u.setIsOnline(false);
                    u.setLastOnlineAt(LocalDateTime.now());
                    userRepo.save(u);
                    messagingTemplate.convertAndSend("/topic/presence." + id, new PresenceDto(id, "OFFLINE", LocalDateTime.now()));
                });
            }
        }
    }
}
