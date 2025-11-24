import { Component, HostListener } from '@angular/core';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Company } from '../../../../models/company';
import { CompanyService } from '../../../../services/company.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { finalize } from 'rxjs';
import { AvatarEditorComponent } from "../../../common/avatar-editor/avatar-editor.component";
import { JobService } from '../../../../services/job.service';
import { JobSkillsService } from '../../../../services/job-skills.service';
import { SkillsService } from '../../../../services/skills.service';
import { Job } from '../../../../models/job';
import { CompanyMember } from '../../../../models/company_member';
import { Skills } from '../../../../models/skills';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewlineToBrPipe } from "../../../../services/common/newline-to-br-pipe.service";
import { NotificationService } from '../../../../services/notification.service';
import { EmailService } from '../../../../services/email.service';

@Component({
  selector: 'app-company-related-info',
  imports: [
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    AvatarEditorComponent,
    NgSelectModule,
    ReactiveFormsModule,
    NewlineToBrPipe
  ],
  templateUrl: './company-related-info.component.html',
  styleUrl: './company-related-info.component.css'
})
export class CompanyRelatedInfoComponent {
  jobForm!: FormGroup;
  companyForm!: FormGroup;
  company: Company = {} as Company;
  members: any[] = [];
  jobs: any[] = [];

  isLoading = false;
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'editMember' | 'cancel' | 'deleteMember' | 'deleteJob' | 'updateJob' | 'cancelUpdateJob' | 'editCompany' | 'cancelEditCompany' | 'deleteCompany' | null = null;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  isDescExpanded = false;
  mapUrl?: SafeResourceUrl;
  selectedTab: 'members' | 'jobs' = 'members';
  memberSearchText = '';
  totalPageMember = 1;
  currentPageMember = 0;
  pendingSearchTextMember = '';
  editMemberData: any = {};
  showEditDialog: boolean = false;
  showAvatarEditor = false;
  jobSearchText = '';
  pendingSearchTextJob = '';
  currentPageJob = 0;
  totalPageJob = 1;
  selectedLocation: string = '';
  selectedDeadline: string = '';
  selectedStatus: string = '';
  showLocationDropdown: boolean = false;
  showDeadlineDropdown: boolean = false;
  showStatusDropdown: boolean = false;
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
  showJobDetail = false;
  jobDetail: any;
  showFullDescription = false;
  showFullRequirement = false;
  showFullBenefit = false;
  showUpdateJobModal = false;
  jobSelected: Job | null = null;
  memberSelected: CompanyMember | null = null;
  member: CompanyMember | null = null;
  skillsList: Skills[] = [];
  selectedSkills: number[] = [];
  showEditCompanyModal = false;

  constructor(
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private convertEnumService: ConvertEnumService,
    private companyMemberService: CompanyMemberService,
    private jobService: JobService,
    private router: Router,
    private fb: FormBuilder,
    private jobSkillsService: JobSkillsService,
    private skillsService: SkillsService,
    private emailService: EmailService
  ) { }

