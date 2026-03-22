import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { CartMergeService } from '../../../core/services/cart-merge.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
    templateUrl: './login.html',
    styleUrls: ['./login.css'],
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private cartMergeService = inject(CartMergeService);

    loginForm: FormGroup;
    loading = false;
    errorMessage = '';
    returnUrl = '/';

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });

        // Get return URL from query params or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const credentials = this.loginForm.value;

        this.authService.login(credentials).subscribe({
            next: (response) => {
                setTimeout(() => {
                    this.loading = false;
                }, 0);
                
                const queryParams = this.route.snapshot.queryParams;
                if (queryParams['recovery_token']) {
                    this.cartMergeService.handlePostLoginMerge().then(() => {
                        // Navigation handled by service
                    });
                } else {
                    this.router.navigate([this.returnUrl]);
                }
            },
            error: (error) => {
                setTimeout(() => {
                    this.loading = false;
                    this.errorMessage = error.message || 'Login failed. Please try again.';
                }, 0);
            },
        });
    }

    getFieldError(fieldName: string): string {
        const field = this.loginForm.get(fieldName);
        if (field && field.invalid && field.touched) {
            if (field.errors?.['required']) {
                return 'This field is required';
            }
            if (field.errors?.['email']) {
                return 'Please enter a valid email address';
            }
            if (field.errors?.['minlength']) {
                return 'Password must be at least 6 characters';
            }
        }
        return '';
    }
}
