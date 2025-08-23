package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.LoginRequestDto;
import com.example.jobsday_backend.dto.RegisterRequestDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.AuthToken;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.AuthTokenRepository;
import com.example.jobsday_backend.repository.UserRepository;
import com.example.jobsday_backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Value("${app.env.jwtSecret}")
    private String passwordSecret;

    @PostMapping("/register")
    public ResponseEntity<ResponseDto> register(@RequestBody RegisterRequestDto body) {
        if (userRepository.findByEmail(body.getEmail()) != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Email already in use", null));
        }

        String secretPassword = body.getPassword();
        String hashedPassword = passwordEncoder.encode(secretPassword);

        User user = new User();
        user.setEmail(body.getEmail());
        user.setPasswordHash(hashedPassword);
        user.setFullName(body.getFullName());
        user.setDob(body.getDob());
        user.setPhone(body.getPhone());
        user.setAvatarUrl(body.getAvatar_url());
        user.setRole(body.getRole() != null ? body.getRole() : User.Role.CANDIDATE);
        user.setStatus(User.Status.ACTIVE);

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "User registered successfully", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseDto> login(@RequestBody LoginRequestDto body) {
        User user = userRepository.findByEmail(body.getEmail());

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "User not found", null));
        }

        if (!passwordEncoder.matches(body.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDto(HttpStatus.UNAUTHORIZED.value(), "Invalid password", null));
        }

        String token = tokenService.generateToken(user);

        AuthToken authToken = new AuthToken();
        authToken.setUserId(user.getId());
        authToken.setToken(token);
        authTokenRepository.save(authToken);
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
        String token = header.substring(7);
        authTokenRepository.deleteByToken(token);
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ResponseDto(HttpStatus.OK.value(), "Logged out successfully", null));
    }
}