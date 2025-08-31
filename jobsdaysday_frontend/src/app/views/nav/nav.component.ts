import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
  isLogging: boolean | undefined;

  constructor(public authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLogging = !!user;
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }
}

