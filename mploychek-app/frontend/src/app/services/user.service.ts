import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, RecordsResponse, CreateUserRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Profile ──────────────────────────────────────────────────────────────
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  // ── Records (delay param demonstrates async processing) ──────────────────
  getRecords(delayMs: number = 0): Observable<RecordsResponse> {
    let params = new HttpParams();
    if (delayMs > 0) params = params.set('delay', delayMs.toString());
    return this.http.get<RecordsResponse>(`${this.base}/records`, { params });
  }

  // ── User Management (Admin only) ─────────────────────────────────────────
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  createUser(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, payload);
  }

  updateUser(id: string, payload: Partial<User & { password?: string }>): Observable<User> {
    return this.http.put<User>(`${this.base}/users/${id}`, payload);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/users/${id}`);
  }
}
