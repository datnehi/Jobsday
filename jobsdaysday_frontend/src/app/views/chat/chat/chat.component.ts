import { CompanyService } from './../../../services/company.service';
import { Component, OnDestroy, OnInit, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { map, of, switchMap, take, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat-websocket.service';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { MessageDto } from '../../../dto/messageDto';
import { PresenceDto } from '../../../dto/presencsDto';
import { ConversationService } from '../../../services/conversation.service';
import { LoadingComponent } from "../../common/loading/loading.component";
import { Company } from '../../../models/company';
import { ApplicationService } from '../../../services/application.service';
import { User } from '../../../models/user';
import { UserService } from '../../../services/user.service';
import { ErrorDialogComponent } from "../../common/error-dialog/error-dialog.component";
import { CvsService } from '../../../services/cvs.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyMemberService } from '../../../services/company-member.service';
import { CompanyMember } from '../../../models/company_member';
import { merge } from 'rxjs';
import { filter, distinctUntilChanged, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent,
    ErrorDialogComponent
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  conversations: any[] = [];
  selectedConversation?: any = null;
  messages: MessageDto[] = [];
  companySelected: Company | null = null;
  candidateSelected: User | null = null;
  member: CompanyMember | null = null;
  messagePage = 0;
  totalPageMessages = 0;
  isLoading = false;
  newMessage = '';
  token = '';
  searchText = '';
  pendingSearchText = '';
  currentUserRole: string | null = null;
  currentUserId?: number;
  appliedJobs: any[] = [];
  showErrorDialog: boolean = false;
  errorTitle: string = '';
  errorMessage: string = '';
  currentPresence: PresenceDto | null = null;

  @ViewChild('chatScroll') chatScroll!: ElementRef<HTMLDivElement>;
  @ViewChild('convScroll') convScroll!: ElementRef<HTMLDivElement>;
  userAtBottom = true;
  suppressAutoScroll = false;
  readonly BOTTOM_THRESHOLD = 50;
  userInteracting = false;
  userInteractingTimeout: any = null;
  convPage = 0;
  totalPageConversations = 0;

  visibleMessages: MessageDto[] = [];
  groupedMessages: Array<{ senderId?: number; msgs: MessageDto[]; time?: string }> = [];

  destroy$ = new Subject<void>();
  convFetchPending = new Set<number | string>();

  parseMs = (iso?: string) => iso ? new Date(iso).getTime() : 0;

  readonly MAX_MESSAGE_LENGTH = 1000;
  private bannedWords = ['spamword1', 'chó', 'lợn'];
  private bannedPatterns: RegExp[] = [
    /\<script[\s\S]*?\>[\s\S]*?\<\/script\>/i,
    /(?:viagra|casino|porn)/i,
  ];

  private normalizeText(s: string) {
    if (!s) return '';
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private checkContentCompliance(content: string): string | null {
    const norm = this.normalizeText(content);

    for (const w of this.bannedWords) {
      const normW = this.normalizeText(w);
      if (!normW) continue;

      try {
        const re = new RegExp('(^|[^\\p{L}\\p{N}])' + this.escapeRegExp(normW) + '($|[^\\p{L}\\p{N}])', 'iu');
        if (re.test(norm)) {
          return 'Nội dung chứa từ/đoạn không được phép: "' + w + '". Vui lòng chỉnh sửa.';
        }
      } catch {
        const simpleRe = new RegExp('(^|\\s)' + this.escapeRegExp(normW) + '(\\s|$)', 'i');
        if (simpleRe.test(norm)) {
          return 'Nội dung chứa từ/đoạn không được phép: "' + w + '". Vui lòng chỉnh sửa.';
        }
      }
    }

    for (const pat of this.bannedPatterns) {
      if (pat.test(content) || pat.test(norm)) {
        return 'Nội dung vi phạm quy định hệ thống. Vui lòng chỉnh sửa.';
      }
    }

    if (/^(.)\1{200,}$/.test(norm)) {
      return 'Nội dung có vẻ không hợp lệ (lặp lại). Vui lòng chỉnh sửa.';
    }

    return null;
  }

  private escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private authService: AuthService,
    private conversationService: ConversationService,
    private companyService: CompanyService,
    private applicationService: ApplicationService,
    private userService: UserService,
    private cvsService: CvsService,
    private router: Router,
    private companyMemberService: CompanyMemberService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.authService.currentUser$.pipe(
      switchMap(u => {
        this.currentUserRole = u?.role || u?.role?.[0] || null;
        this.currentUserId = u?.id ? Number(u.id) : undefined;
        this.token = this.authService.token || '';

        if (this.currentUserRole === 'HR') {
          return this.companyMemberService.getMemberByUserId(this.currentUserId || 0).pipe(
            map(res => ({ user: u, member: res?.data || null }))
          );
        }
        return of({ user: u, member: null });
      }),
      takeUntil(this.destroy$)
    ).subscribe(({ user, member }) => {
      this.member = member;
      if (this.token) {
        this.chatService.connect(this.token, this.member?.companyId);
        this.chatService.messages$.pipe(takeUntil(this.destroy$)).subscribe((msg: MessageDto) => this.onIncomingMessage(msg));
        this.chatService.presence$.pipe(takeUntil(this.destroy$)).subscribe((p: PresenceDto) => this.onPresence(p));
      }
    });

    this.loadConversations().pipe(
      take(1),
      switchMap(() =>
        merge(
          this.route.paramMap.pipe(map(pm => pm.get('conversationId') || pm.get('id'))),
          this.route.queryParamMap.pipe(map(qm => qm.get('conversationId') || qm.get('id')))
        )
      ),
      filter((id): id is string => !!id),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(convId => this.openConversationById(convId));

    if (this.isCandidate()) {
      this.getAppliedJobs();
    }

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations(page: number = 0) {
    const filter = {
      page,
      searchText: this.searchText
    };
    this.isLoading = true;

    return this.conversationService.getConversations(filter).pipe(
      takeUntil(this.destroy$),
      tap(res => {
        if (res && res.data && res.data.content) {
          if (page === 0) {
            this.conversations = res.data.content;
            this.conversations.sort((a, b) => {
              const ta = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
              const tb = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
              return tb - ta;
            });
            this.convPage = res.data.page;
            this.totalPageConversations = res.data.totalPages;
            this.pendingSearchText = this.searchText;
          } else {
            this.conversations = [...this.conversations, ...res.data.content];
          }
        }
        this.isLoading = false;
      }),
      catchError(() => {
        this.isLoading = false;
        if (page === 0) this.conversations = [];
        return of(null);
      })
    );
  }

  onScrollConversations(e: Event) {
    if (this.convPage + 1 >= this.totalPageConversations) return;
    const el = e.target as HTMLElement;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    if (distanceToBottom < this.BOTTOM_THRESHOLD) {
      if (this.searchText !== this.pendingSearchText) {
        this.convPage = 0;
        this.loadConversations(0).subscribe();
      } else {
        this.convPage++;
        this.loadConversations(this.convPage).subscribe();
      }
    }
  }

  trackByConversation(index: number, item: any) {
    return item?.conversationId ?? item?.id ?? index;
  }

  selectConversation(conv: any) {
    const newConvId = conv?.conversationId ?? conv?.id;
    const oldConvId = this.selectedConversation?.conversationId ?? this.selectedConversation?.id;
    if (oldConvId && newConvId && Number(oldConvId) === Number(newConvId)) return;

    if (this.selectedConversation) this.chatService.unsubscribeConversation(this.selectedConversation.conversationId);

    this.messageService.markRead(conv.conversationId).pipe(takeUntil(this.destroy$)).subscribe(() => {
      conv.unread = 0;
      this.cd.detectChanges();
    }, () => { });

    this.selectedConversation = conv;
    this.messages = [];
    this.messagePage = 0;
    this.totalPageMessages = 0;
    this.currentPresence = null;

    this.conversationService.checkOnlineStatus(conv.conversationId).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) this.currentPresence = res.data as PresenceDto;
    });

    this.chatService.subscribeConversation(conv.conversationId);

    if (this.isCandidate()) {
      this.companyService.getById(conv.companyId).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.companySelected = res.data;
        if (this.companySelected) this.chatService.subscribePresenceOf(this.companySelected.id);
      });
    } else {
      this.userService.getUserById(conv.candidateId).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.candidateSelected = res.data;
        if (this.candidateSelected) this.chatService.subscribePresenceOf(this.candidateSelected.id);
      });
    }

    this.loadMessages();
  }

  loadMessages(page: number = 0) {
    if (!this.selectedConversation) return;
    this.isLoading = true;

    const el = this.chatScroll?.nativeElement;
    const prevScrollHeight = el ? el.scrollHeight : 0;
    const prevScrollTop = el ? el.scrollTop : 0;
    this.suppressAutoScroll = true;

    this.messageService.getMessages(this.selectedConversation.conversationId, page).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.messages = [...(res.data.content || []), ...this.messages];
      this.updateVisibleMessages();
      this.isLoading = false;
      this.messagePage = res.data.page;
      this.totalPageMessages = res.data.totalPages;

      requestAnimationFrame(() => {
        try {
          const el2 = this.chatScroll?.nativeElement;
          if (!el2) return;
          const newScrollHeight = el2.scrollHeight;
          el2.scrollTop = (newScrollHeight - prevScrollHeight) + prevScrollTop;
        } catch { }
        requestAnimationFrame(() => { this.suppressAutoScroll = false; });
      });
    }, () => {
      this.updateVisibleMessages();
      this.suppressAutoScroll = false;
      this.isLoading = false;
    });
  }

  updateVisibleMessages() {
    this.visibleMessages = [...this.messages].sort((a, b) => this.parseMs(a?.createdAt) - this.parseMs(b?.createdAt));

    this.groupedMessages = [];
    let lastGroup: { msgs: MessageDto[]; time?: string } | null = null;
    const GROUP_WINDOW_MS = 15 * 60 * 1000;

    for (const m of this.visibleMessages) {
      if (!lastGroup) {
        lastGroup = { msgs: [m], time: m.createdAt };
        this.groupedMessages.push(lastGroup);
        continue;
      }

      const lastMsgTime = lastGroup.msgs.length ? this.parseMs(lastGroup.msgs[lastGroup.msgs.length - 1].createdAt) : this.parseMs(lastGroup.time);
      const currTime = this.parseMs(m.createdAt);
      if ((currTime - lastMsgTime) <= GROUP_WINDOW_MS) {
        lastGroup.msgs.push(m);
      } else {
        lastGroup = { msgs: [m], time: m.createdAt };
        this.groupedMessages.push(lastGroup);
      }
    }
  }

  onScrollMessages(e: Event) {
    if (this.messagePage + 1 >= this.totalPageMessages) return;
    const el = e.target as HTMLElement;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;

    if (this.userInteractingTimeout) clearTimeout(this.userInteractingTimeout);
    this.userInteracting = true;
    this.userInteractingTimeout = setTimeout(() => { this.userInteracting = false; }, 250);

    this.userAtBottom = (scrollHeight - (scrollTop + clientHeight)) < this.BOTTOM_THRESHOLD;

    if (scrollTop === 0 && !this.isLoading) {
      this.messagePage++;
      this.loadMessages(this.messagePage);
    }
  }

  ngAfterViewChecked(): void {
    if (this.suppressAutoScroll) return;
    if (this.userInteracting) return;
    if (this.userAtBottom) this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatScroll?.nativeElement;
      if (!el) return;
      this.suppressAutoScroll = true;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        requestAnimationFrame(() => { this.suppressAutoScroll = false; });
      });
    } catch { }
  }

  trackByMessage(index: number, item: MessageDto & { _tempId?: string }) {
    return (item as any).id ?? item._tempId ?? index;
  }

  send() {
    if (!this.selectedConversation || !this.newMessage.trim()) return;

    const content = this.newMessage.trim();

    if (content.length > this.MAX_MESSAGE_LENGTH) {
      this.showValidationError('Nội dung quá dài. Vui lòng gõ tối đa ' + this.MAX_MESSAGE_LENGTH + ' ký tự.');
      return;
    }

    const violation = this.checkContentCompliance(content);
    if (violation) {
      this.showValidationError(violation);
      return;
    }

    const receiverId = this.isHr() ? this.selectedConversation.candidateId : this.selectedConversation.companyId;
    const convId = this.selectedConversation.conversationId ?? this.selectedConversation.id;
    const now = new Date().toISOString();
    const tempId = 't_' + Math.random().toString(36).slice(2, 9);

    const temp: MessageDto & { _tempId?: string } = {
      conversationId: convId,
      senderId: this.currentUserId ?? 0,
      receiverId,
      content,
      createdAt: now,
      _tempId: tempId
    };

    this.messages.push(temp);
    this.updateVisibleMessages();

    const conv = this.conversations.find(c => Number(c.conversationId ?? c.id) === Number(convId));
    if (conv) {
      conv.lastMessage = content;
      conv.lastMessageAt = now;
    }

    this.newMessage = '';

    this.chatService.sendMessage(Number(convId), content, tempId)
      .then(() => {
      })
      .catch((err: any) => {
        this.messages = this.messages.filter(m => (m as any)._tempId !== tempId);
        this.updateVisibleMessages();
        this.cd.detectChanges();
        this.showErrorDialog = true;
        this.errorTitle = 'Gửi tin nhắn thất bại';
        this.errorMessage = err?.message || 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối và thử lại.';
      });

    if (this.userAtBottom) this.scrollToBottom();
  }

  private showValidationError(msg: string) {
    this.showErrorDialog = true;
    this.errorTitle = 'Nội dung không hợp lệ';
    this.errorMessage = msg;
  }

  onIncomingMessage(msg: MessageDto) {
    if (!msg) return;

    if (!msg.createdAt) {
      (msg as any).createdAt = (msg as any).sentAt || (msg as any).sent || new Date().toISOString();
    }

    const incomingConvId = (msg as any).conversationId ?? (msg as any).conversation?.id ?? null;
    const currentConvId = this.selectedConversation?.conversationId ?? this.selectedConversation?.id;

    if (currentConvId && incomingConvId && Number(incomingConvId) === Number(currentConvId)) {
      if (msg.id && this.messages.some(m => m.id && m.id === msg.id)) return;

      const timeMs = this.parseMs(msg.createdAt);
      const matchIdx = this.messages.findIndex(m => {
        if (m.id && msg.id) return m.id === msg.id;
        const sameContent = m.content === msg.content;
        const sameSender = m.senderId === msg.senderId;
        const diff = Math.abs(this.parseMs(m.createdAt) - timeMs);
        return !m.id && sameContent && sameSender && diff <= 10000;
      });

      if (matchIdx !== -1) this.messages[matchIdx] = msg;
      else this.messages.push(msg);

      this.updateVisibleMessages();

      const convIdNum = Number(currentConvId);
      const conv = this.conversations.find(c => Number(c.conversationId ?? c.id) === convIdNum);
      if (conv) {
        conv.lastMessage = msg.content;
        conv.lastMessageAt = msg.createdAt || new Date().toISOString();
        conv.unread = 0;
        this.moveConversationToTop(convIdNum);
      }
      this.cd.detectChanges();

      this.messageService.markRead(convIdNum).subscribe(() => {
        if (this.selectedConversation) this.selectedConversation.unread = 0;
        const c = this.conversations.find(x => Number(x.conversationId ?? x.id) === convIdNum);
        if (c) c.unread = 0;
        this.cd.detectChanges();
      }, () => { });
    } else {
      const conv = this.conversations.find(c => Number(c.conversationId ?? c.id) === Number(incomingConvId));
      if (conv) {
        conv.lastMessage = msg.content;
        conv.lastMessageAt = msg.createdAt || new Date().toISOString();
        if (this.isHr()) {
          const senderIdNum = Number(msg.senderId);
          const candidateIdNum = Number(conv.candidateId);
          if (senderIdNum === candidateIdNum) {
            conv.unread = (Number(conv.unread) || 0) + 1;
          }
        } else {
          conv.unread = (Number(conv.unread) || 0) + 1;
        }
        this.moveConversationToTop(incomingConvId);
        this.cd.detectChanges();
      } else {
        const convFromMsg = (msg as any)?.conversation;
        if (convFromMsg) {
          convFromMsg.lastMessage = msg.content;
          convFromMsg.lastMessageAt = msg.createdAt || new Date().toISOString();
          convFromMsg.unread = 1;
          this.conversations.unshift(convFromMsg);
          this.cd.detectChanges();
          return;
        }

        const idKey = incomingConvId ?? (msg as any).conversationId;
        if (!idKey) return;

        if (this.convFetchPending.has(idKey)) return;
        this.convFetchPending.add(idKey);

        this.conversationService.getConversationById(idKey as any).pipe(takeUntil(this.destroy$)).subscribe(res => {
          this.convFetchPending.delete(idKey);
          if (res && res.data) {
            const newConv = res.data;
            this.conversations.unshift(newConv);
            this.cd.detectChanges();
          }
        }, () => {
          this.convFetchPending.delete(idKey);
          const placeholder: any = {
            conversationId: idKey,
            title: 'Tin nhắn mới',
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt || new Date().toISOString(),
            unread: 1
          };
          this.conversations.unshift(placeholder);
          this.cd.detectChanges();
        });
      }
    }
  }

  onPresence(p: PresenceDto) {
    if (p && p.userId) {
      this.currentPresence = p;
    }
  }

  isOnline(userId?: number) {
    return !!userId && this.currentPresence?.userId == userId && this.currentPresence?.status == 'ONLINE'
  }

  formatTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatGroupTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  isHr(): boolean {
    const r = (this.currentUserRole || '').toLowerCase();
    return r === 'hr' || r === 'recruiter' || r === 'employer';
  }

  isCandidate(): boolean {
    const r = (this.currentUserRole || '').toLowerCase();
    return r === 'candidate' || r === 'user' || r === 'applicant';
  }

  viewCv() {
    if (!this.candidateSelected) return;
    this.isLoading = true;
    this.cvsService.getCvPublicByUserId(this.candidateSelected.id).subscribe(res => {
      if (res) {
        const cvId = res.data.id;
        this.cvsService.downloadCv(cvId).subscribe(response => {
          const blob = response.body!;
          const url = window.URL.createObjectURL(blob);

          const contentType = response.headers.get('Content-Type');
          let fileName = 'cv';
          const contentDisposition = response.headers.get('Content-Disposition');
          if (contentDisposition) {
            const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
            if (matches && matches[1]) {
              fileName = decodeURIComponent(matches[1]);
            }
          }

          if (contentType?.includes('pdf')) {
            const pdfWindow = window.open(url, '_blank');
            if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
              this.showErrorDialog = true;
              this.errorTitle = 'Lỗi xem CV';
              this.errorMessage = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.';
              this.isLoading = false;
              return;
            }
          } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
          }
          this.isLoading = false;
        }, () => {
          this.showErrorDialog = true;
          this.errorTitle = 'Lỗi xem CV';
          this.errorMessage = 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.';
          this.isLoading = false;
        });
      }
    }, () => {
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.';
      this.isLoading = false;
    });
  }

  openConversationWithEmployer(job: any) {
    if (!job || !job.companyId) return;
    this.conversationService.createByCandidateAndCompany(this.currentUserId!, job.companyId).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res && res.data) {
        const existing = this.conversations.find(c => Number(c.conversationId ?? c.id) === Number(res.data.conversationId ?? res.data.id));
        if (!existing) {
          this.conversations.unshift(res.data);
        }
        this.selectConversation(res.data);
        this.cd.detectChanges();
      }
    });
   }

  getAppliedJobs() {
    const filter = { page: 0, size: 5 };
    this.applicationService.getAppliedJobs(filter).subscribe(res => {
      if (res && res.data && res.data.content) {
        this.appliedJobs = res.data.content;
      }
    });
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  openCompanyDetail(companyId?: number) {
    if (!companyId) return;
    this.router.navigate(['/company-detail', companyId]);
  }

  formatLastOnline(date: Date): string {
    const now = new Date().getTime();
    const diffMs = now - date.getTime();

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const days = Math.floor(hrs / 24);

    if (sec < 30) return "vừa xong";
    if (min < 1) return `${sec} giây trước`;
    if (min < 60) return `${min} phút trước`;
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${days} ngày trước`;
  }

  getLastOnline(): string | null {
    if (!this.currentPresence || this.currentPresence.status === 'ONLINE' || !this.currentPresence.lastOnlineAt) return null;
    return this.formatLastOnline(this.currentPresence.lastOnlineAt ? new Date(this.currentPresence.lastOnlineAt) : new Date());
  }

  isIncomingMessage(msg: MessageDto): boolean {
    if (!this.selectedConversation) return false;
    return (this.isHr() && msg.senderId === this.selectedConversation.candidateId)
      || (this.isCandidate() && msg.senderId !== this.currentUserId);
  }

  showAvatarForMessage(group: { msgs: MessageDto[] }, mi: number): boolean {
    const msg = group.msgs[mi];
    if (!this.isIncomingMessage(msg)) return false;
    const next = group.msgs[mi + 1];
    if (!next) return true;
    return !this.isIncomingMessage(next);
  }

  backToHome() {
    try { (this.chatService as any).disconnect?.(); } catch { }
    this.destroy$.next();
    this.destroy$.complete();
    this.messages = [];
    this.groupedMessages = [];
    this.visibleMessages = [];
    this.selectedConversation = undefined;
    this.conversations = [];

    if (this.isHr()) {
      this.router.navigate(['/quan-ly-job']);
    } else if (this.isCandidate()) {
      this.router.navigate(['/jobsday']);
    }
  }

  private moveConversationToTop(convId: any) {
    const idNum = Number(convId);
    const idx = this.conversations.findIndex(c => Number(c.conversationId ?? c.id) === idNum);
    if (idx > 0) {
      const [item] = this.conversations.splice(idx, 1);
      this.conversations.unshift(item);
    }
  }

  openConversationById(id: string | number) {
    if (!id) return;
    const idKey = String(id);
    const existing = this.conversations.find(c => String(c.conversationId ?? c.id) === idKey);
    if (existing) {
      this.selectConversation(existing);
      return;
    }

    if (this.convFetchPending.has(idKey)) return;
    this.convFetchPending.add(idKey);

    this.conversationService.getConversationById(id as any).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.convFetchPending.delete(idKey);
      if (res && res.data) {
        this.conversations.unshift(res.data);
        this.selectConversation(res.data);
        this.cd.detectChanges();
      }
    }, () => {
      this.convFetchPending.delete(idKey);
      const placeholder: any = {
        conversationId: id,
        title: 'Tin nhắn',
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unread: 0
      };
      this.conversations.unshift(placeholder);
      this.selectConversation(placeholder);
      this.cd.detectChanges();
    });
  }

  isActiveConversation(conv: any): boolean {
    const selId = String(this.selectedConversation?.conversationId ?? this.selectedConversation?.id ?? '');
    const convId = String(conv?.conversationId ?? conv?.id ?? '');
    return selId !== '' && convId !== '' && selId === convId;
  }
}
