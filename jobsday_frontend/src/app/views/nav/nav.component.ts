import { Router, RouterModule } from '@angular/router';
import { CommonModule, } from '@angular/common';
import { Component, HostListener, } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Notification } from '../../models/notification';
import { CompanyMemberService } from '../../services/company-member.service';
import { CompanyMember } from '../../models/company_member';
import { NotificationService } from '../../services/notification.service';
import { ConversationService } from '../../services/conversation.service';
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
  isLogging: boolean = false;
  user: User | null = null;
  member: CompanyMember | null = null;
  showNotificationDropdown = false;
  showMobileMenu = false;
  notifications: Notification[] = [];
  baseUrl: string = 'http://localhost:4200/';
  unreadConversationsCount: number = 0;
  openDropdown: string | null = null;
  showProfileDropdown: boolean = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private companyMemberService: CompanyMemberService,
    private conversationService: ConversationService
    ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.user = null;
      } else {
        this.isLogging = true;
        this.user = user;
        if (this.user.role === 'HR') {
          this.companyMemberService.getMe().subscribe(response => {
            if (response && response.data) {
              this.member = response.data;
            }
          });
        }
        this.notificationService.getNotifications().subscribe(response => {
          this.notifications = response.data;
        });
        this.conversationService.getCountOfUnreadMessages().subscribe(response => {
          if (response.data) {
            this.unreadConversationsCount = response.data;
          }
        });
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) {
      this.showProfileDropdown = false;
    }
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleProfileDropdown(event?: Event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    this.showProfileDropdown = !this.showProfileDropdown;
    if (this.showProfileDropdown) {
      this.showNotificationDropdown = false;
    }
  }

  handleTopLevelClick(event: Event, key: string, routePath: string) {
    const isMobile = window.innerWidth <= 600;
    if (!isMobile) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.openDropdown === key) {
      this.openDropdown = null;
      return;
    }
    this.openDropdown = key;
  }

  isDropdownOpen(key: string): boolean {
    return this.openDropdown === key;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.icon-item.dropdown')) {
      this.showNotificationDropdown = false;
    }
    if (!target.closest('.profile-dropdown-area')) {
      this.showProfileDropdown = false;
    }
    const isMobile = window.innerWidth <= 600;
    if (!target.closest('nav.navbar')) {
      this.showMobileMenu = false;
      this.openDropdown = null;
    } else if (isMobile && this.openDropdown && !target.closest('.navbar-item.dropdown.open')) {
      // Tap somewhere else inside nav: close open dropdown
      this.openDropdown = null;
    }
  }

  goToLink(notification: Notification) {
    this.markAsRead(notification);
    if(!notification.url) return;
    window.open(this.baseUrl + notification.url, '_blank');
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id).subscribe((response) => {
      if (response.data) {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
      }
    });
  }

  markAllAsRead() {
    this.notificationService.makeAllAsRead().subscribe((response) => {
      if (response.status === 200) {
        this.notifications = [];
      }
    });
  }

  openChatModal() {
    window.open(this.baseUrl + '/chat', '_blank');
  }
}
