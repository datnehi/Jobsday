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
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    @Value("${app.upload.cv-apply}")
    private Path cvUploadDir;

    public void applyJob(Long candidateId, Long jobId, String coverLetter, MultipartFile cvFile) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy job"));

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        // Lưu file
        String originalFileName = cvFile.getOriginalFilename();
        String fileName = UUID.randomUUID() + "_" + originalFileName; // tránh trùng
        Path filePath = cvUploadDir.resolve(fileName);

        try {
            cvFile.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file CV", e);
        }

        // Lấy file type (nếu null thì fallback theo extension)
        String fileType = cvFile.getContentType();
        if (fileType == null && originalFileName != null && originalFileName.contains(".")) {
            fileType = originalFileName.substring(originalFileName.lastIndexOf(".") + 1);
        }

        Application existingApplication = applicationRepository.findByJobIdAndCandidateId(jobId, candidateId);
        if (existingApplication != null) {
            try {
                Path oldPath = Paths.get(existingApplication.getCvUrl());
                Files.deleteIfExists(oldPath);
            } catch (IOException e) {
                throw new RuntimeException("Không thể xóa file CV cũ", e);
            }
            existingApplication.setFileName(originalFileName);
            existingApplication.setFileType(fileType);
            existingApplication.setCvUrl(filePath.toString());
            existingApplication.setCoverLetter(coverLetter);
            existingApplication.setAppliedAt(LocalDateTime.now());
            applicationRepository.save(existingApplication);
        } else {
            Application application = new Application();
            application.setJobId(job.getId());
            application.setCandidateId(candidate.getId());
            application.setFileName(originalFileName);
            application.setFileType(fileType);
            application.setCvUrl(filePath.toString());
            application.setCoverLetter(coverLetter);
            applicationRepository.save(application);
        }
    }

    public void applyJobWithExistingCv(Long candidateId, Long jobId, Long cvId, String coverLetter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy job"));

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Cvs cv = cvsRepository.findById(cvId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CV"));

        if (!cv.getUserId().equals(candidateId)) {
            throw new RuntimeException("CV không thuộc về user này");
        }

        // Copy file từ cvs sang application folder
        Path sourcePath = Paths.get(cv.getFileUrl());
        String originalFileName = Paths.get(cv.getFileUrl()).getFileName().toString();
        String newFileName = UUID.randomUUID() + "_" + originalFileName;
        Path targetPath = cvUploadDir.resolve(newFileName);

        try {
            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Không thể copy file CV từ cvs sang application", e);
        }

        Application existingApplication = applicationRepository.findByJobIdAndCandidateId(jobId, candidateId);
        if (existingApplication != null) {
            try {
                Path oldPath = Paths.get(existingApplication.getCvUrl());
                Files.deleteIfExists(oldPath);
            } catch (IOException e) {
                throw new RuntimeException("Không thể xóa file CV cũ", e);
            }
            existingApplication.setFileName(originalFileName);
            existingApplication.setFileType(cv.getFileType());
            existingApplication.setCvUrl(targetPath.toString());
            existingApplication.setCoverLetter(coverLetter);
            existingApplication.setAppliedAt(LocalDateTime.now());
            applicationRepository.save(existingApplication);
        } else {
            Application application = new Application();
            application.setJobId(job.getId());
            application.setCandidateId(candidate.getId());
            application.setFileName(originalFileName);
            application.setFileType(cv.getFileType());
            application.setCvUrl(targetPath.toString());
            application.setCoverLetter(coverLetter);
            applicationRepository.save(application);
        }
    }

    public boolean hasApplied(Long jobId, Long candidateId) {
        return applicationRepository.existsByJobIdAndCandidateId(jobId, candidateId);
    }

    public Application getApplicationByJobAndCandidate(Long jobId, Long candidateId) {
        return applicationRepository.findByJobIdAndCandidateId(jobId, candidateId);
    }

    public Application getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));
    }

    public ResponseEntity<Resource> loadCvFile(Long applicationId, String mode) throws Exception {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));

        Path filePath = Path.of(application.getCvUrl());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File không tồn tại");
        }

        String fileName = filePath.getFileName().toString();
        String fileType = resolveFileType(application.getFileType(), fileName);

        Resource resource = new UrlResource(filePath.toUri());

        // inline (xem trực tiếp) hoặc attachment (download)
        String disposition = "inline";
        if ("download".equalsIgnoreCase(mode)) {
            disposition = "attachment";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + fileName + "\"")
                .body(resource);
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
            String jobTitle = (String) row[1];
            String companyName = (String) row[2];
            Application.ApplicationStatus applicationStatus = Application.ApplicationStatus.valueOf((String) row[3]);
            String cvUrl = (String) row[4];
            String fileName = (String) row[5];
            String fileType = (String) row[6];
            String appliedAt = row[7].toString();
            String updatedAt = row[8].toString();

            applications.add(new AppliedJobDto(
                    applicationId,
                    jobTitle,
                    companyName,
                    applicationStatus,
                    cvUrl,
                    fileName,
                    fileType,
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

    private String resolveFileType(String fileType, String fileName) {
        if (fileType != null) return fileType;

        if (fileName.endsWith(".pdf")) {
            return "application/pdf";
        } else if (fileName.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (fileName.endsWith(".doc")) {
            return "application/msword";
        } else {
            return "application/octet-stream";
        }
    }

}
