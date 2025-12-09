import { JobService } from './../../../../services/job.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { NewlineToBrPipe } from "../../../../services/common/newline-to-br-pipe.service";
import { NotificationService } from '../../../../services/notification.service';
import { ConversationService } from '../../../../services/conversation.service';

@Component({
  selector: 'app-list-candidate-applied',
  imports: [
    DatePipe,
    CommonModule,
    ErrorDialogComponent,
    LoadingComponent,
    NewlineToBrPipe
  ],
  templateUrl: './list-candidate-applied.component.html',
  styleUrl: './list-candidate-applied.component.css'
})
export class ListCandidateAppliedComponent {
  applications: any[] = [];
  currentPage: number = 0;
  totalPages: number = 1;
  selectedApplication: any = null;
  showDetailDialog: boolean = false;
  isLoading: boolean = false;
  showErrorDialog: boolean = false;
  errorTitle: string = '';
  errorMessage: string = '';
  job: any = null;

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private jobService: JobService,
    private router: Router,
    private conversationService: ConversationService
  ) { }

  ngOnInit() {
    const jobId = this.route.snapshot.params['id'];
    this.jobService.getJobById(jobId).subscribe(response => {
      this.job = response.data;
    });
    this.jobService.checkOwnerJob(jobId).subscribe(response => {
      if (response.data) {
        this.loadApplications(jobId, 0);
      } else {
        this.router.navigate(['/notfound']);
      }
    });
  }

  loadApplications(jobId: number, page: number = 0) {
    const filter = { page };
    this.applicationService.getApplicationsByJob(jobId, filter).subscribe(response => {
      this.applications = response.data.content;
      this.currentPage = response.data.page;
      this.totalPages = response.data.totalPages;
    });
  }

  changePage(page: number) {
    this.loadApplications(this.route.snapshot.params['id'], page);
  }

  viewDetail(application: any) {
    this.selectedApplication = application;
    this.showDetailDialog = true;
    if (application.status == "APPLIED") {
      const data = {
        userTo: application.candidateId,
        type: "APPLICATION_STATUS",
        message: "VIEWED_" + this.route.snapshot.params['id']
      };
      this.notificationService.sendNotification(data).subscribe();
      this.applicationService.updateApplicationStatus(application.applicationId, "VIEWED").subscribe();
      application.status = "VIEWED";
    }
  }

  closeDetailDialog() {
    this.showDetailDialog = false;
    this.selectedApplication = null;
  }

  acceptCandidate(applicationId: number) {
    const application = this.applications.find(app => app.applicationId === applicationId);
    if (application && application.status != "SUITABLE") {
      const data = {
        userTo: application.candidateId,
        type: "APPLICATION_STATUS",
        message: "SUITABLE_" + this.route.snapshot.params['id']
      };
      this.applicationService.updateApplicationStatus(application.applicationId, "SUITABLE").subscribe((response) => {
        if (response.status === 200) {
          this.notificationService.sendNotification(data).subscribe();
          application.status = "SUITABLE";
        }
      });
    }
  }

  rejectCandidate(applicationId: number) {
    const application = this.applications.find(app => app.applicationId === applicationId);
    if (application && application.status != "UNSUITABLE") {
      const data = {
        userTo: application.candidateId,
        type: "APPLICATION_STATUS",
        message: "UNSUITABLE_" + this.route.snapshot.params['id']
      };
      this.applicationService.updateApplicationStatus(application.applicationId, "UNSUITABLE").subscribe((response) => {
        if (response.status === 200) {
          this.notificationService.sendNotification(data).subscribe();
          application.status = "UNSUITABLE";
        }
      });
    }
  }

  viewCv(applicationId: number) {
    this.isLoading = true;
    const application = this.applications.find(app => app.applicationId === applicationId);

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
      if (application.status == "APPLIED") {
        const data = {
          userTo: application.candidateId,
          type: "APPLICATION_STATUS",
          message: "VIEWED_" + this.route.snapshot.params['id']
        };
        this.applicationService.updateApplicationStatus(application.applicationId, "VIEWED").subscribe((response) => {
          if (response.status === 200) {
            this.notificationService.sendNotification(data).subscribe();
            application.status = "VIEWED";
          }
        });
      }
      this.isLoading = false;
    }, () => {
      this.isLoading = false;
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi tải CV';
      this.errorMessage = 'Đã xảy ra lỗi khi tải CV. Vui lòng thử lại sau.';
    });
  }

  handleCancel() {
    this.showErrorDialog = false;
  }

  openChatWithCandidate(application: any) {
    this.conversationService.createByCandidateAndCompany(application.candidateId, this.job.companyId).subscribe(res => {
      if (!res.data){
        this.errorTitle = 'Lỗi mở cuộc trò chuyện';
        this.errorMessage = 'Không thể tạo hoặc mở cuộc trò chuyện vào lúc này. Vui lòng thử lại sau.';
        this.showErrorDialog = true;
        return;
      }
      const convId = res.data.conversationId ?? res.data.id;
      window.open(`/chat?conversationId=${convId}`, '_blank');
    });
  }
}
