import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/users/profile?t=${Date.now()}`);
  }
  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    console.log('updateProfile called', data); // ← thêm
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/users/profile`, data);
  }
  updateHealth(health_status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/health`, { health_status });
  }
}
