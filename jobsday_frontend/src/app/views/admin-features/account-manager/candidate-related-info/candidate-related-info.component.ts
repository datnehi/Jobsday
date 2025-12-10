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

@Component({
  selector: 'app-candidate-related-info',
  imports: [
    DatePipe,
    CommonModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    ReactiveFormsModule,
    RouterModule,
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
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cvsService: CvsService,
    private applicationService: ApplicationService
  ) {
    this.userForm = this.fb.group({
      email: [''],
      full_name: [''],
      phone: [''],
      dob: [''],
      address: [''],
      status: ['ACTIVE', Validators.required],
      ntd_search: [false]
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
    this.userForm.get('full_name')?.disable();
    this.userForm.get('phone')?.disable();
    this.userForm.get('dob')?.disable();
    this.userForm.get('address')?.disable();
    this.userForm.get('ntd_search')?.disable();
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

  openConfirm(action: 'save' | 'cancel' | 'reset') {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    if (action === 'save') {
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi?';
    } else if (action === 'cancel') {
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy bỏ thay đổi?';
    } else if (action === 'reset') {
      this.confirmMessage = 'Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này?';
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

  changePage(page: number) {
    this.currentPage = page;
    this.getAppliedJobs(page);
  }
}
