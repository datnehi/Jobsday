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
import { AvatarEditorComponent } from "../../../common/avatar-editor/avatar-editor.component";
import { Company } from '../../../../models/company';
import { CompanyMember } from '../../../../models/company_member';
import { CompanyService } from '../../../../services/company.service';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { JobService } from '../../../../services/job.service';
import { JobSkillsService } from '../../../../services/job-skills.service';
import { SkillsService } from '../../../../services/skills.service';
import { Skills } from '../../../../models/skills';
import { NgSelectModule } from '@ng-select/ng-select';
import { Job } from '../../../../models/job';
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
    AvatarEditorComponent,
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
  members: any[] = [];
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
  confirmAction: 'save' | 'cancel' | 'reset' | 'deleteJob' | 'updateJob' | 'cancelUpdateJob' | null = null;

  totalPages: number = 1;
  currentPage: number = 0;
  showStatusDropdown = false;
  showAvatarEditor: boolean = false;
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
  Array: any;
  jobSelected: any = null;
  showUpdateJobModal = false;
  jobForm!: FormGroup;
  skillsList: Skills[] = [];
  selectedSkills: number[] = [];
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private companyMemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService,
    private jobService: JobService,
    private jobSkillsService: JobSkillsService,
    private skillsService: SkillsService,
    private emailService: EmailService
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      full_name: ['', Validators.required],
      phone: [''],
      dob: [''],
      address: [''],
      status: ['ACTIVE', Validators.required],
      ntd_search: [false, Validators.required]
    });
    const futureDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return { invalidDate: true };
      if (d.getTime() <= Date.now()) return { pastOrToday: true };
      return null;
    };
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      memberName: ['', Validators.required],
      location: ['', Validators.required],
      address: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      deadline: ['', [Validators.required, futureDateValidator]],
      salary: ['', Validators.required],
      experience: ['', Validators.required],
      level: ['', Validators.required],
      jobType: ['', Validators.required],
      contractType: ['', Validators.required],
      workingTime: ['', Validators.required],
      skills: [[]],
      description: ['', Validators.required],
      requirement: ['', Validators.required],
      benefit: ['', Validators.required],
      status: ['', Validators.required]
    });
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
  }

  closeUserDialog() {
    this.showUserDialog = false;
  }

  saveUser() {
    if (this.userForm.invalid) return;
    this.isLoading = true;
    const userData: User = {
      ...this.user,
      email: this.userForm.value.email,
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

  openConfirm(action: 'save' | 'cancel' | 'reset' | 'deleteJob' | 'updateJob' | 'cancelUpdateJob', payload?: any) {
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
    } else if (action === 'updateJob') {
      this.confirmTitle = 'Xác nhận cập nhật công việc';
      this.confirmMessage = 'Bạn có chắc chắn muốn cập nhật công việc này?';
    } else if (action === 'deleteJob') {
      this.confirmTitle = 'Xác nhận xóa công việc';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa công việc này?';
    } else if (action === 'cancelUpdateJob') {
      this.confirmTitle = 'Xác nhận hủy cập nhật công việc';
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy cập nhật công việc này? Mọi thay đổi sẽ không được lưu.';
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
    } else if (this.confirmAction === 'updateJob' && this.jobSelected) {
      this.submitUpdateJob();
    } else if (this.confirmAction === 'cancelUpdateJob') {
      this.closeUpdateJobModal();
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

  openAvatarDialog() {
    this.showAvatarEditor = true;
  }

  async onAvatarSaved(file: File | null) {
    if (!file) return;
    this.isLoading = true;
    this.userService.updateAvatarUser(this.user.id, file)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.showAvatarEditor = false;
            this.ngOnInit();
          } else {
            this.errorTitle = 'Lỗi';
            this.errorMessage = 'Cập nhật ảnh đại diện thất bại.';
            this.showErrorDialog = true;
          }
        },
        error: () => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

  onAvatarDialogClosed() {
    this.showAvatarEditor = false;
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

  updateJob(job: any) {
    this.showJobDetail = false;
    this.openUpdateJob(job);
  }

  closeUpdateJobModal() {
    this.showUpdateJobModal = false;
    this.jobSelected = null;
  }

  openUpdateJob(job: any) {
    this.jobSelected = job;
    this.jobService.getJobById(job.id).subscribe(response => {
      if (response.data) {
        this.jobSelected = response.data;
        this.populateForm(this.jobSelected);
        if (this.jobSelected) {
          this.jobSkillsService.getSkillsByJobId(this.jobSelected.id!).subscribe(skillsResponse => {
            if (skillsResponse.data) {
              this.selectedSkills = skillsResponse.data.map((skill: any) => skill.id);
              this.jobForm.patchValue({ skills: this.selectedSkills });
            }
          });
          this.companyMemberService.getMemberOfCompany(this.jobSelected.companyId).subscribe(membersResponse => {
            if (membersResponse.data) {
              this.members = membersResponse.data;
              const jobMember = this.members.find((m: any) => m.id === this.jobSelected?.memberId);
              if (jobMember) {
                this.jobForm.patchValue({ memberName: jobMember.id });
              }
            }
          });
        }
      }
    });
    this.skillsService.getAllSkills().subscribe(response => {
      if (response.data) {
        this.skillsList = response.data;
      }
    });
    this.showUpdateJobModal = true;
  }

  private populateForm(job: any): void {
    if (job) {
      this.jobForm.patchValue({
        title: job.title,
        location: job.location,
        address: job.address,
        quantity: job.quantity,
        deadline: job.deadline,
        salary: job.salary,
        experience: job.experience,
        level: job.level,
        jobType: job.jobType,
        contractType: job.contractType,
        workingTime: job.workingTime,
        skills: job.skills,
        description: job.description,
        requirement: job.requirement,
        benefit: job.benefit,
        status: job.status
      });
    };
  }

  onSkillChange(skillId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedSkills.includes(skillId)) {
        this.selectedSkills.push(skillId);
      }
    } else {
      const idx = this.selectedSkills.indexOf(skillId);
      if (idx > -1) {
        this.selectedSkills.splice(idx, 1);
      }
    }
    this.jobForm.get('skills')?.setValue([...this.selectedSkills]);
    this.jobForm.get('skills')?.markAsDirty();
  }

  submitUpdateJob() {
    if (this.jobForm.valid) {
      const formValues = this.jobForm.getRawValue();
      const updatedJob: Job = {
        id: this.jobSelected ? this.jobSelected.id : 0,
        companyId: this.company.id,
        memberId: formValues.memberName,
        title: formValues.title,
        location: formValues.location,
        address: formValues.address,
        quantity: formValues.quantity,
        deadline: formValues.deadline,
        salary: formValues.salary,
        experience: formValues.experience,
        level: formValues.level,
        jobType: formValues.jobType,
        contractType: formValues.contractType,
        workingTime: formValues.workingTime,
        description: formValues.description,
        requirement: formValues.requirement,
        benefit: formValues.benefit,
        status: formValues.status,
      };
      this.isLoading = true;
      this.jobService.updateJob(updatedJob.id!, updatedJob)
        .pipe(finalize(() => { this.isLoading = false; }))
        .subscribe(response => {
          if (response.data) {
            const skillsToUpdate = formValues.skills;
            this.jobSkillsService.updateSkillsForJob(updatedJob.id!, skillsToUpdate).subscribe(skillsResponse => {
              if (skillsResponse.status === 200) {
                this.emailService.sendEmail({
                  to: this.company.email,
                  subject: 'Cập nhật job',
                  body: `Xin chào ${this.company.name},\n\nJob ${updatedJob.title} của bạn đã được cập nhật thành công.\n\nTrân trọng,\nĐội ngũ Jobsday`
                }).subscribe();
                this.fetchJobs(this.currentPage);
                this.closeUpdateJobModal();
              } else {
                this.showErrorDialog = true;
                this.errorTitle = 'Cập nhật job thất bại!';
                this.errorMessage = 'Đã xảy ra lỗi khi cập nhật job. Vui lòng thử lại sau.';
              }
            });
          } else {
            this.showErrorDialog = true;
            this.errorTitle = 'Cập nhật job thất bại!';
            this.errorMessage = 'Đã xảy ra lỗi khi cập nhật job. Vui lòng thử lại sau.';
          }
        });
    }
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
