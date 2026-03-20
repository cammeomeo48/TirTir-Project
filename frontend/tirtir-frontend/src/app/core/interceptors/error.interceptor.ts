import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for global error handling
 * Handles 401 errors by redirecting to login
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Unauthorized - clear token and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('tirtir_auth_token');
                    router.navigate(['/login']);
                }
            }

            // Log error for debugging
            console.error('HTTP Error:', error);

            // Re-throw the error for component-level handling
            return throwError(() => error);
        })
    );
};
