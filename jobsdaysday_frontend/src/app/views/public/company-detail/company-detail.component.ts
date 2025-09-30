import { Job } from '../../../models/job';
import { Component } from '@angular/core';
import { Company } from '../../../models/company';
import { CompanyService } from '../../../services/company.service';
import { ActivatedRoute } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConvertEnumService } from '../../../services/convert-enum.service';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth.service';
import { SavedJobService } from '../../../services/saved-job.service';
import { LoginDialogComponent } from '../../common/login-dialog/login-dialog.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-company-detail',
  imports: [
    CommonModule,
    FormsModule,
    LoginDialogComponent,
  ],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.css'
})
export class CompanyDetailComponent {

  company: Company | null = null;
  jobs: any[] = [];
  user: User | null = null;

  searchText: string = '';
  pendingSearchText: string = '';
  currentPage: number = 0;
  totalPages: number = 1;

  hoveredJobIndex: number | null = null;
  showLoginDialog = false;
  mapUrl?: SafeResourceUrl;

  showFullDescription = false;

  constructor(
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private jobService: JobService,
    private convertEnum: ConvertEnumService,
    private authService: AuthService,
    private savedJobService: SavedJobService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.companyService.getById(this.route.snapshot.params['id']).subscribe({
        next: (res: any) => {
          this.company = res.data;
          this.searchJobs();
          if (this.company?.address) {
            this.updateMapUrl(this.company.address);
          }
        }
      });
    });
  }

  searchJobs(jobsPage: number = 0) {
    const filters = {
      companyId: this.route.snapshot.params['id'],
      keyword: this.searchText,
      userId: this.user?.id,
      jobsPage
    };

    this.jobService.getJobsByCompanyId(filters).subscribe({
      next: (res: any) => {
        const jobsData = res.data;
        this.jobs = (jobsData.content || []).map((job: any) => ({
          ...job,
          location: this.convertEnum.mapLocationFromEnum(job.location)
        }));
        this.currentPage = jobsData.page;
        this.totalPages = jobsData.totalPages;
        this.pendingSearchText = this.searchText;
      },
      error: (err) => {
        console.error('Search jobs error', err);
      }
    });
  }

  changePage(page: number) {
    // Nếu text đang nhập khác text đã search, về trang đầu với text mới
    if (this.pendingSearchText !== this.searchText) {
      this.searchJobs(0);
    } else if (page >= 0 && page < this.totalPages) {
      this.searchJobs(page);
    }
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  onSaveClick(job: any) {
    if (!this.user) {
      this.showLoginDialog = true;
      return;
    }
    if (!job?.id) return;

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
    if (!this.user) {
      this.showLoginDialog = true;
      return;
    }
    if (!job?.id) return;

    this.savedJobService.unsaveJob(job.id).subscribe({
      next: () => {
        job.saved = false;
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

  encodeAddress(address: string): string {
    return encodeURIComponent(address);
  }

  updateMapUrl(address: string) {
    const rawUrl = `https://www.google.com/maps?q=${this.encodeAddress(address)}&output=embed`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  copyCompanyLink() {
    const input: HTMLInputElement | null = document.getElementById('companyShareLink') as HTMLInputElement;
    if (input) {
      input.select();
      document.execCommand('copy');
    }
  }

  get isLongDescription(): boolean {
    return (this.company?.description?.length || 0) > 300;
  }

  get shortDescription(): string | undefined {
    if (this.isLongDescription && !this.showFullDescription) {
      return this.company?.description?.slice(0, 300) + '...';
    }
    return this.company?.description;
  }
}
