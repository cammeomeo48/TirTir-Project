import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: {
        _id: string;
        email: string;
        name: string;
        role: string;
    };
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        // Check if user is already logged in
        const token = localStorage.getItem('admin_token');
        const user = localStorage.getItem('admin_user');
        if (token && user) {
            this.currentUserSubject.next(JSON.parse(user));
        }
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
            email,
            password
        }).pipe(
            tap(response => {
                if (response.success && response.token && response.user) {
                    // Only allow admin users
                    if (response.user.role === 'admin') {
                        localStorage.setItem('admin_token', response.token);
                        localStorage.setItem('admin_user', JSON.stringify(response.user));
                        this.currentUserSubject.next(response.user);
                    } else {
                        throw new Error('Access denied. Admin privileges required.');
                    }
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem('admin_token');
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        return !!token;
    }

    isAdmin(): boolean {
        const user = this.currentUserSubject.value;
        return user?.role === 'admin';
    }

    getCurrentUser(): any {
        return this.currentUserSubject.value;
    }
}
