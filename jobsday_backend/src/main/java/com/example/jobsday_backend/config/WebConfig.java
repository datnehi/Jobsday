package com.example.jobsday_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.avatar}")
    private String avatarDir;

    @Value("${app.upload.company-logo}")
    private String companyLogoDir;

    @Value("${app.upload.cv-apply}")
    private String cvApplyDir;

    @Value("${app.upload.cv-upload}")
    private String cvUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map avatar
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:///" + avatarDir + "/");

        // Map company logo
        registry.addResourceHandler("/uploads/companyLogos/**")
                .addResourceLocations("file:///" + companyLogoDir + "/");

        // Map CV apply
        registry.addResourceHandler("/uploads/cv-applies/**")
                .addResourceLocations("file:///" + cvApplyDir + "/");

        // Map CV upload
        registry.addResourceHandler("/uploads/cv-uploads/**")
                .addResourceLocations("file:///" + cvUploadDir + "/");
    }
}


