import { Component } from '@angular/core';
import { Company } from '../../../models/company';
import { CompanyService } from '../../../services/company.service';
import { JobService } from '../../../services/job.service';
import { Job } from '../../../models/job';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ConvertEnumService } from '../../../services/convert-enum.service';
import { JobSkillsService } from '../../../services/job-skills.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApplicationService } from '../../../services/application.service';
import { SavedJobService } from '../../../services/saved-job.service';
import { LoginDialogComponent } from '../../common/login-dialog/login-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { Cvs } from '../../../models/cvs';
import { CvsService } from '../../../services/cvs.service';

@Component({
  selector: 'app-job-detail',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    LoginDialogComponent
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

  constructor(
    private jobService: JobService,
    private companyService: CompanyService,
    private jobSkillsService: JobSkillsService, // Inject service
    private route: ActivatedRoute,
    public convertEnum: ConvertEnumService,
    private applicationService: ApplicationService,
    private savedJobService: SavedJobService,
    private authService: AuthService,
    private router: Router,
    private cvsService: CvsService
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
          // Lấy skill của job
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
                console.error('Failed to load company details');
              }
            });
            this.jobService.getSimilarJobsById(this.job.id, this.authService.currentUser?.id! || 0)
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
          console.error('Failed to load job details');
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
      // Giới hạn loại file
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ hỗ trợ file .pdf, .doc, .docx!');
        return;
      }
      // Giới hạn kích thước file (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File vượt quá kích thước 5MB!');
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

  // Hàm kiểm tra đăng nhập (ví dụ, thay bằng logic thực tế)
  isLoggedIn(): boolean {
    // Ví dụ: kiểm tra token hoặc trạng thái đăng nhập
    return !!localStorage.getItem('token');
  }

  // Khi ấn ứng tuyển/lưu tin
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
        // Hiển thị modal ứng tuyển sau khi đã có dữ liệu
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
        alert('Lưu tin thất bại!');
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
        alert('Bỏ lưu tin thất bại!');
      }
    });
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  onSubmitApplication() {
    if (!this.job?.id) {
      alert('Vui lòng chọn công việc để ứng tuyển!');
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
      alert('Bạn phải chọn CV có sẵn hoặc upload CV mới');
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
        alert('Nộp hồ sơ thất bại! ' + (err.error?.message || 'Vui lòng thử lại.'));
      }
    });
  }

  onViewCVClick() {
    if (this.application && this.application.id) {
      const url = `http://localhost:8080${this.application.cvUrl}`;
      if (this.application.fileName.toLowerCase().endsWith('.docx')) {
        this.applicationService.downloadCv(this.application.id).subscribe({
          next: (response) => {
            const blob = response.body!;
            const url = window.URL.createObjectURL(blob);

            // Lấy tên file từ header
            let fileName = 'cv.docx';
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition) {
              const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
              if (matches && matches[1]) {
                fileName = matches[1];
              }
            }

            // Tạo link ẩn để tải
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
          },
          error: () => {
            alert('Không tải được CV!');
          }
        });
        return;
      } else {
        window.open(url, '_blank');
      }
    } else {
      alert('Không tìm thấy CV đã nộp!');
    }
  }

  onViewCVuploaded(cvId: number) {
    if (!cvId) {
      alert('Không tìm thấy CV đã nộp!');
      return;
    }

    const cv = this.userCVs.find(item => item.id === cvId);

    // Nếu là file .docx thì ép tải xuống
    if (cv && cv.title && cv.title.toLowerCase().endsWith('.docx')) {
      this.cvsService.downloadCv(cvId).subscribe({
        next: (response) => {
          const blob = response.body!;
          const url = window.URL.createObjectURL(blob);

          // Lấy tên file từ header
          let fileName = 'cv.docx';
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
            const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
            if (matches && matches[1]) {
              fileName = matches[1];
            }
          }

          // Tạo link ẩn để tải
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          window.URL.revokeObjectURL(url);
        },
        error: () => {
          alert('Không tải được CV!');
        }
      });
      return;
    }

    // Các loại file khác thì mở trực tiếp
    this.cvsService.viewCv(cvId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Không tải được CV đã nộp!');
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

  onMessageClick() {
    // if (this.application && this.application.id) {
    //   this.router.navigate(['/chat'], { queryParams: { applicationId: this.application.id } });
    //   this.closeModalLogin();
    // }
  }
}
