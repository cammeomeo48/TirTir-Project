import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
    label: string;
    icon: string;
    route: string;
    badge?: string;
    badgeColor?: string;
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
export class SidebarComponent {
    @Input() collapsed = false;
    @Output() collapsedChange = new EventEmitter<boolean>();

    menuGroups: MenuGroup[] = [
        {
            title: 'GENERAL',
            items: [
                { label: 'Dashboard', icon: '📊', route: '/dashboard' },
                { label: 'Products', icon: '🛍️', route: '/products' },
                { label: 'Inventory', icon: '📦', route: '/inventory' },
                { label: 'Orders', icon: '📄', route: '/orders' },
                { label: 'Customers', icon: '👥', route: '/customers' },
                { label: 'Coupons', icon: '🎟️', route: '/coupons' },
                { label: 'Reviews', icon: '⭐', route: '/reviews', badge: '02', badgeColor: '#00e396' },
            ]
        },
        {
            title: 'ACCOUNT',
            items: [
                { label: 'Settings', icon: '⚙️', route: '/settings' },
                { label: 'Help', icon: '❓', route: '/help' }
            ]
        }
    ];

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.collapsedChange.emit(this.collapsed);
    }
}
