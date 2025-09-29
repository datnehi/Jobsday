package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.JobItemDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job")
public class JobController {

    @Autowired
    private JobService jobService;

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDto> getById(@PathVariable Long id) {
        Job job = jobService.findJobById(id);
        if (job == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Job not found", null));
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find Job successfully", job)
        );
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<ResponseDto> getSimilarJobs(
            @PathVariable("id") Long jobId,
            @RequestParam(value = "userId", required = false) Long userIdParam) {
        Long userId = (userIdParam == null || userIdParam == 0) ? null : userIdParam;

        List<JobItemDto> jobs = jobService.findTopSimilarJobs(jobId, userId);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find Job successfully", jobs)
        );
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<ResponseDto> getJobsByCompanyId(
            @PathVariable Long companyId,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 5 : size);
        PageResultDto<JobItemDto> jobs = jobService.findJobsByCompanyId(companyId, userId, q, page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find Jobs by Company ID successfully", jobs)
        );
    }

}
