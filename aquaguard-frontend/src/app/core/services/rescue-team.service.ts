import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class RescueTeamService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/rescue-teams`);
  }
}
