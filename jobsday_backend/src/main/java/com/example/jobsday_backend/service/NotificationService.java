package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Notification;
import com.example.jobsday_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CompanyMemberService companyMemberService;

    public void sendNotification(Long userFrom, Long userTo, String type, String message) {
        Notification notification = new Notification();
        if (type.equalsIgnoreCase("APPLICATION_STATUS")) {
            Map<String, Object> memberInfo = companyMemberService.getMemberById(userFrom);
            notification.setUserFrom(userFrom);
            notification.setUserTo(userTo);
            String[] parts = message.split("_");
            String status = parts[0];
            String jobId = parts.length > 1 ? parts[1] : "";
            if (status.equalsIgnoreCase("APPROVED")) {
                notification.setTitle("Nhà tuyển dụng đã chấp nhận ứng tuyển của bạn");
                notification.setMessage(memberInfo.get("fullName") + " - " + memberInfo.get("position") + " - " + memberInfo.get("companyName") + ", đã đánh giá Cv của bạn phù hợp.");
            } else if (status.equalsIgnoreCase("REJECTED")) {
                notification.setTitle("Nhà tuyển dụng đã từ chối ứng tuyển của bạn");
                notification.setMessage(memberInfo.get("fullName") + " - " + memberInfo.get("position") + " - " + memberInfo.get("companyName") + ", đã đánh giá Cv của bạn chưa phù hợp.");
            } else if (status.equalsIgnoreCase("VIEWED")) {
                notification.setTitle("Nhà tuyển dụng vừa xem Cv ứng tuyển của bạn");
                notification.setMessage(memberInfo.get("fullName") + " - " + memberInfo.get("position") + " - " + memberInfo.get("companyName") + ", vừa xem Cv của bạn.");
            }
            notification.setUrl("job/" + jobId);
            notificationRepository.save(notification);
        } else if ( type.equalsIgnoreCase("HR_VIEWED")) {
            Map<String, Object> memberInfo = companyMemberService.getMemberById(userFrom);
            notification.setUserFrom(userFrom);
            notification.setUserTo(userTo);
            notification.setTitle("Nhà tuyển dụng vừa xem hồ sơ của bạn");
            notification.setMessage(memberInfo.get("fullName") + " - " + memberInfo.get("position") + " - " + memberInfo.get("companyName") + ", vừa xem Cv của bạn.");
            notification.setUrl("xem-ho-so");
            notificationRepository.save(notification);
        } else if (type.equalsIgnoreCase("NEW_MESSAGE")) {
            String[] parts = message.split("_");
            String conversationId = parts[0];
            String name = parts.length > 1 ? parts[1] : "";
            notification.setUserFrom(userFrom);
            notification.setUserTo(userTo);
            notification.setTitle("Bạn có cuộc trò chuyện mới");
            notification.setMessage("Ban đã nhận được tin nhắn mới từ " + name);
            notification.setUrl("/chat?conversationId=" + conversationId);
            notificationRepository.save(notification);
        } else if (type.equalsIgnoreCase("SYSTEM_ALERT")) {
            notificationRepository.save(notification);
        } else {
            throw new IllegalArgumentException("Invalid notification type: " + type);
        }
    }

    public List<Notification> getUnreadNotificationsOfUser(Long userId) {
        return notificationRepository.findByUserToAndIsReadFalseOrderByCreatedAtDesc(userId);
    }
    
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markReadAllOfUser(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

}
