import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) { }

  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admins`);
  }

  createAdminUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin`, user);
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
