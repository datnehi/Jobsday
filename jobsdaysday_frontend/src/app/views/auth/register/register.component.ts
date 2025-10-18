import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CompanyService } from '../../../services/company.service';
import { RegisterRequest } from '../../../dto/registerRequest';
import { ConvertEnumService } from '../../../services/common/convert-enum.service';
import { ErrorDialogComponent } from "../../common/error-dialog/error-dialog.component";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    ErrorDialogComponent
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

  today: string = new Date().toISOString().split('T')[0];
  otpCountdown = 0;
  otpInterval: any;
  isLoading = false;
  showSuccessDialog = false;
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService,
    private convertEnumService: ConvertEnumService
  ) {
    this.registerForm = this.fb.group({
      role: ['CANDIDATE', Validators.required],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: [''],
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
      companyLocation: [''],
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
      this.isLoading = true;
      const { confirmPassword, ...formValue } = this.registerForm.value;
      if (formValue.password !== confirmPassword) {
        this.isLoading = false;
        this.errorTitle = 'Đăng ký thất bại';
        this.errorMessage = 'Mật khẩu và xác nhận mật khẩu không khớp.';
        this.showErrorDialog = true;
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
          this.isLoading = false;
          this.emailToVerify = payload.email;
          this.roleToVerify = payload.role;
          this.companyDataToVerify = {
            position: formValue.position,
            companyCode: formValue.companyCode,
            companyName: formValue.companyName,
            companyLocation: this.convertEnumService.mapLocationToEnum(formValue.companyLocation),
            companyAddress: formValue.companyAddress,
            companyWebsite: formValue.companyWebsite,
            companyTaxCode: formValue.companyTaxCode,
            companyDetail: formValue.companyDetail
          };
          this.step = 'VERIFY';
        },
        error: (err) => {
          this.isLoading = false;
          this.errorTitle = 'Đăng ký thất bại';
          this.errorMessage = err.error.message || 'Đăng ký thất bại';
          this.showErrorDialog = true;
        }
      });
    }
  }

  // B2: Nhập OTP (và thông tin công ty nếu HR)
  onVerifyOtp() {
    if (this.otpForm.valid) {
      this.isLoading = true;
      const otpPayload: any = {
        email: this.emailToVerify,
        otp: this.otpForm.value.otp
      };

      if (this.roleToVerify === 'HR') {
        if (this.companyDataToVerify.companyCode && this.companyExists === true) {
          otpPayload.companyCode = this.companyDataToVerify.companyCode;
        } else {
          otpPayload.position = this.companyDataToVerify.position;
          otpPayload.companyName = this.companyDataToVerify.companyName;
          otpPayload.companyAddress = this.companyDataToVerify.companyAddress;
          otpPayload.companyLocation = this.companyDataToVerify.companyLocation;
          otpPayload.companyWebsite = this.companyDataToVerify.companyWebsite;
          otpPayload.companyTaxCode = this.companyDataToVerify.companyTaxCode;
          otpPayload.companyDetail = this.companyDataToVerify.companyDetail;
        }
      }

      this.authService.verifyOtp(otpPayload).subscribe({
        next: () => {
          this.isLoading = false;
          if (this.roleToVerify === 'HR') {
            this.showSuccessDialog = true;
            return;
          }
          const loginData = {
            email: this.emailToVerify,
            password: this.registerForm.value.password
          };
          this.authService.login(loginData)
            .subscribe({
              next: () => {
                this.router.navigate(['/jobsday']);
              },
              error: (err) => {
                this.message = err.error.message || 'Đăng nhập thất bại';
              }
            });
        },
        error: (err) => {
          this.isLoading = false;
          this.message = err.error.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
        }
      });
    }
  }

  // Optional: kiểm tra companyCode hợp lệ
  checkCompanyCode() {
    const code = this.registerForm.get('companyCode')?.value;
    if (!code) {
      this.companyExists = null;
      return;
    }
    this.companyService.getById(code).subscribe({
      next: (result) => {
        if (result?.data) {
          this.companyExists = true;
        } else {
          this.companyExists = false;
        }
      },
      error: () => {
        this.companyExists = false;
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

  onRoleChange(role: string) {
    this.registerForm.get('role')?.setValue(role);
    if (role === 'HR') {
      this.registerForm.get('companyName')?.setValidators([Validators.required]);
      this.registerForm.get('companyAddress')?.setValidators([Validators.required]);
      this.registerForm.get('companyTaxCode')?.setValidators([Validators.required]);
      this.registerForm.get('companyLocation')?.setValidators([Validators.required]);
    } else {
      this.registerForm.get('companyName')?.clearValidators();
      this.registerForm.get('companyAddress')?.clearValidators();
      this.registerForm.get('companyTaxCode')?.clearValidators();
      this.registerForm.get('companyLocation')?.clearValidators();
    }
    this.registerForm.get('companyName')?.updateValueAndValidity();
    this.registerForm.get('companyAddress')?.updateValueAndValidity();
    this.registerForm.get('companyTaxCode')?.updateValueAndValidity();
    this.registerForm.get('companyLocation')?.updateValueAndValidity();
  }

  closeSuccessDialog() {
    this.showSuccessDialog = false;
    this.router.navigate(['/jobsday']);
  }

  handleCancel() {
    this.showErrorDialog = false;
  }
}
