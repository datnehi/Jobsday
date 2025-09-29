package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.AppliedJobDto;
import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Application;
import com.example.jobsday_backend.service.ApplicationService;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDto> applyJob(
            @RequestParam("jobId") Long jobId,
            @RequestParam(value = "coverLetter", required = false) String coverLetter,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @RequestParam(value = "cvId", required = false) Long cvId,
            @AuthenticationPrincipal CustomUserDetail userDetails) {

        if (cvId != null) {
            applicationService.applyJobWithExistingCv(userDetails.getId(), jobId, cvId, coverLetter);
        } else if (cvFile != null && !cvFile.isEmpty()) {
            applicationService.applyJob(userDetails.getId(), jobId, coverLetter, cvFile);
        } else {
            throw new RuntimeException("Bạn phải chọn CV có sẵn hoặc upload CV mới");
        }

        return ResponseEntity.created(null)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "Ứng tuyển thành công", null));
    }

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

    @GetMapping("/{applicationId}/cv/view")
    public ResponseEntity<Resource> viewCvFile(@PathVariable Long applicationId) throws Exception {
        return applicationService.loadCvFile(applicationId, "view");
    }

    @GetMapping("/{applicationId}/cv/download")
    public ResponseEntity<Resource> downloadCvFile(@PathVariable Long applicationId) throws Exception {
        return applicationService.loadCvFile(applicationId, "download");
    }

    @GetMapping("/candidate")
    public ResponseEntity<ResponseDto> getApplicationsByCandidate(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam(value = "status", required = false) Application.ApplicationStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page
    ) {
        int pageSize = 10;
        PageResultDto<AppliedJobDto> applications = applicationService.getApplicationsByCandidate(userDetails.getId(), status, page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy danh sách ứng tuyển thành công", applications));
    }

}