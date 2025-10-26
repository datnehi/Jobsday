import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  deleteCompany(id: number): Observable<ResponseDto> {
    return this.http.delete<ResponseDto>(`${this.apiUrl}/admin/${id}`);
  }

  getAll(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.text) params = params.set('text', filter.text);
    if (filter.location) params = params.set('location', filter.location);
    if (filter.page !== undefined) params = params.set('page', filter.page);
    return this.http.get<ResponseDto>(`${this.apiUrl}/admin/all`, { params });
  }

  getAllPending(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.text) params = params.set('text', filter.text);
    if (filter.location) params = params.set('location', filter.location);
    if (filter.page !== undefined) params = params.set('page', filter.page);
    return this.http.get<ResponseDto>(`${this.apiUrl}/admin/pending`, { params });
  }

}
