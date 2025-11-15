import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { MessageDto } from '../dto/messageDto';
import { PresenceDto } from '../dto/presencsDto';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private client!: Client;
  private connected = false;
  messages$ = new Subject<MessageDto>();
  presence$ = new Subject<PresenceDto>();
  private subMap = new Map<number, any>();

  connect(token: string, companyId?: number) {
    if (this.client && (this.client.active || this.client.state === 1)) return;

    const sockUrl = `${environment.apiUrl}ws?access=${encodeURIComponent(token)}`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      connectHeaders: {
        access: token
      },
      debug: (str) => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000
    });
    this.client.onConnect = (frame) => {
      this.connected = true;
      this.client.subscribe('/user/queue/messages', (msg: IMessage) => {
        try {
          this.messages$.next(JSON.parse(msg.body));
        } catch (e) { }
      });

      if (companyId) {
        this.client.subscribe(`/topic/company.${companyId}.messages`, (msg: IMessage) => {
          try {
            this.messages$.next(JSON.parse(msg.body));
          } catch { }
        });
      }
    };

    this.client.onStompError = (err) => {
      console.error('STOMP error', err);
    };

    this.client.activate();
  }

  subscribeConversation(conversationId: number) {
    if (!this.connected || this.subMap.has(conversationId)) return;
    const sub = this.client.subscribe(`/topic/conversation.${conversationId}`, (msg: IMessage) => {
      try { this.messages$.next(JSON.parse(msg.body)); } catch (e) { }
    });
    this.subMap.set(conversationId, sub);
  }

  unsubscribeConversation(conversationId: number) {
    const sub = this.subMap.get(conversationId);
    if (sub) { sub.unsubscribe(); this.subMap.delete(conversationId); }
  }

  sendMessage(conversationId: number, content: string) {
    if (!this.client || !this.client.active) {
      console.warn('STOMP client not active — message not sent', { conversationId, content });
      return;
    }
    const payload = { conversationId, content };
    try {
      this.client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
    } catch (e) {
      console.error('Failed to publish message', e);
    }
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  subscribePresenceOf(userId: number) {
    return this.client.subscribe(`/topic/presence.${userId}`, (msg: IMessage) => {
      try {
        const data = JSON.parse(msg.body);
        this.presence$.next(data);
      } catch { }
    });
  }
}
