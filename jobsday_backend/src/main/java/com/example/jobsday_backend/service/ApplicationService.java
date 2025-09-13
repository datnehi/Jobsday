package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Application;
import com.example.jobsday_backend.entity.Job;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.ApplicationRepository;
import com.example.jobsday_backend.repository.JobRepository;
import com.example.jobsday_backend.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.upload.cv-dir}")
    private Path cvUploadDir;

    public Application applyJob(Long candidateId, Long jobId, String coverLetter, MultipartFile cvFile) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy job"));

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        // Tạo folder nếu chưa tồn tại
        try {
            Files.createDirectories(cvUploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục upload CV", e);
        }

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

        Application application = new Application();
        application.setJobId(job.getId());
        application.setCandidateId(candidate.getId());
        application.setFileName(originalFileName); // tên gốc của file
        application.setFileType(fileType);         // kiểu file (pdf/docx/...)
        application.setCvUrl(filePath.toString()); // đường dẫn file
        application.setCoverLetter(coverLetter);

        return applicationRepository.save(application);
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

    public Resource loadCvFile(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy application"));

        Path filePath = Path.of(application.getCvUrl());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File không tồn tại");
        }

        try {
            return new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Không thể đọc file", e);
        }
    }

    public String getFileContentType(Application application, Path filePath) {
        String contentType = application.getFileType();
        if (contentType == null || contentType.isBlank()) {
            try {
                contentType = Files.probeContentType(filePath);
            } catch (IOException e) {
                contentType = "application/octet-stream";
            }
        }
        return contentType;
    }

}
