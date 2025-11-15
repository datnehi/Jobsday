package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.*;
import com.example.jobsday_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    @Autowired
    private ApplicationRepository applicationRepo;

    @Autowired
    private CompanyRepository companyRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JobRepository jobRepo;

    @Autowired
    private SavedJobRepository savedRepo;

    public OverviewDto getOverview(int days) {
        long newCompanies = companyRepo.newCompaniesToday();
        long newCandidates = userRepo.newCandidatesToday();
        long activeJobs = jobRepo.activeJobs();
        long totalAppsNow = applicationRepo.totalApplicationsNow();

        return new OverviewDto(newCompanies, newCandidates, activeJobs,  totalAppsNow);
    }

    public AnalyticsDaysDto getAnalyticsDays(int days) {

        CompletableFuture<List<Object[]>> timelineF = timeline(days);
        CompletableFuture<Long> totalAppsF = totalApps(days);
        CompletableFuture<Long> responseRateF = responseRate(days);
        CompletableFuture<List<Object[]>> topJobsF = topJobs(days);
        CompletableFuture<List<Object[]>> topCompanyJobsF = topCompanyJobs(days);
        CompletableFuture<List<Object[]>> topCompanyAppsF = topCompanyApplications(days);
        CompletableFuture<List<Object[]>> jobsCreatedF = jobsCreated(days);
        CompletableFuture<List<Object[]>> topCandidatesF = topCandidates();
        CompletableFuture<List<Object[]>> topSkillsF = topSkills(days);

        CompletableFuture.allOf(
                timelineF, totalAppsF, responseRateF, topJobsF,
                topCompanyJobsF, topCompanyAppsF, jobsCreatedF, topCandidatesF, topSkillsF
        ).join();

        List<DailyCountDto> timeline = timelineF.join().stream()
                .map(r -> new DailyCountDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<TopJobDto> topJobs = topJobsF.join().stream()
                .map(r -> new TopJobDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<TopCompanyJobDto> topCompanyJobs = topCompanyJobsF.join().stream()
                .map(r -> new TopCompanyJobDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<TopCompanyApplicationDto> topCompanyApps = topCompanyAppsF.join().stream()
                .map(r -> new TopCompanyApplicationDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<DailyCountDto> jobsCreated = jobsCreatedF.join().stream()
                .map(r -> new DailyCountDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<TopCandidateDto> topCandidates = topCandidatesF.join().stream()
                .map(r -> new TopCandidateDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<TopSkillDto> topSkills = topSkillsF.join().stream()
                .map(r -> new TopSkillDto((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        return new AnalyticsDaysDto(
                timeline,
                totalAppsF.join(),
                responseRateF.join(),
                topJobs,
                topCompanyJobs,
                topCompanyApps,
                jobsCreated,
                topCandidates,
                topSkills
        );
    }

    public List<ApplicationsByLevelDto> getApplicationsByLevel(int days) {
        return applicationRepo.applicationsByLevel(days).stream()
                .map(r -> new ApplicationsByLevelDto(
                        (String) r[0],
                        ((Number) r[1]).longValue()
                )).toList();
    }

    @Async
    public CompletableFuture<List<Object[]>> timeline(int days) {
        return CompletableFuture.completedFuture(applicationRepo.countApplicationsByDay(days));
    }

    @Async
    public CompletableFuture<Long> totalApps(int days) {
        return CompletableFuture.completedFuture(applicationRepo.totalApplications(days));
    }

    @Async
    public CompletableFuture<Long> responseRate(int days) {
        return CompletableFuture.completedFuture(applicationRepo.totalEmployerResponses(days));
    }

    @Async
    public CompletableFuture<List<Object[]>> topJobs(int days) {
        return CompletableFuture.completedFuture(applicationRepo.topJobs(days));
    }

    @Async
    public CompletableFuture<List<Object[]>> topCompanyJobs(int days) {
        return CompletableFuture.completedFuture(companyRepo.topCompaniesJob(days));
    }

    @Async
    public CompletableFuture<List<Object[]>> topCompanyApplications(int days) {
        return CompletableFuture.completedFuture(companyRepo.topCompaniesApplication(days));
    }

    @Async
    public CompletableFuture<List<Object[]>> jobsCreated(int days) {
        return CompletableFuture.completedFuture(jobRepo.jobsCreated(days));
    }

    @Async
    public CompletableFuture<List<Object[]>> topCandidates() {
        return CompletableFuture.completedFuture(userRepo.topCandidates());
    }

    @Async
    public CompletableFuture<List<Object[]>> topSkills(int days) {
        return CompletableFuture.completedFuture(applicationRepo.topSkillsByApplications(days));
    }

    @Async
    public CompletableFuture<Integer> activeJobsAsync(long companyId) {
        return CompletableFuture.supplyAsync(() -> jobRepo.countActiveJobs(companyId));
    }

    @Async
    public CompletableFuture<Long> totalAppsAsync(long companyId, int days) {
        return CompletableFuture.supplyAsync(() -> applicationRepo.countTotalApplications(companyId, days));
    }

    @Async
    public CompletableFuture<Long> fitAppsAsync(long companyId, int days) {
        return CompletableFuture.supplyAsync(() -> applicationRepo.countFitApplications(companyId, days));
    }

    @Async
    public CompletableFuture<List<Object[]>> growthAsync(long companyId, int days) {
        return CompletableFuture.supplyAsync(() -> applicationRepo.getApplicationGrowth(companyId, days));
    }

    @Async
    public CompletableFuture<List<Object[]>> topJobsAsync(long companyId, int days) {
        return CompletableFuture.supplyAsync(() -> applicationRepo.getTopJobs(companyId, days));
    }

    @Async
    public CompletableFuture<List<Object[]>> topHrAsync(long companyId, int days) {
        return CompletableFuture.supplyAsync(() -> applicationRepo.getTopHrFit(companyId, days));
    }

    public HrStatsDto getStats(long companyId, int days) {

        CompletableFuture<Integer> activeJobsF = activeJobsAsync(companyId);
        CompletableFuture<Long> totalAppsF = totalAppsAsync(companyId, days);
        CompletableFuture<Long> fitAppsF = fitAppsAsync(companyId, days);
        CompletableFuture<List<Object[]>> growthF = growthAsync(companyId, days);
        CompletableFuture<List<Object[]>> topJobsF = topJobsAsync(companyId, days);
        CompletableFuture<List<Object[]>> topHrF = topHrAsync(companyId, days);

        CompletableFuture.allOf(
                activeJobsF, totalAppsF, fitAppsF, growthF, topJobsF, topHrF
        ).join();

        long totalApps = totalAppsF.join();
        long fitApps = fitAppsF.join();

        HrStatsDto dto = new HrStatsDto();

        dto.setActiveJobs(activeJobsF.join());
        dto.setTotalApplications(totalApps);
        dto.setFitRate(totalApps == 0 ? 0 : (double) fitApps / totalApps);

        dto.setGrowth(growthF.join().stream()
                .map(r -> new DailyCountDto(
                        r[0].toString(),
                        ((Number) r[1]).intValue()
                )).toList());

        dto.setTopJobs(topJobsF.join().stream()
                .map(r -> new TopJobDto(
                        r[0].toString(),
                        ((Number) r[1]).intValue()
                )).toList());

        dto.setTopHr(topHrF.join().stream()
                .map(r -> new HrStatsDto.TopItem(
                        r[0].toString(),
                        ((Number) r[1]).intValue()
                )).toList());

        return dto;
    }


}

