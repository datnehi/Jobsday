import { CompanySkillsService } from './../../../../services/company-skills.service';
import { Component } from '@angular/core';
import { Company } from '../../../../models/company';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { CompanyService } from '../../../../services/company.service';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { CompanyMember } from '../../../../models/company_member';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { AvatarEditorComponent } from "../../../common/avatar-editor/avatar-editor.component";
import { finalize } from 'rxjs';
import { Skills } from '../../../../models/skills';
import { SkillsService } from '../../../../services/skills.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-company-info',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ErrorDialogComponent,
    NotificationDialogComponent,
    LoadingComponent,
    AvatarEditorComponent,
    FormsModule,
    NgSelectModule
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
  skillsList: Skills[] = [];
  selectedSkills: number[] = [];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private companymemberService: CompanyMemberService,
    private convertEnumService: ConvertEnumService,
    private skillsService: SkillsService,
    private companySkillsService: CompanySkillsService
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      address: [''],
      website: [''],
      taxCode: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      skills: [[]]
    });
  }

  ngOnInit() {
    this.companyForm.get('skills')?.valueChanges.subscribe((vals: number[] | null) => {
      this.selectedSkills = vals || [];
    });

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
            this.companySkillsService.getSkillsByCompanyId(this.company!.id).subscribe(res => {
              if (res && res.data) {
                this.selectedSkills = res.data.map((skill: Skills) => skill.id);
                this.companyForm.get('skills')?.setValue([...this.selectedSkills]);
              }
            });
          }
        });
        this.skillsService.getAllSkills().subscribe(response => {
          if (response.data) {
            this.skillsList = response.data;
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

    this.companyService.update(updatedCompany)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.companySkillsService.updateSkillsForCompany(this.company!.id, this.selectedSkills).subscribe(
            (res) => {
              if (res.status == 200) {
                this.ngOnInit();
              } else {
                this.errorTitle = 'Lỗi';
                this.errorMessage = 'Đã xảy ra lỗi khi cập nhật kỹ năng công ty.';
                this.showErrorDialog = true;
              }
            }
          );
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin công ty.';
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

  onSkillChange(skillId: number, checked: boolean) {
    if (checked) {
      if (!this.selectedSkills.includes(skillId)) {
        this.selectedSkills.push(skillId);
      }
    } else {
      const idx = this.selectedSkills.indexOf(skillId);
      if (idx > -1) {
        this.selectedSkills.splice(idx, 1);
      }
    }
    this.companyForm.get('skills')?.setValue([...this.selectedSkills], { emitEvent: false });
    this.companyForm.get('skills')?.markAsDirty();
  }
}
