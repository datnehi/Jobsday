import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';
import { get } from 'http';
import { CompanyMember } from '../models/company_member';

@Injectable({
  providedIn: 'root'
})
export class CompanyMemberService {

  private apiUrl = environment.apiUrl + 'company-members';

  constructor(private http: HttpClient) { }

  getMe(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/me`);
  }

  getMemberOfCompany(companyId: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/company/${companyId}`);
  }

  updateMember(member: CompanyMember): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(`${this.apiUrl}/update`, member);
  }

  getMembers(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.textSearch !== undefined) params = params.set('textSearch', filter.textSearch);
    if (filter.page !== undefined) params = params.set('page', filter.page);
    if (filter.size !== undefined) params = params.set('size', filter.size);
    return this.http.get<ResponseDto>(`${this.apiUrl}/members`, { params });
  }

  getMemberById(id: number): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/${id}`);
  }

  getMemberRequests(filter: any): Observable<ResponseDto> {
    let params = new HttpParams();
    if (filter.page !== undefined) params = params.set('page', filter.page);
    if (filter.size !== undefined) params = params.set('size', filter.size);
    return this.http.get<ResponseDto>(`${this.apiUrl}/member-requests`, { params });
  }
}
