package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.EmailRequestDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
public class EmailControler {

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<ResponseDto> sendTestEmail(@RequestBody EmailRequestDto emailRequestDto) {
        boolean send = emailService.sendEmail(emailRequestDto.getTo(), emailRequestDto.getSubject(), emailRequestDto.getText());
        if (!send) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDto(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Send email failed", null));
        }
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ResponseDto(HttpStatus.OK.value(), "Send email successfully", null));
    }
}
