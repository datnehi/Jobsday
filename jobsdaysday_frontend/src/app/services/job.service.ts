import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job } from '../models/job';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class JobService {

  private apiUrl = environment.apiUrl + 'job';

  constructor(private http: HttpClient) {}

  getJobById(id: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${id}`);
  }

  getSimilarJobsById(jobId: number, userId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${jobId}/similar`, {
      params: new HttpParams().set('userId', userId)
    });
  }

  getJobsByCompanyId(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.keyword) params = params.set('q', filter.keyword);
    if (filter.location) params = params.set('location', filter.location);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.companyId) params = params.set('companyId', filter.companyId);

    // Phân trang cho jobs
    if (filter.jobsPage !== undefined) params = params.set('page', filter.jobsPage);
    if (filter.size !== undefined) params = params.set('size', filter.size);
    return this.http.get<ResponseDto>(`${this.apiUrl}/company/${filter.companyId}`, { params });
  }
}
