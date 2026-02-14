import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-profile-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
    templateUrl: './profile-layout.html',
    styleUrl: './profile-layout.css'
})
export class ProfileLayoutComponent {
    menuItems = [
        { path: 'profile', label: 'Profile Information', icon: '👤' },
        { path: 'addresses', label: 'Address Book', icon: '📍' },
        { path: 'password', label: 'Change Password', icon: '🔒' },
        { path: 'orders', label: 'Order History', icon: '📦' },
        { path: 'notifications', label: 'Notifications', icon: '🔔' }
    ];
}
