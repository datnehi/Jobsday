package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.HrViewCandidateDTO;
import com.example.jobsday_backend.dto.PageResultDto;
import com.example.jobsday_backend.entity.HrViewCandidate;
import com.example.jobsday_backend.repository.HrViewCandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class HrViewCandidateService {
    @Autowired
    private HrViewCandidateRepository hrViewCandidateRepository;

    public PageResultDto<HrViewCandidateDTO> getHrViewed (
            Long candidateId,
            int page,
            int size
    ) {
        int offset = page * size;
        List<Object[]> rows = hrViewCandidateRepository.findHrViewsByCandidate(candidateId, size, offset);

        List<HrViewCandidateDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            String hrName = (String) row[0];
            Long companyId = ((Number) row[1]).longValue();
            String companyName = (String) row[2];
            String companyLogo = (String) row[3];
            String viewedAt = row[4].toString();

            result.add(HrViewCandidateDTO.builder()
                    .hrName(hrName)
                    .companyId(companyId)
                    .companyName(companyName)
                    .companyLogo(companyLogo)
                    .viewedAt(viewedAt)
                    .build());
        }

        long totalElements = hrViewCandidateRepository.countHrViewsByCandidate(candidateId);
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

    public void createHrViewRecord(Long hrId, Long candidateId) {
        HrViewCandidate hrViewCandidate = new HrViewCandidate();
        hrViewCandidate.setHrId(hrId);
        hrViewCandidate.setCandidateId(candidateId);
        hrViewCandidateRepository.save(hrViewCandidate);
    }
}
