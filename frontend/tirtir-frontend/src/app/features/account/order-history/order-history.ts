import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
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
    .page-container{padding:0;max-width:100%}
    h1{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:30px;color:#111}
    .empty-state{text-align:center;padding:50px;background:#fff;border:1px solid #111}
    .shop-btn{display:inline-block;padding:16px 32px;background:#111;color:#fff;text-decoration:none;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;transition:background 0.2s}
    .shop-btn:hover{background:#333}
    .orders-list{display:grid;gap:20px}
    .order-card{background:#fff;padding:30px;border:1px solid #e0e0e0;cursor:pointer;transition:all 0.3s ease}
    .order-card:hover{border-color:#111;transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,0.06)}
    .order-header{display:flex;justify-content:space-between;margin-bottom:15px}
    .order-id{font-size:14px;font-weight:800;color:#111;text-transform:uppercase}
    .order-status{padding:4px 10px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px}
    .status-pending{border:1px solid #fef3c7;color:#92400e}
    .status-processing{border:1px solid #dbeafe;color:#1e40af}
    .status-shipped{border:1px solid #fce7f3;color:#9f1239}
    .status-delivered{border:1px solid #d1fae5;color:#065f46}
    .order-date{color:#888;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px}
    .order-total{font-size:16px;font-weight:800;color:#111;margin:0}
  `],
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);

  orders: Order[] = [];
  loading = true;

  ngOnInit(): void {
    this.loading = true;

    // Ensure the loading spinner is visible for at least 800ms
    // to provide a stable and premium user experience.
    forkJoin([
      this.orderService.getMyOrders(),
      timer(800)
    ]).subscribe({
      next: ([orders]) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
