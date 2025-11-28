import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl + 'notifications';

  constructor(private http: HttpClient) { }

  sendNotification(data: any) {
    let params = new HttpParams();
    params = params.set('userTo', data.userTo);
    params = params.set('type', data.type);
    params = params.set('message', data.message);
    return this.http.post(this.apiUrl + '/send', params);
  }

  getNotifications(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(this.apiUrl);
  }

  markAsRead(notificationId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  makeAllAsRead(): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.apiUrl}/readall`, {});
  }
}
