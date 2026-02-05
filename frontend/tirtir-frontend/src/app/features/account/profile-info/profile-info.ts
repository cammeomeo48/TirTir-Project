import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
    selector: 'app-profile-info',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile-info.html',
    styleUrl: './profile-info.css'
})
export class ProfileInfoComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);

    profileForm!: FormGroup;
    loading = false;
    successMessage = '';
    errorMessage = '';
    user: User | null = null;

    ngOnInit(): void {
        this.initForm();
        this.loadProfile();
    }

    initForm(): void {
        this.profileForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
            gender: [''],
            birthDate: [''],
            avatar: ['']
        });
    }

    loadProfile(): void {
        this.loading = true;
        this.userService.getProfile().subscribe({
            next: (user) => {
                this.user = user;
                this.profileForm.patchValue({
                    name: user.name,
                    phone: user.phone || '',
                    gender: user.gender || '',
                    birthDate: user.birthDate ? this.formatDateForInput(user.birthDate) : '',
                    avatar: user.avatar || ''
                });
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to load profile';
                this.loading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.successMessage = '';
        this.errorMessage = '';

        const formData = this.profileForm.value;

        this.userService.updateProfile(formData).subscribe({
            next: (updatedUser) => {
                this.user = updatedUser;
                this.successMessage = 'Profile updated successfully!';
                this.loading = false;

                // Update auth service user state (optional, don't block UI)
                this.authService.getCurrentUser().subscribe({
                    error: () => {
                        // Silently ignore errors from getCurrentUser
                        console.warn('Failed to refresh user data in auth service');
                    }
                });
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to update profile';
                this.loading = false;
            }
        });
    }

    /**
     * Get user initials for avatar display
     */
    getUserInitials(): string {
        if (!this.user?.name) return 'U';
        const nameParts = this.user.name.trim().split(' ');
        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase();
        }
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }

    /**
     * Get avatar background color based on name
     */
    getAvatarColor(): string {
        if (!this.user?.name) return '#667eea';

        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe',
            '#43e97b', '#fa709a', '#fee140', '#30cfd0'
        ];

        const charCode = this.user.name.charCodeAt(0);
        return colors[charCode % colors.length];
    }

    private formatDateForInput(date: Date | string): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
