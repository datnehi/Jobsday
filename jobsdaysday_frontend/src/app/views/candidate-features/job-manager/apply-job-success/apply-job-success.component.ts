import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoginDialogComponent } from '../../../common/login-dialog/login-dialog.component';
import { User } from '../../../../models/user';
import { JobService } from '../../../../services/job.service';
import { AuthService } from '../../../../services/auth.service';
import { ConvertEnumService } from '../../../../services/convert-enum.service';
import { SavedJobService } from '../../../../services/saved-job.service';
import { Job } from '../../../../models/job';

@Component({
  selector: 'app-apply-job-success',
  imports: [
    CommonModule,
    LoginDialogComponent,
    RouterModule
  ],
  templateUrl: './apply-job-success.component.html',
  styleUrl: './apply-job-success.component.css'
})
export class ApplyJobSuccessComponent {
  similarJobs: any[] = [];
  showLoginDialog = false;
  user: User | null = null;

  constructor(
    private jobService: JobService,
    private authService: AuthService,
    private convertEnum: ConvertEnumService,
    private savedJobService: SavedJobService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const jobId = this.route.snapshot.params['id'];
    this.authService.currentUser$.subscribe(() => {
      this.jobService.getSimilarJobsById(jobId, this.authService.currentUser?.id! || 0)
        .subscribe(res => {
          this.similarJobs = res.data?.filter((j: Job) => j.id !== jobId).map((job: any) => ({
            ...job,
            location: this.convertEnum.mapLocationFromEnum(job.location),
            experience: this.convertEnum.mapExperienceFromEnum(job.experience),
            level: this.convertEnum.mapLevelFromEnum(job.level),
            salary: this.convertEnum.mapSalaryFromEnum(job.salary),
            contractType: this.convertEnum.mapContractTypeFromEnum(job.contractType),
            jobType: this.convertEnum.mapWorkTypeFromEnum(job.jobType)
          })) || [];
        });
    });
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  onSaveClick(job: any) {
    if (this.authService.currentUser == null) {
      this.showLoginDialog = true;
      return;
    }
    if (!job) return;

    this.savedJobService.saveJob(job.id).subscribe({
      next: () => {
        job.saved = true;
      },
      error: () => {
        alert('Lưu tin thất bại!');
      }
    });
  }

  onUnsaveClick(job: any) {
    if (this.authService.currentUser == null) {
      this.showLoginDialog = true;
      return;
    }

    if (!job) return;

    this.savedJobService.unsaveJob(job.id).subscribe({
      next: () => {
        job.saved = false;
      },
      error: () => {
        alert('Bỏ lưu tin thất bại!');
      }
    });
  }
}
