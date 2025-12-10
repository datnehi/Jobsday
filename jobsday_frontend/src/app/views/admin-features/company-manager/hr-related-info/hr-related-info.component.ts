import { CommonModule} from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Company } from '../../../../models/company';
import { CompanyMember } from '../../../../models/company_member';
import { CompanyService } from '../../../../services/company.service';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { JobService } from '../../../../services/job.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { EmailService } from '../../../../services/email.service';

@Component({
  selector: 'app-hr-related-info',
  imports: [
    CommonModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    NgSelectModule
  ],
  templateUrl: './hr-related-info.component.html',
  styleUrl: './hr-related-info.component.css'
})
export class HrRelatedInfoComponent {
  user: User = {} as User;
  company: Company = {} as Company;
  member: CompanyMember = {} as CompanyMember;
  jobs: any[] = [];

  showUserDialog = false;
  userForm: FormGroup;
  isLoading = false;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'save' | 'cancel' | 'reset' | 'deleteJob' | null = null;

  totalPages: number = 1;
  currentPage: number = 0;
  showStatusDropdown = false;
  searchText: string = '';
  pendingSearchText: string = '';
  showLocationDropdown: boolean = false;
  selectedLocation: string = '';
  locations = [
    { value: '', label: 'Tất cả' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
    { value: 'Đà Nẵng', label: 'Đà Nẵng' }
  ];
  status = [
    { value: '', label: 'Tất cả' },
    { value: 'Đang mở', label: 'Đang mở' },
    { value: 'Đã ẩn', label: 'Đã ẩn' },
    { value: 'Đã đóng', label: 'Đã đóng' }
  ];
  deadlines = [
    { value: '', label: 'Tất cả' },
    { value: 'Còn hiệu lực', label: 'Còn hiệu lực' },
    { value: 'Đã hết hạn', label: 'Đã hết hạn' },
  ];
  showDeadlineDropdown: boolean = false;
  selectedDeadline: string = '';
  selectedStatus: string = '';
  showJobDetail = false;
  jobDetail: any;
  showFullDescription = false;
  showFullRequirement = false;
  showFullBenefit = false;
  jobSelected: any = null;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private companyMemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService,
    private jobService: JobService,
    private emailService: EmailService
  ) {
    this.userForm = this.fb.group({
      email: ['',],
      full_name: [''],
      phone: [''],
      dob: [''],
      address: [''],
      status: ['ACTIVE', Validators.required]
    });
    const futureDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return { invalidDate: true };
      if (d.getTime() <= Date.now()) return { pastOrToday: true };
      return null;
    };
  }

  ngOnInit() {
    const memberId = this.route.snapshot.params['id'];
    this.companyMemberService.getMemberById(memberId).subscribe(res => {
      if (res.data) {
        this.member = res.data as CompanyMember;
        this.userService.getUserById(this.member.userId).subscribe(response => {
          if (response.data) {
            this.user = response.data as User;
            this.userForm.patchValue({
              email: this.user.email,
              full_name: this.user.fullName,
              phone: this.user.phone,
              dob: this.user.dob ? (new Date(this.user.dob)).toISOString().split('T')[0] : '',
              address: this.user.address,
              status: this.user.status,
              ntd_search: !!this.user.ntdSearch
            });
          }
        });
        this.companyService.getById(this.member.companyId).subscribe(companyRes => {
          if (companyRes.data) {
            this.company = {
              ...companyRes.data as Company,
              location: this.convertEnumService.mapLocationFromEnum(companyRes.data['location'] as string)
            };
            this.fetchJobs(0);
          }
        });
      }
    });
  }

  fetchJobs(page: number) {
    const filters = {
      companyId: this.company.id,
      memberId: this.member?.id,
      keyword: this.searchText,
      location: this.convertEnumService.mapLocationToEnum(this.selectedLocation),
      deadline: this.convertEnumService.mapDeadlineToEnum(this.selectedDeadline),
      status: this.convertEnumService.mapJobStatusToEnum(this.selectedStatus),
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
      this.pendingSearchText = this.searchText;
    });
  }

  editUser() {
    this.showUserDialog = true;
    this.userForm.get('email')?.disable();
    this.userForm.get('full_name')?.disable();
    this.userForm.get('phone')?.disable();
    this.userForm.get('dob')?.disable();
    this.userForm.get('address')?.disable();
  }

  closeUserDialog() {
    this.showUserDialog = false;
  }

  saveUser() {
    if (this.userForm.invalid) return;
    this.isLoading = true;
    const userData: User = {
      ...this.user,
      fullName: this.userForm.value.full_name,
      phone: this.userForm.value.phone,
      dob: this.userForm.value.dob,
      address: this.userForm.value.address,
      status: this.userForm.value.status,
      ntdSearch: this.userForm.value.ntd_search
    };
    this.userService.updateUserInfoByAdmin(userData)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.closeUserDialog();
          this.ngOnInit();
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Cập nhật người dùng thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  openConfirm(action: 'save' | 'cancel' | 'reset' | 'deleteJob', payload?: any) {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    if (action === 'save') {
      this.confirmTitle = 'Xác nhận lưu';
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi?';
    } else if (action === 'cancel') {
      this.confirmTitle = 'Xác nhận hủy';
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy bỏ thay đổi?';
    } else if (action === 'reset') {
      this.confirmTitle = 'Xác nhận đặt lại';
      this.confirmMessage = 'Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này?';
    } else if (action === 'deleteJob') {
      this.jobSelected = payload;
      this.confirmTitle = 'Xác nhận xóa công việc';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa công việc này?';
    }
    this.showConfirmDialog = true;
  }

  handleConfirm() {
    this.showConfirmDialog = false;
    if (this.confirmAction === 'save') {
      this.saveUser();
    } else if (this.confirmAction === 'cancel') {
      this.closeUserDialog();
    } else if (this.confirmAction === 'reset') {
      this.resetPassword(this.user.id);
    } else if (this.confirmAction === 'deleteJob' && this.jobSelected) {
      this.onDeleteJob(this.jobSelected);
    }
    this.confirmAction = null;
    this.jobSelected = null;
    this.showConfirmDialog = false;
  }

  handleCancel() {
    this.showConfirmDialog = false;
  }

  resetPassword(id: number) {
    this.isLoading = true;
    this.userService.resetPassword(id)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => { },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.showStatusDropdown = false;
      this.showLocationDropdown = false;
      this.showDeadlineDropdown = false;
    }
  }

  onLocationChange(location: string) {
    this.selectedLocation = location;
    this.showLocationDropdown = false;
    this.fetchJobs(0);
  }

  onDeadlineChange(deadline: string) {
    this.selectedDeadline = deadline;
    this.showDeadlineDropdown = false;
    this.fetchJobs(0);
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.fetchJobs(0);
  }

  viewJobDetail(job: any) {
    this.jobDetail = job;
    this.showJobDetail = true;
  }

  changePage(page: number) {
    if (this.pendingSearchText !== this.searchText) {
      this.fetchJobs(0);
    } else if (page >= 0 && page < this.totalPages) {
      this.fetchJobs(page);
    }
  }

  closeJobDetail() {
    this.showJobDetail = false;
    this.jobDetail = null;
    this.showFullDescription = false;
    this.showFullRequirement = false;
    this.showFullBenefit = false;
    this.jobSelected = null;
  }

  onDeleteJob(id: number) {
    this.isLoading = true;
    this.jobService.deleteJob(id)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        if (response.status === 200) {
          this.emailService.sendEmail({
            to: this.company.email,
            subject: 'Xóa job',
            body: `Xin chào ${this.company.name},\n\nJob ${this.jobSelected?.title} của bạn đã được xóa.\n\nTrân trọng,\nĐội ngũ Jobsday`
          }).subscribe();
          this.fetchJobs(0);
        }
      });
  }
}
