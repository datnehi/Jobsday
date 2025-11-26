package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Conversation;
import com.example.jobsday_backend.entity.Message;
import com.example.jobsday_backend.service.ConversationService;
import com.example.jobsday_backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private ConversationService conversationService;

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ResponseDto> getMessages(@PathVariable Long conversationId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        Conversation conversation = conversationService.getConversationById(conversationId);
        if (conversation == null) {
            return ResponseEntity.status(404).body(
                    new ResponseDto(404, "Conversation not found", null)
            );
        }
        PageResultDto<Message> messagesPage = messageService.getMessages(conversationId, page, size);
        return ResponseEntity.ok(
                new ResponseDto(200, "Messages retrieved successfully", messagesPage)
        );
    }

    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ResponseDto> markAsRead(@PathVariable Long conversationId, @AuthenticationPrincipal CustomUserDetail userDetail) {
        conversationService.markRead(conversationId, userDetail.getId());
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Messages marked as read successfully", null)
        );
    }
}
