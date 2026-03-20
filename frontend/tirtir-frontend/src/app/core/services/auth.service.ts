import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import {
    User,
    LoginRequest,
    RegisterRequest,
    AuthResponse, // Keep AuthResponse here for now, as the instruction defines it later.
    ForgotPasswordRequest,
    ResetPasswordRequest,
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private http = inject(HttpClient);
    private router = inject(Router);

    // Auth state management
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // Signal-based auth state for modern Angular
    private isAuthenticatedSignal = signal<boolean>(false);
    public isAuthenticated = computed(() => this.isAuthenticatedSignal());

    private readonly TOKEN_KEY = 'tirtir_auth_token';

    constructor() {
        // Check for existing token on initialization
        this.checkAuthStatus();
    }

    /**
     * Check if user is authenticated by verifying token
     */
    private checkAuthStatus(): void {
        const token = this.getToken();
        if (token) {
            // Verify token by fetching current user
            this.getCurrentUser().subscribe({
                next: (user) => {
                    this.currentUserSubject.next(user);
                    this.isAuthenticatedSignal.set(true);
                },
                error: (err) => {
                    // Only clear token if it's explicitly an auth invalidation error (e.g. expired)
                    // and not just a temporary 401/network glitch or backend restarting.
                    if (err && err.status === 401) {
                        this.clearToken();
                        this.isAuthenticatedSignal.set(false);
                    } else if (err && err.status !== 500) {
                        this.isAuthenticatedSignal.set(false);
                    }
                },
            });
        }
    }

    /**
     * Login user with email and password
     */
    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap((response) => {
                if (response.success && response.token) {
                    this.setToken(response.token);
                    this.currentUserSubject.next(response.user);
                    this.isAuthenticatedSignal.set(true);
                }
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Register new user
     */
    register(userData: RegisterRequest): Observable<{ success: boolean; message: string }> {
        return this.http
            .post<{ success: boolean; message: string }>(`${this.apiUrl}/register`, userData)
            .pipe(catchError(this.handleError));
    }

    /**
     * Logout current user
     */
    logout(): void {
        // Clear token from localStorage
        this.clearToken();

        // Clear user state
        this.currentUserSubject.next(null);
        this.isAuthenticatedSignal.set(false);

        // Navigate to home
        this.router.navigate(['/']);
    }

    /**
     * Get current logged-in user from backend
     */
    getCurrentUser(): Observable<User> {
        return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/me`).pipe(
            tap((response) => {
                if (response.success && response.data) {
                    this.currentUserSubject.next(response.data);
                    this.isAuthenticatedSignal.set(true);
                }
            }),
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    /**
     * Send forgot password email
     */
    forgotPassword(email: ForgotPasswordRequest): Observable<{ success: boolean; message: string }> {
        return this.http
            .post<{ success: boolean; message: string }>(`${this.apiUrl}/forgot-password`, email)
            .pipe(catchError(this.handleError));
    }

    /**
     * Reset password with token
     */
    resetPassword(
        token: string,
        passwordData: ResetPasswordRequest
    ): Observable<AuthResponse> {
        return this.http
            .put<AuthResponse>(`${this.apiUrl}/reset-password/${token}`, passwordData)
            .pipe(
                tap((response) => {
                    if (response.success && response.token) {
                        // Auto-login after successful password reset
                        this.setToken(response.token);
                        this.currentUserSubject.next(response.user);
                        this.isAuthenticatedSignal.set(true);
                    }
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get JWT token from localStorage
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Save JWT token to localStorage
     */
    private setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Remove JWT token from localStorage
     */
    private clearToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    /**
     * Get current user value (synchronous)
     */
    get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Check if user is admin
     */
    isAdmin(): boolean {
        return this.currentUserValue?.role === 'admin';
    }

    /**
     * Error handler
     */
    private handleError(error: any): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error?.message) {
            errorMessage = error.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('Auth Error:', error);
        return throwError(() => new Error(errorMessage));
    }
}
