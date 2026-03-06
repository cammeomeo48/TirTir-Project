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

interface MenuGroup {
    title: string;
    items: NavItem[];
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

    allMenuGroups: MenuGroup[] = [
        {
            title: 'GENERAL',
            items: [
                { label: 'Dashboard', icon: '📊', route: '/dashboard' },
                { label: 'Products', icon: '🛍️', route: '/products', roles: ['admin'] },
                { label: 'Inventory', icon: '📦', route: '/inventory', roles: ['admin', 'inventory_staff'] },
                { label: 'Orders', icon: '📄', route: '/orders', roles: ['admin', 'customer_service'] },
                { label: 'GHN Simulator', icon: '🚚', route: '/shipping-simulator', roles: ['admin'] },
                { label: 'Customers', icon: '👥', route: '/customers', roles: ['admin', 'customer_service'] },
                { label: 'Coupons', icon: '🎟️', route: '/coupons', roles: ['admin'] },
                { label: 'Reviews', icon: '⭐', route: '/reviews', roles: ['admin', 'customer_service'] },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { label: 'Staff Users', icon: '🛡️', route: '/users', roles: ['admin'] },
                { label: 'Settings', icon: '⚙️', route: '/settings', roles: ['admin'] },
            ]
        }
    ];

    visibleGroups: MenuGroup[] = [];

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        this.filterItems();
        this.authService.currentUser$.subscribe(() => this.filterItems());
    }

    filterItems(): void {
        const user = this.authService.getCurrentUser();
        if (!user) { this.visibleGroups = []; return; }
        const role = user.role;
        this.visibleGroups = this.allMenuGroups.map(group => ({
            ...group,
            items: group.items.filter(item => !item.roles || item.roles.includes(role))
        })).filter(group => group.items.length > 0);
    }
}
