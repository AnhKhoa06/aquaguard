import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FloodService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFloodData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/flood-data`);
  }
}
