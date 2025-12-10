import { Job } from './../../../../models/job';
import { Component } from '@angular/core';
import { NewlineToBrPipe } from "../../../../services/common/newline-to-br-pipe.service";
import { CommonModule } from '@angular/common';
import { JobService } from '../../../../services/job.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../../services/company.service';
import { Company } from '../../../../models/company';
import { CompanyMember } from '../../../../models/company_member';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { User } from '../../../../models/user';
import { UserService } from '../../../../services/user.service';
import { ApplicationService } from '../../../../services/application.service';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { finalize } from 'rxjs';
import { EmailService } from '../../../../services/email.service';
import { AbstractControl, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-job-related-info',
  imports: [
    NewlineToBrPipe,
    CommonModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './job-related-info.component.html',
  styleUrl: './job-related-info.component.css'
})
export class JobRelatedInfoComponent {
  job: Job = {} as Job;
  company: Company = {} as Company;
  member: CompanyMember = {} as CompanyMember;
  user: User = {} as User;
  applications: any[] = [];

  totalPages = 1;
  currentPage = 0;
  isLoading = false;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'deleteJob' | null = null;

  constructor(
    private jobService: JobService,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private companyMemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService,
    private userService: UserService,
    private applicationService: ApplicationService,
    private router: Router,
    private emailService: EmailService,
  ) { }

  ngOnInit() {
    const jobId = this.route.snapshot.params['id'];
    this.jobService.getJobById(jobId).subscribe(response => {
      this.job = {
        ...response.data,
        location: this.convertEnumService.mapLocationFromEnum(response.data.location),
        contractType: this.convertEnumService.mapContractTypeFromEnum(response.data.contractType),
        jobType: this.convertEnumService.mapWorkTypeFromEnum(response.data.jobType),
        level: this.convertEnumService.mapLevelFromEnum(response.data.level),
        salary: this.convertEnumService.mapSalaryFromEnum(response.data.salary),
        experience: this.convertEnumService.mapExperienceFromEnum(response.data.experience)
      };
      this.companyService.getById(this.job.companyId).subscribe(companyResp => {
        this.company = companyResp.data;
        this.companyMemberService.getMemberById(this.job.memberId).subscribe(memberResp => {
          this.member = memberResp.data;
          this.userService.getUserById(this.member.userId).subscribe(userResp => {
            this.user = userResp.data;
          });
        });
      });
      this.loadApplications(jobId, 0);
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

  loadApplications(jobId: number, page: number) {
    this.applicationService.getApplicationsByJob(jobId, { page }).subscribe(appResp => {
      if (appResp.data) {
        this.applications = appResp.data.content;
        this.totalPages = appResp.data.totalPages;
        this.currentPage = appResp.data.page;
      }
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadApplications(this.job.id!, page);
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  openConfirm(action: 'deleteJob') {
    this.confirmAction = action;
    if (action === 'deleteJob') {
      this.confirmTitle = 'Xác nhận';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa job này? Tất cả các ứng tuyển liên quan sẽ bị xóa.';
    }
    this.showConfirmDialog = true;
  }

  handleConfirm() {
    if (this.confirmAction === 'deleteJob') {
      this.deleteJob();
    }
    this.showConfirmDialog = false;
  }

  handleCancel() {
    this.showConfirmDialog = false;
  }

  deleteJob() {
    this.isLoading = true;
    this.jobService.deleteJob(this.job.id!)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        if (response.status == 200) {
          this.emailService.sendEmail({
            to: this.company.email,
            subject: 'Xóa job',
            body: `Xin chào ${this.company.name},\n\nJob ${this.job.title} của bạn đã được xóa.\n\nTrân trọng,\nĐội ngũ Jobsday`
          }).subscribe();
          this.router.navigate(['/company-related-info/', this.company.id]);
        } else {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Xóa job thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

}
