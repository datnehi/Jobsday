package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.JobItemDto;
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
            @RequestParam String title,
            @RequestParam Job.Level level,
            @RequestParam Job.Location location) {

        List<JobItemDto> jobs = jobService.findTopSimilarJobs(jobId, title, level, location);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find Job successfully", jobs)
        );
    }
}
