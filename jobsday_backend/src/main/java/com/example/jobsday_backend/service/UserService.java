package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private S3Service s3Service;

    private final String avatars = "avatars";

    @Value("${password.secret}")
    private String passwordSecret;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User findById(long id) {
        return userRepository.findById(id);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public void createUser(User user) {
        userRepository.save(user);
    }

    public void updateUser(User user) {
        userRepository.save(user);
    }

    public void updateAvatar(User user, MultipartFile file) {
        try {
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                String oldKey = s3Service.extractKeyFromUrl(user.getAvatarUrl());
                s3Service.deleteFile(oldKey);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String fileName = user.getId() + "_" + timestamp + "_" + file.getOriginalFilename();

            String fileUrl = s3Service.uploadFileWithCustomName(file, avatars, fileName);

            user.setAvatarUrl(fileUrl);
            userRepository.save(user);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi upload avatar lên S3", e);
        }
    }

    public PageResultDto<User> getAllUser(String textSearch, int page, int size) {
        int offset = page * size;
        List<User> users = userRepository.getALl(textSearch, size, offset);
        long totalElements = userRepository.countAllNonAdminUsers(textSearch);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                users,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

    public void resetPassword(User user) {
        String hashedPassword = passwordEncoder.encode("Jobsday123@" + passwordSecret);
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}
