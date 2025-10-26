import { AuthService } from './../../services/auth.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notfound',
  imports: [],
  templateUrl: './notfound.component.html',
  styleUrl: './notfound.component.css'
})
export class NotfoundComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  back() {
    const user = this.authService.currentUser;
    if (user) {
      if (user.role === 'ADMIN') {
        this.router.navigate(['/user-manager']);
      } else if (user.role === 'HR') {
        this.router.navigate(['/quan-ly-job']);
      } else {
        this.router.navigate(['/jobsday']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}

