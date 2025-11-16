package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.AppliedJobDto;
import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Application;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.service.ApplicationService;
import com.example.jobsday_backend.service.JobService;
import com.example.jobsday_backend.service.NotificationService;
import com.example.jobsday_backend.service.UserService;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JobService jobService;

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDto> applyJob(
            @RequestParam("jobId") Long jobId,
            @RequestParam(value = "coverLetter", required = false) String coverLetter,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @RequestParam(value = "cvId", required = false) Long cvId,
            @AuthenticationPrincipal CustomUserDetail userDetails) {

        Long candidateId = userDetails.getId();

        if (cvId != null) {
            applicationService.applyJobWithExistingCv(candidateId, jobId, cvId, coverLetter);
        } else if (cvFile != null && !cvFile.isEmpty()) {
            applicationService.applyJob(candidateId, jobId, coverLetter, cvFile);
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

        Application application = applicationService.getApplicationByJobAndCandidate(jobId, userDetails.getId());
        if (application == null) {
            return ResponseEntity.ok(
                    new ResponseDto(HttpStatus.OK.value(), "Bạn chưa apply công việc này", null)
            );
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Bạn đã apply công việc này", application)
        );
    }

    @GetMapping("/{applicationId}/cv/download")
    public ResponseEntity<Resource> downloadCvFile(
            @PathVariable Long applicationId
    ) throws Exception {
        return applicationService.downloadCvFile(applicationId);
    }

    @GetMapping("/candidate")
    public ResponseEntity<ResponseDto> getApplicationsByCandidate(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam(value = "status", required = false) Application.ApplicationStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        PageResultDto<AppliedJobDto> applications =
                applicationService.getApplicationsByCandidate(userDetails.getId(), status, page, size);

        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy danh sách ứng tuyển thành công", applications));
    }

    @GetMapping("/applied/{jobId}")
    public ResponseEntity<ResponseDto> getApplicationByJob(
            @PathVariable("jobId") Long jobId,
            @RequestParam(value = "page", defaultValue = "0") int page
    ) {
        int pageSize = 14;
        PageResultDto<Map<String, Object>> results = applicationService.getApplicationsByJob(jobId, page, pageSize);
        if (results == null || results.getTotalElements() == 0) {
            return ResponseEntity.ok(
                    new ResponseDto(HttpStatus.OK.value(), "Chưa có ai ứng tuyển công việc này", null)
            );
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Bạn đã apply công việc này", results)
        );
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<ResponseDto> updateApplicationStatus(
            @PathVariable("applicationId") Long applicationId,
            @RequestParam("status") Application.ApplicationStatus status
    ) {
        applicationService.updateApplicationStatus(applicationId, status);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Cập nhật trạng thái ứng tuyển thành công", null)
        );
    }

    @GetMapping("/admin")
    public ResponseEntity<ResponseDto> getApplicationsOfUser(
            @RequestParam(value = "userId") Long userId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "status", required = false) Application.ApplicationStatus status
    ) {
        int pageSize = 10;
        PageResultDto<AppliedJobDto> applications = applicationService.getApplicationsByCandidate(userId, status, page, pageSize);

        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Lấy danh sách ứng tuyển thành công", applications));
    }

    @DeleteMapping("/admin/{applicationId}")
    public ResponseEntity<ResponseDto> deleteApplicationByAdmin(
            @PathVariable("applicationId") Long applicationId
    ) {
        Application application = applicationService.getApplicationById(applicationId);
        if (application == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "Ứng tuyển không tồn tại", null));
        }
        Job job = jobService.findJobById(application.getJobId());
        applicationService.deleteApplication(applicationId);
        notificationService.sendNotification(1L, application.getCandidateId(), "SYSTEM_ALERT", "Đơn ứng tuyển vào " + job.getTitle() + " của bạn đã bị Jobsday xoá. Vui lòng liên hệ với chúng tôi nếu bạn cần hỗ trợ. Cảm ơn!");
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Xóa ứng tuyển thành công", null)
        );
    }
}
