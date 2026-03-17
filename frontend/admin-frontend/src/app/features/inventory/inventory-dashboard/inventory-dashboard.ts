import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryStats } from '../../../core/services/inventory.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
    selector: 'app-inventory-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './inventory-dashboard.html',
    styleUrls: ['./inventory-dashboard.css']
})
export class InventoryDashboardComponent implements OnInit {
    stats: InventoryStats | null = null;
    alerts: any[] = [];
    loading = true;
    error: string | null = null;
    statsLoading = true;

    // Quick Restock
    restockingId: string | null = null;
    restockQty: number = 0;
    restockReason = 'Manual restock';
    restocking = false;

    // Filter from query param (e.g. ?filter=low-stock from Products page)
    activeFilter: string | null = null;

    constructor(
        private inventoryService: InventoryService,
        private exportService: ExportService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Read query param from Products "Low Stock Alerts" button
        this.route.queryParams.subscribe(params => {
            this.activeFilter = params['filter'] || null;
        });
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.loading = true;
        this.error = null;

        this.inventoryService.getInventoryStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.statsLoading = false;
            },
            error: (err: any) => {
                console.error('Stats load error:', err);
                this.statsLoading = false;
                this.error = 'Failed to load inventory stats';
            }
        });

        this.inventoryService.getLowStockAlerts().subscribe({
            next: (data) => {
                this.alerts = Array.isArray(data) ? data : [];
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Alerts load error:', err);
                this.loading = false;
                this.error = 'Failed to load inventory alerts';
            }
        });
    }

    // ─── Quick Restock ───────────────────────────────────────────
    openRestock(item: any): void {
        this.restockingId = item._id;
        this.restockQty = 0;
        this.restockReason = 'Manual restock';
    }

    cancelRestock(): void {
        this.restockingId = null;
    }

    confirmRestock(item: any): void {
        if (!this.restockQty || this.restockQty <= 0) return;
        this.restocking = true;

        this.inventoryService.adjustStock({
            productId: item._id,
            action: 'add',
            quantity: this.restockQty,
            reason: this.restockReason || 'Manual restock'
        }).subscribe({
            next: () => {
                this.restocking = false;
                this.restockingId = null;
                // Reactive: reload both stats and alerts without page reload
                this.loadDashboardData();
            },
            error: (err: any) => {
                console.error('Restock error:', err);
                this.restocking = false;
                this.error = 'Failed to restock. Please try again.';
            }
        });
    }

    // ─── Export ──────────────────────────────────────────────────
    exportData(): void {
        if (!this.alerts || this.alerts.length === 0) return;

        const dataToExport = this.alerts.map(item => ({
            'Product Name': item.name,
            'SKU': item.sku || 'N/A',
            'Current Stock': item.stock,
            'Status': item.stock === 0 ? 'Out of Stock' : 'Low Stock',
            'Price': item.price
        }));
        this.exportService.exportToExcel(dataToExport, 'low_stock_alerts_export');
    }

    getSeverityClass(alert: any): string {
        if (alert.stock === 0) return 'critical';
        if (alert.stock < 5) return 'high';
        return 'medium';
    }
}
