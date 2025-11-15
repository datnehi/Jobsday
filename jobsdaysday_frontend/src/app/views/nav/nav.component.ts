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
  notifications: Notification[] = [];
  baseUrl: string = 'http://localhost:4200/';
  unreadConversationsCount: number = 0;

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
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.icon-item.dropdown')) {
      this.showNotificationDropdown = false;
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
