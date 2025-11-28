import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  errorMessage: string | null = null;
  loginForm!: FormGroup;
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const loginData = this.loginForm.value;
    this.isLoading = true;

    this.authService.login(loginData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.authService.loadUserBeforeApp().then(() => {
            if (this.authService.currentUser?.role === 'ADMIN') {
              this.router.navigate(['/analytics']);
            } else if (this.authService.currentUser?.role === 'HR') {
              this.router.navigate(['/analytics-hr']);
            } else {
              this.router.navigate(['/jobsday']);
            }
          });
        },
        error: (err) => {
          this.errorMessage = err.error.message || 'Đăng nhập thất bại';
        }
      });
  }
}

