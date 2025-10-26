package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.LoginRequestDto;
import com.example.jobsday_backend.dto.RegisterRequestDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.dto.VerifyOtpRequest;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyMemberService companyMemberService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private EmailService emailService;

    @Value("${password.secret}")
    private String passwordSecret;

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ResponseDto> register(@RequestBody RegisterRequestDto body) {
        System.out.println("Register request received: " + body);
        User userCheck = userService.findByEmail(body.getEmail());
        if (userCheck != null && Boolean.TRUE.equals(userCheck.getEmailVerified())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Email already in use", null));
        } else {
            authService.register(body, userCheck);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "User registered. Please check your email for OTP.", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ResponseDto> verifyOtp(@RequestBody VerifyOtpRequest request) {
        User user = userService.findByEmail(request.getEmail());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "User not found", null));
        }

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return ResponseEntity.ok(new ResponseDto(HttpStatus.OK.value(), "Email already verified", null));
        }

        if (user.getVerificationExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "OTP expired. Please register again.", null));
        }

        if (!user.getVerificationCode().equals(request.getOtp())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Invalid OTP", null));
        }

        authService.verifyOtp(request, user);

        return ResponseEntity.ok(new ResponseDto(HttpStatus.OK.value(), "Email verified successfully", null));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ResponseDto> resendOtp(@RequestBody VerifyOtpRequest request) {
        User user = userService.findByEmail(request.getEmail());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "User not found", null));
        }

        String otp = String.valueOf((int)((Math.random() * 900000) + 100000));
        user.setVerificationCode(otp);
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
        user.setEmailVerified(false);

        userService.updateUser(user);

        emailService.sendEmail(
                user.getEmail(),
                "Mã xác minh tài khoản",
                "Xin chào " + user.getFullName() +
                        ",\n\nMã OTP xác minh tài khoản của bạn là: " + otp +
                        "\nMã có hiệu lực trong 10 phút.\n\nCảm ơn!"
        );

        return ResponseEntity.ok(new ResponseDto(HttpStatus.OK.value(), "Resend successfully", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseDto> login(@RequestBody LoginRequestDto body) {
        User user = userService.findByEmail(body.getEmail());

        if (user == null || Boolean.FALSE.equals(user.getEmailVerified())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }

        if(user.getRole() == User.Role.HR) {
            CompanyMember member = companyMemberService.getMemberByUserId(user.getId());
            if (member.getStatus() != CompanyMember.MemberStatusEnum.APPROVED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ResponseDto(HttpStatus.FORBIDDEN.value(), "Your company member account is inactive. Please wait for admin approval.", null));
            }

            Company company = companyService.getById(member.getCompanyId());
            if (company.getStatus() != Company.CompanyStatusEnum.APPROVED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ResponseDto(HttpStatus.FORBIDDEN.value(), "Your company account is inactive. Please contact support.", null));
            }
        }

        if (!passwordEncoder.matches(body.getPassword() + passwordSecret, user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDto(HttpStatus.UNAUTHORIZED.value(), "Invalid password", null));
        }

        String token = tokenService.generateToken(user);

        return ResponseEntity.status(HttpStatus.OK)
                .body(new ResponseDto(HttpStatus.OK.value(), "Login successfully", Map.of("token", token)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ResponseDto> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "No token provided", null));
        }
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ResponseDto(HttpStatus.OK.value(), "Logged out successfully", null));
    }
}