import { AuthService } from './../../../services/auth.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  step: 'email' | 'verifyReset' = 'email';
  loading = false;
  message = '';
  error = '';
  formEmail!: FormGroup;
  formVerifyReset!: FormGroup;
  resendSeconds = 0;
  private timerSub: Subscription | null = null;
  private emailSentTo: string = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.formEmail = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.formVerifyReset = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      password: [
        '', [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/)
        ]
      ],
      confirm: ['', [Validators.required]]
    }, { validators: this.matchPassword });
  }
  ngOnDestroy(): void {
    this.stopTimer();
  }

  private matchPassword(group: any) {
    return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
  }

  sendEmail() {
    if (this.formEmail.invalid) return;
    this.loading = true;
    this.error = '';
    this.message = '';
    const email = String(this.formEmail.get('email')?.value || '');
    this.authService.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.loading = false;
        this.emailSentTo = email;
        this.step = 'verifyReset';
        this.startResendTimer(60);
        this.message = res?.message || 'Mã OTP đã được gửi tới email.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Gửi email thất bại. Vui lòng thử lại.';
      }
    });
  }

  submitVerifyReset() {
    if (this.formVerifyReset.invalid) return;
    this.loading = true;
    this.error = '';
    const payload = {
      email: this.emailSentTo,
      otp: String(this.formVerifyReset.get('otp')?.value || ''),
      newPassword: String(this.formVerifyReset.get('password')?.value || '')
    };
    this.authService.verifyForgotPasswordOtp(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res?.message || 'Đổi mật khẩu thành công.';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Xác thực/Đổi mật khẩu thất bại.';
      }
    });
  }

  resendOtp() {
    if (this.resendSeconds > 0 || !this.emailSentTo) return;
    this.loading = true;
    this.error = '';
    this.authService.resendOtp({ email: this.emailSentTo }).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res?.message || 'Đã gửi lại mã OTP.';
        this.startResendTimer(60);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Gửi lại OTP thất bại.';
      }
    });
  }

  startResendTimer(seconds: number) {
    this.resendSeconds = seconds;
    this.stopTimer();
    this.timerSub = interval(1000).subscribe(() => {
      this.resendSeconds--;
      if (this.resendSeconds <= 0) this.stopTimer();
    });
  }

  stopTimer() {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = null;
    }
    if (this.resendSeconds <= 0) this.resendSeconds = 0;
  }

  canSubmitEmail() { return this.formEmail.valid && !this.loading; }
  canVerifyReset() { return this.formVerifyReset.valid && !this.loading; }
  displayTime() {
    const s = this.resendSeconds;
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
}
