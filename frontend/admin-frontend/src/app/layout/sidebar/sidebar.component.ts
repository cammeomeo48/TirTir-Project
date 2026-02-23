import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
    label: string;
    icon: string;
    route: string;
    badge?: string;
    badgeColor?: string;
    roles?: string[]; // Optional: if not present, accessible by all authenticated users
}

interface MenuGroup {
    title: string;
    items: MenuItem[];
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
                { label: 'Customers', icon: '👥', route: '/customers', roles: ['admin', 'customer_service'] },
                { label: 'Coupons', icon: '🎟️', route: '/coupons', roles: ['admin'] },
                { label: 'Reviews', icon: '⭐', route: '/reviews', badge: '02', badgeColor: '#00e396', roles: ['admin', 'customer_service'] },
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

    menuGroups: MenuGroup[] = [];

    constructor(private authService: AuthService) { }

    ngOnInit() {
        this.filterMenu();
        // Subscribe to user changes if role might change dynamically (unlikely without refresh, but good practice)
        this.authService.currentUser$.subscribe(() => {
            this.filterMenu();
        });
    }

    filterMenu() {
        const user = this.authService.getCurrentUser();
        if (!user) {
            this.menuGroups = [];
            return;
        }

        const userRole = user.role;

        this.menuGroups = this.allMenuGroups.map(group => {
            return {
                ...group,
                items: group.items.filter(item => {
                    if (!item.roles) return true; // Accessible by all
                    return item.roles.includes(userRole);
                })
            };
        }).filter(group => group.items.length > 0); // Remove empty groups
    }

}
