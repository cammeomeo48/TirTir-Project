import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
    @Input() collapsed = false;

    menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: '📊', route: '/dashboard' },
        { label: 'Products', icon: '📦', route: '/products' },
        { label: 'Orders', icon: '🛒', route: '/orders' },
        { label: 'Customers', icon: '👥', route: '/customers' },
        { label: 'Coupons', icon: '🎫', route: '/coupons' },
        { label: 'Inventory', icon: '📋', route: '/inventory' }
    ];
}
