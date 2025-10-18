import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { get } from 'http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../dto/responseDto';

@Injectable({
  providedIn: 'root'
})
export class SkillsService {
  private apiUrl = environment.apiUrl + 'skills';

  constructor(private http: HttpClient) { }

  getAllSkills(): Observable<ResponseDto> {
    return this.http.get<ResponseDto>(this.apiUrl);
  }
}
