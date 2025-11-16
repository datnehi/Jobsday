package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class TokenService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.refresh.secret}")
    private String refreshSecret;

    public String generateToken(User user) {
        Date now = new Date();
        long expiryInMs = 1000L * 60 * 15;
        Date expiryDate = new Date(now.getTime() + expiryInMs);
        return Jwts.builder()
                .claim("id", user.getId())
                .claim("role", user.getRole().name())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long extractUserId(String token) {
        return Long.valueOf(
                (Integer) Jwts.parser()
                        .setSigningKey(jwtSecret)
                        .parseClaimsJws(token)
                        .getBody()
                        .get("id")
        );
    }

    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        long expiryInMs = 1000L * 60 * 60 * 24 * 30;
        Date expiryDate = new Date(now.getTime() + expiryInMs);
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, refreshSecret)
                .compact();
    }

    public Long validateRefreshToken(String token) {
        return Long.valueOf(Jwts.parser()
                .setSigningKey(refreshSecret)
                .parseClaimsJws(token)
                .getBody().getSubject());
    }
}
