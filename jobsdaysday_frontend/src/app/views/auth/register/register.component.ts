import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CompanyService } from '../../../services/company.service';
import { RegisterRequest } from '../../../dto/registerRequest';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  otpForm: FormGroup;
  step: 'REGISTER' | 'VERIFY' = 'REGISTER';
  emailToVerify: string = '';
  roleToVerify: string = '';
  message: string | null = null;
  companyDataToVerify: any = null;

  companyExists: boolean | null = null;
  companyInfo: any = null;

  today: string = new Date().toISOString().split('T')[0];
  otpCountdown = 0;
  otpInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService
  ) {
    this.registerForm = this.fb.group({
      role: ['CANDIDATE', Validators.required],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dob: [''],
      password: [
        '', [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/)
        ]
      ],
      confirmPassword: ['', Validators.required],
      companyCode: [''],
      companyName: [''],
      companyAddress: [''],
      companyWebsite: [''],
      companyTaxCode: [''],
      companyDetail: ['']
    });

    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });
  }

  // B1: Đăng ký -> gửi OTP về email
  onSubmit() {
    if (this.registerForm.valid) {
      const { confirmPassword, ...formValue } = this.registerForm.value;
      if (formValue.password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
      }

      const payload: RegisterRequest = {
        fullName: formValue.fullName,
        email: formValue.email,
        phone: formValue.phone,
        dob: formValue.dob,
        password: formValue.password,
        role: formValue.role,
        avatarUrl: undefined
      };

      this.authService.register(payload).subscribe({
        next: () => {
          this.emailToVerify = payload.email;
          this.roleToVerify = payload.role;
          this.companyDataToVerify = {
            companyCode: formValue.companyCode,
            companyName: formValue.companyName,
            companyAddress: formValue.companyAddress,
            companyWebsite: formValue.companyWebsite,
            companyTaxCode: formValue.companyTaxCode,
            companyDetail: formValue.companyDetail
          };
          this.step = 'VERIFY';
        },
        error: (err) => {
          alert(err.error.message || 'Đăng ký thất bại');
        }
      });
    }
  }

  // B2: Nhập OTP (và thông tin công ty nếu HR)
  onVerifyOtp() {
    if (this.otpForm.valid) {
      const otpPayload: any = {
        email: this.emailToVerify,
        otp: this.otpForm.value.otp
      };

      if (this.roleToVerify === 'HR') {
        if (this.companyDataToVerify.companyCode && this.companyExists === true) {
          otpPayload.companyCode = this.companyDataToVerify.companyCode;
        } else {
          otpPayload.companyName = this.companyDataToVerify.companyName;
          otpPayload.companyAddress = this.companyDataToVerify.companyAddress;
          otpPayload.companyWebsite = this.companyDataToVerify.companyWebsite;
          otpPayload.companyTaxCode = this.companyDataToVerify.companyTaxCode;
          otpPayload.companyDetail = this.companyDataToVerify.companyDetail;
        }
      }

      this.authService.verifyOtp(otpPayload).subscribe({
        next: () => {
          const loginData = {
            email: this.emailToVerify,
            password: this.registerForm.value.password
          };
          this.authService.login(loginData).subscribe({
            next: () => {
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              this.message = err.error.message || 'Đăng nhập thất bại.';
            }
          });
        },
        error: (err) => {
          this.message = err.error.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
        }
      });
    }
  }

  // Optional: kiểm tra companyCode hợp lệ
  checkCompanyCode() {
    const code = this.otpForm.get('companyCode')?.value;
    if (!code) {
      this.companyExists = null;
      this.companyInfo = null;
      return;
    }
    this.companyService.getById(code).subscribe({
      next: (result) => {
        if (result?.data) {
          this.companyExists = true;
          this.companyInfo = result.data;
        } else {
          this.companyExists = false;
          this.companyInfo = null;
        }
      },
      error: () => {
        this.companyExists = false;
        this.companyInfo = null;
      }
    });
  }

  resendOtp() {
    this.authService.resendOtp({ email: this.emailToVerify }).subscribe({
      next: () => {
        this.message = 'Mã OTP mới đã được gửi đến email của bạn!';
      },
      error: () => {
        this.message = 'Gửi lại mã OTP thất bại!';
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
}
