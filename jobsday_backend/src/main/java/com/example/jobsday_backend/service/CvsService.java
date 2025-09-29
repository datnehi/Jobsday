package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Cvs;
import com.example.jobsday_backend.repository.CvsRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CvsService {
    @Autowired
    private CvsRepository cvsRepository;

    @Value("${app.upload.cv-upload}")
    private Path cvUploadDir;

    // Đọc text từ file PDF hoặc DOCX
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

    // Lưu CV vào DB
    public Cvs saveCV(Long userId, String title, MultipartFile file) throws Exception {
        int totalCvs = cvsRepository.countCvOfCandidate(userId);
        if (totalCvs >= 6) {
            throw new RuntimeException("Bạn đã đạt giới hạn 6 CV. Vui lòng xóa bớt CV cũ để tải lên CV mới.");
        }
        String content = extractText(file);
        String jobTitle = extractJobTitle(content);
        Cvs.Level level = extractLevel(content);
        Cvs.Experience experience = extractExperience(content);
        String address = extractAddress(content);

        String originalFileName = file.getOriginalFilename();
        String fileName = UUID.randomUUID() + "_" + originalFileName; // tránh trùng
        Path filePath = cvUploadDir.resolve(fileName);

        try {
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file CV", e);
        }

        String fileType = file.getContentType();
        if (fileType == null && originalFileName != null && originalFileName.contains(".")) {
            fileType = originalFileName.substring(originalFileName.lastIndexOf(".") + 1);
        }

        boolean isPublic = false;
        if(totalCvs == 0){
            isPublic = true;
        }

        Cvs cv = Cvs.builder()
                .userId(userId)
                .title(title)
                .fileUrl(filePath.toString())
                .fileType(fileType)
                .jobTitle(jobTitle)
                .content(content)
                .level(level)
                .experience(experience)
                .address(address)
                .isPublic(isPublic)
                .build();

        return cvsRepository.save(cv);
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

        return Cvs.Experience.DUOI_1_NAM; // fallback
    }

    public String extractAddress(String content) {
        if (content == null) return null;
        Pattern pattern = Pattern.compile("(Địa chỉ|Address)[:：]\\s*(.+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(2).trim();
        }

        // fallback: tìm dòng có "Hà Nội", "HCM", "Đà Nẵng", ...
        for (String line : content.split("\\r?\\n")) {
            String lower = line.toLowerCase();
            if (lower.contains("hà nội") || lower.contains("hcm") || lower.contains("hồ chí minh") || lower.contains("đà nẵng")) {
                return line.trim();
            }
        }

        return null;
    }

    public String extractJobTitle(String content) {
        if (content == null || content.isBlank()) return null;

        String[] lines = content.split("\\r?\\n");

        // Regex: tìm dòng có "Vị trí", "Job Title", "Chức danh"
        Pattern pattern = Pattern.compile("(Vị trí|Job Title|Chức danh|Ứng tuyển)[:：]\\s*(.+)", Pattern.CASE_INSENSITIVE);
        for (String line : lines) {
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) {
                return matcher.group(2).trim();
            }
        }

        // Heuristics: các từ khóa phổ biến
        String lower = content.toLowerCase();
        if (lower.contains("thực tập sinh") || lower.contains("intern")) return "Thực tập sinh";
        if (lower.contains("trưởng nhóm") || lower.contains("leader")) return "Trưởng nhóm";
        if (lower.contains("developer") || lower.contains("lập trình viên")) return "Developer";
        if (lower.contains("engineer")) return "Engineer";
        if (lower.contains("tester")) return "Tester";
        if (lower.contains("analyst")) return "Analyst";
        if (lower.contains("manager")) return "Manager";

        // Fallback: dòng sau "Kinh nghiệm" hoặc "Experience"
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

    public  Cvs getCvById(Long cvId) {
        return cvsRepository.findById(cvId).orElse(null);
    }

    public void deleteCv(Long cvId) {
        Cvs cv = cvsRepository.findById(cvId).orElse(null);
        if (cv == null) {
            throw new RuntimeException("CV not found");
        }
        try {
            Path oldPath = Paths.get(cv.getFileUrl());
            Files.deleteIfExists(oldPath);
        } catch (IOException e) {
            throw new RuntimeException("Không thể xóa file CV cũ", e);
        }
        cvsRepository.delete(cv);
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

    public ResponseEntity<Resource> handleCv(Long id, String mode) throws Exception {
        Cvs cv = cvsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CV"));

        Path path = Paths.get(cv.getFileUrl());
        if (!Files.exists(path)) {
            throw new RuntimeException("File không tồn tại trên server");
        }

        String fileName = cv.getTitle() != null ? cv.getTitle() : path.getFileName().toString();
        String fileType = resolveFileType(cv.getFileType(), fileName);

        Resource resource = new UrlResource(path.toUri());

        // Nếu mode = view thì inline, ngược lại thì attachment
        String disposition = "inline";
        if ("download".equalsIgnoreCase(mode)) {
            disposition = "attachment";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + fileName + "\"")
                .body(resource);
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

