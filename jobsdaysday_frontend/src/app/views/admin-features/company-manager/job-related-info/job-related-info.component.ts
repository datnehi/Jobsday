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

@Component({
  selector: 'app-job-related-info',
  imports: [
    NewlineToBrPipe,
    CommonModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    RouterModule
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
  showDetailDialog = false;
  selectedApplication: any = null;
  isLoading = false;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'deleteApplication' | 'deleteJob' | null = null;

  constructor(
    private jobService: JobService,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    private companyMemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService,
    private userService: UserService,
    private applicationService: ApplicationService,
    private router: Router,
    private emailService: EmailService
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

  viewDetail(application: any) {
    this.selectedApplication = application;
    this.showDetailDialog = true;
  }

  viewCv(applicationId: number) {
    if (!applicationId) return;
    this.isLoading = true;
    this.applicationService.downloadCv(applicationId).subscribe(response => {
      const blob = response.body!;
      const url = window.URL.createObjectURL(blob);

      const contentType = response.headers.get('Content-Type');
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = 'cv.pdf';
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = decodeURIComponent(matches[1]);
        }
      }

      if (contentType?.includes('pdf')) {
        const pdfWindow = window.open(url, '_blank');
        if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
          this.showErrorDialog = true;
          this.errorTitle = 'Lỗi xem CV';
          this.errorMessage = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.';
          this.isLoading = false;
          return;
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
      }
      this.isLoading = false;
    }, () => {
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.';
      this.isLoading = false;
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadApplications(this.job.id!, page);
  }

  deleteApplication(applicationId: number) {
    this.isLoading = true;
    this.applicationService.deleteByAdmin(applicationId)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        if (response.status == 200) {
          this.applications = this.applications.filter(app => app.applicationId !== applicationId);
        } else {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Xóa ứng tuyển thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

  closeDetailDialog() {
    this.showDetailDialog = false;
    this.selectedApplication = null;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  openConfirm(action: 'deleteApplication' | 'deleteJob',application?: any) {
    this.confirmAction = action;
    if (action === 'deleteApplication') {
      this.selectedApplication = application;
      this.confirmTitle = 'Xác nhận';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa ứng tuyển này?';
    } else if (action === 'deleteJob') {
      this.confirmTitle = 'Xác nhận';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa job này? Tất cả các ứng tuyển liên quan sẽ bị xóa.';
    }
    this.showConfirmDialog = true;
  }

  handleConfirm() {
    if (this.confirmAction === 'deleteApplication' && this.selectedApplication) {
      this.deleteApplication(this.selectedApplication.applicationId);
    } else if (this.confirmAction === 'deleteJob') {
      this.deleteJob();
    }
    this.showConfirmDialog = false;
    this.selectedApplication = null;
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
