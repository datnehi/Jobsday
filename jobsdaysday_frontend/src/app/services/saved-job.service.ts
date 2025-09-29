import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class SavedJobService {
  private apiUrl = environment.apiUrl + 'saved-jobs';

  constructor(private http: HttpClient) { }

  getSavedJob(jobId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/check/${jobId}`);
  }

  saveJob(jobId: number): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.apiUrl}/${jobId}`, {});
  }

  unsaveJob(jobId: number): Observable<ResponseDto> {
    return this.http.delete<ResponseDto>(`${this.apiUrl}/${jobId}`);
  }

  getSavedJobs(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.jobsPage !== undefined) params = params.set('page', filter.jobsPage);
    return this.http.get<ResponseDto>(`${this.apiUrl}/candidate`, { params });
  }
}
