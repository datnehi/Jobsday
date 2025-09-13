import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SearchService } from '../../services/search.service';
import { ConvertEnumService } from '../../services/convert-enum.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  constructor(private searchService: SearchService, private convertEnum: ConvertEnumService) { }
  // Filter options
  experiences = ['Tất cả', 'Không yêu cầu', 'Dưới 1 năm', '2 năm', '3 năm', '4 năm', '5 năm', 'Trên 5 năm'];
  levels = ['Tất cả', 'Fresher', 'Intern', 'Junior', 'Senior'];
  locations = ['Tất cả', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];
  salaries = ['Tất cả', 'Dưới 10 triệu', '10 - 15 triệu', '15 - 20 triệu', '20 - 25 triệu', '25 - 30 triệu', '30 - 50 triệu', 'trên 50 triệu', 'Thỏa thuận'];
  contractTypes = ['Tất cả', 'Full-time', 'Part-time', 'Freelance'];
  workTypes = ['Tất cả', 'In Office', 'Remote', 'Hybrid'];

  // Filter state
  selectedTab: 'jobs' | 'companies' = 'jobs';
  selectedLocations: string = 'Tất cả';
  selectedExperience: string = 'Tất cả';
  selectedLevel: string = 'Tất cả';
  selectedSalary: string = 'Tất cả';
  selectedContractType: string = 'Tất cả';
  selectedWorkType: string = 'Tất cả';
  searchText: string = '';
  pendingSearchText: string = '';

  // Data
  jobs: any[] = [];
  companies: any[] = [];

  currentPage: number = 0;
  totalPages: number = 1;
  companiesCurrentPage: number = 0;
  companiesTotalPages: number = 1;

  hoveredJobIndex: number | null = null;

  ngOnInit() {
    this.search();
  }

  search() {
      this.searchJobs();
      this.searchCompanies();
  }

  // Filter handlers
  selectLocation(location: string) {
    this.selectedLocations = location;
    this.search();
  }

  selectExperience(exp: string) {
    this.selectedExperience = exp;
    this.searchJobs();
  }

  selectLevel(level: string) {
    this.selectedLevel = level;
    this.searchJobs();
  }

  selectSalary(salary: string) {
    this.selectedSalary = salary;
    this.searchJobs();
  }

  selectWorkType(workType: string) {
    this.selectedWorkType = workType;
    this.searchJobs();
  }

  selectContractType(contractType: string) {
    this.selectedContractType = contractType;
    this.searchJobs();
  }

  clearFilters() {
    this.selectedLocations = 'Tất cả';
    this.selectedExperience = 'Tất cả';
    this.selectedLevel = 'Tất cả';
    this.selectedSalary = 'Tất cả';
    this.selectedContractType = 'Tất cả';
    this.selectedWorkType = 'Tất cả';
    this.search();
  }

  // Lấy jobs từ backend
  searchJobs(jobsPage: number = 0) {
    const filters = {
      keyword: this.searchText,
      location: this.convertEnum.mapLocationToEnum(this.selectedLocations),
      experience: this.convertEnum.mapExperienceToEnum(this.selectedExperience),
      level: this.convertEnum.mapLevelToEnum(this.selectedLevel),
      salary: this.convertEnum.mapSalaryToEnum(this.selectedSalary),
      contractType: this.convertEnum.mapContractTypeToEnum(this.selectedContractType),
      workType: this.convertEnum.mapWorkTypeToEnum(this.selectedWorkType),
      jobsPage
    };

    this.searchService.searchJobs(filters).subscribe({
      next: (res: any) => {
        const jobsData = res.data;
        this.jobs = (jobsData.content || []).map((job: any) => ({
          ...job,
          location: this.convertEnum.mapLocationFromEnum(job.location),
          experience: this.convertEnum.mapExperienceFromEnum(job.experience),
          level: this.convertEnum.mapLevelFromEnum(job.level),
          salary: this.convertEnum.mapSalaryFromEnum(job.salary),
          contractType: this.convertEnum.mapContractTypeFromEnum(job.contractType),
          jobType: this.convertEnum.mapWorkTypeFromEnum(job.jobType)
        }));
        this.currentPage = jobsData.page;
        this.totalPages = jobsData.totalPages;
        this.pendingSearchText = this.searchText;
      },
      error: (err) => {
        console.error('Search jobs error', err);
      }
    });
  }

  // Lấy companies từ backend
  searchCompanies(companiesPage: number = 0) {
    const filters = {
      keyword: this.searchText,
      location: this.convertEnum.mapLocationToEnum(this.selectedLocations),
      companiesPage
    };

    this.searchService.searchCompanies(filters).subscribe({
      next: (res: any) => {
        const companiesData = res.data;
        this.companies = (companiesData.content || []).map((company: any) => ({
          ...company,
          location: this.convertEnum.mapLocationFromEnum(company.location)
        }));
        this.companiesCurrentPage = companiesData.page;
        this.companiesTotalPages = companiesData.totalPages;
        this.pendingSearchText = this.searchText;
      },
      error: (err) => {
        console.error('Search companies error', err);
      }
    });
  }

  // Sửa lại changePage để gọi đúng hàm
  changePage(page: number, tab: string) {
    if (tab === 'jobs') {
      // Nếu text đang nhập khác text đã search, về trang đầu với text mới
      if (this.pendingSearchText !== this.searchText) {
        this.searchJobs(0);
      } else if (page >= 0 && page < this.totalPages) {
        this.searchJobs(page);
      }
    }
    if (tab === 'companies') {
      if (this.pendingSearchText !== this.searchText) {
        this.searchCompanies(0);
      } else if (page >= 0 && page < this.companiesTotalPages) {
        this.searchCompanies(page);
      }
    }
  }

  onTabChange(tab: 'jobs' | 'companies') {
    this.selectedTab = tab;
    if (tab === 'jobs') {
      this.currentPage = 0;
      this.searchJobs(0);
    } else {
      this.companiesCurrentPage = 0;
      this.searchCompanies(0);
    }
  }

  getPostedLabel(postedAt: string): string {
    if (!postedAt) return '';
    const postedDate = new Date(postedAt);
    const now = new Date();
    const diffMs = now.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Đăng hôm nay';
    if (diffDays < 7) return `Đăng ${diffDays} ngày trước`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `Đăng ${diffWeeks} tuần trước`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Đăng ${diffMonths} tháng trước`;
  }

  onLogoError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/logo1.png';
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }
}

