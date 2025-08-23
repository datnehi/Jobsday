package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.AuthToken;
import com.example.jobsday_backend.repository.AuthTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TokensService {

    @Autowired
    private AuthTokenRepository authTokenRepository;

    public AuthToken findByToken(String token){
        return authTokenRepository.findByToken(token);
    }
}
