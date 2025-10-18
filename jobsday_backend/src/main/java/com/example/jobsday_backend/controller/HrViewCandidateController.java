package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.HrViewCandidateDTO;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.service.CompanyMemberService;
import com.example.jobsday_backend.service.HrViewCandidateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hrviewcandidate")
public class HrViewCandidateController {
    @Autowired
    private HrViewCandidateService hrViewCandidateService;

    @Autowired
    private CompanyMemberService companyMemberService;

    @GetMapping
    public ResponseEntity<ResponseDto> getHrViewed(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pageSize = (size == null ? 5 : size);
        PageResultDto<HrViewCandidateDTO> resultDto = hrViewCandidateService.getHrViewed(userDetails.getId(), page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(200, "Get HR viewed successfully", resultDto)
        );
    }

    @PostMapping
    public ResponseEntity<ResponseDto> createHrViewRecord(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam("candidateId") Long candidateId
    ) {
        CompanyMember companyMember = companyMemberService.getMemberByUserId(userDetails.getId());
        if (companyMember == null) {
            return ResponseEntity.status(403).body(
                    new ResponseDto(403, "Only company members can create HR view records", null)
            );
        }
        hrViewCandidateService.createHrViewRecord(companyMember.getId(), candidateId);
        return ResponseEntity.ok(
                new ResponseDto(201, "Create HR view record successfully", null)
        );
    }
}
