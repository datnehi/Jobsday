import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

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

  getCV(applicationId: number) {
    return this.http.get(this.apiUrl + `/${applicationId}/cv`);
  }
}
