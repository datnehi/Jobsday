package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.Conversation;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CompanyMemberService companyMemberService;

    @GetMapping
    public ResponseEntity<ResponseDto> getConversations(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @Param("text") String text,
            @Param("page") int page
    ) {
        PageResultDto<Map<String, Object>> conversations = conversationService.getConversations(
                userDetails.getId(),
                text,
                page,
                20,
                userDetails.getRole()
        );
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy danh sách cuộc trò chuyện thành công", conversations)
        );
    }

    @PostMapping
    public ResponseEntity<ResponseDto> createConversation(
            @RequestParam Long companyId,
            @RequestParam Long candidateId,
            @AuthenticationPrincipal CustomUserDetail userDetails
    ) {
        Company company = companyService.getById(companyId);
        if (company == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Công ty không tồn tại", null)
            );
        }
        User user = userService.findById(candidateId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Ứng viên không tồn tại", null)
            );
        }
        Map<String, String> conversation = conversationService.getByCandidateIdAndCompanyId(companyId, candidateId);
        if (conversation == null) {
            conversationService.createConversation(companyId, candidateId);
            conversation = conversationService.getByCandidateIdAndCompanyId(companyId, candidateId);
            if (conversation == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        new ResponseDto(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Tạo cuộc trò chuyện thất bại", null)
                );
            } else {
                if (Objects.equals(userDetails.getRole(), User.Role.HR.toString())) {
                    String type = "NEW_MESSAGE";
                    String message = conversation.get("conversationId") + "_" + company.getName();
                    notificationService.sendNotification(userDetails.getId(), candidateId, type, message);
                } else if (Objects.equals(userDetails.getRole(), User.Role.CANDIDATE.toString())) {
                    String type = "NEW_MESSAGE";
                    String message = conversation.get("conversationId") + "_" + user.getFullName();
                    List<CompanyMember> members = companyMemberService.getMenbersByCompanyId(companyId);
                    for (CompanyMember member : members) {
                        notificationService.sendNotification(userDetails.getId(), member.getUserId(), type, message);
                    }
                }
            }
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Tạo cuộc trò chuyện thành công", conversation)
        );
    }

    @GetMapping("/conversation/{id}/presence")
    public ResponseEntity<ResponseDto> getPresence(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetail user) {
        User u = userService.findById(user.getId());
        Conversation conv = conversationService.getConversationById(id);
        if (conv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ResponseDto(HttpStatus.NOT_FOUND.value(), "Cuộc trò chuyện không tồn tại", null)
            );
        }

        Map<String, Object> dto = new HashMap<>();
        if (u.getRole() == User.Role.CANDIDATE) {
            Company company = companyService.getById(conv.getCompanyId());
            String status = company.getIsOnline() ? "ONLINE" : "OFFLINE";
            dto.put("userId", company.getId());
            dto.put("status", status);
            dto.put("lastOnlineAt", company.getLastOnlineAt());
        } else if (u.getRole() == User.Role.HR) {
            User candidate = userService.findById(conv.getCandidateId());
            String status = candidate.getIsOnline() ? "ONLINE" : "OFFLINE";
            dto.put("userId", candidate.getId());
            dto.put("status", status);
            dto.put("lastOnlineAt", candidate.getLastOnlineAt());
        }

        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy trạng thái trực tuyến thành công", dto
        ));
    }

    @GetMapping("/conversation/{id}/info")
    public ResponseEntity<ResponseDto> getConversationInfo(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetail user) {
        Map<String, String> info = conversationService.getConversationPresenceById(id, user.getUser().getRole());
        if (info == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ResponseDto(HttpStatus.NOT_FOUND.value(), "Cuộc trò chuyện không tồn tại", null)
            );
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy thông tin cuộc trò chuyện thành công", info)
        );
    }

    @GetMapping("/conversation/unread")
    public ResponseEntity<ResponseDto> markConversationRead(@AuthenticationPrincipal CustomUserDetail user) {
        long count = conversationService.countConversationsWithMessagesUnread(user.getId(), user.getRole());
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy số cuộc trò chuyện chưa đọc thành công", count)
        );
    }

}
