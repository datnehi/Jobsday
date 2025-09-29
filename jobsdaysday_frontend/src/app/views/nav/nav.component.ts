import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
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
  user: User | null = null;

  constructor(public authService: AuthService, private router: Router, private userService: UserService) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.isLogging = false;
        this.user = null;
      } else {
        this.isLogging = true;
        this.user = user;
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}

