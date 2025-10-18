package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private S3Service s3Service;

    private final String avatars = "avatars";

    public User findById(long id){
        return userRepository.findById(id);
    }

    public User findByEmail(String email){
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email){
        return userRepository.existsByEmail(email);
    }

    public void createUser(User user){
        userRepository.save(user);
    }

    public void updateUser(User user){
        userRepository.save(user);
    }

    public void updateAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        try {
            // Xóa avatar cũ trên S3 nếu có
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                String oldKey = s3Service.extractKeyFromUrl(user.getAvatarUrl());
                s3Service.deleteFile(oldKey);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String fileName = userId + "_" + timestamp + "_" + file.getOriginalFilename();

            // Upload lên S3
            String fileUrl = s3Service.uploadFileWithCustomName(file, avatars, fileName);

            // Cập nhật vào DB
            user.setAvatarUrl(fileUrl);
            userRepository.save(user);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi upload avatar lên S3", e);
        }
    }

}
