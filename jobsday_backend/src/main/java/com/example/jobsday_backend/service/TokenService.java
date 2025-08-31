package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class TokenService {

    @Value("${app.env.jwtSecret}")
    private String jwtSecret;

    // Sinh token mới
    public String generateToken(User user) {
        Date now = new Date();
        long expiryInMs = 1000L * 60 * 60 * 24 * 30;
        Date expiryDate = new Date(now.getTime() + expiryInMs);

        return Jwts.builder()
                .claim("id", user.getId())
                .claim("role", user.getRole().name())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }

    // Kiểm tra token hợp lệ (chữ ký, hết hạn)
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Lấy role từ token
    public String extractRole(String token) {
        return (String) Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody()
                .get("role");
    }

    // Lấy id từ token
    public Long extractUserId(String token) {
        return Long.valueOf(
                (Integer) Jwts.parser()
                        .setSigningKey(jwtSecret)
                        .parseClaimsJws(token)
                        .getBody()
                        .get("id")
        );
    }
}
