package com.example.jobsday_backend.service;

import com.example.jobsday_backend.entity.Company;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.CompanyMemberRepository;
import com.example.jobsday_backend.repository.CompanyRepository;
import com.example.jobsday_backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyMemberService {
    @Autowired
    private CompanyMemberRepository companyMemberRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UserRepository userRepository;

    public CompanyMember addMember(CompanyMember member) {
        return companyMemberRepository.save(member);
    }

    public CompanyMember getMemberByUserIdAndCompanyId(Long memberId, Long companyId) {
        return companyMemberRepository.findByCompanyIdAndUserId(memberId, companyId);
    }

//    public List<CompanyMember> getMembers(Long companyId) {
//        return companyMemberRepository.findByCompanyId(companyId);
//    }
//
//    public CompanyMember updateStatus(Long memberId, CompanyMember.MemberStatusEnum status) {
//        CompanyMember member = companyMemberRepository.findById(memberId)
//                .orElseThrow(() -> new EntityNotFoundException("Member not found"));
//        member.setStatus(status);
//        return companyMemberRepository.save(member);
//    }
//
//    public void removeMember(Long memberId) {
//        if (!companyMemberRepository.existsById(memberId)) {
//            throw new EntityNotFoundException("Member not found");
//        }
//        companyMemberRepository.deleteById(memberId);
//    }
}
