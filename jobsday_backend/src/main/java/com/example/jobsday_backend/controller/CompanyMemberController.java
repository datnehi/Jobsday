package com.example.jobsday_backend.controller;

import com.example.jobsday_backend.dto.ResponseDto;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.service.CompanyMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/company-members")
@RequiredArgsConstructor
public class CompanyMemberController {

    @Autowired
    private CompanyMemberService companyMemberService;

//    // Lấy danh sách member trong company
//    @GetMapping("/{companyId}")
//    public ResponseEntity<ResponseDto> getMembers(@PathVariable Long companyId) {
//        List<CompanyMember> members = companyMemberService.getMembers(companyId);
//        if (members == null || members.isEmpty()) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                    .body(new ResponseDto(HttpStatus.NOT_FOUND.value(), "No members found", null));
//        }
//        return ResponseEntity.ok(
//                new ResponseDto(HttpStatus.OK.value(), "Get members successfully", members)
//        );
//    }
//
//    // Duyệt hoặc từ chối thành viên
//    @PutMapping("/{memberId}/status")
//    public ResponseEntity<ResponseDto> updateStatus(
//            @PathVariable Long memberId,
//            @RequestParam CompanyMember.MemberStatusEnum status) {
//        try {
//            CompanyMember member = companyMemberService.updateStatus(memberId, status);
//            return ResponseEntity.ok(
//                    new ResponseDto(HttpStatus.OK.value(), "Status updated successfully", member)
//            );
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null));
//        }
//    }
//
//    // Xóa thành viên khỏi company
//    @DeleteMapping("/{memberId}")
//    public ResponseEntity<ResponseDto> removeMember(@PathVariable Long memberId) {
//        try {
//            companyMemberService.removeMember(memberId);
//            return ResponseEntity.ok(
//                    new ResponseDto(HttpStatus.OK.value(), "Member removed successfully", null)
//            );
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(new ResponseDto(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null));
//        }
//    }
}
