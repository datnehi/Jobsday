import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ResponseDto } from '../dto/responseDto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanySkillsService {

  private apiUrl = environment.apiUrl + 'companyskill';

  constructor(private http: HttpClient) { }

  getSkillsByCompanyId(companyId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${companyId}`);
  }

  updateSkillsForCompany(companyId: number, newSkillIds: number[]): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(`${this.apiUrl}/update/${companyId}`, newSkillIds);
  }
}
