import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationDialogComponent } from '../../../common/notification-dialog/notification-dialog.component';
import { Skills } from '../../../../models/skills';
import { JobService } from '../../../../services/job.service';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { JobSkillsService } from '../../../../services/job-skills.service';
import { SkillsService } from '../../../../services/skills.service';
import { Router } from '@angular/router';
import { CompanyMember } from '../../../../models/company_member';
import { Job } from '../../../../models/job';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";

@Component({
  selector: 'app-create-job',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgSelectModule,
    NotificationDialogComponent,
    ErrorDialogComponent
],
  templateUrl: './create-job.component.html',
  styleUrl: './create-job.component.css'
})
export class CreateJobComponent {
  jobForm!: FormGroup;
  members: any[] = [];
  member: CompanyMember | null = null;
  skillsList: Skills[] = [];
  selectedSkills: number[] = [];

  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'save' | 'cancel' | null = null;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private companyMemberService: CompanyMemberService,
    private skillsService: SkillsService,
    private jobSkills: JobSkillsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      location: ['', Validators.required],
      address: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      deadline: ['', Validators.required],
      salary: ['', Validators.required],
      experience: ['', Validators.required],
      level: ['', Validators.required],
      jobType: ['', Validators.required],
      contractType: ['', Validators.required],
      workingTime: ['', Validators.required],
      skills: [[]],
      description: ['', Validators.required],
      requirement: ['', Validators.required],
      benefit: ['', Validators.required]
    });
    this.companyMemberService.getMe().subscribe(response => {
      if (response.data) {
        this.member = response.data;
      }
    });
    this.skillsService.getAllSkills().subscribe(response => {
      if (response.data) {
        this.skillsList = response.data;
      }
    });
  }

  onSubmit(): void {
    if (this.jobForm.valid) {
      const formValues = this.jobForm.getRawValue();
      const updatedJob: Job = {
        companyId: this.member ? this.member.companyId : 0,
        memberId: this.member ? this.member.id! : 0,
        title: formValues.title,
        location: formValues.location,
        address: formValues.address,
        quantity: formValues.quantity,
        deadline: formValues.deadline,
        salary: formValues.salary,
        experience: formValues.experience,
        level: formValues.level,
        jobType: formValues.jobType,
        contractType: formValues.contractType,
        workingTime: formValues.workingTime,
        description: formValues.description,
        requirement: formValues.requirement,
        benefit: formValues.benefit,
        status: "ACTIVE"
      };
      this.jobService.createJob(updatedJob).subscribe(response => {
        if (response.data) {
          const skillsToUpdate = formValues.skills;
          this.jobSkills.updateSkillsForJob(response.data.id, skillsToUpdate).subscribe(skillsResponse => {
            if (skillsResponse.status === 200) {
              this.router.navigate([`quan-ly-job`]);
            } else {
              this.showErrorDialog = true;
              this.errorTitle = 'Cập nhật job thất bại!';
              this.errorMessage = 'Đã xảy ra lỗi khi cập nhật job. Vui lòng thử lại sau.';
            }
          });
        } else {
          this.showErrorDialog = true;
          this.errorTitle = 'Cập nhật job thất bại!';
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật job. Vui lòng thử lại sau.';
        }
      });
    }
  }

  onCancel(): void {
    this.ngOnInit();
  }

  onSkillChange(skillId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedSkills.includes(skillId)) {
        this.selectedSkills.push(skillId);
      }
    } else {
      const idx = this.selectedSkills.indexOf(skillId);
      if (idx > -1) {
        this.selectedSkills.splice(idx, 1);
      }
    }
    this.jobForm.get('skills')?.setValue([...this.selectedSkills]);
    this.jobForm.get('skills')?.markAsDirty();
  }

  openConfirm(action: 'save' | 'cancel') {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    this.confirmMessage = action === 'save'
      ? 'Bạn có chắc chắn muốn lưu thay đổi?'
      : 'Bạn có chắc chắn muốn hủy chỉnh sửa?';
    this.showConfirmDialog = true;
  }

  handleConfirm() {
    this.showConfirmDialog = false;
    if (this.confirmAction === 'save') {
      this.onSubmit();
    } else if (this.confirmAction === 'cancel') {
      this.onCancel();
    }
  }

  handleCancel() {
    this.showConfirmDialog = false;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }
}
