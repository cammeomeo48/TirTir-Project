import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { CanComponentDeactivate } from '../../../core/guards/can-deactivate.guard';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-profile-info',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile-info.html',
    styleUrl: './profile-info.css'
})
export class ProfileInfoComponent implements OnInit, OnDestroy, CanComponentDeactivate {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);

    profileForm!: FormGroup;
    loading = false;
    successMessage = '';
    errorMessage = '';
    user: User | null = null;

    // Avatar upload state
    showUploadModal = false;
    selectedFile: File | null = null;
    previewUrl: string | null = null;
    uploading = false;
    uploadProgress: number | null = null;

    // Unsaved changes tracking
    hasUnsavedChanges = false;
    private destroy$ = new Subject<void>();


    ngOnInit(): void {
        this.initForm();
        this.loadProfile();
        this.trackFormChanges(); // Start tracking form changes
    }

    initForm(): void {
        this.profileForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
            gender: [''],
            birthDate: ['']
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
                    birthDate: user.birthDate ? this.formatDateForInput(user.birthDate) : ''
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
                this.hasUnsavedChanges = false; // Mark as saved before reload
                this.loading = false;
                this.successMessage = 'Profile updated successfully! Reloading...';

                // Show success message briefly then reload
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to update profile';
                this.loading = false;
                console.error('Profile update error:', error);
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

    // ===== AVATAR UPLOAD METHODS =====

    /**
     * Open avatar upload modal
     */
    openAvatarUpload(): void {
        console.log('Avatar clicked! Opening upload modal...');
        this.showUploadModal = true;
    }


    /**
     * Close upload modal
     */
    closeUploadModal(): void {
        if (!this.uploading) {
            this.showUploadModal = false;
            this.cancelUpload();
        }
    }

    /**
     * Trigger hidden file input
     */
    triggerFileInput(): void {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fileInput?.click();
    }

    /**
     * Handle file selection
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.errorMessage = 'Only image files (JPG, PNG, WEBP) are allowed';
            this.successMessage = '';
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.errorMessage = 'File size must be under 5MB';
            this.successMessage = '';
            return;
        }

        this.selectedFile = file;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        // Clear any previous errors
        this.errorMessage = '';
    }

    /**
     * Confirm and upload avatar
     */
    confirmUpload(): void {
        if (!this.selectedFile) return;

        this.uploading = true;
        this.uploadProgress = 0;
        this.errorMessage = '';
        this.successMessage = '';

        this.userService.uploadAvatar(this.selectedFile).subscribe({
            next: (response) => {
                this.uploadProgress = 100;
                setTimeout(() => {
                    this.user = response.user;
                    this.hasUnsavedChanges = false; // Avatar upload doesn't dirty the form
                    this.successMessage = 'Avatar updated successfully!';
                    this.uploading = false;
                    this.closeUploadModal();
                }, 500);
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to upload avatar. Please try again.';
                this.uploading = false;
                this.uploadProgress = null;
            }
        });
    }

    /**
     * Cancel upload and clear selection
     */
    cancelUpload(): void {
        this.selectedFile = null;
        this.previewUrl = null;
        this.uploadProgress = null;

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * Open camera for capture (TODO: Implement camera capture)
     */
    openCamera(): void {
        // TODO: Implement camera capture functionality
        this.errorMessage = 'Camera capture feature coming soon!';
    }

    /**
     * Get full avatar URL (handle relative paths from backend)
     */
    getAvatarUrl(avatar: string): string {
        if (avatar.startsWith('http')) {
            return avatar;
        }
        // Backend returns relative path like '/uploads/avatars/filename.jpg'
        // Extract base URL from environment.apiUrl (e.g., 'http://localhost:5001/api/v1' -> 'http://localhost:5001')
        const baseUrl = this.userService['apiUrl'].replace('/api/v1/users', '');
        return `${baseUrl}${avatar}`;
    }

    /**
     * Track form changes to detect unsaved edits
     */
    private trackFormChanges(): void {
        this.profileForm.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.hasUnsavedChanges = true;
            });
    }

    /**
     * Navigation guard: Warn user if leaving with unsaved changes
     */
    canDeactivate(): boolean {
        if (!this.hasUnsavedChanges) {
            return true;
        }

        return confirm('You have unsaved changes. Do you want to leave? Your changes will be lost.');
    }

    /**
     * Prevent browser close/reload if there are unsaved changes
     */
    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: BeforeUnloadEvent): void {
        if (this.hasUnsavedChanges) {
            $event.preventDefault();
            $event.returnValue = true; // Required for Chrome
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private formatDateForInput(date: Date | string): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
