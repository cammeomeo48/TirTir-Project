import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../core/services/order.service';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './order-list.html',
    styleUrls: ['./order-list.css']
})
export class OrderListComponent implements OnInit {
    orders: Order[] = [];
    filteredOrders: Order[] = [];
    loading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    pageSize = 20;
    totalPages = 1;

    // Filters
    selectedStatus = '';
    selectedDateRange = 'all';
    searchQuery = '';

    statusOptions = [
        { value: '', label: 'All Orders' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Shipped', label: 'Shipped' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' }
    ];

    constructor(private orderService: OrderService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.error = null;

        this.orderService.getAllOrders().subscribe({
            next: (data: any) => {
                // Handle both array and wrapped object response
                this.orders = Array.isArray(data) ? data : (data.orders || data.data || []);
                this.applyFilters();
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load orders';
                this.loading = false;
                console.error('Order load error:', err);
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.orders];

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.Order_ID?.toLowerCase().includes(query) ||
                o.User?.Name?.toLowerCase().includes(query) ||
                o.User?.Email?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (this.selectedStatus) {
            filtered = filtered.filter(o => o.Order_Status === this.selectedStatus);
        }

        // Date range filter
        if (this.selectedDateRange !== 'all') {
            const now = new Date();
            const startDate = new Date();

            switch (this.selectedDateRange) {
                case '7days':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30days':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case '90days':
                    startDate.setDate(now.getDate() - 90);
                    break;
            }

            filtered = filtered.filter(o => new Date(o.createdAt) >= startDate);
        }

        this.filteredOrders = filtered;
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        this.currentPage = 1;
    }

    getPaginatedOrders(): Order[] {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredOrders.slice(start, end);
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    onStatusChange(): void {
        this.applyFilters();
    }

    onDateRangeChange(): void {
        this.applyFilters();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    getStatusClass(status: string): string {
        const statusMap: { [key: string]: string } = {
            'Pending': 'status-pending',
            'Processing': 'status-processing',
            'Shipped': 'status-shipped',
            'Delivered': 'status-delivered',
            'Cancelled': 'status-cancelled'
        };
        return statusMap[status] || 'status-default';
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatPrice(price: number): string {
        return `$${price?.toFixed(2) || '0.00'}`;
    }
}
