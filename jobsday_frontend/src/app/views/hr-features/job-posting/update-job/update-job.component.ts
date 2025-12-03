import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { JobService } from '../../../../services/job.service';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { Job } from '../../../../models/job';
import { CompanyMember } from '../../../../models/company_member';
import { JobSkillsService } from '../../../../services/job-skills.service';
import { CommonModule } from '@angular/common';
import { SkillsService } from '../../../../services/skills.service';
import { Skills } from '../../../../models/skills';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationDialogComponent } from '../../../common/notification-dialog/notification-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";

@Component({
  selector: 'app-update-job',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgSelectModule,
    NotificationDialogComponent,
    ErrorDialogComponent
],
  templateUrl: './update-job.component.html',
  styleUrls: ['./update-job.component.css']
})
export class UpdateJobComponent implements OnInit {
  jobForm!: FormGroup;
  job: Job | null = null;
  member: CompanyMember | null = null;
  members: any[] = [];
  skillsList: Skills[] = [];
  selectedSkills: number[] = [];

  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'save' | 'cancel' | null = null;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private companyMemberService: CompanyMemberService,
    private jobSkillsService: JobSkillsService,
    private skillsService: SkillsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const jobId = Number(this.route.snapshot.paramMap.get('id'));
    const futureDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return { invalidDate: true };
      if (d.getTime() <= Date.now()) return { pastOrToday: true };
      return null;
    };
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      memberName: ['', Validators.required],
      location: ['', Validators.required],
      address: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      deadline: ['', [Validators.required, futureDateValidator]],
      salary: ['', Validators.required],
      experience: ['', Validators.required],
      level: ['', Validators.required],
      jobType: ['', Validators.required],
      contractType: ['', Validators.required],
      workingTime: ['', Validators.required],
      skills: [[]],
      description: ['', Validators.required],
      requirement: ['', Validators.required],
      benefit: ['', Validators.required],
      status: ['', Validators.required]
    });

    this.jobService.getJobById(jobId).subscribe(response => {
      if (response.data) {
        this.job = response.data;
        this.populateForm(this.job);
        if (this.job) {
          this.jobSkillsService.getSkillsByJobId(this.job.id!).subscribe(skillsResponse => {
            if (skillsResponse.data) {
              this.selectedSkills = skillsResponse.data.map((skill: any) => skill.id);
              this.jobForm.patchValue({ skills: this.selectedSkills });
            }
          });
          this.companyMemberService.getMemberOfCompany(this.job.companyId).subscribe(membersResponse => {
            if (membersResponse.data) {
              this.members = membersResponse.data;
              const jobMember = this.members.find((m: any) => m.id === this.job?.memberId);
              if (jobMember) {
                this.jobForm.patchValue({ memberName: jobMember.id });
              }
            }
          });
        }
        this.companyMemberService.getMe().subscribe(response => {
          if (response.data) {
            this.member = response.data;
            if (this.member && !this.member.isAdmin) {
              this.jobForm.get('memberName')?.disable();
            }
            this.jobForm.patchValue({ memberName: this.member?.id });
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

  private populateForm(job: any): void {
    if (job) {
      this.jobForm.patchValue({
        title: job.title,
        location: job.location,
        address: job.address,
        quantity: job.quantity,
        deadline: job.deadline,
        salary: job.salary,
        experience: job.experience,
        level: job.level,
        jobType: job.jobType,
        contractType: job.contractType,
        workingTime: job.workingTime,
        skills: job.skills,
        description: job.description,
        requirement: job.requirement,
        benefit: job.benefit,
        status: job.status
      });
    };
  }

  onSubmit(): void {
    if (this.jobForm.valid) {
      const formValues = this.jobForm.getRawValue();
      const updatedJob: Job = {
        id: this.job ? this.job.id : 0,
        companyId: this.job ? this.job.companyId : 0,
        memberId: formValues.memberName,
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
        status: formValues.status,
      };
      this.jobService.updateJob(updatedJob.id!, updatedJob).subscribe(response => {
        if (response.data) {
          const skillsToUpdate = formValues.skills;
          this.jobSkillsService.updateSkillsForJob(updatedJob.id!, skillsToUpdate).subscribe(skillsResponse => {
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
