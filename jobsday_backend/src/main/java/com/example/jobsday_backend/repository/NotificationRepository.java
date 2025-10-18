package com.example.jobsday_backend.repository;

import com.example.jobsday_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserToAndIsReadFalseOrderByCreatedAtDesc(Long userTo);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userTo = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);

}
