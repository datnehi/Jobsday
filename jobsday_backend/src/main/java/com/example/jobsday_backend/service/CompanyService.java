package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CompanyService {
    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private S3Service s3Service;

    private final String avatars = "companyLogos";

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public List<Company> getAll() {
        return companyRepository.findAll();
    }

    public Company getById(Long id) {
        return companyRepository.findCompanyById(id);
    }

    public Company create(Company company) {
        return companyRepository.save(company);
    }

    public void updateLogo(Long companyId, MultipartFile file) {
        Company company = companyRepository.findCompanyById(companyId);
        if (company == null) {
            throw new RuntimeException("Company not found");
        }

        try {
            if ( company.getLogo() != null && !company.getLogo().isEmpty()) {
                String oldKey = s3Service.extractKeyFromUrl(company.getLogo());
                s3Service.deleteFile(oldKey);
            }
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String fileName = companyId + "_" + timestamp + "_" + file.getOriginalFilename();

            // Upload lên S3
            String fileUrl = s3Service.uploadFileWithCustomName(file, avatars, fileName);

            // Cập nhật vào DB
            company.setLogo(fileUrl);
            companyRepository.save(company);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi upload logo lên S3", e);
        }

    }
}
