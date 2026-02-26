import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { RevenueChartComponent } from './revenue-chart/revenue-chart';
import { TopProductsTableComponent } from './top-products-table/top-products-table';
import { RecentOrdersComponent } from './recent-orders/recent-orders';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, RevenueChartComponent, TopProductsTableComponent, RecentOrdersComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    stats: DashboardStats | null = null;
    isLoading = true;

    // Low stock alerts for dashboard widget
    lowStockAlerts: any[] = [];
    lowStockLoading = true;

    // Conversion + AI insights
    conversionData: any = null;
    aiInsights: any = null;

    constructor(private dashboardService: DashboardService) { }

    ngOnInit() {
        this.loadStats();
        this.loadLowStockAlerts();
        this.loadConversionStats();
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

    loadLowStockAlerts() {
        this.dashboardService.getLowStockAlerts().subscribe({
            next: (data) => {
                this.lowStockAlerts = Array.isArray(data) ? data.slice(0, 5) : [];
                this.lowStockLoading = false;
            },
            error: () => {
                this.lowStockLoading = false;
            }
        });
    }

    loadConversionStats() {
        this.dashboardService.getConversionStats().subscribe({
            next: (data) => { this.conversionData = data; },
            error: () => { /* Silently fail — widget simply won't show */ }
        });
        this.dashboardService.getAiInsights().subscribe({
            next: (data) => { this.aiInsights = data; },
            error: () => { /* Silently fail */ }
        });
    }
}
