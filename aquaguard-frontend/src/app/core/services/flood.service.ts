import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FloodService {
  private apiUrl = environment.apiUrl;
  private cachedFloodData: any = null;

  constructor(private http: HttpClient) {}

  getFloodData(): Observable<any> {
    if (this.cachedFloodData) {
      return of(this.cachedFloodData);
    }
    return this.http
      .get<any>(`${this.apiUrl}/flood-data`)
      .pipe(tap((res) => (this.cachedFloodData = res)));
  }
}
