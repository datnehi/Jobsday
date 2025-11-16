package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.*;
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

    @Autowired
    private CompanyMemberService companyMemberService;

    @Autowired
    private UserService userService;

    @Autowired
    private JobService jobService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private EmailService emailService;

    private final String avatars = "companyLogos";

    public Company getById(Long id) {
        return companyRepository.findCompanyById(id);
    }

    public Company create(Company company) {
        return companyRepository.save(company);
    }

    public String updateLogo(Long companyId, MultipartFile file) {
        Company company = companyRepository.findCompanyById(companyId);
        if (company == null) {
            throw new RuntimeException("Company not found");
        }

        try {
            if (company.getLogo() != null && !company.getLogo().isEmpty()) {
                String oldKey = s3Service.extractKeyFromUrl(company.getLogo());
                s3Service.deleteFile(oldKey);
            }
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String fileName = companyId + "_" + timestamp + "_" + file.getOriginalFilename();

            String fileUrl = s3Service.uploadFileWithCustomName(file, avatars, fileName);

            company.setLogo(fileUrl);
            companyRepository.save(company);
            return fileUrl;

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi upload logo lên S3", e);
        }
    }

    public void deleteCompany(Long companyId) {
        Company company = companyRepository.findCompanyById(companyId);
        if (company == null) {
            throw new RuntimeException("Company not found");
        }

        if (company.getLogo() != null && !company.getLogo().isEmpty()) {
            String oldKey = s3Service.extractKeyFromUrl(company.getLogo());
            s3Service.deleteFile(oldKey);
        }

        List<CompanyMember> members = companyMemberService.getMenbersByCompanyId(company.getId());

        List<Job> jobs = jobService.getJobsByCompanyId(company.getId());
        if (jobs != null) {
            for (Job job : jobs) {
                List<Application> applications = applicationService.getApplicationsByJobId(job.getId());
                if (applications != null) {
                    for (Application application : applications) {
                        if (application.getCvUrl() != null && !application.getCvUrl().isEmpty()) {
                            String oldKey = s3Service.extractKeyFromUrl(application.getCvUrl());
                            s3Service.deleteFile(oldKey);
                        }
                    }
                }
            }
        }

        companyRepository.delete(company);

        if (members != null) {
            for (CompanyMember member : members) {
                User user = userService.findById(member.getUserId());
                if (user != null) {
                    String oldKey = s3Service.extractKeyFromUrl(user.getAvatarUrl());
                    s3Service.deleteFile(oldKey);
                    userService.deleteUser(user.getId());
                    emailService.sendEmail(
                            user.getEmail(),
                            "Xóa tài khoản công ty",
                            "Xin chào " + user.getFullName() +
                                    ",\n\nChúng tôi xin thông báo rằng tài khoản công ty của bạn đã bị xóa nên tài khoản của bạn cũng bị xóa theo." +
                                    "\nVui lòng liên hệ với chúng tôi nếu bạn cần hỗ trợ.\n\nCảm ơn!"
                    );
                }
            }
        }

        emailService.sendEmail(
                company.getEmail(),
                "Xóa tài khoản công ty",
                "Xin chào " + company.getName() +
                        ",\n\nChúng tôi xin thông báo rằng tài khoản công ty của bạn đã bị xóa." +
                        "\nVui lòng liên hệ với chúng tôi nếu bạn cần hỗ trợ.\n\nCảm ơn!"
        );
    }

    public PageResultDto<Company> getAllFiltered(String text, String location, int page, int size) {
        int offset = page * size;
        List<Company> companies = companyRepository.findAll(text, location, size, offset);
        long totalItems = companyRepository.countFindAll(text, location);
        int totalPages = (int) Math.ceil((double) totalItems / size);
        return new PageResultDto<>(
                companies,
                page,
                size,
                totalItems,
                totalPages,
                page >= totalPages - 1
        );
    }

    public PageResultDto<Company> getAllFilteredPending(String text, String location, int page, int size) {
        int offset = page * size;
        List<Company> companies = companyRepository.findAllPending(text, location, size, offset);
        long totalItems = companyRepository.countFindAllPending(text, location);
        int totalPages = (int) Math.ceil((double) totalItems / size);
        return new PageResultDto<>(
                companies,
                page,
                size,
                totalItems,
                totalPages,
                page >= totalPages - 1
        );
    }
}
