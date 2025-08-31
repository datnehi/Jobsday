import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = environment.apiUrl + 'company';

  constructor(private http: HttpClient) { }

  // getAll(): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}`);
  // }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(company: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, company);
  }

  // update(id: number, company: any): Observable<any> {
  //   return this.http.put<any>(`${this.apiUrl}/${id}`, company);
  // }

  // delete(id: number): Observable<any> {
  //   return this.http.delete<any>(`${this.apiUrl}/${id}`);
  // }
}
