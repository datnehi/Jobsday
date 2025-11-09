import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../dto/loginRequestDto';
import { User } from '../models/user';
import { UserService } from './user.service';
import { RegisterRequest } from '../dto/registerRequest';
import { ResponseDto } from '../dto/responseDto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + 'auth';

  private userToken = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  userToken$ = this.userToken.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService,
  ) { }

  async loadUserBeforeApp(): Promise<any> {
    try {
      const res = await this.userService.getCurrentUser().toPromise();
      if (res) {
        this.currentUserSubject.next(res.data);
      } else {
        this.clearUser();
      }
    } catch (e) {
      this.clearUser();
    }
  }


  login(payload: LoginRequest): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(this.api + '/login', payload).pipe(
      map(response => {
        if (response.data?.token) {
          this.clearUser();
          this.setUser(response.data.token);
        }
        return response;
      })
    );
  }

  register(body: RegisterRequest): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.api}/register`, body);
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

    localStorage.setItem('token', token);
    this.userToken.next(token);

    this.userService.getCurrentUser().subscribe(res => {
      if (res.data) {
        this.currentUserSubject.next(res.data);
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

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  resendOtp(data: { email: string }): Observable<any> {
    return this.http.post(`${this.api}/resend-otp`, data);
  }

  verifyOtp(request: any): Observable<any> {
    return this.http.post(`${this.api}/verify-otp`, request);
  }

  get userId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }
}
