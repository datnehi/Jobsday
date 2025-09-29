package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.service.SavedJobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-jobs")
public class SavedJobController {
    @Autowired
    private SavedJobService savedJobService;

    @GetMapping("/check/{jobId}")
    public ResponseEntity<ResponseDto> isJobSaved(
            @PathVariable Long jobId,
            @AuthenticationPrincipal CustomUserDetail userDetails) {
        boolean isSaved = savedJobService.isJobSaved(userDetails.getId(), jobId);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Check saved job successfully", isSaved)
        );
    }

    @PostMapping("/{jobId}")
    public ResponseEntity<ResponseDto> saveJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal CustomUserDetail userDetails) {
        savedJobService.saveJob(userDetails.getId(), jobId);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Job saved successfully", null)
        );
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<ResponseDto> unsaveJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal CustomUserDetail userDetails) {
        savedJobService.unsaveJob(userDetails.getId(), jobId);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Unsave job successfully", null)
        );
    }

    @GetMapping("/candidate")
    public ResponseEntity<ResponseDto> getSavedJobs(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page
    ) {
        int pageSize = 10;
        PageResultDto<JobItemDto> jobs = savedJobService.getSavedJobs(userDetails.getId(), page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find saved job successfully", jobs)
        );
    }
}

