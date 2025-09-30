package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Value("${app.upload.avatar}")
    private Path avatarUploadDir;

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
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                Path oldPath = Paths.get(avatarUploadDir.toString(),
                        Paths.get(user.getAvatarUrl()).getFileName().toString());
                Files.deleteIfExists(oldPath);
            }

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = avatarUploadDir.resolve(fileName);

            file.transferTo(filePath.toFile());

            String avatarUrl = "/uploads/avatars/" + fileName;

            user.setAvatarUrl(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu avatar", e);
        }
    }

}
