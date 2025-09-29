import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';
import { Application } from '../models/application';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  private apiUrl = environment.apiUrl + 'applications';

  constructor(private http: HttpClient) { }

  apply(formData: FormData) {
    return this.http.post(this.apiUrl + '/apply', formData);
  }

  checkApplied(jobId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(this.apiUrl + `/check/${jobId}`);
  }

  getCvView(applicationId: number): Observable<Blob> {
    return this.http.get(this.apiUrl + `/${applicationId}/cv/view`, {
      responseType: 'blob'
    });
  }

  downloadCv(applicationId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${applicationId}/cv/download`, { responseType: 'blob', observe: 'response'});
  }

  getAppliedJobs(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.status) params = params.set('status', filter.status);
    if (filter.page !== undefined) params = params.set('page', filter.page);
    return this.http.get<ResponseDto>(this.apiUrl + '/candidate', { params });
  }
}
