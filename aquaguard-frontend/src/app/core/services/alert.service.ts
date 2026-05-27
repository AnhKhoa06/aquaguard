// src/app/core/services/alert.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Alert } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Alert[]>> {
    //API GET /alerts từ backend.
    return this.http.get<ApiResponse<Alert[]>>(`${this.apiUrl}/alerts`);
  }
}
