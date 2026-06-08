import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ApiResponse } from '../../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Lấy user từ localStorage khi khởi động
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(phone: string, password: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/login`, { phone, password }).pipe(
      tap((res) => {
        if (res.success) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          this.currentUserSubject.next(res.data.user);
        }
      }),
    );
  }

  register(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/register`, data);
  }
  //sử dụng HttpClient để thực hiện một yêu cầu HTTP POST đến địa chỉ API auth/register kèm dl

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        error: () => {},
      });
    }
    localStorage.clear();
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken'); //lấy r.t từ localstorage
    return this.http.post<any>(`${this.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap((res) => {
        //nhận res
        if (res.success) {
          localStorage.setItem('accessToken', res.data.accessToken); //lưu a.t vào local storage
        }
      }),
    );
  }
}
