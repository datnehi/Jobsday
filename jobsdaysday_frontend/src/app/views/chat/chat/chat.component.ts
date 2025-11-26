import { CompanyService } from './../../../services/company.service';
import { Component, OnDestroy, OnInit, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { of, merge, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
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
  convPage = 0;
  totalPageConversations = 0;

  isLoading = false;
  isSendingMessage = false;
  newMessage = '';
  token = '';
  searchText = '';
  pendingSearchText = '';

  currentUserRole: string | null = null;
  currentUserId?: number;
  appliedJobs: any[] = [];

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';

  currentPresence: PresenceDto | null = null;

  @ViewChild('chatScroll') chatScroll!: ElementRef<HTMLDivElement>;
  @ViewChild('convScroll') convScroll!: ElementRef<HTMLDivElement>;

  userAtBottom = true;
  suppressAutoScroll = false;
  readonly BOTTOM_THRESHOLD = 50;
  userInteracting = false;
  private userInteractingTimeout: any = null;

  visibleMessages: MessageDto[] = [];
  groupedMessages: Array<{ senderId?: number; msgs: MessageDto[]; time?: string }> = [];

  destroy$ = new Subject<void>();
  private convFetchPending = new Set<string>();

  readonly MAX_MESSAGE_LENGTH = 1000;
  private bannedWords = ['spamword1', 'chó', 'lợn'];
  private bannedPatterns: RegExp[] = [
    /\<script[\s\S]*?\>[\s\S]*?\<\/script\>/i,
    /(?:viagra|casino|porn)/i,
  ];

  private parseMs = (iso?: string) => iso ? new Date(iso).getTime() : 0;

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
    ).subscribe(({ member }) => {
      this.member = member;
      if (this.token) this.initSocket();
    });

    this.loadConversations().pipe(
      takeUntil(this.destroy$),
      switchMap(() =>
        merge(
          this.route.paramMap.pipe(map(pm => pm.get('conversationId') || pm.get('id'))),
          this.route.queryParamMap.pipe(map(qm => qm.get('conversationId') || qm.get('id')))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe((id) => {
      if (id) this.openConversationById(id);
    });

    if (this.isCandidate()) {
      this.getAppliedJobs();
    }
  }

  ngOnDestroy() {
    try { (this.chatService as any).disconnect?.(); } catch { }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSocket() {
    this.chatService.connect(this.token, this.member?.companyId);
    this.chatService.messages$.pipe(takeUntil(this.destroy$)).subscribe((m: MessageDto) => this.onIncomingMessage(m));
    this.chatService.seen$.pipe(takeUntil(this.destroy$)).subscribe(p => this.handleSeenEvent(p));
    this.chatService.presence$.pipe(takeUntil(this.destroy$)).subscribe(p => this.onPresence(p));
  }

  loadConversations(page = 0) {
    const filter = { page, searchText: this.searchText };
    this.isLoading = true;
    return this.conversationService.getConversations(filter).pipe(
      takeUntil(this.destroy$),
      tap(res => {
        this.isLoading = false;
        if (!res?.data?.content) {
          if (page === 0) this.conversations = [];
          return;
        }
        if (page === 0) {
          this.conversations = res.data.content.sort((a: any, b: any) => {
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
      }, () => {
        this.isLoading = false;
      })
    );
  }

  onScrollConversations(e: Event) {
    if (this.convPage + 1 >= this.totalPageConversations) return;
    const el = e.target as HTMLElement;
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
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

  trackByConversation(_i: number, item: any) {
    return item?.conversationId ?? item?.id ?? _i;
  }

  selectConversation(conv: any) {
    const newConvId = conv?.conversationId ?? conv?.id;
    const oldConvId = this.selectedConversation?.conversationId ?? this.selectedConversation?.id;
    if (oldConvId && newConvId && Number(oldConvId) === Number(newConvId)) return;

    if (this.selectedConversation) this.chatService.unsubscribeConversation(this.selectedConversation.conversationId);

    this.selectedConversation = conv;
    this.messages = [];
    this.messagePage = 0;
    this.totalPageMessages = 0;
    this.currentPresence = null;

    this.messageService.markRead(conv.conversationId).pipe(takeUntil(this.destroy$)).subscribe(() => {
      conv.unread = 0;
      this.cd.detectChanges();
    }, () => { });

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

  loadMessages(page = 0) {
    if (!this.selectedConversation) return;
    this.isLoading = true;
    const el = this.chatScroll?.nativeElement;
    const prevScrollHeight = el ? el.scrollHeight : 0;
    const prevScrollTop = el ? el.scrollTop : 0;
    this.suppressAutoScroll = true;

    this.messageService.getMessages(this.selectedConversation.conversationId, page).pipe(takeUntil(this.destroy$)).subscribe(res => {
      const content = res?.data?.content || [];
      this.messages = [...content, ...this.messages];
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

  private updateVisibleMessages() {
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
      const lastMsgTime = this.parseMs(lastGroup.msgs[lastGroup.msgs.length - 1].createdAt);
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

    if (this.userInteractingTimeout) clearTimeout(this.userInteractingTimeout);
    this.userInteracting = true;
    this.userInteractingTimeout = setTimeout(() => { this.userInteracting = false; }, 250);

    this.userAtBottom = (el.scrollHeight - (el.scrollTop + el.clientHeight)) < this.BOTTOM_THRESHOLD;

    if (el.scrollTop === 0 && !this.isLoading) {
      this.messagePage++;
      this.loadMessages(this.messagePage);
    }
  }

  ngAfterViewChecked(): void {
    if (this.suppressAutoScroll || this.userInteracting) return;
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

  trackByMessage(_i: number, item: MessageDto & { _tempId?: string }) {
    return (item as any).id ?? item._tempId ?? _i;
  }

  send() {
    if (!this.selectedConversation || this.isSendingMessage) return;

    const content = (this.newMessage || '').trim();
    if (!content) return;

    if (content.length > this.MAX_MESSAGE_LENGTH) {
      return this.showValidationError(`Nội dung quá dài. Vui lòng gõ tối đa ${this.MAX_MESSAGE_LENGTH} ký tự.`);
    }

    const violation = this.checkContentCompliance(content);
    if (violation) return this.showValidationError(violation);

    const convId = this.selectedConversation.conversationId ?? this.selectedConversation.id;
    if (!convId) return;

    if (!this.chatService.isConnected?.()) {
      this.showError('Không có kết nối', 'Không thể gửi tin nhắn do mất kết nối. Vui lòng thử lại khi có mạng.');
      return;
    }

    const correlationId = 'c_' + Math.random().toString(36).slice(2, 9);
    this.isSendingMessage = true;

    this.chatService.sendMessage(Number(convId), content, correlationId)
      .then(() => {
        this.newMessage = '';
        const conv = this.conversations.find(c => Number(c.conversationId ?? c.id) === Number(convId));
        const now = new Date().toISOString();
        if (conv) {
          conv.lastMessage = content;
          conv.lastMessageAt = now;
        }
        this.isSendingMessage = false;
        this.cd.detectChanges();
        if (this.userAtBottom) this.scrollToBottom();
      })
      .catch((err: any) => {
        this.isSendingMessage = false;
        this.cd.detectChanges();
        this.showError('Gửi tin nhắn thất bại', err?.message || 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối và thử lại.');
      });
  }

  private showValidationError(msg: string) {
    this.showErrorDialog = true;
    this.errorTitle = 'Nội dung không hợp lệ';
    this.errorMessage = msg;
  }

  private showError(title: string, message: string) {
    this.showErrorDialog = true;
    this.errorTitle = title;
    this.errorMessage = message;
  }

  private normalizeText(s: string) {
    if (!s) return '';
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private checkContentCompliance(content: string): string | null {
    const norm = this.normalizeText(content);

    for (const w of this.bannedWords) {
      const normW = this.normalizeText(w);
      if (!normW) continue;
      try {
        const re = new RegExp('(^|[^\\p{L}\\p{N}])' + this.escapeRegExp(normW) + '($|[^\\p{L}\\p{N}])', 'iu');
        if (re.test(norm)) return `Nội dung chứa từ/đoạn không được phép: "${w}". Vui lòng chỉnh sửa.`;
      } catch {
        const simpleRe = new RegExp('(^|\\s)' + this.escapeRegExp(normW) + '(\\s|$)', 'i');
        if (simpleRe.test(norm)) return `Nội dung chứa từ/đoạn không được phép: "${w}". Vui lòng chỉnh sửa.`;
      }
    }

    for (const pat of this.bannedPatterns) {
      if (pat.test(content) || pat.test(norm)) return 'Nội dung vi phạm quy định hệ thống. Vui lòng chỉnh sửa.';
    }

    if (/^(.)\1{200,}$/.test(norm)) return 'Nội dung có vẻ không hợp lệ (lặp lại). Vui lòng chỉnh sửa.';

    return null;
  }

  onIncomingMessage(msg?: MessageDto) {
    if (!msg) return;

    if (!msg.createdAt) msg.createdAt = (msg as any).sentAt || (msg as any).sent || new Date().toISOString();

    const incomingConvId = (msg as any).conversationId ?? (msg as any).conversation?.id ?? null;
    const currentConvId = this.selectedConversation?.conversationId ?? this.selectedConversation?.id;

    const assignConvLast = (conv: any, m: MessageDto) => {
      conv.lastMessage = m.content;
      conv.lastMessageAt = m.createdAt || new Date().toISOString();
    };

    if (currentConvId && incomingConvId && Number(incomingConvId) === Number(currentConvId)) {
      if (msg.id) {
        const existingIdx = this.messages.findIndex(m => m.id && m.id === msg.id);
        if (existingIdx !== -1) {
          this.messages[existingIdx] = { ...this.messages[existingIdx], ...msg };
          this.updateVisibleMessages();
          this.cd.detectChanges();
          return;
        }
      }

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
      const convNum = Number(currentConvId);
      const conv = this.conversations.find(c => Number(c.conversationId ?? c.id) === convNum);
      if (conv) {
        assignConvLast(conv, msg);
        conv.unread = 0;
        this.moveConversationToTop(convNum);
      }
      this.cd.detectChanges();

      if (this.isIncomingMessage(msg)) {
        this.messageService.markRead(convNum).subscribe(() => {
          if (this.selectedConversation) this.selectedConversation.unread = 0;
          const c = this.conversations.find(x => Number(x.conversationId ?? x.id) === convNum);
          if (c) c.unread = 0;
          this.cd.detectChanges();
        }, () => { });
      }
      return;
    }

    const convInList = this.conversations.find(c => Number(c.conversationId ?? c.id) === Number(incomingConvId));
    if (convInList) {
      assignConvLast(convInList, msg);
      if (this.isHr()) {
        const senderIdNum = Number(msg.senderId);
        const candidateIdNum = Number(convInList.candidateId);
        if (senderIdNum === candidateIdNum) convInList.unread = (Number(convInList.unread) || 0) + 1;
      } else {
        convInList.unread = (Number(convInList.unread) || 0) + 1;
      }
      this.moveConversationToTop(incomingConvId);
      this.cd.detectChanges();
      return;
    }

    const convFromMsg = (msg as any)?.conversation;
    if (convFromMsg) {
      convFromMsg.lastMessage = msg.content;
      convFromMsg.lastMessageAt = msg.createdAt || new Date().toISOString();
      convFromMsg.unread = 1;
      this.conversations.unshift(convFromMsg);
      this.cd.detectChanges();
      return;
    }

    const idKey = String(incomingConvId ?? (msg as any).conversationId);
    if (!idKey || this.convFetchPending.has(idKey)) return;

    this.convFetchPending.add(idKey);
    this.conversationService.getConversationById(idKey as any).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.convFetchPending.delete(idKey);
      if (res?.data) {
        this.conversations.unshift(res.data);
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

  private handleSeenEvent(payload: any) {
    if (!payload) return;
    const convIdNum = Number(payload.conversationId ?? payload.raw?.conversationId ?? 0);
    if (!convIdNum) return;

    const messageIdsArr: number[] = Array.isArray(payload.messageIds)
      ? payload.messageIds.map((v: any): number => Number(v)).filter((n: number) => !isNaN(n))
      : [];
    const messageIdsSet = new Set<number>(messageIdsArr);
    const seenAt = payload.seenAt ?? new Date().toISOString();

    const currentConvIdNum = Number(this.selectedConversation?.conversationId ?? this.selectedConversation?.id ?? 0);

    if (convIdNum === currentConvIdNum) {
      let updated = false;
      for (let i = 0; i < this.messages.length; i++) {
        const m = this.messages[i] as any;
        const mid = Number(m.id);
        if (isNaN(mid)) continue;
        if (!this.isIncomingMessage(m) && (messageIdsSet.size === 0 ? true : messageIdsSet.has(mid))) {
          if (!m.seenAt || m.seenAt !== seenAt) {
            this.messages[i] = { ...m, seenAt };
            updated = true;
          }
        }
      }
      if (updated) {
        this.updateVisibleMessages();
        if (this.selectedConversation) this.selectedConversation.unread = 0;
        this.cd.detectChanges();
      }
      return;
    }

    const conv = this.conversations.find(c => Number(c.conversationId ?? c.id) === convIdNum);
    if (conv) {
      conv.unread = 0;
      this.cd.detectChanges();
    }
  }

  onPresence(p: PresenceDto) {
    if (p && p.userId) this.currentPresence = p;
  }

  isOnline(userId?: number) {
    return !!userId && this.currentPresence?.userId == userId && this.currentPresence?.status == 'ONLINE';
  }

  formatTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString([], {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  formatGroupTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return this.formatTime(iso);
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
      if (res?.data?.id) {
        const cvId = res.data.id;
        this.cvsService.downloadCv(cvId).subscribe(response => {
          const blob = response.body!;
          const url = window.URL.createObjectURL(blob);

          const contentType = response.headers.get('Content-Type') || '';
          let fileName = 'cv';
          const contentDisposition = response.headers.get('Content-Disposition');
          if (contentDisposition) {
            const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
            if (matches && matches[1]) fileName = decodeURIComponent(matches[1]);
          }

          if (contentType.includes('pdf')) {
            const pdfWindow = window.open(url, '_blank');
            if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
              this.showError('Lỗi xem CV', 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.');
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
          this.showError('Lỗi xem CV', 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.');
          this.isLoading = false;
        });
      } else {
        this.isLoading = false;
      }
    }, () => {
      this.showError('Lỗi xem CV', 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.');
      this.isLoading = false;
    });
  }

  openConversationWithEmployer(job: any) {
    if (!job?.companyId) return;
    this.conversationService.createByCandidateAndCompany(this.currentUserId!, job.companyId).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res?.data) {
        const existing = this.conversations.find(c => Number(c.conversationId ?? c.id) === Number(res.data.conversationId ?? res.data.id));
        if (!existing) this.conversations.unshift(res.data);
        this.selectConversation(res.data);
        this.cd.detectChanges();
      }
    });
  }

  getAppliedJobs() {
    const filter = { page: 0, size: 5 };
    this.applicationService.getAppliedJobs(filter).subscribe(res => {
      if (res?.data?.content) this.appliedJobs = res.data.content;
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
    const now = Date.now();
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
    return this.formatLastOnline(new Date(this.currentPresence.lastOnlineAt));
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

    if (this.isHr()) this.router.navigate(['/quan-ly-job']);
    else if (this.isCandidate()) this.router.navigate(['/jobsday']);
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
      if (res?.data) {
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

  isLastOutgoingMessage(msg: any): boolean {
    if (!this.groupedMessages?.length) return false;

    for (let gi = this.groupedMessages.length - 1; gi >= 0; gi--) {
      const group = this.groupedMessages[gi];
      if (!group?.msgs) continue;
      for (let mi = group.msgs.length - 1; mi >= 0; mi--) {
        const m = group.msgs[mi];
        if (!this.isIncomingMessage(m) && m.seenAt) {
          if (m.id != null && msg.id != null) return m.id === msg.id;
          return m === msg;
        }
      }
    }
    return false;
  }
}
