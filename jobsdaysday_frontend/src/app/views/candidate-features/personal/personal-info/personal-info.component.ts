import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../../models/user';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-personal-info',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent {
  user: User | null = null;
  infoForm: FormGroup;
  allowNTDSearch: boolean = false;

  selectedFile: File | null = null;
  selectedFileUrl: string | null = null;
  previewUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.infoForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: [''],
      dob: ['', Validators.required],
      email: [{ value: '', disabled: true }],
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.allowNTDSearch = user.ntdSearch;
        this.infoForm.patchValue({
          fullName: user.fullName,
          phone: user.phone || '',
          dob: user.dob || '',
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
      const updatedUser: User = {
        ...this.user!,
        fullName: this.infoForm.value.fullName,
        phone: this.infoForm.value.phone,
        dob: this.infoForm.value.dob
      };
      this.userService.updateUserInfo(updatedUser).subscribe(response => {
        if (response) {
          this.authService.setUser(this.authService.token || '');
          this.ngOnInit();
        }
      });
    }
  }

  openAvatarDialog() {
    const modal = document.getElementById('avatarModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
    }
  }

  closeAvatarDialog() {
    const modal = document.getElementById('avatarModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();
    }
    this.selectedFile = null;
    this.selectedFileUrl = null;
    this.previewUrl = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB.');
      return;
    }
    if (file) {
      this.selectedFile = file;
      this.selectedFileUrl = URL.createObjectURL(file);
      this.previewUrl = this.selectedFileUrl;
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.selectedFileUrl = null;
    this.previewUrl = null;
  }

  saveAvatar() {
    if (this.selectedFile) {
      this.userService.changeAvatar(this.selectedFile).subscribe(res => {
        this.authService.setUser(this.authService.token || '');
        this.closeAvatarDialog();
        this.ngOnInit();
      });
    }
  }
}
