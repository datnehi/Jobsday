export interface DailyCount {
  day: string;
  count: number;
}

export interface Overview {
  newCompaniesToday: number;
  newCandidatesToday: number;
  activeJobs: number;
  totalApplications: number;
}

export interface AnalyticsDays {
  applications: DailyCount[];
  totalApplications: number;
  responseRate: number;
  topJobs: TopJob[];
  topCompaniesJobs: TopCompanyJob[];
  topCompaniesApplications: TopCompanyApplication[];
  topCandidates: TopCandidate[];
  jobsCreated: DailyCount[];
  topSkills: TopSkill[];
}

export interface TopJob {
  title: string;
  employer: string;
  applications: number;
}

export interface TopCompanyJob {
  company: string;
  jobs: number;
}

export interface TopCompanyApplication {
  company: string;
  applications: number;
}

export interface TopCandidate {
  name: string;
  applications: number;
}

export interface TopSkill {
  skillName: string;
  applicationCount: number;
}

export interface TopHrItem {
  name: string;
  count: number;
}

export interface HrStatsDto {
  activeJobs: number;
  totalApplications: number;
  fitRate: number;

  growth: DailyCount[];
  topJobs: TopJob[];
  topHr: TopHrItem[];
}
