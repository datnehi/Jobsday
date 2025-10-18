import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";

@Component({
  selector: 'app-applied-history',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ErrorDialogComponent,
    LoadingComponent
  ],
  templateUrl: './applied-history.component.html',
  styleUrls: ['./applied-history.component.css']
})
export class AppliedHistoryComponent {

  appliedJobs: any[] = [];
  isJobSearchActive: boolean = true;
  allowNTDSearch: boolean = false;
  currentPage: number = 0;
  totalPages: number = 1;
  showStatusDropdown = false;
  selectedStatus: string = '';

  isLoading: boolean = false;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.fetchAppliedJobs(0);
        this.allowNTDSearch = user.ntdSearch;
      }
    });
  }

  fetchAppliedJobs(page: number) {
    const filters = {
      status: this.selectedStatus,
      page
    };
    this.applicationService.getAppliedJobs(filters).subscribe(response => {
      this.appliedJobs = response.data.content;
      this.currentPage = response.data.page;
      this.totalPages = response.data.totalPages;
    });
  }

  toggleSearchChange() {
    this.userService.updateNtdSearch(this.allowNTDSearch).subscribe(response => {
      if (response) {
        this.authService.setUser(this.authService.token || '');
        this.ngOnInit();
      }
    });
  }

  changePage(page: number) {
    this.fetchAppliedJobs(page);
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.fetchAppliedJobs(0);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPLIED': return 'Đã ứng tuyển';
      case 'VIEWED': return 'NTD đã xem hồ sơ';
      case 'SUITABLE': return 'Hồ sơ phù hợp';
      case 'UNSUITABLE': return 'Hồ sơ chưa phù hợp';
      default: return '';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.showStatusDropdown = false;
    }
  }

  onViewCVApplied(cvId: number, mode: string) {
    if (cvId) {
      this.isLoading = true;

      this.applicationService.downloadCv(cvId).subscribe(response => {
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

        if (mode == 'view' && contentType?.includes('pdf')) {
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
        this.isLoading = false;
        this.showErrorDialog = true;
        this.errorTitle = 'Lỗi tải CV';
        this.errorMessage = 'Đã xảy ra lỗi khi tải CV. Vui lòng thử lại sau.';
      });
    } else {
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Không tìm thấy CV đã nộp!';
    }
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  handleCancel() {
    this.showErrorDialog = false;
  }

}
