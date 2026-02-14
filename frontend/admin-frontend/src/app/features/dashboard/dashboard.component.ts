import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { RevenueChartComponent } from './revenue-chart/revenue-chart';
import { TopProductsTableComponent } from './top-products-table/top-products-table';
import { RecentOrdersComponent } from './recent-orders/recent-orders';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RevenueChartComponent, TopProductsTableComponent, RecentOrdersComponent],
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
