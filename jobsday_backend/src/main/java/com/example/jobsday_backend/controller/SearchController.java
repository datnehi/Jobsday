package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.*;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {
    
    @Autowired
    private SearchService searchService;

    @GetMapping("/jobs")
    public ResponseEntity<ResponseDto> searchJobs(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "location", required = false) Job.Location location,
            @RequestParam(value = "experience", required = false) Job.Experience experience,
            @RequestParam(value = "level", required = false) Job.Level level,
            @RequestParam(value = "salary", required = false) Job.Salary salary,
            @RequestParam(value = "jobType", required = false) Job.JobType jobType,
            @RequestParam(value = "contractType", required = false) Job.ContractType contractType,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 10 : size);
        PageResultDto<JobItemDto> jobs = searchService.findJobs(
                q, location, experience, level, salary, jobType, contractType, userId, page, pageSize
        );
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find jobs successfully", jobs)
        );
    }

    @GetMapping("/companies")
    public ResponseEntity<ResponseDto> searchCompanies(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "location", required = false) Company.Location location,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 10 : size);
        PageResultDto<CompanyItemDto> companies = searchService.findCompanies(
                q, location, page, pageSize
        );
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find companies successfully", companies)
        );
    }

    @GetMapping("/candidates")
    public ResponseEntity<ResponseDto> searchCandidates(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "location", required = false) Job.Location location,
            @RequestParam(value = "experience", required = false) Job.Experience experience,
            @RequestParam(value = "level", required = false) Job.Level level,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 10 : size);
        PageResultDto<CandidateSearchDto> candidates = searchService.findCandidates(
                q, experience, level, page, pageSize
        );
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Find candidates successfully", candidates)
        );
    }
}
