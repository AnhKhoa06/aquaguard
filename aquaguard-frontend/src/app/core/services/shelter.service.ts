import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse, Shelter } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ShelterService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Shelter[]>> {
    return this.http.get<ApiResponse<Shelter[]>>(`${this.apiUrl}/shelters?t=${Date.now()}`);
  }
}
