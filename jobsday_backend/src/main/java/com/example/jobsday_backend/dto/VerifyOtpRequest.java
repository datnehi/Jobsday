package com.example.jobsday_backend.dto;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String email;
    private String otp;

    // cho HR nếu cần tạo công ty sau verify
    private String companyCode;
    private String companyName;
    private String companyAddress;
    private String companyWebsite;
    private String companyTaxCode;
    private String companyDetail;
}
