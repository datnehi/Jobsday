import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorDialogComponent } from '../../common/error-dialog/error-dialog.component';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { CompanyMemberService } from '../../../services/company-member.service';
import { CompanyMember } from '../../../models/company_member';
import { NotificationDialogComponent } from "../../common/notification-dialog/notification-dialog.component";
import { LoadingComponent } from "../../common/loading/loading.component";
import { AvatarEditorComponent } from "../../common/avatar-editor/avatar-editor.component";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-personal-info',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ErrorDialogComponent,
    NotificationDialogComponent,
    LoadingComponent,
    AvatarEditorComponent
  ],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent {
  user: User | null = null;
  member: CompanyMember | null = null;
  infoForm: FormGroup;
  allowNTDSearch: boolean = false;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  isLoading = false;
  showAvatarEditor = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private companyMemberService: CompanyMemberService
  ) {
    this.infoForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: [''],
      dob: [],
      address: [''],
      email: [{ value: '', disabled: true }],
      position: ['']
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        if (user.role === 'HR') {
          this.companyMemberService.getMe().subscribe(response => {
            if (response && response.data) {
              this.member = response.data as CompanyMember;
              this.infoForm.patchValue({
                position: this.member.position || ''
              });
            }
          });
        }
        this.allowNTDSearch = user.ntdSearch;
        this.infoForm.patchValue({
          fullName: user.fullName,
          phone: user.phone || '',
          dob: user.dob || '',
          email: user.email || '',
          address: user.address || '',
        });
      }
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

  onSubmit() {
    if (this.infoForm.valid) {
      const updatedUser: User = {
        ...this.user!,
        fullName: this.infoForm.value.fullName,
        phone: this.infoForm.value.phone,
        dob: this.infoForm.value.dob,
        address: this.infoForm.value.address
      };
      const updateMember: CompanyMember = {
        ...this.member!,
        position: this.infoForm.value.position
      };
      this.userService.updateUserInfo(updatedUser).subscribe(response => {
        if (response && response.data) {
          if (this.user?.role == 'HR') {
            this.companyMemberService.updateMember(updateMember).subscribe();
          }
          this.authService.setUser(this.authService.token || '');
          this.ngOnInit();
        }
      });
    }
  }

  openAvatarDialog() {
    this.showAvatarEditor = true;
  }

  async onAvatarSaved(file: File | null) {
    if (!file) return;
    this.isLoading = true;
    this.userService.changeAvatar(file)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(res => {
        if (res.status === 200) {
          this.authService.setUser(this.authService.token || '');
          this.showAvatarEditor = false;
          this.ngOnInit();
        } else {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Cập nhật ảnh đại diện thất bại.';
          this.showErrorDialog = true;
        }
      });
  }

  onAvatarDialogClosed() {
    this.showAvatarEditor = false;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }


  handleCancel() {
    this.showConfirmDialog = false;
  }

  handleConfirm() {
    this.showConfirmDialog = false;
    this.onSubmit();
  }

  openConfirm() {
    this.confirmTitle = 'Xác nhận';
    this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi?';
    this.showConfirmDialog = true;
  }
}
