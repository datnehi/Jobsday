import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { EmailRequestDto } from '../dto/emailRequestDto';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private api = environment.apiUrl + 'email';
  constructor(private http: HttpClient) { }

  sendEmail(data: EmailRequestDto): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(this.api, data);
  }
}
