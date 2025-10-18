import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';
import { Job } from '../models/job';

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

  getAllJobsOfCompany(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.keyword) params = params.set('q', filter.keyword);
    if (filter.location) params = params.set('location', filter.location);
    if (filter.deadline) params = params.set('deadline', filter.deadline);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.memberId) params = params.set('memberId', filter.memberId);

    // Phân trang cho jobs
    if (filter.page !== undefined) params = params.set('page', filter.page);
    if (filter.size !== undefined) params = params.set('size', filter.size);
    return this.http.get<ResponseDto>(`${this.apiUrl}/search/${filter.companyId}`, { params });
  }

  updateJob(id: number, jobData: Job): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(`${this.apiUrl}/update/${id}`, jobData);
  }

  deleteJob(id: number): Observable<ResponseDto> {
    return this.http.delete<ResponseDto>(`${this.apiUrl}/delete/${id}`);
  }

  createJob(jobData: Job): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.apiUrl}/create`, jobData);
  }

  checkOwnerJob(jobId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/checkown/${jobId}`);
  }
}
