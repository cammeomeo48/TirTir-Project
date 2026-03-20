import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order, StatusHistory } from '../../../core/services/order.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './order-detail.html',
    styleUrls: ['./order-detail.css']
})
export class OrderDetailComponent implements OnInit {
    order: Order | null = null;
    loading = true;
    error: string | null = null;
    updateError: string | null = null;
    updateSuccess = false;
    selectedStatus = '';
    statusNote = '';
    updating = false;

    statusOptions = [
        'Pending',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled'
    ];

    constructor(
        private route: ActivatedRoute,
        private orderService: OrderService
    ) { }

    ngOnInit(): void {
        const orderId = this.route.snapshot.paramMap.get('id');
        if (orderId) {
            this.loadOrder(orderId);
        }
    }

    loadOrder(id: string): void {
        this.loading = true;
        this.error = null;

        this.orderService.getOrderById(id).subscribe({
            next: (data: any) => {
                this.order = data;
                this.selectedStatus = data.status;
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load order details';
                this.loading = false;
                console.error('Order load error:', err);
            }
        });
    }

    updateStatus(): void {
        if (!this.order || this.updating || this.selectedStatus === this.order.status) {
            return;
        }

        this.updating = true;
        this.updateError = null;
        this.updateSuccess = false;

        this.orderService.updateOrderStatus(
            this.order._id,
            this.selectedStatus,
            this.statusNote.trim() || undefined
        ).subscribe({
            next: (updatedOrder: any) => {
                if (this.order) {
                    this.order.status = updatedOrder.status;
                    if (updatedOrder.status_history) {
                        this.order.status_history = updatedOrder.status_history;
                    }
                }
                this.statusNote = '';
                this.updating = false;
                this.updateSuccess = true;
                setTimeout(() => this.updateSuccess = false, 3000);
            },
            error: (err: any) => {
                this.updateError = err.error?.message || 'Failed to update order status. Please try again.';
                this.updating = false;
            }
        });
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
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatPrice(price: number): string {
        return `$${price?.toFixed(2) || '0.00'}`;
    }

    getItemSubtotal(item: any): number {
        return (item.price || item.Price || 0) * (item.quantity || item.Quantity || 0);
    }

    /** Computed sum of all item line totals */
    get itemsSubtotal(): number {
        if (!this.order?.items) return 0;
        return this.order.items.reduce((sum: number, item: any) => {
            return sum + (item.price || item.Price || 0) * (item.quantity || item.Quantity || 0);
        }, 0);
    }

    /** Resolve image URL using same pattern as Inventory page */
    resolveImage(path: string): string {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const base = environment.apiUrl.replace('/api/v1', '');
        const clean = path.startsWith('/') ? path.slice(1) : path;
        return `${base}/${clean}`;
    }

    printInvoice(): void {
        window.print();
    }
}
