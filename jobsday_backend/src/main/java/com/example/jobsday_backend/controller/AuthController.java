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

    @Value("${app.env.passwordSecret}")
    private String passwordSecret;

    @PostMapping("/register")
    public ResponseEntity<ResponseDto> register(@RequestBody RegisterRequestDto body) {
        User userCheck = userService.findByEmail(body.getEmail());
        if (userCheck != null && Boolean.TRUE.equals(userCheck.getEmailVerified())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Email already in use", null));
        } else {
            if (userCheck != null) {
                String hashedPassword = passwordEncoder.encode(body.getPassword() + passwordSecret);
                userCheck.setEmail(body.getEmail());
                userCheck.setPasswordHash(hashedPassword);
                userCheck.setFullName(body.getFullName());
                userCheck.setDob(body.getDob());
                userCheck.setPhone(body.getPhone());
                userCheck.setAvatarUrl(body.getAvatarUrl());
                userCheck.setRole(body.getRole());
                if ("HR".equalsIgnoreCase(String.valueOf(body.getRole()))) {
                    userCheck.setStatus(User.Status.INACTIVE);
                }
                String otp = String.valueOf((int)((Math.random() * 900000) + 100000));
                userCheck.setVerificationCode(otp);
                userCheck.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
                userCheck.setEmailVerified(false);

                userService.updateUser(userCheck);

                emailService.sendEmail(
                        userCheck.getEmail(),
                        "Mã xác minh tài khoản",
                        "Xin chào " + userCheck.getFullName() +
                                ",\n\nMã OTP xác minh tài khoản của bạn là: " + otp +
                                "\nMã có hiệu lực trong 10 phút.\n\nCảm ơn!"
                );
            } else {
                String hashedPassword = passwordEncoder.encode(body.getPassword() + passwordSecret);
                User user = new User();
                user.setEmail(body.getEmail());
                user.setPasswordHash(hashedPassword);
                user.setFullName(body.getFullName());
                user.setDob(body.getDob());
                user.setPhone(body.getPhone());
                user.setAvatarUrl(body.getAvatarUrl());
                user.setRole(body.getRole());
                if ("HR".equalsIgnoreCase(String.valueOf(body.getRole()))) {
                    user.setStatus(User.Status.INACTIVE);
                }
                String otp = String.valueOf((int)((Math.random() * 900000) + 100000));
                user.setVerificationCode(otp);
                user.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
                user.setEmailVerified(false);

                userService.createUser(user);

                emailService.sendEmail(
                        user.getEmail(),
                        "Mã xác minh tài khoản",
                        "Xin chào " + user.getFullName() +
                                ",\n\nMã OTP xác minh tài khoản của bạn là: " + otp +
                                "\nMã có hiệu lực trong 10 phút.\n\nCảm ơn!"
                );
            }
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

        // ✅ Xác minh thành công
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        userService.updateUser(user);

        // Nếu là HR thì gắn vào công ty
        if ("HR".equalsIgnoreCase(String.valueOf(user.getRole()))) {
            if (request.getCompanyCode() != null) {
                Company company = companyService.getById(Long.valueOf(request.getCompanyCode()));
                if (company == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Invalid company code", null));
                }
                CompanyMember cm = new CompanyMember();
                cm.setCompanyId(company.getId());
                cm.setUserId(user.getId());
                cm.setIsAdmin(false);
                companyMemberService.addMember(cm);
            } else {
                Company company = new Company();
                company.setName(request.getCompanyName());
                company.setAddress(request.getCompanyAddress());
                company.setWebsite(request.getCompanyWebsite());
                company.setTaxCode(request.getCompanyTaxCode());
                company.setDescription(request.getCompanyDetail());
                company.setStatus(Company.CompanyStatusEnum.PENDING);
                companyService.create(company);

                CompanyMember cm = new CompanyMember();
                cm.setCompanyId(company.getId());
                cm.setUserId(user.getId());
                cm.setIsAdmin(true);
                companyMemberService.addMember(cm);
            }
        }

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