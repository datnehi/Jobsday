package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.*;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.service.CompanyMemberService;
import com.example.jobsday_backend.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job")
public class JobController {

    @Autowired
    private JobService jobService;

    @Autowired
    private CompanyMemberService companyMemberService;

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

    @GetMapping("/search/{companyId}")
    public ResponseEntity<ResponseDto> searchJobs(
            @PathVariable Long companyId,
            @RequestParam(value = "memberId", required = false) Long memberId,
            @RequestParam(value = "location",required = false) Job.Location location,
            @RequestParam(value = "deadline",required = false) String deadline,
            @RequestParam(value = "status",required = false) Job.JobStatus status,
            @RequestParam(value = "q",required = false) String q,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 10 : size);
        PageResultDto<JobCompanyDto> jobs = jobService.findJobsByCompany(companyId, memberId, location, deadline, status, q, page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find Jobs by Company ID successfully", jobs)
        );
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ResponseDto> updateJob(
            @PathVariable Long id,
            @RequestBody Job job
    ) {
        Job existingJob = jobService.findJobById(id);
        if (existingJob == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Job not found", null));
        }

        Job updatedJob = jobService.updateJob(job);

        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Update Job successfully", updatedJob)
        );
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDto> deleteJob(@PathVariable Long id) {
        Job existingJob = jobService.findJobById(id);
        if (existingJob == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Job not found", null));
        }

        jobService.deleteJob(id);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Delete Job successfully", null)
        );
    }

    @PostMapping("/create")
    public ResponseEntity<ResponseDto> createJob(@RequestBody Job job) {
        Job createdJob = jobService.updateJob(job);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDto(HttpStatus.CREATED.value(), "Create Job successfully", createdJob));
    }

    @GetMapping("/checkown/{jobId}")
    public ResponseEntity<ResponseDto> checkJobOwnership(
            @PathVariable Long jobId,
            @AuthenticationPrincipal CustomUserDetail userDetails
    ) {
        CompanyMember member = companyMemberService.getMemberByUserId(userDetails.getId());
        if (member == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ResponseDto(HttpStatus.FORBIDDEN.value(), "You are not a company member", null));
        }
        boolean isOwner = jobService.checkJobOwn(jobId, member.getId());
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Check Job ownership successfully", isOwner)
        );
    }

}
