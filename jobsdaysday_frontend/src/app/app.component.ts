import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavComponent } from './views/nav/nav.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavComponent,
    CommonModule
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  displayNav = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.displayNav = this.router.url.includes('login') || this.router.url.includes('register');
    });
  }
}

