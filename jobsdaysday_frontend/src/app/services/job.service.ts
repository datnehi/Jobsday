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

  getSimilarJobsById(id: number, filters: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filters.keyword) params = params.set('title', filters.keyword);
    if (filters.level) params = params.set('level', filters.level);
    if (filters.location) params = params.set('location', filters.location);

    return this.http.get<ResponseDto>(`${this.apiUrl}/${id}/similar`, { params });
  }
}
