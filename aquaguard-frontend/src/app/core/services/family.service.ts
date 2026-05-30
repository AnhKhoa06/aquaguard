import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../../models/interfaces';

export interface FamilyInvite {
  id: number;
  from_user_id: number;
  to_user_id: number;
  from_name: string;
  from_phone: string;
  relationship: string;
  status: string;
  created_at: string;
}

export interface SearchResult {
  id: number;
  full_name: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFamily(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/family`);
  }

  searchByPhone(phone: string): Observable<ApiResponse<SearchResult>> {
    return this.http.post<ApiResponse<SearchResult>>(`${this.apiUrl}/family/search`, { phone });
  }

  sendInvite(to_user_id: number, relationship: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/family/invite`, {
      to_user_id,
      relationship,
    });
  }

  getInvites(): Observable<ApiResponse<FamilyInvite[]>> {
    return this.http.get<ApiResponse<FamilyInvite[]>>(`${this.apiUrl}/family/invites`);
  }

  acceptInvite(inviteId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/family/invites/${inviteId}/accept`, {});
  }

  rejectInvite(inviteId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/family/invites/${inviteId}/reject`, {});
  }

  removeMember(memberId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/family/${memberId}`);
  }
}
