package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Application;
import com.example.jobsday_backend.service.ApplicationService;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDto> applyJob(
            @RequestParam("jobId") Long jobId,
            @RequestParam(value = "coverLetter", required = false) String coverLetter,
            @RequestParam("cvFile") MultipartFile cvFile,
            @AuthenticationPrincipal CustomUserDetail userDetails) {

        Long candidateId = userDetails.getId();
        Application application = applicationService.applyJob(candidateId, jobId, coverLetter, cvFile);
        return ResponseEntity.created(null)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "Ứng tuyển thành công", application));
    };

    @GetMapping("/check/{jobId}")
    public ResponseEntity<ResponseDto> checkIfApplied(
            @PathVariable("jobId") Long jobId,
            @AuthenticationPrincipal CustomUserDetail userDetails) {
        Long candidateId = userDetails.getId();
        Application application = applicationService.getApplicationByJobAndCandidate(jobId, candidateId);
        if(application == null) {
            return ResponseEntity.ok(
                    new ResponseDto(HttpStatus.OK.value(), "Bạn chưa apply công việc này", null)
            );
        }

        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Bạn đã apply công việc này", application)
        );
    }


    @GetMapping("/{id}/cv")
    public ResponseEntity<Resource> viewCv(@PathVariable Long id) {
        Application application = applicationService.getApplicationById(id);

        Path filePath = Path.of(application.getCvUrl());
        Resource resource = applicationService.loadCvFile(id);

        String contentType = applicationService.getFileContentType(application, filePath);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + application.getFileName() + "\"")
                .body(resource);
    }

}