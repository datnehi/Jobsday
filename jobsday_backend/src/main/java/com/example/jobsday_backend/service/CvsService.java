package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Cvs;
import com.example.jobsday_backend.repository.CvsRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CvsService {
    @Autowired
    private CvsRepository cvsRepository;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private CvSkillsService cvSkillsService;

    private final String cvUploads = "cvUploads";

    public String extractText(MultipartFile file) throws Exception {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new RuntimeException("File name is invalid");
        }

        if (fileName.endsWith(".pdf")) {
            try (InputStream is = file.getInputStream();
                 PDDocument doc = PDDocument.load(is)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(doc);
            }
        } else if (fileName.endsWith(".docx")) {
            try (InputStream is = file.getInputStream();
                 XWPFDocument doc = new XWPFDocument(is)) {
                List<String> paragraphs = doc.getParagraphs()
                        .stream()
                        .map(XWPFParagraph::getText)
                        .collect(Collectors.toList());
                return String.join("\n", paragraphs);
            }
        } else {
            throw new RuntimeException("Unsupported file type. Only PDF and DOCX are supported.");
        }
    }

    public Cvs saveCV(Long userId, String title, MultipartFile file) throws Exception {
        int totalCvs = cvsRepository.countCvOfCandidate(userId);
        if (totalCvs >= 6) {
            throw new RuntimeException("Bạn đã đạt giới hạn 6 CV. Vui lòng xóa bớt CV cũ để tải lên CV mới.");
        }

        String content = extractText(file);
        String jobTitle = extractJobTitle(content);
        Cvs.Level level = extractLevel(content);
        Cvs.Experience experience = extractExperience(content);

        String originalFileName = file.getOriginalFilename();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String s3FileName = userId + "_" + timestamp + "_" + originalFileName;

        String fileUrl = s3Service.uploadFileWithCustomName(file, cvUploads, s3FileName);

        boolean isPublic = (totalCvs == 0);

        Cvs cv = Cvs.builder()
                .userId(userId)
                .title(title)
                .fileUrl(fileUrl)
                .jobTitle(jobTitle)
                .content(content)
                .level(level)
                .experience(experience)
                .isPublic(isPublic)
                .build();

        Cvs cvs = cvsRepository.save(cv);
        cvSkillsService.saveCvSkills(cv.getId(), content);
        return cvs;
    }

    public Cvs.Level extractLevel(String content) {
        if (content == null) return null;
        String lower = content.toLowerCase();

        if (lower.contains("intern") || lower.contains("thực tập")) return Cvs.Level.INTERN;
        if (lower.contains("fresher")) return Cvs.Level.FRESHER;
        if (lower.contains("junior")) return Cvs.Level.JUNIOR;
        if (lower.contains("senior") || lower.contains("cao cấp")) return Cvs.Level.SENIOR;

        return null;
    }

    public Cvs.Experience extractExperience(String content) {
        if (content == null) return null;
        String lower = content.toLowerCase();

        if (lower.contains("trên 5 năm") || lower.contains("over 5 years")) return Cvs.Experience.TREN_5_NAM;
        if (lower.contains("5 năm") || lower.contains("5 years")) return Cvs.Experience.NAM_NAM;
        if (lower.contains("4 năm")) return Cvs.Experience.BON_NAM;
        if (lower.contains("3 năm")) return Cvs.Experience.BA_NAM;
        if (lower.contains("2 năm")) return Cvs.Experience.HAI_NAM;
        if (lower.contains("1 năm")) return Cvs.Experience.MOT_NAM;
        if (lower.contains("không yêu cầu") || lower.contains("no experience")) return Cvs.Experience.KHONG_YEU_CAU;

        return Cvs.Experience.DUOI_1_NAM;
    }

    public String extractJobTitle(String content) {
        if (content == null || content.isBlank()) return null;

        String[] lines = content.split("\\r?\\n");

        Pattern pattern = Pattern.compile("(Vị trí|Job Title|Chức danh|Ứng tuyển)[:：]\\s*(.+)", Pattern.CASE_INSENSITIVE);
        for (String line : lines) {
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) {
                return matcher.group(2).trim();
            }
        }

        String lower = content.toLowerCase();
        if (lower.contains("thực tập sinh") || lower.contains("intern")) return "Thực tập sinh";
        if (lower.contains("trưởng nhóm") || lower.contains("leader")) return "Trưởng nhóm";
        if (lower.contains("developer") || lower.contains("lập trình viên")) return "Developer";
        if (lower.contains("engineer")) return "Engineer";
        if (lower.contains("tester")) return "Tester";
        if (lower.contains("analyst")) return "Analyst";
        if (lower.contains("manager")) return "Manager";

        for (int i = 0; i < lines.length - 1; i++) {
            String l = lines[i].toLowerCase();
            if (l.contains("kinh nghiệm") || l.contains("experience") || l.contains("thực tập")) {
                return lines[i + 1].trim();
            }
        }

        return null;
    }

    public List<Cvs> getCvByUserId(Long userId) {
        return cvsRepository.findByUserId(userId);
    }

    public void deleteCv(Long cvId) {
        Cvs cv = cvsRepository.findById(cvId).orElse(null);
        if (cv == null) {
            throw new RuntimeException("CV not found");
        }
        try {
            String key = s3Service.extractKeyFromUrl(cv.getFileUrl());
            s3Service.deleteFile(key);

        } catch (Exception e) {
            throw new RuntimeException("Không thể xóa file CV cũ", e);
        }
        if (cv.getIsPublic()) {
            cvsRepository.delete(cv);
            Cvs cvsMain = cvsRepository.findTopByUserIdOrderByUpdatedAtDesc(cv.getUserId());
            if (cvsMain != null) {
                cvsMain.setIsPublic(true);
                cvsRepository.save(cvsMain);
            }
        } else {
            cvsRepository.delete(cv);
        }
    }

    public void setPublic(Long cvId, boolean makePublic) {
        Cvs cv = cvsRepository.findById(cvId).orElse(null);
        if (cv == null) {
            throw new RuntimeException("CV not found");
        }
        cv.setIsPublic(makePublic);
        cvsRepository.save(cv);
    }

    public void updateCvTitle(Long cvId, String newTitle) {
        Cvs cv = cvsRepository.findById(cvId).orElse(null);
        if (cv == null) {
            throw new RuntimeException("CV not found");
        }
        cv.setTitle(newTitle);
        cvsRepository.save(cv);
    }

    public ResponseEntity<Resource> downloadCv(Long id) {
        Cvs cv = cvsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CV"));
        String key = s3Service.extractKeyFromUrl(cv.getFileUrl());

        ResponseInputStream<GetObjectResponse> s3ObjectStream;
        try {
            s3ObjectStream = s3Service.downloadFile(key);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tải file từ S3", e);
        }

        Resource resource = new InputStreamResource(s3ObjectStream);

        String fileName = s3Service.extractFileNameFromUrl(cv.getFileUrl());
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

    public Cvs getCvPublicByUserId(Long userId) {
        return cvsRepository.findByUserIdAndIsPublicTrue(userId);
    }
}

