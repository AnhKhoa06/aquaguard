import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SosRequest } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class SosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<SosRequest[]>> {
    return this.http.get<ApiResponse<SosRequest[]>>(`${this.apiUrl}/sos`);
  }

  getMySos(): Observable<ApiResponse<SosRequest[]>> {
    return this.http.get<ApiResponse<SosRequest[]>>(`${this.apiUrl}/sos/my`);
  }

  getAllForMap(): Observable<ApiResponse<SosRequest[]>> {
    return this.http.get<ApiResponse<SosRequest[]>>(`${this.apiUrl}/sos/map/all`);
  }

  create(data: FormData): Observable<ApiResponse<SosRequest>> {
    return this.http.post<ApiResponse<SosRequest>>(`${this.apiUrl}/sos`, data);
  }

  updateStatus(id: number, status: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/sos/${id}/status`, { status });
  }

  getById(id: number): Observable<ApiResponse<SosRequest>> {
    return this.http.get<ApiResponse<SosRequest>>(`${this.apiUrl}/sos/${id}`);
  }

  getActive(): Observable<ApiResponse<SosRequest[]>> {
    return this.http.get<ApiResponse<SosRequest[]>>(`${this.apiUrl}/sos/map/active`);
  }
  accept(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/sos/${id}/accept`, {});
  }
  assignResponder(id: number, responderId: number): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/sos/${id}/assign`, {
      responder_id: responderId,
    });
  }

  updateResponderLocation(sosId: number, latitude: number, longitude: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/sos/${sosId}/location`, { latitude, longitude });
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/sos/${id}`);
  }
}
