import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  baseApi: string = environment.apiUrl + 'conversations';

  constructor(private http: HttpClient) { }

  getConversations(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if(filter.searchText !== undefined) params = params.set('text', filter.searchText);
    if (filter.page !== undefined) params = params.set('page', filter.page);
    return this.http.get<ResponseDto>(this.baseApi, { params });
  }

  createByCandidateAndCompany(candidateId: number, companyId: number): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.baseApi}?companyId=${companyId}&candidateId=${candidateId}`, {});
  }

  checkOnlineStatus(conversationId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.baseApi}/conversation/${conversationId}/presence`);
  }

  getConversationById(conversationId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.baseApi}/conversation/${conversationId}/info`);
  }

  getCountOfUnreadMessages(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.baseApi}/conversation/unread`);
  }
}
