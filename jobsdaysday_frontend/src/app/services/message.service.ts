import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../dto/responseDto';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private apiUrl = environment.apiUrl + 'chat';
  constructor(private http: HttpClient) { }

  getMessages(conversationId: number, page = 0): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/conversations/${conversationId}/messages?page=${page}`);
  }

  markRead(conversationId: number) {
    return this.http.put(`${this.apiUrl}/conversations/${conversationId}/read`, {});
  }
}
