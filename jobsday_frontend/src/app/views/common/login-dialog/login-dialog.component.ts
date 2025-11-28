import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterRequest } from '../../../dto/registerRequest';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.css'
})
export class LoginDialogComponent implements OnChanges {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

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

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show'] && this.show) {
      const modal = document.getElementById('loginModal');
      if (modal) {
        (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
        modal.addEventListener('hidden.bs.modal', () => {
          this.close.emit();
        }, { once: true });
      }
    }
  }

  switchTab(tab: 'login' | 'register') {
    this.loginTab = tab;
    this.errorMessage = null;
    this.registerErrorMessage = null;
    this.verifyErrorMessage = null;
    this.registerStep = 'form';
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      const { confirmPassword, ...formValue } = this.registerForm.value;
      if ((formValue.password ?? '') !== (confirmPassword ?? '')) {
        this.registerErrorMessage = 'Mật khẩu xác nhận không khớp.';
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

  closeModalLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();
    }
    this.close.emit();
  }

  showLoginTab() {
    this.loginTab = 'login';
  }

  showRegisterTab() {
    this.loginTab = 'register';
  }

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
                  this.router.navigate(['/analytics-hr']);
                  return;
                } else if (user.role === 'ADMIN') {
                  this.router.navigate(['/analytics']);
                  return;
                } else {
                  this.closeModalLogin();
                  this.errorMessage = null;
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
}
