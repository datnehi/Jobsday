import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '../models/user';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = environment.apiUrl + 'user';

  constructor(private http: HttpClient) {}

  getUserById(userId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.api}/${userId}`);
  }

  getCurrentUser(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.api}/me`);
  }
}
