import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { Token } from '../models/token';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private http = inject(HttpClient);
  private api = environment.apiUrl + 'token';

  constructor() { }

  getToken(token: string): Observable<Token> {
    return this.http.get<{data: Token}>(`${this.api}/${token}`).pipe(
      map(res => res.data));
  }
}
