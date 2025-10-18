import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class HrViewCandidateService {
  private apiUrl = environment.apiUrl + 'hrviewcandidate';

  constructor(private http: HttpClient) { }

  getHrViewed(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.page !== undefined) params = params.set('page', filter.page);
    if (filter.size !== undefined) params = params.set('size', filter.size);
    return this.http.get<ResponseDto>(this.apiUrl, { params });
  }

  createHrViewCandidate(candidateId: number): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.apiUrl}?candidateId=${candidateId}`, null);
  }

}
