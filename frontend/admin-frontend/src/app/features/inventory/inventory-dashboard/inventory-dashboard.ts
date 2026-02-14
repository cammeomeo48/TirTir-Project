import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService, InventoryStats } from '../../../core/services/inventory.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
    selector: 'app-inventory-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './inventory-dashboard.html',
    styleUrls: ['./inventory-dashboard.css']
})
export class InventoryDashboardComponent implements OnInit {
    stats: InventoryStats | null = null;
    alerts: any[] = [];
    loading = true;
    error: string | null = null;
    statsLoading = true;

    constructor(
        private inventoryService: InventoryService,
        private exportService: ExportService
    ) { }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.loading = true;
        this.error = null;

        // Load stats and alerts in parallel (mock-style)
        this.inventoryService.getInventoryStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.statsLoading = false;
            },
            error: (err) => {
                console.error('Stats load error:', err);
                this.statsLoading = false;
                // Mock stats for now if backend fails
                this.stats = {
                    totalProducts: 45,
                    lowStockItems: 3,
                    outOfStockItems: 1,
                    totalValue: 25000
                };
            }
        });

        this.inventoryService.getLowStockAlerts().subscribe({
            next: (data) => {
                this.alerts = Array.isArray(data) ? data : [];
                this.loading = false;
            },
            error: (err) => {
                console.error('Alerts load error:', err);
                this.loading = false;
                this.error = 'Failed to load inventory alerts';
            }
        });
    }

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

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }
}
