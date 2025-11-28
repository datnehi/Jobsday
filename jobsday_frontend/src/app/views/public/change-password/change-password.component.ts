import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../models/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {

  user: User | null = null;
  infoForm: FormGroup;
  allowNTDSearch: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.infoForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/)
        ]
      ],
      confirmPassword: ['', Validators.required],
      email: [{value: '', disabled: true}],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.allowNTDSearch = user.ntdSearch;
        this.infoForm.patchValue({
          email: user.email || ''
        });
      }
    });
  }

  toggleSearchChange() {
    this.userService.updateNtdSearch(this.allowNTDSearch).subscribe(response => {
      if (response) {
        this.authService.setUser(this.authService.token || '');
        this.ngOnInit();
      }
    });
  }

  onSubmit() {
    if (this.infoForm.valid) {
      this.userService.changePassword(this.infoForm.value.currentPassword, this.infoForm.value.newPassword).subscribe(response => {
        if (response) {
          this.authService.setUser(this.authService.token || '');
          this.ngOnInit();
          this.infoForm.reset();
        }
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
   const currentPassword = String(form.get('currentPassword')?.value || '');
   const newPassword = String(form.get('newPassword')?.value || '');
   const confirmPassword = String(form.get('confirmPassword')?.value || '');

   const errors: { [key: string]: boolean } = {};

   if (newPassword !== confirmPassword) {
     errors['passwordMismatch'] = true;
   }

   if (newPassword && currentPassword && newPassword === currentPassword) {
     errors['sameAsCurrent'] = true;
   }

   return Object.keys(errors).length ? errors : null;
  }
}

