import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private baseUrl = environment.apiUrl + 'analytics';

  constructor(private http: HttpClient) {}

  getOverview(days: number = 30): Observable<ResponseDto> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ResponseDto>(`${this.baseUrl}/admin/overview`, { params });
  }

  getAnalyticsDays(days: number = 30): Observable<ResponseDto> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ResponseDto>(`${this.baseUrl}/admin/applications-by-day`, { params });
  }

  getAnalyticsHr(days: number = 30, companyId: number): Observable<ResponseDto> {
    const params = new HttpParams()
      .set('days', days.toString());
    return this.http.get<ResponseDto>(`${this.baseUrl}/${companyId}`, { params });
  }

}
