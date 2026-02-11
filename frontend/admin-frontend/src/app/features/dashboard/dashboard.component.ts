import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    stats: DashboardStats | null = null;
    isLoading = true;

    constructor(private dashboardService: DashboardService) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.dashboardService.getStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading stats:', error);
                this.isLoading = false;
            }
        });
    }
}
