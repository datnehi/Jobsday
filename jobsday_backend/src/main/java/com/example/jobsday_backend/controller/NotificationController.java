package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Notification;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.service.NotificationService;
import com.example.jobsday_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @PostMapping("/send")
    public ResponseEntity<ResponseDto> createNotification(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam("userTo") Long userTo,
            @RequestParam("type") String type,
            @RequestParam("message") String message
    ) {
        User user = userService.findById(userTo);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Không thấy người nhận.", null));
        }

        notificationService.sendNotification(userDetails.getId(), userTo, type, message);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "Gửi thông báo thành công.", null));
    }

    @GetMapping
    public ResponseEntity<ResponseDto> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetail userDetails
    ) {
        List<Notification> notifications = notificationService.getUnreadNotificationsOfUser(userDetails.getId());
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy thông báo thành công.", notifications)
        );
    }

    @GetMapping("/{id}/read")
    public ResponseEntity<ResponseDto> markAsRead(
            @PathVariable("id") Long notificationId
    ) {
        Notification notification = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Đánh dấu đã đọc thành công.", notification)
        );
    }

    @PostMapping("/readall")
    public ResponseEntity<ResponseDto> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetail userDetails
    ) {
        notificationService.markReadAllOfUser(userDetails.getId());
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Đánh dấu tất cả đã đọc thành công.", null)
        );
    }
}
