import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class CvsService {
  private apiUrl = environment.apiUrl + 'cvs';

  constructor(private http: HttpClient) { }

  uploadCV(formData: FormData): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(this.apiUrl + '/upload', formData);
  }

  getUserCVs(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(`${this.apiUrl}/me`);
  }

  changeTitle(cvId: number, newTitle: string): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(
      `${this.apiUrl}/set-title/${cvId}?title=${encodeURIComponent(newTitle)}`,
      {});
  }

  deleteCv(cvId: number): Observable<ResponseDto> {
    return this.http.delete<ResponseDto>(`${this.apiUrl}/delete/${cvId}`);
  }

  setPublicStatus(cvId: number, isPublic: boolean): Observable<ResponseDto> {
    return this.http.put<ResponseDto>(
      `${this.apiUrl}/change-public/${cvId}?isPublic=${encodeURIComponent(isPublic)}`,
      {});
  }

  downloadCv(cvId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${cvId}/download`, {
      responseType: 'blob',
      observe: 'response'
    });
  }


}