  ngOnInit() {
    const companyId = Number(this.route.snapshot.paramMap.get('id'));
    this.companyService.getById(companyId).subscribe({
      next: (response) => {
        this.company = {
          ...response.data,
          location: this.convertEnumService.mapLocationFromEnum(response.data.location)
        };
        if (this.company?.address) {
          this.updateMapUrl(this.company.address);
        }
        this.fetchMembers();
        this.fetchJobs();
      }
    });
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      memberName: ['', Validators.required],
      location: ['', Validators.required],
      address: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      deadline: ['', Validators.required],
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
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      address: [''],
      website: [''],
      taxCode: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      status: ['', Validators.required]
    });
  }

  fetchMembers(page: number = 0) {
    const filter = {
      id: this.company.id,
      textSearch: this.memberSearchText,
      page: page,
      size: 10
    };
    this.isLoading = true;
    this.companyMemberService.getMemberByAdmin(filter)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (response) => {
          this.members = response.data.content;
          this.totalPageMember = response.data.totalPages;
          this.currentPageMember = response.data.page;
          this.pendingSearchTextMember = this.memberSearchText;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorTitle = 'Lỗi tải thành viên';
          this.errorMessage = error.message || 'Đã có lỗi xảy ra khi tải danh sách thành viên.';
          this.showErrorDialog = true;
        }
      });
  }

  fetchJobs(page: number = 0) {
    const filters = {
      companyId: this.company.id,
      keyword: this.jobSearchText,
      location: this.convertEnumService.mapLocationToEnum(this.selectedLocation),
      deadline: this.convertEnumService.mapDeadlineToEnum(this.selectedDeadline),
      status: this.convertEnumService.mapJobStatusToEnum(this.selectedStatus),
      page: page,
    };
    this.isLoading = true;
    this.jobService.getAllJobsOfCompany(filters)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (response) => {
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
          this.totalPageJob = jobsData.totalPages;
          this.currentPageJob = jobsData.page;
          this.pendingSearchTextJob = this.jobSearchText;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorTitle = 'Lỗi tải việc làm';
          this.errorMessage = error.message || 'Đã có lỗi xảy ra khi tải danh sách việc làm.';
          this.showErrorDialog = true;
        }
      });
  }

  updateJob(job: any) {
    this.showJobDetail = false;
    this.openUpdateJob(job);
  }

  openConfirm(action: 'editMember' | 'cancel' | 'deleteMember' | 'deleteJob' | 'updateJob' | 'cancelUpdateJob' | 'editCompany' | 'cancelEditCompany' | 'deleteCompany', payload?: any) {
    this.confirmAction = action;
    if (action === 'editMember') {
      this.confirmTitle = 'Xác nhận thay đổi';
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi cho thành viên này không?';
    } else if (action === 'cancel') {
      this.confirmTitle = 'Hủy thay đổi';
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy các thay đổi không? Mọi thay đổi chưa lưu sẽ bị mất.';
    } else if (action === 'deleteMember') {
      this.confirmTitle = 'Xóa thành viên';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa thành viên này không? Hành động này không thể hoàn tác.';
    } else if (action === 'deleteJob') {
      this.jobSelected = payload;
      this.confirmTitle = 'Xóa việc làm';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa việc làm này không? Hành động này không thể hoàn tác.';
    } else if (action === 'updateJob') {
      this.confirmTitle = 'Cập nhật việc làm';
      this.confirmMessage = 'Bạn có chắc chắn muốn cập nhật việc làm này không?';
    } else if (action === 'cancelUpdateJob') {
      this.confirmTitle = 'Hủy cập nhật việc làm';
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy các thay đổi không? Mọi thay đổi chưa lưu sẽ bị mất.';
    } else if (action === 'editCompany') {
      this.confirmTitle = 'Xác nhận thay đổi công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi cho công ty này không?';
    } else if (action === 'cancelEditCompany') {
      this.confirmTitle = 'Hủy thay đổi công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy các thay đổi không? Mọi thay đổi chưa lưu sẽ bị mất.';
    } else if (action === 'deleteCompany') {
      this.confirmTitle = 'Xóa công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa công ty này không? Hành động này không thể hoàn tác.';
    }
    this.showConfirmDialog = true;
  }

  handleConfirm() {
    if (this.confirmAction === 'editMember' || this.confirmAction === 'deleteMember') {
      this.saveEditMember();
    } else if (this.confirmAction === 'cancel') {
      this.closeEditDialog();
    } else if (this.confirmAction === 'updateJob') {
      this.submitUpdateJob();
    } else if (this.confirmAction === 'cancelUpdateJob') {
      this.closeUpdateJobModal();
    } else if (this.confirmAction === 'deleteJob' && this.jobSelected) {
      this.onDeleteJob(this.jobSelected);
    } else if (this.confirmAction === 'editCompany') {
      this.saveEditCompany();
    } else if (this.confirmAction === 'cancelEditCompany') {
      this.closeEditCompanyModal();
    } else if (this.confirmAction === 'deleteCompany') {
      this.onDeleteCompany();
    }
    this.jobSelected = null;
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.editMemberData = {};
    this.jobDetail = null;
    this.companyForm.reset();
    this.jobForm.reset();
  }

  handleCancel() {
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.jobDetail = null;
    this.editMemberData = {};
    this.jobSelected = null;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  changeJobsPage(page: number) {
    if (this.pendingSearchTextJob !== this.jobSearchText) {
      this.fetchJobs(0);
    } else if (page >= 0 && page < this.totalPageJob) {
      this.fetchJobs(page);
    }
  }

  toggleDesc() {
    this.isDescExpanded = !this.isDescExpanded;
  }

  encodeAddress(address: string): string {
    return encodeURIComponent(address);
  }

  updateMapUrl(address: string) {
    const rawUrl = `https://www.google.com/maps?q=${this.encodeAddress(address)}&output=embed`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  onTabChange(tab: 'members' | 'jobs') {
    this.selectedTab = tab;
  }

  changePageMember(page: number) {
    if (this.pendingSearchTextMember !== this.memberSearchText) {
      this.fetchMembers(0);
    } else if (page >= 0 && page < this.totalPageMember) {
      this.fetchMembers(page);
    }
  }

  editMember(member: any) {
    this.editMemberData = JSON.parse(JSON.stringify(member));
    this.showEditDialog = true;
  }

  closeEditDialog() {
    this.editMemberData = {};
    this.jobDetail = null;
    this.showEditDialog = false;
  }

  saveEditMember() {
    this.isLoading = true;
    this.companyMemberService.updateMember(this.editMemberData)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (response) => {
          this.showEditDialog = false;
          this.emailService.sendEmail({
            to: this.editMemberData.email,
            subject: 'Cập nhật thông tin thành viên',
            body: `Xin chào ${this.editMemberData.name},\n\nThông tin cá nhân ở công ty của bạn đã được cập nhật thành công.\n\nTrân trọng,\nĐội ngũ Jobsday`
          }).subscribe();
          this.fetchMembers(this.currentPageMember);
          this.editMemberData = {};
        },
        error: (error) => {
          this.errorTitle = 'Lỗi cập nhật thành viên';
          this.errorMessage = error.message || 'Đã có lỗi xảy ra khi cập nhật thông tin thành viên.';
          this.showErrorDialog = true;
        }
      });
  }

  deleteMember(member: any) {
    this.editMemberData = JSON.parse(JSON.stringify(member));
    if (this.editMemberData) {
      this.editMemberData!.status = 'REJECTED';
      this.openConfirm('deleteMember');
    }
  }

  openAvatarDialog() {
    this.showAvatarEditor = true;
  }

  async onAvatarSaved(file: File | null) {
    if (!file) return;
    this.isLoading = true;
    this.companyService.updateLogo(this.company.id, file)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (res) => {
          if (res.status == 200) {
            this.company.logo = res.data;
            this.emailService.sendEmail({
              to: this.company.email,
              subject: 'Cập nhật ảnh đại diện công ty',
              body: `Xin chào ${this.company.name},\n\nẢnh đại diện công ty của bạn đã được cập nhật thành công.\n\nTrân trọng,\nĐội ngũ Jobsday`
            }).subscribe();
          } else {
            this.errorTitle = 'Lỗi';
            this.errorMessage = 'Cập nhật ảnh đại diện thất bại.';
            this.showErrorDialog = true;
          }
          this.showAvatarEditor = false;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showLocationDropdown = false;
    this.showDeadlineDropdown = false;
    this.showStatusDropdown = false;
  }

  routerHr(member: any) {
    this.router.navigate([`/hr-related-info/${member.id}`]);
  }

  closeJobDetail() {
    this.showJobDetail = false;
    this.jobDetail = null;
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

  viewJobDetail(job: any) {
    this.jobDetail = job;
    this.showJobDetail = true;
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

  closeUpdateJobModal() {
    this.jobSelected = null;
    this.jobForm.reset();
    this.selectedSkills = [];
    this.showUpdateJobModal = false;
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
                  subject: 'Cập nhật thông tin job',
                  body: `Xin chào ${this.company.name},\n\nThông tin job ${updatedJob.title} của bạn đã được cập nhật thành công.\n\nTrân trọng,\nĐội ngũ Jobsday`
                }).subscribe();
                this.fetchJobs(this.currentPageJob);
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

  onDeleteJob(job: Job) {
    this.isLoading = true;
    this.jobService.deleteJob(job.id!)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        if (response.status === 200) {
          this.emailService.sendEmail({
            to: this.company.email,
            subject: 'Xóa job',
            body: `Xin chào ${this.company.name},\n\nJob ${job.title} của bạn đã được xóa.\n\nTrân trọng,\nĐội ngũ Jobsday`
          }).subscribe();
          this.fetchJobs(this.currentPageJob);
        }
      });
  }

  editCompany() {
    if (!this.company) return;
    this.companyForm.patchValue({
      name: this.company.name,
      location: this.company.location,
      address: this.company.address,
      website: this.company.website,
      taxCode: this.company.taxCode,
      email: this.company.email,
      description: this.company.description,
      status: this.company.status
    });
    this.showEditCompanyModal = true;
  }

  closeEditCompanyModal() {
    this.showEditCompanyModal = false;
    this.companyForm.reset();
  }

  saveEditCompany() {
    if (this.companyForm.invalid) {
      this.errorTitle = 'Lỗi';
      this.errorMessage = 'Vui lòng điền đầy đủ các trường bắt buộc.';
      this.showErrorDialog = true;
      return;
    }
    this.isLoading = true;
    const updatedCompany: Company = {
      ...this.company!,
      ...this.companyForm.value,
      location: this.convertEnumService.mapLocationToEnum(this.companyForm.get('location')?.value)
    };

    this.companyService.update(updatedCompany)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.showEditCompanyModal = false;
          this.emailService.sendEmail({
            to: this.company.email,
            subject: 'Cập nhật thông tin công ty',
            body: `Xin chào ${this.company.name},\n\nThông tin công ty của bạn đã được cập nhật thành công.\n\nTrân trọng,\nĐội ngũ Jobsday`
          }).subscribe();
          this.ngOnInit();
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin công ty.';
          this.showErrorDialog = true;
        }
      });
  }

  onDeleteCompany() {
    this.isLoading = true;
    this.companyService.deleteCompany(this.company.id!)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (response) => {
          if (response.status === 200) {
            this.router.navigate(['/company-management']);
          }
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi xóa công ty.';
          this.showErrorDialog = true;
        }
      });
  }
}
