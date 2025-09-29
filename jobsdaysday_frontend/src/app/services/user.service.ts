import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = environment.apiUrl + 'user';

  constructor(private http: HttpClient) { }

  getUserById(userId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.api}/${userId}`);
  }

  getCurrentUser(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.api}/me`);
  }

  updateNtdSearch(allowSearch: boolean): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(`${this.api}/update-public-info?isPublic=${encodeURIComponent(allowSearch)}`, {});
  }

  updateUserInfo(user: User): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(`${this.api}/update-info`, user);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(
      `${this.api}/change-password?currentPassword=${currentPassword}&newPassword=${newPassword}`, {});
  }

  changeAvatar(file: File): Observable<ResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<ResponseDto>(`${this.api}/update-avatar`, formData);
  }
}
