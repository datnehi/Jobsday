import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SearchService } from '../../../services/search.service';
import { ConvertEnumService } from '../../../services/common/convert-enum.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user';
import { SavedJobService } from '../../../services/saved-job.service';
import { LoginDialogComponent } from '../../common/login-dialog/login-dialog.component';
import { LoadingComponent } from "../../common/loading/loading.component";
import { ErrorDialogComponent } from "../../common/error-dialog/error-dialog.component";

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    LoginDialogComponent,
    LoadingComponent,
    ErrorDialogComponent
],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  experiences = ['Tất cả', 'Không yêu cầu', 'Dưới 1 năm', '2 năm', '3 năm', '4 năm', '5 năm', 'Trên 5 năm'];
  levels = ['Tất cả', 'Fresher', 'Intern', 'Junior', 'Middle', 'Senior'];
  locations = ['Tất cả', 'Hà Nội', 'TP.Hồ Chí Minh', 'Đà Nẵng'];
  salaries = ['Tất cả', 'Dưới 10 triệu', '10 - 15 triệu', '15 - 20 triệu', '20 - 25 triệu', '25 - 30 triệu', '30 - 50 triệu', 'trên 50 triệu', 'Thỏa thuận'];
  contractTypes = ['Tất cả', 'Full-time', 'Part-time', 'Freelance'];
  workTypes = ['Tất cả', 'In Office', 'Remote', 'Hybrid'];

  selectedTab: 'jobs' | 'companies' = 'jobs';
  selectedLocations: string = 'Tất cả';
  selectedExperience: string = 'Tất cả';
  selectedLevel: string = 'Tất cả';
  selectedSalary: string = 'Tất cả';
  selectedContractType: string = 'Tất cả';
  selectedWorkType: string = 'Tất cả';
  searchText: string = '';
  pendingSearchText: string = '';

  jobs: any[] = [];
  companies: any[] = [];
  user: User | null = null;

  currentPage: number = 0;
  totalPages: number = 1;
  companiesCurrentPage: number = 0;
  companiesTotalPages: number = 1;

  hoveredJobIndex: number | null = null;
  showLoginDialog = false;
  isLoading = false;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';

  constructor(private searchService: SearchService, private convertEnum: ConvertEnumService,
    private authService: AuthService, private savedJobService: SavedJobService) { }

  ngOnInit() {
    this.search();
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.search();
      }
    });
  }

  search() {
    this.searchJobs();
    this.searchCompanies();
  }

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

  searchJobs(jobsPage: number = 0) {
    this.isLoading = true;
    const filters = {
      keyword: this.searchText,
      location: this.convertEnum.mapLocationToEnum(this.selectedLocations),
      experience: this.convertEnum.mapExperienceToEnum(this.selectedExperience),
      level: this.convertEnum.mapLevelToEnum(this.selectedLevel),
      salary: this.convertEnum.mapSalaryToEnum(this.selectedSalary),
      contractType: this.convertEnum.mapContractTypeToEnum(this.selectedContractType),
      workType: this.convertEnum.mapWorkTypeToEnum(this.selectedWorkType),
      userId: this.user?.id,
      jobsPage
    };

    this.searchService.searchJobs(filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
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
        this.isLoading = false
        this.showErrorDialog = true;
        this.errorTitle = 'Lỗi tìm kiếm';
        this.errorMessage = 'Không thể tìm kiếm việc làm. Vui lòng thử lại sau.';
      },
      complete: () => this.isLoading = false
    });
  }

  searchCompanies(companiesPage: number = 0) {
    this.isLoading = true;
    const filters = {
      keyword: this.searchText,
      location: this.convertEnum.mapLocationToEnum(this.selectedLocations),
      companiesPage
    };

    this.searchService.searchCompanies(filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
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
        this.isLoading = false;
        this.showErrorDialog = true;
        this.errorTitle = 'Lỗi tìm kiếm';
        this.errorMessage = 'Không thể tìm kiếm công ty. Vui lòng thử lại sau.';
      },
      complete: () => this.isLoading = false
    });
  }

  changePage(page: number, tab: string) {
    if (tab === 'jobs') {
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

  onSaveClick(job: any) {
    if (!this.user) {
      this.showLoginDialog = true;
      return;
    }
    if (!job?.id) return;

    this.savedJobService.saveJob(job.id).subscribe({
      next: () => {
        job.saved = true;
      },
      error: () => {
        this.showErrorDialog = true;
        this.errorTitle = 'Lưu tin thất bại!';
        this.errorMessage = 'Đã xảy ra lỗi khi lưu tin. Vui lòng thử lại sau.';
      }
    });
  }

  onUnsaveClick(job: any) {
    if (!this.user) {
      this.showLoginDialog = true;
      return;
    }
    if (!job?.id) return;

    this.savedJobService.unsaveJob(job.id).subscribe({
      next: () => {
        job.saved = false;
      },
      error: () => {
        this.showErrorDialog = true;
        this.errorTitle = 'Bỏ lưu tin thất bại!';
        this.errorMessage = 'Đã xảy ra lỗi khi bỏ lưu tin. Vui lòng thử lại sau.';
      }
    });
  }

  openCompanyDetail(companyId: number) {
    window.open(`/company-detail/${companyId}`, '_blank');
  }

  handleCancel() {
    this.showErrorDialog = false;
  }
}

