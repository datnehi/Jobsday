import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../dto/responseDto';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = environment.apiUrl + 'search';

  constructor(private http: HttpClient) {}

  searchJobs(filters: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filters.keyword) params = params.set('q', filters.keyword);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.experience) params = params.set('experience', filters.experience);
    if (filters.level) params = params.set('level', filters.level);
    if (filters.salary) params = params.set('salary', filters.salary);
    if (filters.contractType) params = params.set('contractType', filters.contractType);
    if (filters.workType) params = params.set('jobType', filters.workType);
    if (filters.userId) params = params.set('userId', filters.userId);

    // Phân trang cho jobs
    if (filters.jobsPage !== undefined) params = params.set('page', filters.jobsPage);
    if (filters.size !== undefined) params = params.set('size', filters.size);

    return this.http.get<ResponseDto>(`${this.apiUrl}/jobs`, { params });
  }

  searchCompanies(filters: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filters.keyword) params = params.set('q', filters.keyword);
    if (filters.location) params = params.set('location', filters.location);

    // Phân trang cho companies
    if (filters.companiesPage !== undefined) params = params.set('page', filters.companiesPage);
    if (filters.size !== undefined) params = params.set('size', filters.size);

    return this.http.get<ResponseDto>(`${this.apiUrl}/companies`, { params });
  }
}
