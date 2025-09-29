package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.Cvs;
import com.example.jobsday_backend.service.CvsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/cvs")
public class CvsController {
    @Autowired
    private CvsService cvService;

    @PostMapping("/upload")
    public ResponseEntity<ResponseDto> uploadCV(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file
    ) throws Exception {
        Cvs cv = cvService.saveCV(userDetails.getId(), title, file);

        if(cv == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), "Upload CV failed", null));
        }

        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Upload cv successfully", cv)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<ResponseDto> getMyCV(
            @AuthenticationPrincipal CustomUserDetail userDetails
    ) {
        List<Cvs> cv = cvService.getCvByUserId(userDetails.getId());
        if (cv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "CV not found", null));
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get CV successfully", cv)
        );
    }

    @PutMapping("/change-public/{cvId}")
    public ResponseEntity<ResponseDto> setDefaultCV(
            @PathVariable Long cvId,
            @RequestParam("isPublic") boolean isPublic
    ) {
        cvService.setPublic(cvId, isPublic);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Set default CV successfully", null)
        );
    }

    @DeleteMapping("/delete/{cvId}")
    public ResponseEntity<ResponseDto> deleteCV(
            @PathVariable Long cvId
    ) {
        cvService.deleteCv(cvId);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Delete CV successfully", null)
        );
    }

    @PutMapping("/set-title/{cvId}")
    public ResponseEntity<ResponseDto> setTitleCV(
            @PathVariable Long cvId,
            @RequestParam("title") String title
    ) {
        cvService.updateCvTitle(cvId, title);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Set title CV successfully", null)
        );
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewCv(@PathVariable Long id) throws Exception {
        return cvService.handleCv(id, "view");
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id) throws Exception {
        return cvService.handleCv(id, "download");
    }
}

