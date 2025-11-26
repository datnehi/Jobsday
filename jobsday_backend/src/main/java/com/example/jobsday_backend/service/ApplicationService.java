package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.AppliedJobDto;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.Application;
import com.example.jobsday_backend.entity.Cvs;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.ApplicationRepository;
import com.example.jobsday_backend.repository.CvsRepository;
import com.example.jobsday_backend.repository.JobRepository;
import com.example.jobsday_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CvsRepository cvsRepository;

    @Autowired
    private S3Service s3Service;

    private final String cvApplicationFolder = "cvApplications";

    public void applyJob(Long candidateId, Long jobId, String coverLetter, MultipartFile cvFile) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy job"));

        if((job.getDeadline() != null && job.getDeadline().isBefore(LocalDate.now()) || job.getStatus() != Job.JobStatus.ACTIVE)) {
            throw new RuntimeException("Hạn nộp hồ sơ đã kết thúc");
        }

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        String originalFilename = cvFile.getOriginalFilename();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String s3FileName = jobId + "_" + timestamp + "_" + originalFilename;

        String s3Url = s3Service.uploadFileWithCustomName(cvFile, cvApplicationFolder, s3FileName);

        Application existingApplication = applicationRepository.findByJobIdAndCandidateId(jobId, candidateId);
        if (existingApplication != null) {
            existingApplication.setFileName(originalFilename);
            existingApplication.setCvUrl(s3Url);
            existingApplication.setCoverLetter(coverLetter);
            existingApplication.setAppliedAt(LocalDateTime.now());
            applicationRepository.save(existingApplication);
        } else {
            Application application = new Application();
            application.setJobId(job.getId());
            application.setCandidateId(candidate.getId());
            application.setFileName(originalFilename);
            application.setCvUrl(s3Url);
            application.setCoverLetter(coverLetter);
            application.setAppliedAt(LocalDateTime.now());
            applicationRepository.save(application);
        }
    }

    public void applyJobWithExistingCv(Long candidateId, Long jobId, Long cvId, String coverLetter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy job"));

        if((job.getDeadline() != null && job.getDeadline().isBefore(LocalDate.now()) || job.getStatus() != Job.JobStatus.ACTIVE)) {
            throw new RuntimeException("Hạn nộp hồ sơ đã kết thúc");
        }

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Cvs cv = cvsRepository.findById(cvId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CV"));

        if (!cv.getUserId().equals(candidateId)) {
            throw new RuntimeException("CV không thuộc về user này");
        }

        String originalFilename = cv.getTitle();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String newFileName = jobId + "_" + timestamp + "_" + originalFilename;

        String sourceKey = s3Service.extractKeyFromUrl(cv.getFileUrl());
        String targetKey = cvApplicationFolder + "/" + newFileName;
        s3Service.copyFile(sourceKey, targetKey);

        String newS3Url = s3Service.getPublicUrl(targetKey);

        Application application = applicationRepository.findByJobIdAndCandidateId(jobId, candidateId);
        if (application == null) {
            application = new Application();
            application.setJobId(job.getId());
            application.setCandidateId(candidate.getId());
        }

        application.setFileName(originalFilename);
        application.setCvUrl(newS3Url);
        application.setCoverLetter(coverLetter);
        application.setAppliedAt(LocalDateTime.now());
        applicationRepository.save(application);
    }

    public ResponseEntity<Resource> downloadCvFile(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));

        String key = s3Service.extractKeyFromUrl(application.getCvUrl());
        ResponseInputStream<GetObjectResponse> s3ObjectStream;
        try {
            s3ObjectStream = s3Service.downloadFile(key);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tải file từ S3", e);
        }

        Resource resource = new InputStreamResource(s3ObjectStream);

        String fileName = s3Service.extractFileNameFromUrl(application.getCvUrl());
        String lowerName = fileName.toLowerCase();

        boolean isPdf = lowerName.endsWith(".pdf");

        String fileType;
        if (isPdf) {
            fileType = "application/pdf";
        } else if (lowerName.endsWith(".docx")) {
            fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (lowerName.endsWith(".doc")) {
            fileType = "application/msword";
        } else {
            fileType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "filename=\"" + fileName + "\"")
                .body(resource);
    }

    public Application getApplicationByJobAndCandidate(Long jobId, Long candidateId) {
        return applicationRepository.findByJobIdAndCandidateId(jobId, candidateId);
    }

    public PageResultDto<AppliedJobDto> getApplicationsByCandidate(
            Long candidateId,
            Application.ApplicationStatus status,
            int page,
            int size
    ) {
        int offset = page * size;
        List<Object[]> result;
        if(status != null) {
            result = applicationRepository.findApplicationsByCandidateIdAndStatus(candidateId, status.name(), size, offset);
        } else {
            result = applicationRepository.findApplicationsByCandidateId(candidateId, size, offset);
        }
        List<AppliedJobDto> applications = new ArrayList<>();
        for (Object[] row : result) {
            Long applicationId = ((Number) row[0]).longValue();
            Long jobId = ((Number) row[1]).longValue();
            String jobTitle = (String) row[2];
            Long companyId = ((Number) row[3]).longValue();
            String companyName = (String) row[4];
            String companyLogo = (String) row[5];
            Application.ApplicationStatus applicationStatus = Application.ApplicationStatus.valueOf((String) row[6]);
            String cvUrl = (String) row[7];
            String fileName = (String) row[8];
            String coverLetter = (String) row[9];
            String appliedAt = row[10].toString();
            String updatedAt = row[11].toString();

            applications.add(new AppliedJobDto(
                    applicationId,
                    jobId,
                    jobTitle,
                    companyId,
                    companyName,
                    companyLogo,
                    applicationStatus,
                    cvUrl,
                    fileName,
                    coverLetter,
                    appliedAt,
                    updatedAt
            ));
        }

        long totalElements;
        if(status != null) {
            totalElements = applicationRepository.countApplicationsByCandidateIdAndStatus(candidateId, status.name());
        } else {
            totalElements = applicationRepository.countApplicationsByCandidateId(candidateId);
        }
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                applications,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

    public PageResultDto<Map<String,Object>> getApplicationsByJob(Long jobId, int page, int size) {
        int offset = page * size;
        List<Object[]> result = applicationRepository.findByJobId(jobId, size, offset);
        List<Map<String,Object>> applications = new ArrayList<>();
        for (Object[] row : result) {
            Long applicationId = ((Number) row[0]).longValue();
            Long candidateId = ((Number) row[1]).longValue();
            String coverLetter = row[6] != null ? (String) row[2] : "";
            Application.ApplicationStatus applicationStatus = Application.ApplicationStatus.valueOf((String) row[3]);
            String appliedAt = (( Timestamp) row[4]).toLocalDateTime().toString();
            String candidateName = (String) row[5];
            String candidateAvatar = row[6] != null ? (String) row[6] : "";
            String candidateEmail = row[6] != null ? (String) row[7] : "";
            String candidatePhone = row[8] != null ? (String) row[8] : "";

            applications.add(Map.of(
                    "applicationId", applicationId,
                    "candidateId", candidateId,
                    "candidateName", candidateName,
                    "candidateAvatar", candidateAvatar,
                    "candidateEmail", candidateEmail,
                    "candidatePhone", candidatePhone,
                    "coverLetter", coverLetter,
                    "appliedAt", appliedAt,
                    "status", applicationStatus
            ));
        }

        long totalElements = applicationRepository.countByJobId(jobId);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                applications,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

    public void updateApplicationStatus(Long applicationId, Application.ApplicationStatus status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));
        application.setStatus(status);
        applicationRepository.save(application);
    }

    public void deleteApplication(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));
        try {
            String key = s3Service.extractKeyFromUrl(application.getCvUrl());
            s3Service.deleteFile(key);

        } catch (Exception e) {
            throw new RuntimeException("Không thể xóa file CV cũ", e);
        }
        applicationRepository.delete(application);
    }

    public List<Application> getApplicationsByJobId(Long jobId) {
        return applicationRepository.findByJobId(jobId);
    }

    public Application getApplicationById(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));
    }
}
