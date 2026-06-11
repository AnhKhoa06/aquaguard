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

  createTeam(data: { name: string; phone?: string; area?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/rescue-teams`, data);
  }

  addMember(teamId: number, userId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/rescue-teams/${teamId}/members`, {
      user_id: userId,
    });
  }

  deleteTeam(teamId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/rescue-teams/${teamId}`);
  }

  getJoinRequests(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/rescue-teams/join-requests/all`);
  }

  handleJoinRequest(
    requestId: number,
    status: 'approved' | 'rejected',
  ): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(
      `${this.apiUrl}/rescue-teams/join-requests/${requestId}`,
      { status },
    );
  }

  //---
  requestJoin(teamId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/rescue-teams/${teamId}/join-request`,
      {},
    );
  }

  getMyJoinRequest(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/rescue-teams/join-requests/mine`);
  }

  leaveTeam(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/rescue-teams/leave`);
  }

  removeMember(teamId: number, userId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/rescue-teams/${teamId}/members/${userId}`,
    );
  }
}
