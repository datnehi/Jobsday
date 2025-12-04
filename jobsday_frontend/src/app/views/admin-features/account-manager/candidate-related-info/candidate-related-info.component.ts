import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Cvs } from '../../../../models/cvs';
import { CvsService } from '../../../../services/cvs.service';
import { ApplicationService } from '../../../../services/application.service';
import { NewlineToBrPipe } from "../../../../services/common/newline-to-br-pipe.service";
import { AvatarEditorComponent } from "../../../common/avatar-editor/avatar-editor.component";
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-candidate-related-info',
  imports: [
    DatePipe,
    CommonModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    ReactiveFormsModule,
    NewlineToBrPipe,
    RouterModule,
    AvatarEditorComponent
  ],
  templateUrl: './candidate-related-info.component.html',
  styleUrl: './candidate-related-info.component.css'
})
export class CandidateRelatedInfoComponent {
  user: any = null;
  appliedJobs: any[] = [];
  cvs: Cvs[] = [];

  showUserDialog = false;
  userForm: FormGroup;
  isLoading = false;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'save' | 'cancel' | 'reset' | 'delete' | null = null;

  totalPages: number = 1;
  currentPage: number = 0;
  showStatusDropdown = false;
  selectedStatus: string = '';

  selectedApplication: any = null;
  showDetailDialog: boolean = false;
  showAvatarEditor: boolean = false;
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cvsService: CvsService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService
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
  }

  ngOnInit() {
    const userId = this.route.snapshot.params['id'];
    this.userService.getUserById(userId).subscribe(response => {
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
        this.getCvs(this.user.id);
        this.getAppliedJobs();
      }
    });
  }

  getCvs(userId: number) {
    this.cvsService.getCvOfUser(userId).subscribe(response => {
      if (response.data) {
        this.cvs = response.data as Cvs[];
      }
    });
  }

  getAppliedJobs(page: number = 0) {
    const filter = {
      page: page,
      status: this.selectedStatus || undefined,
      userId: this.user.id
    };
    this.isLoading = true;
    this.applicationService.getApplicationByUserId(filter)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        if (response.data) {
          this.appliedJobs = response.data.content;
          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;
        }
      });
  }

  editUser() {
    this.showUserDialog = true;
    this.userForm.get('email')?.disable();
  }

  closeUserDialog() {
    this.showUserDialog = false;
    this.userForm.get('email')?.enable();
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

  openConfirm(action: 'save' | 'cancel' | 'reset' | 'delete', application?: any) {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    if (action === 'save') {
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi?';
    } else if (action === 'cancel') {
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy bỏ thay đổi?';
    } else if (action === 'reset') {
      this.confirmMessage = 'Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này?';
    } else if (action === 'delete') {
      this.selectedApplication = application;
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa ứng tuyển này?';
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
    } else if (this.confirmAction === 'delete') {
      this.deleteApplication(this.selectedApplication.id);
      this.selectedApplication = null;
    }
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

  viewCv(cvId: number, mode: string) {
    if (!cvId) return;
    this.isLoading = true;
    this.cvsService.downloadCv(cvId).subscribe(response => {
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
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.';
      this.isLoading = false;
    });
  }

  deleteCv(cvId: number) {
    this.cvsService.deleteCv(cvId).subscribe(response => {
      if (response) {
        const data = {
          userTo: this.user.id,
          type: "SYSTEM_ALERT",
          message: "Jobsday đã xóa CV của bạn. Vui lòng liên hệ bộ phận hỗ trợ nếu bạn cần thêm thông tin."
        };
        this.notificationService.sendNotification(data).subscribe();
        this.getCvs(this.user.id);
      }
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    this.getAppliedJobs(page);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.showStatusDropdown = false;
    }
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.getAppliedJobs(0);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPLIED': return 'Đã ứng tuyển';
      case 'VIEWED': return 'NTD đã xem hồ sơ';
      case 'SUITABLE': return 'Hồ sơ phù hợp';
      case 'UNSUITABLE': return 'Hồ sơ chưa phù hợp';
      default: return status;
    }
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'APPLIED':
        return 'badge bg-primary';
      case 'VIEWED':
        return 'badge bg-warning text-dark';
      case 'SUITABLE':
        return 'badge bg-success';
      case 'UNSUITABLE':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light text-dark';
    }
  }

  viewDetail(application: any) {
    this.selectedApplication = application;
    this.showDetailDialog = true;
  }

  closeDetailDialog() {
    this.showDetailDialog = false;
    this.selectedApplication = null;
  }

  deleteApplication(applicationId: number) {
    this.isLoading = true;
    this.applicationService.deleteByAdmin(applicationId)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        if (response.status == 200) {
          this.appliedJobs = this.appliedJobs.filter(app => app.applicationId !== applicationId);
        } else {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Xóa ứng tuyển thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

  viewApplicationCv(applicationId: number) {
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

}
