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
        this.router.navigate(['/analytics']);
      } else if (user.role === 'HR') {
        this.router.navigate(['/analytics-hr']);
      } else {
        this.router.navigate(['/jobsday']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}

