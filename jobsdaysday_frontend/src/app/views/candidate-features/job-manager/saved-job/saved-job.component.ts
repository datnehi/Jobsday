import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { SavedJobService } from '../../../../services/saved-job.service';
import { User } from '../../../../models/user';
import { AuthService } from '../../../../services/auth.service';
import { ConvertEnumService } from '../../../../services/convert-enum.service';

@Component({
  selector: 'app-saved-job',
  imports: [
    DatePipe,
    CommonModule
  ],
  templateUrl: './saved-job.component.html',
  styleUrl: './saved-job.component.css'
})
export class SavedJobComponent {
  user: User | null = null;
  savedJobs: any[] = [];
  currentPage: number = 0;
  totalPages: number = 1;
  totalElements: number = 0;

  hoveredJobIndex: number | null = null;

  constructor(
    private savedJobService: SavedJobService,
    private authService: AuthService,
    private convertEnum: ConvertEnumService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.fetchSavedJobs();
      }
    });
  }

  fetchSavedJobs(page: number = 0) {
    const filters = {
      jobsPage: page,
    };
    this.savedJobService.getSavedJobs(filters).subscribe({
      next: (response) => {
        const jobsData = response.data;
        this.savedJobs = (jobsData.content || []).map((job: any) => ({
          ...job,
          location: this.convertEnum.mapLocationFromEnum(job.location),
          experience: this.convertEnum.mapExperienceFromEnum(job.experience),
          level: this.convertEnum.mapLevelFromEnum(job.level),
          salary: this.convertEnum.mapSalaryFromEnum(job.salary),
          contractType: this.convertEnum.mapContractTypeFromEnum(job.contractType),
          jobType: this.convertEnum.mapWorkTypeFromEnum(job.jobType)
        }));
        this.currentPage = jobsData.page;
        this.totalPages = jobsData.totalPages;
        this.totalElements = jobsData.totalElements;
      }
    });
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  onUnsaveClick(job: any) {
    if (!job?.id) return;

    this.savedJobService.unsaveJob(job.id).subscribe({
      next: () => {
        this.fetchSavedJobs(0);
      },
      error: () => {
        alert('Bỏ lưu tin thất bại!');
      }
    });
  }

  getPostedLabel(postedAt: string): string {
    if (!postedAt) return '';
    const postedDate = new Date(postedAt);
    const now = new Date();
    const diffMs = now.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Đăng hôm nay';
    if (diffDays < 7) return `Đăng ${diffDays} ngày trước`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `Đăng ${diffWeeks} tuần trước`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Đăng ${diffMonths} tháng trước`;
  }

  changePage(page: number) {
    this.fetchSavedJobs(page);
  }

  onLogoError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/logo1.png';
  }
}
