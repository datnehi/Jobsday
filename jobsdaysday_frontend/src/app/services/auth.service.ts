import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../dto/loginRequestDto';
import { User } from '../models/user';
import { TokenService } from './token.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + 'auth';

  private userToken = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  userToken$ = this.userToken.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient,
              private tokenService: TokenService,
              private userService: UserService) {
    if (this.userToken.value) {
      this.setUser(this.userToken.value);
    }
  }

  login(payload: LoginRequest) {
    return this.http.post<any>(this.api + '/login', payload).pipe(
      map(response => {
        if (response.data?.token) {
          this.clearUser();
          this.setUser(response.data.token);
        }
        return response;
      })
    );
  }

  logout() {
    return this.http.post(this.api + '/logout', {}).pipe(
      map(() => this.clearUser())
    );
  }

  setUser(token: string) {
    if (!token) {
      this.clearUser();
      return;
    }

    // Lưu token trực tiếp vào localStorage
    localStorage.setItem('token', token);
    this.userToken.next(token);

    // Lấy thông tin user từ API
    this.tokenService.getToken(token).subscribe(tokenData => {
      if (tokenData) {
        this.userService.getUserById(tokenData.userId).subscribe(user => {
          if (user) {
            this.currentUserSubject.next(user);
          } else {
            this.clearUser();
          }
        });
      } else {
        this.clearUser();
      }
    });
  }

  clearUser() {
    localStorage.removeItem('token');
    this.userToken.next(null);
    this.currentUserSubject.next(null);
  }

  get token(): string | null {
    return this.userToken.value;
  }
}
