import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminAuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if route has specific roles
    const requiredRoles = route.data['roles'] as string[];
    
    if (authService.isAuthenticated()) {
        // If roles are defined, check them
        if (requiredRoles && requiredRoles.length > 0) {
            if (authService.hasRole(requiredRoles)) {
                return true;
            }
            // User authenticated but not authorized for this route
            // Redirect to dashboard or show unauthorized message
            router.navigate(['/dashboard']); 
            return false;
        }
        
        // If no roles defined, allow access (authenticated users)
        return true;
    }

    router.navigate(['/login']);
    return false;
};
