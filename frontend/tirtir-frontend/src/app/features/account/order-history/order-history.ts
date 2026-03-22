import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div class="eyebrow">My Account</div>
        <div class="page-title">Order History</div>
        <div class="order-count" *ngIf="!loading">{{ filteredOrders.length }} {{ filteredOrders.length === 1 ? 'order' : 'orders' }}</div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button class="tab" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">All</button>
        <button class="tab" [class.active]="activeFilter === 'pending'" (click)="setFilter('pending')">Pending</button>
        <button class="tab" [class.active]="activeFilter === 'delivered'" (click)="setFilter('delivered')">Delivered</button>
        <button class="tab" [class.active]="activeFilter === 'cancelled'" (click)="setFilter('cancelled')">Cancelled</button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && filteredOrders.length === 0">
        <p>No orders found</p>
        <a routerLink="/shop" class="shop-link">Start Shopping</a>
      </div>

      <!-- Orders List -->
      <div class="orders-list" *ngIf="!loading && filteredOrders.length > 0">
        <div class="order-row" *ngFor="let order of pagedOrders" [routerLink]="['/account/orders', order._id]"
             [class.cancelled]="order.status === 'Cancelled'">

          <!-- Top: ID + Status dot+text + Price + Arrow -->
          <div class="order-top">
            <span class="order-id">#{{ order._id.slice(-8).toUpperCase() }}</span>
            <span class="status-label" [ngClass]="'s-' + order.status.toLowerCase().replace(' ', '-')">
              <span class="status-dot"></span>{{ order.status }}
            </span>
            <span class="order-price" [class.cancelled-price]="order.status === 'Cancelled'">
              {{ order.totalAmount | currency:'USD':'symbol':'1.2-2' }}
            </span>
            <svg class="row-arrow" viewBox="0 0 10 10" fill="none">
              <path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Middle: Thumbnails + item names -->
          <div class="order-preview">
            <div class="thumbs">
              <div class="thumb" *ngFor="let item of order.items.slice(0, 2)">
                <img [src]="getItemImage(item)" [alt]="item.name" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Cpath d=\'M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0 25a10 10 0 1 1 0-20 10 10 0 0 1 0 20z\' fill=\'%23d1d5db\'/%3E%3C/svg%3E'">
              </div>
              <div class="thumb thumb-more" *ngIf="order.items.length > 2">
                +{{ order.items.length - 2 }}
              </div>
            </div>
            <div class="item-names">
              <div class="item-first">{{ order.items[0].name }}</div>
              <div class="item-more" *ngIf="order.items.length > 1">
                &amp; {{ order.items.length - 1 }} more {{ order.items.length - 1 === 1 ? 'item' : 'items' }}
              </div>
            </div>
          </div>

          <!-- Bottom: Date + item count -->
          <div class="order-meta">
            <span>{{ order.createdAt | date:'dd/MM/yyyy · hh:mm a' }}</span>
            <span class="meta-sep">·</span>
            <span>{{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}</span>
          </div>

        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!loading && totalPages > 1">
        <button class="pg-btn pg-prev" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
          <svg viewBox="0 0 10 10" fill="none"><path d="M7 1L3 5L7 9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="pg-btn pg-num"
          *ngFor="let p of pageNumbers"
          [class.active]="p === currentPage"
          (click)="goToPage(p)">{{ p }}</button>
        <button class="pg-btn pg-next" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
          <svg viewBox="0 0 10 10" fill="none"><path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 0; max-width: 100%; }

    /* ── Header ── */
    .page-header { margin-bottom: 1.5rem; }
    .eyebrow {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-accent, #D32F2F);
      margin-bottom: 6px;
    }
    .page-title {
      font-family: var(--font-display, 'Playfair Display', Georgia, serif);
      font-size: 32px;
      font-weight: 500;
      line-height: 1.1;
      color: var(--color-text, #111);
      margin-bottom: 6px;
    }
    .order-count {
      font-size: 12px;
      color: var(--color-text-muted, #888);
    }

    /* ── Filter Tabs (underline style) ── */
    .filter-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e8e6e1;
    }
    .tab {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 500;
      padding: 8px 16px 9px;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--color-text-muted, #888);
      cursor: pointer;
      transition: all 0.15s;
      margin-bottom: -1px;
    }
    .tab:hover { color: var(--color-text, #111); }
    .tab.active {
      color: var(--color-text, #111);
      border-bottom-color: var(--color-text, #111);
    }

    /* ── Orders List ── */
    .orders-list { border-top: 1px solid #e8e6e1; }

    .order-row {
      padding: 20px 0;
      border-bottom: 1px solid #e8e6e1;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: background 0.15s;
    }
    .order-row:hover { background: #fafaf8; }
    .order-row.cancelled .item-first,
    .order-row.cancelled .item-more { color: var(--color-text-muted, #aaa); }

    /* Top row */
    .order-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .order-id {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text, #111);
      letter-spacing: 0.04em;
    }

    /* Status: dot + text, no pill */
    .status-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }
    .s-delivered    { color: #2a6f07; }
    .s-shipped      { color: #1d4ed8; }
    .s-processing   { color: #b45309; }
    .s-pending      { color: #b45309; }
    .s-cancelled    { color: #9ca3af; }
    .s-order-placed { color: #9ca3af; }

    /* Price — display font, auto-push right */
    .order-price {
      font-family: var(--font-display, 'Playfair Display', Georgia, serif);
      font-size: 20px;
      font-weight: 500;
      color: var(--color-text, #111);
      margin-left: auto;
      line-height: 1;
    }
    .cancelled-price {
      text-decoration: line-through;
      color: var(--color-text-muted, #aaa);
      font-size: 16px;
    }

    /* Arrow — hidden, appears on hover */
    .row-arrow {
      width: 10px;
      height: 10px;
      color: var(--color-text-muted, #aaa);
      flex-shrink: 0;
      opacity: 0;
      transform: translateX(-4px);
      transition: opacity 0.15s, transform 0.15s;
    }
    .order-row:hover .row-arrow {
      opacity: 1;
      transform: translateX(0);
    }

    /* Preview row */
    .order-preview {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .thumbs {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .thumb {
      position: relative;
      width: 44px;
      height: 44px;
      background: #fafaf8;
      border: 1px solid #e8e6e1;
      overflow: hidden;
      flex-shrink: 0;
    }
    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* +N as a separate box, not an overlay */
    .thumb-more {
      background: #f0efed;
      border-color: #e8e6e1;
      font-size: 11px;
      font-weight: 500;
      color: var(--color-text-muted, #888);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-names { flex: 1; min-width: 0; }
    .item-first {
      font-size: 13px;
      color: var(--color-text, #111);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-more {
      font-size: 11px;
      color: var(--color-text-muted, #888);
      margin-top: 2px;
    }

    /* Meta row */
    .order-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--color-text-muted, #888);
    }
    .meta-sep { opacity: 0.4; }

    /* ── Loading ── */
    .loading-state { padding: 60px 0; display: flex; justify-content: center; }
    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid #e8e6e1;
      border-top-color: var(--color-text, #111);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Empty ── */
    .empty-state { padding: 60px 0; text-align: center; }
    .empty-state p { font-size: 13px; color: var(--color-text-muted, #888); margin-bottom: 16px; }
    .shop-link {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      padding: 10px 24px;
      border: 1px solid var(--color-text, #111);
      color: var(--color-text, #111);
      text-decoration: none;
      transition: all 0.15s;
    }
    .shop-link:hover { background: var(--color-text, #111); color: #fff; }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 24px 0 8px;
    }
    .pg-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-muted, #888);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.05em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .pg-btn svg { width: 10px; height: 10px; }
    .pg-btn:hover:not(:disabled):not(.active) {
      color: var(--color-text, #111);
      border-color: #e8e6e1;
    }
    .pg-btn.active {
      background: var(--color-text, #111);
      color: #fff;
      border-color: var(--color-text, #111);
    }
    .pg-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }
  `],
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);

  orders: Order[] = [];
  loading = true;
  activeFilter = 'all';
  currentPage = 1;
  readonly pageSize = 5;

  get filteredOrders(): Order[] {
    if (this.activeFilter === 'all') return this.orders;
    return this.orders.filter(o => o.status.toLowerCase() === this.activeFilter);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  get pagedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  ngOnInit(): void {
    forkJoin([
      this.orderService.getMyOrders(),
      timer(600)
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

  getItemImage(item: any): string {
    if (item.image) {
      if (Array.isArray(item.image) && item.image.length > 0) return item.image[0];
      if (typeof item.image === 'string') return item.image.split(',')[0].trim();
    }
    if (item.product?.Thumbnail_Images) return item.product.Thumbnail_Images;
    return 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Cpath d=\'M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0 25a10 10 0 1 1 0-20 10 10 0 0 1 0 20z\' fill=\'%23d1d5db\'/%3E%3C/svg%3E';
  }
}
