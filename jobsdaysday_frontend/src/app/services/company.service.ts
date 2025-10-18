import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../dto/responseDto';
import { Company } from '../models/company';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = environment.apiUrl + 'company';

  constructor(private http: HttpClient) { }

  getById(id: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${id}`);
  }

  update(company: Company): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}`, company);
  }

  updateLogo(companyId: number, file: File): Observable<ResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<ResponseDto>(`${this.apiUrl}/update-logo/${companyId}`, formData);
  }

}
