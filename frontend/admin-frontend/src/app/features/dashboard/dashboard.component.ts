import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats, RevenuePoint, TopProduct } from '../../core/services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    // Stats
    stats: DashboardStats | null = null;
    statsLoading = true;
    statsError: string | null = null;

    // Revenue chart
    revenueData: RevenuePoint[] = [];
    revenueLoading = true;
    maxRevenue = 1;

    // Top products
    topProducts: TopProduct[] = [];
    topProductsLoading = true;

    // Recent orders (via admin/orders with limit=5)
    recentOrders: any[] = [];
    recentOrdersLoading = true;

    // Low stock alerts
    lowStockItems: any[] = [];
    lowStockLoading = true;

    // Cart recovery stats
    recoveryStats: any = null;
    recoveryLoading = true;

    constructor(private dashboardService: DashboardService) { }

    ngOnInit(): void {
        this.loadStats();
        this.loadRevenue();
        this.loadTopProducts();
        this.loadRecentOrders();
        this.loadLowStock();
        this.loadRecoveryStats();
    }

    loadStats(): void {
        this.statsLoading = true;
        this.dashboardService.getStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.statsLoading = false;
            },
            error: () => {
                this.statsError = 'Failed to load stats';
                this.statsLoading = false;
            }
        });
    }

    loadRevenue(): void {
        this.revenueLoading = true;
        this.dashboardService.getRevenueChart().subscribe({
            next: (data) => {
                this.revenueData = Array.isArray(data) ? data : [];
                this.maxRevenue = Math.max(...this.revenueData.map(d => d.revenue), 1);
                this.revenueLoading = false;
            },
            error: () => { this.revenueLoading = false; }
        });
    }

    loadTopProducts(): void {
        this.dashboardService.getTopProducts().subscribe({
            next: (data) => {
                this.topProducts = Array.isArray(data) ? data.slice(0, 10) : [];
                this.topProductsLoading = false;
            },
            error: () => { this.topProductsLoading = false; }
        });
    }

    loadRecentOrders(): void {
        this.dashboardService.getAllOrders(1).subscribe({
            next: (data: any) => {
                const orders = Array.isArray(data) ? data : (data?.orders ?? []);
                this.recentOrders = orders.slice(0, 5);
                this.recentOrdersLoading = false;
            },
            error: () => { this.recentOrdersLoading = false; }
        });
    }

    loadLowStock(): void {
        this.dashboardService.getLowStockAlerts().subscribe({
            next: (data: any) => {
                const items = data?.lowStock?.items ?? (Array.isArray(data) ? data : []);
                this.lowStockItems = items.slice(0, 5);
                this.lowStockLoading = false;
            },
            error: () => { this.lowStockLoading = false; }
        });
    }

    loadRecoveryStats(): void {
        this.recoveryLoading = true;
        this.dashboardService.getCartRecoveryStats().subscribe({
            next: (data) => {
                this.recoveryStats = data;
                this.recoveryLoading = false;
            },
            error: () => { this.recoveryLoading = false; }
        });
    }

    // ── Helpers ─────────────────────────────────────────────────
    getTotalOrders(): number {
        if (!this.stats?.ordersByStatus) return 0;
        return Object.values(this.stats.ordersByStatus)
            .reduce((sum: number, v) => sum + (Number(v) || 0), 0);
    }

    getBarWidth(revenue: number): string {
        return `${Math.round((revenue / this.maxRevenue) * 100)}%`;
    }

    formatCurrency(val: number): string {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('vi-VN');
    }

    getStatusClass(status: string): string {
        const map: { [k: string]: string } = {
            Pending: 'badge-pending',
            Processing: 'badge-processing',
            Shipped: 'badge-shipped',
            Delivered: 'badge-delivered',
            Cancelled: 'badge-cancelled'
        };
        return map[status] ?? 'badge-default';
    }

    /** Trả về URL ảnh đầu tiên, dù Thumbnail_Images là string hay string[] */
    getThumb(img: string | string[] | undefined): string {
        if (!img) return '';
        if (Array.isArray(img)) return img[0] ?? '';
        return img;
    }
}
