import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '../models/user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private api = environment.apiUrl + 'user';
  constructor() { }

  getUserById(userId: number): Observable<User> {
    return this.http.get<{data: User}>(`${this.api}/${userId}`).pipe(
      map(res => res.data));
  }
}
