import { Component } from '@angular/core';
import { User } from '../../../../models/user';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HrViewCandidateService } from '../../../../services/hr-view-candidate.service';

@Component({
  selector: 'app-hr-view-profile',
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './hr-view-profile.component.html',
  styleUrl: './hr-view-profile.component.css'
})
export class HrViewProfileComponent {
  user: User = {} as User;
  allowNTDSearch: boolean = false;
  hrViewed: any[] = [];
  currentPage: number = 0;
  totalPages: number = 1;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private hrViewCandidateService: HrViewCandidateService
  ) { };

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.allowNTDSearch = user.ntdSearch;
        this.getHrViewed();
      }
    });
  }

  getHrViewed(page: number = 0) {
    const filters = {
      page
    };
    this.hrViewCandidateService.getHrViewed(filters).subscribe(response => {
      if (response && response.data) {
        this.hrViewed = response.data.content;
        this.currentPage = response.data.page;
        this.totalPages = response.data.totalPages;
      }
    });
  }

  toggleSearchChange() {
    this.userService.updateNtdSearch(this.allowNTDSearch).subscribe(response => {
      if (response) {
        this.authService.loadUserBeforeApp().then(() => {
          this.ngOnInit();
        });
      }
    });
  }

  getViewedLabel(viewedAt: string): string {
    if (!viewedAt) return '';
    const postedDate = new Date(viewedAt);
    const now = new Date();
    const diffMs = now.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Hôm nay';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} tháng trước`;
  }

  viewCompanyProfile(companyId: number) {
    window.open(`/company-detail/${companyId}`, '_blank');
  }

  changePage(page: number) {
    this.getHrViewed(page);
  }
}
