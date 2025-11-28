import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavComponent } from './views/nav/nav.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  displayNav = false;

  constructor(private router: Router) {
    this.updateNavVisibility(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((evt: any) => {
      this.updateNavVisibility(evt.urlAfterRedirects ?? this.router.url);
    });
  }

  private updateNavVisibility(url: string) {
    const hideFor = ['/login', '/register', '/chat', '/forgot-password'];
    this.displayNav = hideFor.some(p => url.startsWith(p));
  }
}

