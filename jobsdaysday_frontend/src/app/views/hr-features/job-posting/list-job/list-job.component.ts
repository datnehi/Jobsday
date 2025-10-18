import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { JobService } from '../../../../services/job.service';
import { CompanyMember } from '../../../../models/company_member';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-job',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
],
  templateUrl: './list-job.component.html',
  styleUrl: './list-job.component.css'
})
export class ListJobComponent {
  member: CompanyMember | null = null;
  jobs: any[] = [];
  textSearch: string = '';
  locationSearch: string = '';
  statusSearch: string = '';
  deadlineSearch: string = '';
  filterByMe: boolean = false;
  pendingSearchText: string = '';
  currentPage: number = 0;
  totalPages: number = 1;
  showJobDetail = false;
  jobDetail: any = {};
  showFullDescription = false;
  showFullRequirement = false;
  showFullBenefit = false;

  locations = [
    { value: '', label: 'Tất cả' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
    { value: 'Đà Nẵng', label: 'Đà Nẵng' }
  ];
  status = [
    { value: '', label: 'Tất cả' },
    { value: 'ACTIVE', label: 'Đang mở' },
    { value: 'HIDDEN', label: 'Đã ẩn' },
    { value: 'CLOSED', label: 'Đã đóng' }
  ];
  deadline = [
    { value: '', label: 'Tất cả' },
    { value: 'ACTIVE', label: 'Còn hiệu lực' },
    { value: 'EXPIRED', label: 'Đã hết hạn' },
  ];

  constructor(
    private jobService: JobService,
    private companyMemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService,
    private router: Router
  ) { }

  ngOnInit() {
    this.companyMemberService.getMe().subscribe(response => {
      if (response.data) {
        this.member = response.data;
        this.loadJobsForCompany(0);
      }
    });
  }

  loadJobsForCompany(page: number = 0) {
    const filters = {
      companyId: this.member?.companyId,
      memberId: this.filterByMe == true ? this.member?.id : null,
      keyword: this.textSearch,
      location: this.convertEnumService.mapLocationToEnum(this.locationSearch),
      deadline: this.deadlineSearch,
      status: this.statusSearch,
      page: page,
    };
    this.jobService.getAllJobsOfCompany(filters).subscribe(response => {
      const jobsData = response.data;
      this.jobs = (jobsData.content || []).map((job: any) => ({
        ...job,
        location: this.convertEnumService.mapLocationFromEnum(job.location),
        experience: this.convertEnumService.mapExperienceFromEnum(job.experience),
        level: this.convertEnumService.mapLevelFromEnum(job.level),
        salary: this.convertEnumService.mapSalaryFromEnum(job.salary),
        contractType: this.convertEnumService.mapContractTypeFromEnum(job.contractType),
        jobType: this.convertEnumService.mapWorkTypeFromEnum(job.jobType)
      }));
      this.currentPage = response.data.page;
      this.totalPages = response.data.totalPages;
      this.pendingSearchText = this.textSearch;
    });
  }

  resetFilter() {
    this.locationSearch = '';
    this.statusSearch = '';
    this.deadlineSearch = '';
    this.filterByMe = false;
    this.loadJobsForCompany();
  }
  
  onViewJob(id: number) {
    this.jobDetail = this.jobs.find(item => item.id === id);
    this.showJobDetail = true;

  }

  closeJobDetail() {
    this.showJobDetail = false;
  }

  onDeleteJob(id: number) {
    this.jobService.deleteJob(id).subscribe(response => {
      if (response.status === 200) {
        this.loadJobsForCompany(this.currentPage);
      }
    });
  }

  changePage(page: number) {
    if (this.pendingSearchText !== this.textSearch) {
      this.loadJobsForCompany(0);
    } else if (page >= 0 && page < this.totalPages) {
      this.loadJobsForCompany(page);
    }
  }

  changeLocation(value: string) {
    this.locationSearch = value;
    this.loadJobsForCompany();
  }

  changeDeadline(value: string) {
    this.deadlineSearch = value;
    this.loadJobsForCompany();
  }

  changeStatus(value: string) {
    this.statusSearch = value;
    this.loadJobsForCompany();
  }

  toggleFilterByMe() {
    this.filterByMe = !this.filterByMe;
    this.loadJobsForCompany();
  }

  updateJob(jobId: number) {
    this.router.navigate([`update-job/${jobId}`]);
  }

  onViewListCandidateApplied(jobId: number) {
    const job = this.jobs.find(j => j.id === jobId);
    if(this.member?.isAdmin != true && job.memberId != this.member?.id) { return; }
    window.open(`/list-candidates-applied/${jobId}`, '_blank');
  }
}
