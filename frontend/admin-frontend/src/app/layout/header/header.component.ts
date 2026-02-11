import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
    @Output() toggleSidebar = new EventEmitter<void>();
    showUserMenu = false;

    constructor(
        public authService: AuthService,
        private router: Router
    ) { }

    onToggleSidebar() {
        this.toggleSidebar.emit();
    }

    toggleUserMenu() {
        this.showUserMenu = !this.showUserMenu;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
