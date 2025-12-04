package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.dto.UserResponseDto;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.service.EmailService;
import com.example.jobsday_backend.service.NotificationService;
import com.example.jobsday_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Value("${password.secret}")
    private String passwordSecret;

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDto> getUserById(@PathVariable long id) {
        User user = userService.findById(id);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }

        UserResponseDto userDto = new UserResponseDto(user);

        return ResponseEntity.status(HttpStatus.OK)
                .body(new ResponseDto(HttpStatus.OK.value(), "Find successfully", userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<ResponseDto> getCurrentUser(@AuthenticationPrincipal CustomUserDetail user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDto(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", null));
        }

        User currentUser = userService.findById(user.getId());

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }

        UserResponseDto userDto = new UserResponseDto(currentUser);

        return ResponseEntity.status(HttpStatus.OK)
                .body(new ResponseDto(HttpStatus.OK.value(), "Get current user successfully", userDto));
    }

    @PutMapping("/update-public-info")
    public ResponseEntity<ResponseDto> updatePublicInfo(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam("isPublic") boolean isPublic) {
        User user = userService.findById(userDetails.getId());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        user.setNtdSearch(isPublic);
        userService.updateUser(user);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update public info successfully", null)
        );
    }

    @PutMapping("/update-info")
    public ResponseEntity<ResponseDto> updateUserInfo(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestBody UserResponseDto userDto) {
        User user = userService.findById(userDetails.getId());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        user.setFullName(userDto.getFullName());
        user.setPhone(userDto.getPhone());
        user.setDob(userDto.getDob());
        user.setAddress(userDto.getAddress());
        userService.updateUser(user);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update user info successfully", user)
        );
    }

    @PutMapping("/change-password")
    public ResponseEntity<ResponseDto> changePassword(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam("currentPassword") String currentPassword,
            @RequestParam("newPassword") String newPassword) {
        User user = userService.findById(userDetails.getId());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        if (!passwordEncoder.matches(currentPassword + passwordSecret, user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDto(HttpStatus.UNAUTHORIZED.value(), "Invalid password", null));
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword + passwordSecret));
        userService.updateUser(user);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Change password successfully", null)
        );
    }

    @PutMapping("/update-avatar")
    public ResponseEntity<ResponseDto> updateAvatar(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam("file") MultipartFile file) {
        User user = userService.findById(userDetails.getId());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        userService.updateAvatar(user, file);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update avatar successfully", null)
        );
    }

    @GetMapping("/admin")
    public ResponseEntity<ResponseDto> getAllUsers(
            @RequestParam(value = "textSearch", required = false) String textSearch,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 20 : size);
        PageResultDto<User> users = userService.getAllUser(textSearch, page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get all users successfully", users)
        );
    }

    @PutMapping("/admin/reset-password/{userId}")
    public ResponseEntity<ResponseDto> resetPassword(@PathVariable Long userId) {
        User user = userService.findById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        userService.resetPassword(user);
        emailService.sendEmail(
                user.getEmail(),
                "Thay đổi mật khẩu",
                "Xin chào " + user.getFullName() +
                        ",\n\nMật khẩu tài khoản của bạn đã được đổi thành: Jobsday123@" +
                        "\nVui lòng cập nhật.\n\nCảm ơn!"
        );
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Reset password successfully", null)
        );
    }

    @PutMapping("/admin/update-avatar/{userId}")
    public ResponseEntity<ResponseDto> updateAvatarUser(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        User user = userService.findById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        userService.updateAvatar(user, file);
        notificationService.sendNotification(1L, userId, "SYSTEM_ALERT", "Ảnh đại diện của bạn đã được Jobsday thay đổi. Vui lòng cập nhật. Cảm ơn!");
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update avatar successfully", null)
        );
    }

    @PutMapping("/admin/update-info")
    public ResponseEntity<ResponseDto> updateUserInfoAdmin(
            @RequestBody User user) {
        User userInfo = userService.findById(user.getId());
        if (userInfo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }
        if (user.getFullName() != null) {
            userInfo.setFullName(user.getFullName());
        }
        if (user.getPhone() != null) {
            userInfo.setPhone(user.getPhone());
        }
        if (user.getDob() != null) {
            userInfo.setDob(user.getDob());
        }
        if (user.getAddress() != null) {
            userInfo.setAddress(user.getAddress());
        }
        if (user.getStatus() != null) {
            userInfo.setStatus(user.getStatus());
        }
        if (user.getEmailVerified() != null) {
            userInfo.setEmailVerified(user.getEmailVerified());
        }
        if (user.getNtdSearch() != null) {
            userInfo.setNtdSearch(user.getNtdSearch());
        }
        if (user.getVerificationCode() != null) {
            userInfo.setVerificationCode(user.getVerificationCode());
        }
        if (user.getVerificationExpiry() != null) {
            userInfo.setVerificationExpiry(user.getVerificationExpiry());
        }
        userService.updateUser(userInfo);
        notificationService.sendNotification(1L, userInfo.getId(), "SYSTEM_ALERT", "Thông tin cá nhân của bạn đã được Jobsday thay đổi. Vui lòng cập nhật. Cảm ơn!");
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update user info successfully", user)
        );
    }

}
