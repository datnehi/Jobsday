package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.Conversation;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ConversationService {
    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private CompanyMemberService companyMemberService;

    @Autowired
    private UserService userService;

    public PageResultDto<Map<String, Object>> getConversations(Long id, String text, int page, int size, String role) {
        int offset = page * size;
        List<Object[]> results = null;
        long totalElements = 0;
        if("HR".equals(role)) {
            CompanyMember member = companyMemberService.getMemberByUserId(id);
            if (member != null) {
                long companyId = member.getCompanyId();
                results = conversationRepository.findByCompanyId(companyId, text, size, offset);
                totalElements = conversationRepository.countFindByCompanyId(companyId, text);
            }
        } else {
            results = conversationRepository.findByCandidateId(id, text, size, offset);
            totalElements = conversationRepository.countFindByCandidateId(id, text);
        }
        List<Map<String,Object>> conversations = new ArrayList<>();
        for (Object[] row : results) {
            long conversationId = ((Number) row[0]).longValue();
            long companyId = ((Number) row[1]).longValue();
            long candidateId = ((Number) row[2]).longValue();
            String createdAt = row[3].toString();
            String updatedAt = row[4].toString();
            String lastMessage = row[5] != null ? row[5].toString() : "";
            String lastMessageAt = row[6] != null ? row[6].toString() : "";
            String name = (String) row[7];
            String avatarUrl = row[8] != null ? row[8].toString() : "";
            String unread = row[9] != null ? row[9].toString() : "0";
            conversations.add(Map.of(
                    "conversationId", conversationId,
                    "companyId", companyId,
                    "candidateId", candidateId,
                    "createdAt", createdAt,
                    "updatedAt", updatedAt,
                    "lastMessage", lastMessage,
                    "lastMessageAt", lastMessageAt,
                    "name", name,
                    "avatarUrl", avatarUrl,
                    "unread", unread
            ));
        }
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                conversations,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }
    
    public Conversation getConversationById(Long conversationId) {
        return conversationRepository.findById(conversationId).orElse(null);
    }

    public Conversation createConversation(long companyId, long candidateId) {
        Conversation conversation = Conversation.builder()
                .companyId(companyId)
                .candidateId(candidateId)
                .build();
        return conversationRepository.save(conversation);
    }

    public Conversation findByCompanyIdAndCandidateId(Long companyId, Long candidateId) {
        return conversationRepository.findByCompanyIdAndCandidateId(companyId, candidateId);
    }

    public int markRead(Long conversationId, Long candidateId) {
        User user = userService.findById(candidateId);
        int updated = 0;
        if (user.getRole() == User.Role.HR){
            updated = conversationRepository.markHrRead(conversationId);
        } else if (user.getRole() == User.Role.CANDIDATE){
            updated = conversationRepository.markCandidateRead(conversationId);
        }
        return updated;
    }

    public Map<String, String> getConversationPresenceById(Long conversationId, User.Role role) {
        Object result = conversationRepository.findConversationById(conversationId, role.name());
        if (result == null) {
            return null;
        }
        Object[] row = (Object[]) result;
        String conversationIdStr = String.valueOf(row[0]);
        String companyIdStr      = String.valueOf(row[1]);
        String candidateIdStr    = String.valueOf(row[2]);
        String createdAtStr      = row[3] != null ? row[3].toString() : "";
        String updatedAtStr      = row[4] != null ? row[4].toString() : "";
        String lastMessageStr    = row[5] != null ? row[5].toString() : "";
        String lastMessageAtStr  = row[6] != null ? row[6].toString() : "";
        String nameStr           = row[7] != null ? row[7].toString() : "";
        String avatarUrlStr      = row[8] != null ? row[8].toString() : "";
        String unreadStr         = String.valueOf(row[9]);

        return Map.of(
                "conversationId", conversationIdStr,
                "companyId",      companyIdStr,
                "candidateId",    candidateIdStr,
                "createdAt",      createdAtStr,
                "updatedAt",      updatedAtStr,
                "lastMessage",    lastMessageStr,
                "lastMessageAt",  lastMessageAtStr,
                "name",           nameStr,
                "avatarUrl",      avatarUrlStr,
                "unread",         unreadStr
        );
    }

    public Map<String, String> getByCandidateIdAndCompanyId(Long companyId, Long candidateId) {
        Object result = conversationRepository.getByCandidateIdAndCompany(candidateId, companyId);
        if (result == null) {
            return null;
        }
        Object[] row = (Object[]) result;
        String conversationIdStr = String.valueOf(row[0]);
        String companyIdStr      = String.valueOf(row[1]);
        String candidateIdStr    = String.valueOf(row[2]);
        String createdAtStr      = row[3] != null ? row[3].toString() : "";
        String updatedAtStr      = row[4] != null ? row[4].toString() : "";
        String lastMessageStr    = row[5] != null ? row[5].toString() : "";
        String lastMessageAtStr  = row[6] != null ? row[6].toString() : "";
        String nameStr           = row[7] != null ? row[7].toString() : "";
        String avatarUrlStr      = row[8] != null ? row[8].toString() : "";
        String unreadStr         = String.valueOf(row[9]);

        return Map.of(
                "conversationId", conversationIdStr,
                "companyId",      companyIdStr,
                "candidateId",    candidateIdStr,
                "createdAt",      createdAtStr,
                "updatedAt",      updatedAtStr,
                "lastMessage",    lastMessageStr,
                "lastMessageAt",  lastMessageAtStr,
                "name",           nameStr,
                "avatarUrl",      avatarUrlStr,
                "unread",         unreadStr
        );
    }

    public long countConversationsWithMessagesUnread(long userId, String role) {
        if (Objects.equals(role, User.Role.HR.name())) {
            CompanyMember member = companyMemberService.getMemberByUserId(userId);
            if (member != null) {
                long companyId = member.getCompanyId();
                return conversationRepository.countUnreadConversations(companyId, true);
            } else {
                return 0;
            }
        } else if (Objects.equals(role, User.Role.CANDIDATE.name())) {
            return conversationRepository.countUnreadConversations(userId, false);
        } else {
            return 0;
        }
    }
}
