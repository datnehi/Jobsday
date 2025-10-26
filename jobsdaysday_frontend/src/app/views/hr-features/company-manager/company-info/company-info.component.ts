import { Component } from '@angular/core';
import { Company } from '../../../../models/company';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { CompanyService } from '../../../../services/company.service';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { CompanyMember } from '../../../../models/company_member';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { AvatarEditorComponent } from "../../../common/avatar-editor/avatar-editor.component";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-company-info',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ErrorDialogComponent,
    NotificationDialogComponent,
    LoadingComponent,
    AvatarEditorComponent
  ],
  templateUrl: './company-info.component.html',
  styleUrl: './company-info.component.css'
})
export class CompanyInfoComponent {
  companyForm: FormGroup;
  company: Company | null = null;
  member: CompanyMember | null = null;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  isLoading = false;
  showAvatarEditor = false;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private companymemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      address: [''],
      website: [''],
      taxCode: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      description: ['']
    });
  }

  ngOnInit() {
    this.companymemberService.getMe().subscribe(response => {
      if (response && response.data) {
        this.member = response.data as CompanyMember;
        this.companyService.getById(this.member.companyId).subscribe(res => {
          if (res && res.data) {
            this.company = res.data as Company;
            this.company.location = this.convertEnumService.mapLocationFromEnum(this.company.location);
            this.companyForm.patchValue({
              name: this.company.name,
              location: this.company.location,
              address: this.company.address,
              website: this.company.website,
              taxCode: this.company.taxCode,
              email: this.company.email,
              description: this.company.description
            });
          }
        });
      }
    });
  }

  saveCompanyInfo() {
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

    this.companyService.update(updatedCompany).subscribe({
      next: () => {
        this.isLoading = false;
        this.ngOnInit();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorTitle = 'Lỗi';
        this.errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin công ty.';
        this.showErrorDialog = true;
      }
    });
    this.isLoading = false;
  }

  openAvatarDialog() {
    this.showAvatarEditor = true;
  }

  async onAvatarSaved(file: File | null) {
    if (!file) return;
    this.isLoading = true;
    this.companyService.updateLogo(this.company!.id, file)
    .pipe(finalize(() => { this.isLoading = false; }))
    .subscribe(res => {
      if (res.status === 200) {
        this.showAvatarEditor = false;
        this.ngOnInit();
      } else {
        this.errorTitle = 'Lỗi';
        this.errorMessage = 'Cập nhật logo thất bại.';
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
    this.saveCompanyInfo();
  }

  openConfirm() {
    this.confirmTitle = 'Xác nhận';
    this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi?';
    this.showConfirmDialog = true;
  }
}
