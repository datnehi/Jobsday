import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobSkillsService {
  private apiUrl = environment.apiUrl + 'jobskill';

  constructor(private http: HttpClient) { }

  getSkillsByJobId(jobId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${jobId}`);
  }
}
