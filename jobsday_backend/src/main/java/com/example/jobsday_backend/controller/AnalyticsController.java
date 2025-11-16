package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/admin/overview")
    public ResponseEntity<ResponseDto> getOverview(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Overview data fetched successfully", analyticsService.getOverview(days))
        );
    }

    @GetMapping("/admin/applications-by-day")
    public ResponseEntity<ResponseDto> applicationsByDay(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Applications by day fetched successfully", analyticsService.getAnalyticsDays(days))
        );
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ResponseDto> getStats(
            @PathVariable long companyId,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "HR stats fetched successfully", analyticsService.getStats(companyId, days))
        );
    }

}

