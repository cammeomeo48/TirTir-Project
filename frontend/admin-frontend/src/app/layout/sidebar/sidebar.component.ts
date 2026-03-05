import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
    roles?: string[];
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

    navItems: NavItem[] = [
        { label: 'Dashboard', icon: '🏠', route: '/dashboard' },
        { label: 'Products', icon: '📦', route: '/products', roles: ['admin'] },
        { label: 'Orders', icon: '📑', route: '/orders' },
        { label: 'Users', icon: '👤', route: '/users', roles: ['admin'] },
        { label: 'Marketing', icon: '🎯', route: '/marketing', roles: ['admin'] },
        { label: 'Analytics', icon: '📊', route: '/analytics', roles: ['admin'] },
        { label: 'Inventory', icon: '🗂️', route: '/inventory', roles: ['admin', 'inventory_staff'] },
        { label: 'Settings', icon: '⚙️', route: '/settings', roles: ['admin'] },
    ];

    visibleItems: NavItem[] = [];

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        this.filterItems();
        this.authService.currentUser$.subscribe(() => this.filterItems());
    }

    filterItems(): void {
        const user = this.authService.getCurrentUser();
        if (!user) { this.visibleItems = []; return; }
        const role = user.role;
        this.visibleItems = this.navItems.filter(item =>
            !item.roles || item.roles.includes(role)
        );
    }
}
