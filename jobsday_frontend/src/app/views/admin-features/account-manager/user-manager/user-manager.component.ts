import { User } from './../../../../models/user';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { UserService } from '../../../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-manager',
  imports: [
    CommonModule,
    FormsModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    ReactiveFormsModule
  ],
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.css'
})
export class UserManagerComponent implements OnInit {
  searchText: string = '';
  textPending: string = '';
  users: any[] = [];

  showUserDialog = false;
  userForm: FormGroup;

  isLoading = false;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'save' | 'cancel' | 'reset' | null = null;

  totalPages: number = 1;
  currentPage: number = 0;
  filter: any;
  user: any = null;
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private companyMemberService: CompanyMemberService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      email: [''],
      full_name: [''],
      phone: [''],
      dob: [''],
      address: [''],
      status: ['ACTIVE', Validators.required],
      email_verified: [false, Validators.required],
      verification_code: [''],
      verification_expiry: [''],
      ntd_search: [false, Validators.required],
      role: ['']
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page: number = 0) {
    const filter = {
      textSearch: this.searchText,
      page,
    };
    this.isLoading = true;
    this.userService.getAllUsers(filter)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (response) => {
          this.users = response.data.content;
          this.totalPages = response.data.totalPages;
          this.currentPage = page;
          this.textPending = this.searchText;
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Tải danh sách người dùng thất bại. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
  }

  editUser(user: any) {
    this.user = user;
    this.userForm.patchValue({
      email: user.email,
      full_name: user.fullName || user.full_name,
      phone: user.phone,
      dob: user.dob ? (new Date(user.dob)).toISOString().split('T')[0] : '',
      address: user.address,
      status: user.status,
      email_verified: !!user.emailVerified,
      verification_code: user.verificationCode || user.verification_code,
      verification_expiry: user.verificationExpiry ? (new Date(user.verificationExpiry)).toISOString().slice(0, 16) : '',
      ntd_search: !!user.ntdSearch,
      role: user.role
    });
    this.showUserDialog = true;
    this.userForm.get('email')?.disable();
    this.userForm.get('full_name')?.disable();
    this.userForm.get('role')?.disable();
    this.userForm.get('phone')?.disable();
    this.userForm.get('dob')?.disable();
    this.userForm.get('address')?.disable();
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
      emailVerified: this.userForm.value.email_verified,
      verificationCode: this.userForm.value.verification_code,
      verificationExpiry: this.userForm.value.verification_expiry ? new Date(this.userForm.value.verification_expiry) : null,
      ntdSearch: this.userForm.value.ntd_search
    };
    this.userService.updateUserInfoByAdmin(userData)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.closeUserDialog();
          this.loadUsers(this.currentPage);
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

  openConfirm(action: 'save' | 'cancel' | 'reset', filter?: any) {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    if (action === 'save') {
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi?';
    } else if (action === 'cancel') {
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy bỏ thay đổi?';
    } else if (action === 'reset') {
      this.confirmMessage = 'Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này?';
      this.filter = filter;
    }
    this.showConfirmDialog = true;
  }

  handleConfirm(filter?: any) {
    this.showConfirmDialog = false;
    if (this.confirmAction === 'save') {
      this.saveUser();
    } else if (this.confirmAction === 'cancel') {
      this.closeUserDialog();
    } else if (this.confirmAction === 'reset') {
      this.resetPassword(filter.id);
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
    if (this.searchText !== this.textPending) {
      this.loadUsers(0);
    } else if (page >= 0 && page < this.totalPages) {
      this.loadUsers(page);
    }
  }

  viewCandidateInfo(user: any) {
    if (user.role == 'CANDIDATE') {
      this.router.navigate([`/candidate/${user.id}`]);
    } else if (user.role == 'HR') {
      this.companyMemberService.getMemberByUserId(user.id).subscribe({
        next: (response) => {
          const companyMember = response.data;
          this.router.navigate([`/hr-related-info/${companyMember.id}`]);
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Không thể lấy thông tin HR. Vui lòng thử lại.';
          this.showErrorDialog = true;
        }
      });
    }
  }

}
