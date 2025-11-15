import { Component } from '@angular/core';
import { Company } from '../../../models/company';
import { CompanyService } from '../../../services/company.service';
import { JobService } from '../../../services/job.service';
import { Job } from '../../../models/job';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ConvertEnumService } from '../../../services/common/convert-enum.service';
import { JobSkillsService } from '../../../services/job-skills.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApplicationService } from '../../../services/application.service';
import { SavedJobService } from '../../../services/saved-job.service';
import { LoginDialogComponent } from '../../common/login-dialog/login-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { Cvs } from '../../../models/cvs';
import { CvsService } from '../../../services/cvs.service';
import { ErrorDialogComponent } from "../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from '../../common/loading/loading.component';
import { ConversationService } from '../../../services/conversation.service';

@Component({
  selector: 'app-job-detail',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    LoginDialogComponent,
    ErrorDialogComponent,
    LoadingComponent
  ],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css'
})
export class JobDetailComponent {
  company: Company | undefined;
  job: Job | undefined;
  skills: string[] = [];
  cvOption: string = 'uploaded';
  userCVs: Cvs[] = [];
  selectedCV: string = '';
  relatedJobs: any[] = [];
  application: any;
  savedJob: boolean = false;
  uploadedCVName: string = '';
  uploadedCVFile: File | undefined;
  coverLetter: string = '';
  isDragOver = false;
  showLoginDialog = false;
  hoveredJobIndex: number | null = null;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  isLoading: boolean = false;

  constructor(
    private jobService: JobService,
    private companyService: CompanyService,
    private jobSkillsService: JobSkillsService,
    private route: ActivatedRoute,
    public convertEnum: ConvertEnumService,
    private applicationService: ApplicationService,
    private savedJobService: SavedJobService,
    private authService: AuthService,
    private router: Router,
    private cvsService: CvsService,
    private conversationService: ConversationService,
  ) { }

  ngOnInit() {
    const jobId = this.route.snapshot.params['id'];
    if (jobId) {
      this.jobService.getJobById(jobId).subscribe(response => {
        if (response.data) {
          this.job = {
            ...response.data,
            location: this.convertEnum.mapLocationFromEnum(response.data.location),
            experience: this.convertEnum.mapExperienceFromEnum(response.data.experience),
            level: this.convertEnum.mapLevelFromEnum(response.data.level),
            salary: this.convertEnum.mapSalaryFromEnum(response.data.salary),
            contractType: this.convertEnum.mapContractTypeFromEnum(response.data.contractType),
            jobType: this.convertEnum.mapWorkTypeFromEnum(response.data.jobType)
          };
          this.jobSkillsService.getSkillsByJobId(jobId).subscribe(skillsResponse => {
            if (skillsResponse.data) {
              this.skills = skillsResponse.data.map((s: any) => s.name);
            } else {
              this.skills = [];
            }
          });
          if (this.job) {
            this.companyService.getById(this.job.companyId).subscribe(companyResponse => {
              if (companyResponse.data) {
                this.company = {
                  ...companyResponse.data,
                  location: this.convertEnum.mapLocationFromEnum(companyResponse.data.location)
                } as Company;
              } else {
                this.showErrorDialog = true;
                this.errorTitle = 'Lỗi tải công ty';
                this.errorMessage = 'Không thể tải thông tin công ty. Vui lòng thử lại sau.';
              }
            });
            this.jobService.getSimilarJobsById(this.job.id!, this.authService.currentUser?.id! || 0)
              .subscribe(res => {
                this.relatedJobs = res.data?.filter((j: Job) => j.id !== this.job?.id).map((job: any) => ({
                  ...job,
                  location: this.convertEnum.mapLocationFromEnum(job.location),
                  experience: this.convertEnum.mapExperienceFromEnum(job.experience),
                  level: this.convertEnum.mapLevelFromEnum(job.level),
                  salary: this.convertEnum.mapSalaryFromEnum(job.salary),
                  contractType: this.convertEnum.mapContractTypeFromEnum(job.contractType),
                  jobType: this.convertEnum.mapWorkTypeFromEnum(job.jobType)
                })) || [];
              });
          }
        } else {
          this.showErrorDialog = true;
          this.errorTitle = 'Lỗi tải việc làm';
          this.errorMessage = 'Không thể tải thông tin việc làm. Vui lòng thử lại sau.';
        }
      });

      this.applicationService.checkApplied(jobId).subscribe(res => {
        if (res.data) {
          this.application = res.data;
        }
      });
      this.savedJobService.getSavedJob(jobId).subscribe(res => {
        if (res.data) {
          this.savedJob = res.data;
        }
      });
    }
  }

  onCVFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.showErrorDialog = true;
        this.errorTitle = 'Loại file không hợp lệ!';
        this.errorMessage = 'Chỉ hỗ trợ file .pdf, .doc, .docx!';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showErrorDialog = true;
        this.errorTitle = 'Kích thước file không hợp lệ!';
        this.errorMessage = 'Chỉ hỗ trợ file có kích thước tối đa 5MB!';
        return;
      }
      this.uploadedCVName = file.name;
      this.uploadedCVFile = file;
    }
  }

  removeUploadedCV() {
    this.uploadedCVName = '';
    this.uploadedCVFile = undefined;
  }

  triggerCVUpload() {
    const input = document.querySelector('input[type="file"]') as HTMLElement;
    if (input) input.click();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onCVFileChange({ target: { files } });
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  onApplyClick() {
    if (!this.isLoggedIn()) {
      this.showLoginDialog = true;
      return;
    }
    this.cvsService.getUserCVs().subscribe({
      next: (res) => {
        if (res.data) {
          this.userCVs = res.data;
        }
        const modal = document.getElementById('applyModal');
        if (modal) {
          (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
        }
      }
    });
  }

  onSaveClick(job: any) {
    if (!this.isLoggedIn()) {
      this.showLoginDialog = true;
      return;
    }
    if (!job) return;

    this.savedJobService.saveJob(job.id).subscribe({
      next: () => {
        if (job.id === this.job?.id) {
          this.savedJob = true;
        } else {
          job.saved = true;
        }
      },
      error: () => {
        this.showErrorDialog = true;
        this.errorTitle = 'Lưu tin thất bại!';
        this.errorMessage = 'Đã xảy ra lỗi khi lưu tin. Vui lòng thử lại sau.';
      }
    });
  }

  onUnsaveClick(job: any) {
    if (!this.isLoggedIn()) {
      this.showLoginDialog = true;
      return;
    }

    if (!job) return;

    this.savedJobService.unsaveJob(job.id).subscribe({
      next: () => {
        if (job.id === this.job?.id) {
          this.savedJob = false;
        } else {
          job.saved = false;
        }
      },
      error: () => {
        this.showErrorDialog = true;
        this.errorTitle = 'Bỏ lưu tin thất bại!';
        this.errorMessage = 'Đã xảy ra lỗi khi bỏ lưu tin. Vui lòng thử lại sau.';
      }
    });
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  onSubmitApplication() {
    if (!this.job?.id) {
      this.showErrorDialog = true;
      this.errorTitle = 'Chưa chọn công việc';
      this.errorMessage = 'Vui lòng chọn công việc để ứng tuyển!';
      return;
    }

    const formData = new FormData();
    formData.append('jobId', this.job.id.toString());
    formData.append('coverLetter', this.coverLetter || '');

    if (this.cvOption === 'uploadNew' && this.uploadedCVFile) {
      formData.append('cvFile', this.uploadedCVFile);
    } else if (this.cvOption === 'uploaded' && this.selectedCV) {
      formData.append('cvId', this.selectedCV);
    } else {
      this.showErrorDialog = true;
      this.errorTitle = 'Chưa chọn CV';
      this.errorMessage = 'Bạn phải chọn CV có sẵn hoặc upload CV mới';
      return;
    }

    this.applicationService.apply(formData).subscribe({
      next: (res) => {
        const modal = document.getElementById('applyModal');
        if (modal) {
          (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();
        }
        this.router.navigate(['/apply-success/' + this.route.snapshot.params['id']]);
      },
      error: (err) => {
        this.showErrorDialog = true;
        this.errorTitle = 'Nộp hồ sơ thất bại!';
        this.errorMessage = 'Đã xảy ra lỗi khi nộp hồ sơ. Vui lòng thử lại sau.';
      }
    });
  }

  onViewCVClick() {
    if (this.application && this.application.id) {
      this.isLoading = true;

      this.applicationService.downloadCv(this.application.id).subscribe(response => {
        const blob = response.body!;
        const url = window.URL.createObjectURL(blob);

        const contentType = response.headers.get('Content-Type');
        let fileName = 'cv';
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
          if (matches && matches[1]) {
            fileName = decodeURIComponent(matches[1]);
          }
        }

        if (contentType?.includes('pdf')) {
          const pdfWindow = window.open(url, '_blank');
          if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
            this.showErrorDialog = true;
            this.errorTitle = 'Lỗi xem CV';
            this.errorMessage = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.';
            this.isLoading = false;
            return;
          }
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          window.URL.revokeObjectURL(url);
        }
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
        this.showErrorDialog = true;
        this.errorTitle = 'Lỗi tải CV';
        this.errorMessage = 'Đã xảy ra lỗi khi tải CV. Vui lòng thử lại sau.';
      });
    } else {
      this.showErrorDialog = true;
      this.errorTitle = 'Không tìm thấy CV đã nộp!';
      this.errorMessage = 'Vui lòng kiểm tra lại thông tin.';
    }
  }

  onViewCVuploaded(cvId: number) {
    if (!cvId) {
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Không tìm thấy CV đã nộp!';
      return;
    }
    this.isLoading = true;
    this.cvsService.downloadCv(cvId).subscribe(response => {
      const blob = response.body!;
      const url = window.URL.createObjectURL(blob);

      const contentType = response.headers.get('Content-Type');
      let fileName = 'cv';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = decodeURIComponent(matches[1]);
        }
      }

      if (contentType?.includes('pdf')) {
        const pdfWindow = window.open(url, '_blank');
        if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
          this.showErrorDialog = true;
          this.errorTitle = 'Lỗi xem CV';
          this.errorMessage = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.';
          this.isLoading = false;
          return;
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
      }
      this.isLoading = false;
    }, () => {
      this.isLoading = false;
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.';
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

  onMessageClick() {
    if (!this.isLoggedIn()) {
      this.showLoginDialog = true;
      return;
    }
    if (this.authService.currentUser?.id && this.company?.id) {
      this.conversationService.createByCandidateAndCompany(
        this.authService.currentUser?.id,
        this.company?.id!
      ).subscribe((res) => {
        if (!res.data) {
          this.errorTitle = 'Lỗi tạo cuộc trò chuyện';
          this.errorMessage = 'Không thể tạo hoặc mở cuộc trò chuyện vào lúc này. Vui lòng thử lại sau.';
          this.showErrorDialog = true;
          return;
        }
        window.open(`/chat?conversationId=${res.data.conversationId}`, '_blank');
      });
    }
  }

  get isExpired(): boolean {
    if (!this.job) return false;
    else if (this.job?.deadline && new Date(this.job.deadline) < new Date()) {
      return true;
    }
    return false;
  }

  handleCancel() {
    this.showErrorDialog = false;
  }
}
