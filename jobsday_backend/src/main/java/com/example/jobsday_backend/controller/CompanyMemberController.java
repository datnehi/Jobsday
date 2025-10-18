package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.CustomUserDetail;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.service.CompanyMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company-members")
@RequiredArgsConstructor
public class CompanyMemberController {

    @Autowired
    private CompanyMemberService companyMemberService;

    @GetMapping("/me")
    public ResponseEntity<ResponseDto> getMe (
            @AuthenticationPrincipal CustomUserDetail userDetails
    ) {
        Long userId = userDetails.getId();
        CompanyMember member = companyMemberService.getMemberByUserId(userId);
        if (member == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "No member found", null));
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get member successfully", member)
        );
    }

    // Lấy danh sách member trong company
    @GetMapping("/company/{companyId}")
    public ResponseEntity<ResponseDto> getMembers(@PathVariable Long companyId) {
        List<Map<String, Object>> members = companyMemberService.getMembersOfCompany(companyId);
        if (members == null || members.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "No members found", null));
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get members successfully", members)
        );
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDto> updateMember(
            @RequestBody CompanyMember member
    ) {
        CompanyMember memberInfo = companyMemberService.getMemberInfoById(member.getId());
        if (memberInfo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "No member found", null));
        }
        memberInfo.setPosition(member.getPosition());
        memberInfo.setStatus(member.getStatus());
        companyMemberService.updateMember(memberInfo);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get member successfully", memberInfo)
        );
    }

    @GetMapping("/members")
    public ResponseEntity<ResponseDto> getMembersList(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam(value = "textSearch", required = false) String textSearch,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        CompanyMember member = companyMemberService.getMemberByUserId(userDetails.getId());
        if (member == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ResponseDto(HttpStatus.FORBIDDEN.value(), "You are not a company member", null));
        }
        int pageSize = (size == null ? 13 : size);
        PageResultDto<Map<String, Object>> members = companyMemberService.getMembers(member.getCompanyId(), textSearch, page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get members successfully", members)
        );
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<ResponseDto> getMemberById(@PathVariable Long memberId) {
        CompanyMember member = companyMemberService.getMemberInfoById(memberId);
        if (member == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "No member found", null));
        }
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get member successfully", member)
        );
    }

    @GetMapping("/member-requests")
    public ResponseEntity<ResponseDto> getMemberRequest(
            @AuthenticationPrincipal CustomUserDetail userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        CompanyMember member = companyMemberService.getMemberByUserId(userDetails.getId());
        if (member == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ResponseDto(HttpStatus.FORBIDDEN.value(), "You are not a company member", null));
        }
        int pageSize = (size == null ? 14 : size);
        PageResultDto<Map<String, Object>> members = companyMemberService.getMemberRequest(member.getCompanyId(), page, pageSize);
        return ResponseEntity.ok(
                new ResponseDto(HttpStatus.OK.value(), "Get members successfully", members)
        );
    }
}
