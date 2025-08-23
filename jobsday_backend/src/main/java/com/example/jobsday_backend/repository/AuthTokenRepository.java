package com.example.jobsday_backend.repository;


import com.example.jobsday_backend.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    AuthToken findByToken(String token);

    @Transactional
    void deleteByToken(String token);
}
