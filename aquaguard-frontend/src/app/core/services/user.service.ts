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

  reverseGeocode(
    lat: number,
    lng: number,
  ): Observable<{ success: boolean; address: string | null }> {
    return this.http.get<{ success: boolean; address: string | null }>(
      `${this.apiUrl}/users/reverse-geocode?lat=${lat}&lng=${lng}`,
    );
  }

  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    console.log('updateProfile called', data);
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/users/profile`, data);
  }

  updateHealth(health_status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/health`, { health_status });
  }

  // Admin endpoints
  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/admin/users?t=${Date.now()}`);
  }

  updateRole(userId: number, role: User['role']): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/admin/users/${userId}/role`, {
      role,
    });
  }

  deleteUser(userId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/admin/users/${userId}`);
  }
}
