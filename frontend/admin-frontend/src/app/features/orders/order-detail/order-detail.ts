import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order, StatusHistory } from '../../../core/services/order.service';

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

        this.orderService.updateOrderStatus(
            this.order._id,
            this.selectedStatus,
            this.statusNote.trim() || undefined
        ).subscribe({
            next: (updatedOrder: any) => {
                if (this.order) {
                    this.order.status = updatedOrder.status;
                    // Note: status_history might not be on the interface yet, let's ignore or add it
                }
                this.statusNote = '';
                this.updating = false;
            },
            error: (err: any) => {
                console.error('Status update error:', err);
                this.updating = false;
                alert('Failed to update order status');
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
        return (item.Price || 0) * (item.Quantity || 0);
    }

    printInvoice(): void {
        window.print();
    }
}
