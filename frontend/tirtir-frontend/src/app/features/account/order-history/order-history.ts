import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <h1>Order History</h1>
      <div *ngIf="loading"><app-loading-spinner></app-loading-spinner></div>
      <div *ngIf="!loading && orders.length === 0" class="empty-state">
        <p>No orders yet</p>
        <a routerLink="/shop" class="shop-btn">Start Shopping</a>
      </div>
      <div *ngIf="!loading && orders.length > 0" class="orders-list">
        <div *ngFor="let order of orders" class="order-card" [routerLink]="['/account/orders', order._id]">
          <div class="order-header">
            <span class="order-id">Order #{{ order._id.slice(-8) }}</span>
            <span class="order-status" [class]="'status-' + order.status.toLowerCase()">{{ order.status }}</span>
          </div>
          <p class="order-date">{{ order.createdAt | date:'medium' }}</p>
          <p class="order-total">\${{ order.totalAmount }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container{padding:2rem;max-width:1000px;margin:0 auto}
    h1{font-size:2rem;font-weight:600;margin-bottom:2rem;color:#1a1a1a}
    .empty-state{text-align:center;padding:3rem;background:#fff;border-radius:8px}
    .shop-btn{display:inline-block;padding:0.875rem 2rem;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px;margin-top:1rem}
    .orders-list{display:grid;gap:1rem}
    .order-card{background:#fff;padding:1.5rem;border-radius:8px;cursor:pointer;transition:all 0.2s}
    .order-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .order-header{display:flex;justify-content:space-between;margin-bottom:0.5rem}
    .order-id{font-weight:600;color:#1a1a1a}
    .order-status{padding:0.25rem 0.75rem;border-radius:4px;font-size:0.813rem;font-weight:500}
    .status-pending{background:#fef3c7;color:#92400e}
    .status-processing{background:#dbeafe;color:#1e40af}
    .status-shipped{background:#fce7f3;color:#9f1239}
    .status-delivered{background:#d1fae5;color:#065f46}
    .order-date{color:#666;font-size:0.875rem;margin:0.25rem 0}
    .order-total{font-size:1.125rem;font-weight:600;color:#1a1a1a;margin:0}
  `],
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);

  orders: Order[] = [];
  loading = true;

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
