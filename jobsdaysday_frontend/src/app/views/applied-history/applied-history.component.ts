import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ApplicationService } from '../../services/application.service';
import { response } from 'express';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-applied-history',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
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

  onViewCVApplied(cvId: number) {
    if (cvId) {
      const application = this.appliedJobs.find(item => item.id === cvId);

      if (application && application.fileName.toLowerCase().endsWith('.docx')) {
        this.applicationService.downloadCv(application.id).subscribe({
          next: (response) => {
            const blob = response.body!;
            const url = window.URL.createObjectURL(blob);

            let fileName = 'cv.docx';
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition) {
              const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
              if (matches && matches[1]) {
                fileName = matches[1];
              }
            }

            // Tạo link ẩn để tải
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
          },
          error: () => {
            alert('Không tải được CV!');
          }
        });
        return;
      }

      // Các loại file khác thì mở trực tiếp
      this.applicationService.getCvView(application.id).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          alert('Không tải được CV đã nộp!');
        }
      });
    } else {
      alert('Không tìm thấy CV đã nộp!');
    }
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

}
