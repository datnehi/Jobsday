import { Component } from '@angular/core';
import { Company } from '../../models/company';
import { CompanyService } from '../../services/company.service';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ConvertEnumService } from '../../services/convert-enum.service';
import { JobSkillsService } from '../../services/job-skills.service';
import { FormsModule, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../dto/registerRequest';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-job-detail',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css'
})
export class JobDetailComponent {
  company: Company | undefined;
  job: Job | undefined;
  skills: string[] = [];
  cvOption: string = 'uploaded';
  userCVs: string[] = ['Nguyen-Tien-Dat-CV.pdf', 'CV-2025.pdf'];
  selectedCV: string = '';
  relatedJobs: any[] = [];
  application: any;

  uploadedCVName: string = '';
  uploadedCVFile: File | undefined;
  coverLetter: string = '';

  isDragOver = false;
  loginTab: 'login' | 'register' = 'login';
  errorMessage: string | null = null;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    dob: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    confirmPassword: new FormControl('', Validators.required)
  });
  registerErrorMessage: string | null = null;

  today = new Date();
  emailToVerify: string = '';
  roleToVerify: string = '';
  registerStep: 'form' | 'verify' = 'form';

  verifyEmail: string = '';
  verifyCode: string = '';
  verifyErrorMessage: string | null = null;
  otpCountdown = 0;
  otpInterval: any;

  constructor(
    private jobService: JobService,
    private companyService: CompanyService,
    private jobSkillsService: JobSkillsService, // Inject service
    private route: ActivatedRoute,
    public convertEnum: ConvertEnumService,
    private authService: AuthService,
    private applicationService: ApplicationService,
    private router: Router,
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
            const filters = {
              keyword: this.job?.title,
              location: this.convertEnum.mapLocationToEnum(this.job?.location || ''),
              level: this.convertEnum.mapLevelToEnum(this.job?.level || '')
            };
            this.jobService.getSimilarJobsById(this.job.id, filters)
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

  openModalLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
    }
  }

  closeModalLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();
    }
  }

  // Khi ấn ứng tuyển/lưu tin
  onApplyClick() {
    if (!this.isLoggedIn()) {
      this.openModalLogin();
      return;
    }
    // Hiển thị modal ứng tuyển
    const modal = document.getElementById('applyModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
    }
  }

  onSaveClick() {
    if (!this.isLoggedIn()) {
      this.openModalLogin();
      return;
    }
    // Xử lý lưu tin
  }

  showLoginTab() {
    this.loginTab = 'login';
  }

  showRegisterTab() {
    this.loginTab = 'register';
  }

  // Khi submit:
  onLoginSubmit() {
    if (this.loginForm.valid) {
      const loginData = {
        email: this.loginForm.value.email ?? '',
        password: this.loginForm.value.password ?? ''
      };
      this.authService.login(loginData)
        .subscribe({
          next: () => {
            this.authService.currentUser$.subscribe(user => {
              if (user) {
                if (user.role === 'HR') {
                  this.router.navigate(['/company/dashboard']);
                  return;
                } else if (user.role === 'ADMIN') {
                  this.router.navigate(['/admin/dashboard']);
                  return;
                } else {
                  this.closeModalLogin();
                  this.errorMessage = null;
                  this.router.navigate(['/job/' + this.route.snapshot.params['id']]);
                }
              } else {
                this.authService.logout();
                this.errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
              }
            });
          },
          error: (err) => {
            this.errorMessage = err.error.error || 'Đăng nhập thất bại';
          }
        });
    }
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      const { confirmPassword, ...formValue } = this.registerForm.value;
      if ((formValue.password ?? '') !== (confirmPassword ?? '')) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
      }

      const payload: RegisterRequest = {
        fullName: formValue.fullName ?? '',
        email: formValue.email ?? '',
        phone: formValue.phone ?? '',
        dob: formValue.dob ?? '',
        password: formValue.password ?? '',
        role: 'CANDIDATE',
        avatarUrl: undefined
      };

      this.authService.register(payload).subscribe({
        next: () => {
          this.emailToVerify = payload.email;
          this.roleToVerify = payload.role;
          this.registerStep = 'verify';
        },
        error: (err) => {
          this.registerErrorMessage = err.error.message || 'Đăng ký thất bại';
        }
      });
    }
  }

  onVerifyEmail() {
    if (this.verifyCode.trim() && this.emailToVerify) {
      const otpPayload: any = {
        email: this.emailToVerify,
        otp: this.verifyCode.trim()
      };

      this.authService.verifyOtp(otpPayload).subscribe({
        next: () => {
          const loginData = {
            email: this.emailToVerify || '',
            password: this.registerForm.value.password || ''
          };
          this.authService.login(loginData).subscribe({
            next: () => {
              this.closeModalLogin();
              this.verifyErrorMessage = null;
              this.router.navigate(['/job/' + this.route.snapshot.params['id']]);
            },
            error: (err) => {
              this.verifyErrorMessage = err.error.message || 'Đăng nhập thất bại.';
            }
          });
        },
        error: (err) => {
          this.verifyErrorMessage = err.error.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
        }
      });
    }
  }

  resendOtp() {
    this.authService.resendOtp({ email: this.emailToVerify }).subscribe({
      next: () => {
        this.verifyErrorMessage = 'Mã OTP mới đã được gửi đến email của bạn!';
      },
      error: () => {
        this.verifyErrorMessage = 'Gửi lại mã OTP thất bại!';
      }
    });
    this.otpCountdown = 120;
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.otpInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
      } else {
        clearInterval(this.otpInterval);

      }
    }, 1000);
  }

  openJobDetail(jobId: string) {
    window.open(`/job/${jobId}`, '_blank');
  }

  onSubmitApplication() {
    if (!this.job?.id || !this.uploadedCVFile) {
      alert('Vui lòng chọn CV để ứng tuyển!');
      return;
    }

    const formData = new FormData();
    formData.append('jobId', this.job.id.toString());
    formData.append('cvFile', this.uploadedCVFile);
    formData.append('coverLetter', this.coverLetter || '');

    this.applicationService.apply(formData).subscribe({
      next: (res) => {
        this.router.navigate(['/apply-success/' + this.route.snapshot.params['id']]);
      },
      error: (err) => {
        alert('Nộp hồ sơ thất bại! ' + (err.error?.message || 'Vui lòng thử lại.'));
      }
    });
  }

  onViewCVClick() {
    if (this.application && this.application.id) {
      const rawUrl = `/api/applications/${this.application.id}/cv`;
      fetch(rawUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.application.fileName || 'cv.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        });
    } else {
      alert('Không tìm thấy CV đã nộp!');
    }
  }

  onMessageClick() {
    // if (this.application && this.application.id) {
    //   this.router.navigate(['/chat'], { queryParams: { applicationId: this.application.id } });
    //   this.closeModalLogin();
    // }
  }
}
