package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.RegisterRequestDto;
import com.example.jobsday_backend.dto.VerifyOtpRequest;
import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;

@Service
public class AuthService {
    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyMemberService companyMemberService;

    @Value("${password.secret}")
    private String passwordSecret;

    public void register(@RequestBody RegisterRequestDto body, User userCheck) {
        String hashedPassword = passwordEncoder.encode(body.getPassword() + passwordSecret);
        if (userCheck != null) {
            userCheck.setEmail(body.getEmail());
            userCheck.setPasswordHash(hashedPassword);
            userCheck.setFullName(body.getFullName());
            userCheck.setDob(body.getDob());
            userCheck.setPhone(body.getPhone());
            userCheck.setAvatarUrl(body.getAvatarUrl());
            userCheck.setRole(body.getRole());
            String otp = String.valueOf((int) ((Math.random() * 900000) + 100000));
            userCheck.setVerificationCode(otp);
            userCheck.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
            userCheck.setEmailVerified(false);
            userCheck.setNtdSearch(false);

            userService.updateUser(userCheck);

            emailService.sendEmail(
                    userCheck.getEmail(),
                    "Mã xác minh tài khoản",
                    "Xin chào " + userCheck.getFullName() +
                            ",\n\nMã OTP xác minh tài khoản của bạn là: " + otp +
                            "\nMã có hiệu lực trong 10 phút.\n\nCảm ơn!"
            );
        } else {
            User user = new User();
            user.setEmail(body.getEmail());
            user.setPasswordHash(hashedPassword);
            user.setFullName(body.getFullName());
            user.setDob(body.getDob());
            user.setPhone(body.getPhone());
            user.setAvatarUrl(body.getAvatarUrl());
            user.setRole(body.getRole());
            String otp = String.valueOf((int) ((Math.random() * 900000) + 100000));
            user.setVerificationCode(otp);
            user.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
            user.setEmailVerified(false);
            user.setNtdSearch(false);

            userService.createUser(user);

            emailService.sendEmail(
                    user.getEmail(),
                    "Mã xác minh tài khoản",
                    "Xin chào " + user.getFullName() +
                            ",\n\nMã OTP xác minh tài khoản của bạn là: " + otp +
                            "\nMã có hiệu lực trong 10 phút.\n\nCảm ơn!"
            );
        }
    }

    @Transactional
    public void verifyOtp(@RequestBody VerifyOtpRequest request, User user) {
        if ("HR".equalsIgnoreCase(String.valueOf(user.getRole()))) {
            if (request.getCompanyCode() != null) {
                Company company = companyService.getById(Long.valueOf(request.getCompanyCode()));
                if (company == null) {
                    throw new RuntimeException("Company not found");
                }
                CompanyMember cm = new CompanyMember();
                cm.setCompanyId(company.getId());
                cm.setUserId(user.getId());
                cm.setPosition(request.getPosition());
                cm.setIsAdmin(false);
                companyMemberService.addMember(cm);
            } else {
                Company company = new Company();
                company.setName(request.getCompanyName());
                company.setLocation(request.getCompanyLocation());
                company.setAddress(request.getCompanyAddress());
                company.setWebsite(request.getCompanyWebsite());
                company.setTaxCode(request.getCompanyTaxCode());
                company.setDescription(request.getCompanyDetail());
                companyService.create(company);

                CompanyMember cm = new CompanyMember();
                cm.setCompanyId(company.getId());
                cm.setUserId(user.getId());
                cm.setPosition(request.getPosition());
                cm.setIsAdmin(true);
                companyMemberService.addMember(cm);
            }
        }

        user.setStatus(User.Status.ACTIVE);
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        userService.updateUser(user);
    }

    public void forgotPassword(User user) {
        String otp = String.valueOf((int) ((Math.random() * 900000) + 100000));
        user.setVerificationCode(otp);
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
        userService.updateUser(user);
        emailService.sendEmail(
                user.getEmail(),
                "Mã xác minh tài khoản",
                "Xin chào " + user.getFullName() +
                        ",\n\nMã OTP xác minh tài khoản của bạn là: " + otp +
                        "\nMã có hiệu lực trong 10 phút.\n\nCảm ơn!"
        );
    }

}
