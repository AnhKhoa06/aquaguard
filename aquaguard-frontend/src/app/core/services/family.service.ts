import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFamily(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/family`);
  }

  addMember(phone: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/family`, { phone });
  }

  removeMember(memberId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/family/${memberId}`);
  }
}
