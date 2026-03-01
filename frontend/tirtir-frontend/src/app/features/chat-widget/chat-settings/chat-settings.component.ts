import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-chat-settings',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-settings.component.html',
    styleUrls: ['./chat-settings.component.scss']
})
export class ChatSettingsComponent implements OnInit {
    authService = inject(AuthService);
    chatService = inject(ChatService);
    router = inject(Router);

    @Output() closeChat = new EventEmitter<void>();

    ngOnInit() {
        // Initialization handled in ChatService constructor
    }

    toggleAlertSound(event: any) {
        this.chatService.toggleAlertSound(event.target.checked);
    }

    async toggleDesktopNotifications(event: any) {
        if (event.target.checked) {
            await this.chatService.requestDesktopNotification();
            // If user denies permission, the checkbox should revert
            if (!this.chatService.desktopNotificationEnabled()) {
                event.target.checked = false;
            }
        } else {
            // Browser doesn't allow standard web apps to "revoke" permission programmatically,
            // But we can just use the toggle to stop showing them manually if desired.
            // Given the requirements, we'll just let the OS handle block/allow,
            // or we'd need a separate "disabled manually" state.
            // For now, if unchecked, we could add a manual override in the service.
            // We'll leave it simple for this implementation.
            alert('To completely disable notifications, please update your browser site settings.');
            event.target.checked = true; // keep checked until browser revoked
        }
    }

    getAvatarUrl(avatarPath: string | undefined): string {
        if (!avatarPath) return '';
        if (avatarPath.startsWith('http')) return avatarPath;
        const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
        // Assuming API runs on localhost:5001 for this local environment
        return `http://localhost:5001/${cleanPath}`;
    }

    handleAction() {
        this.closeChat.emit();
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/account/profile']);
        } else {
            this.router.navigate(['/login']);
        }
    }
}
