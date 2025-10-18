package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.repository.CompanyMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CompanyMemberService {
    @Autowired
    private CompanyMemberRepository companyMemberRepository;

    public CompanyMember addMember(CompanyMember member) {
        return companyMemberRepository.save(member);
    }

    public CompanyMember getMemberByUserId(Long userId) {
        return companyMemberRepository.findByUserId(userId);
    }

    public List<Map<String, Object>> getMembersOfCompany(Long companyId) {
        List<Object[]> rows = companyMemberRepository.findByCompanyId(companyId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ((Number) row[0]).longValue());
            map.put("position", row[1]);
            map.put("isAdmin", row[2]);
            map.put("fullName", row[3]);
            map.put("role", row[4]);
            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getMemberById(Long memberId) {
        Object result = companyMemberRepository.findByMemberId(memberId);
        if (result == null) {
            return null;
        }
        Object[] row = (Object[]) result;

        Map<String, Object> map = new HashMap<>();
        map.put("id", ((Number) row[0]).longValue());
        map.put("position", row[1]);
        map.put("isAdmin", row[2]);
        map.put("fullName", row[3]);
        map.put("role", row[4]);
        map.put("companyName", row[5]);

        return map;
    }

    public void updateMember(CompanyMember member) {
        companyMemberRepository.save(member);
    }

    public PageResultDto<Map<String, Object>> getMembers(
            Long companyId,
            String textSearch,
            int page,
            int size) {
        int offset = page * size;
        List<Object[]> rows = companyMemberRepository.findMemberByCompanyId(companyId, textSearch, size, offset);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ((Number) row[0]).longValue());
            map.put("userId", row[1]);
            map.put("fullName", row[2]);
            map.put("email", row[3]);
            map.put("position", row[4]);
            map.put("status", row[5]);
            result.add(map);
        }
        long totalElements = companyMemberRepository.countMemberByCompanyId(companyId, textSearch);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                result,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

    public CompanyMember getMemberInfoById(Long memberId) {
        return companyMemberRepository.findById(memberId).orElse(null);
    }

    public PageResultDto<Map<String, Object>> getMemberRequest(
            Long companyId,
            int page,
            int size) {
        int offset = page * size;
        List<Object[]> rows = companyMemberRepository.findMemberRequest(companyId, size, offset);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ((Number) row[0]).longValue());
            map.put("userId", row[1]);
            map.put("fullName", row[2]);
            map.put("email", row[3]);
            map.put("position", row[4]);
            map.put("updatedAt", row[5]);
            map.put("status", row[6]);
            result.add(map);
        }
        long totalElements = companyMemberRepository.countMemberRequest(companyId);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResultDto<>(
                result,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
    }

}
