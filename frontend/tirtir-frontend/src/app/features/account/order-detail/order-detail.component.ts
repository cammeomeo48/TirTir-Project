import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { UserService } from '../../../core/services/user.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="order-detail-page">
      <div class="page-header">
        <button class="back-btn" routerLink="/account/orders">← Back to Orders</button>
        <h1>Order Details</h1>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <div class="skeleton-wrap">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-card"></div>
        </div>
        <p>Loading order details...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <div class="error-icon">⚠️</div>
        <h3>Order Not Found</h3>
        <p>{{ error }}</p>
        <button class="btn-primary" routerLink="/shop">Continue Shopping</button>
      </div>

      <!-- Order Content -->
      <div class="order-content" *ngIf="order && !loading && !error">
        <!-- Order Header -->
        <div class="order-info-card">
          <div class="info-row">
            <span class="label">Order ID:</span>
            <span class="value">#{{ order._id?.slice(-6) | uppercase }}</span>
          </div>
          <div class="info-row">
            <span class="label">Date:</span>
            <span class="value">{{ order.createdAt | date:'medium' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Total Amount:</span>
            <span class="value highlight">{{ order.totalAmount | currency:'VND':'symbol':'1.0-0' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span>
            <span class="value">{{ getStatusLabel(order.status) }}</span>
          </div>
        </div>

        <!-- Tracking Information Segment -->
        <div class="tracking-banner" *ngIf="order.status !== 'Pending' && order.status !== 'Cancelled'">
          <div class="tracking-content">
            <h4>Chi tiết vận chuyển</h4>
            <ng-container *ngIf="order.trackingNumber; else noTracking">
              <div class="tracking-row">
                <span class="label">Mã vận đơn:</span>
                <span class="value">{{ order.trackingNumber }}</span>
                <button class="copy-btn" (click)="copyTracking(order.trackingNumber)">
                  <span>{{ copied ? '✓ Copied!' : '📋 Copy' }}</span>
                </button>
              </div>
              <div class="tracking-row" *ngIf="order.expectedDeliveryDate">
                <span class="label">Dự kiến giao:</span>
                <span class="value highlight">{{ order.expectedDeliveryDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </ng-container>
            <ng-template #noTracking>
              <div class="shipping-coordination">
                <span class="icon">⏳</span>
                <p>Đang chờ điều phối giao hàng...</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Timeline synced with statusHistory -->
        <div class="timeline-card">
          <h2>Lịch sử trạng thái</h2>
          <div class="timeline-row" *ngFor="let history of timelineHistory; let i = index">
            <div class="timeline-dot" [class.active]="i === timelineHistory.length - 1"></div>
            <div class="timeline-content">
              <div class="timeline-title">{{ getStatusLabel(history.status) }}</div>
              <div class="timeline-time">{{ history.timestamp | date:'dd/MM/yyyy HH:mm' }}</div>
              <div class="timeline-note" *ngIf="history.note">{{ history.note }}</div>
            </div>
          </div>
        </div>

        <div class="review-cta-card" *ngIf="order.status === 'Delivered'">
          <h2>Đánh giá đơn hàng</h2>
          <p>Cảm nhận của bạn giúp cộng đồng mua sắm tốt hơn.</p>
          <button class="btn-primary" (click)="goToReview()">
            {{ hasReviewedAllItems ? 'Xem đánh giá của bạn' : '⭐️ Viết đánh giá sản phẩm' }}
          </button>
        </div>

        <div class="details-grid">
          <!-- Items List -->
          <div class="order-items-card">
            <h2>Purchased Items</h2>
            <div class="items-list">
              <div class="item-row" *ngFor="let item of order.items">
                <div class="item-image">
                  <img [src]="getImageUrl(item)" [alt]="item.name">
                </div>
                <div class="item-details">
                  <h4 class="item-name">{{ item.name }}</h4>
                  <p class="item-meta" *ngIf="item.shade">Shade: {{ item.shade }}</p>
                  <div class="item-price-qty">
                    <span class="qty">Qty: {{ item.quantity }}</span>
                    <span class="price">{{ item.price | currency:'VND':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
                <div class="item-subtotal">
                  {{ (item.price * item.quantity) | currency:'VND':'symbol':'1.0-0' }}
                </div>
              </div>
            </div>
            <div class="order-summary">
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ order.totalAmount | currency:'VND':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Info -->
          <div class="shipping-info-card">
            <h2>Shipping Information</h2>
            <div class="info-content" *ngIf="order.shippingAddress">
              <p class="name">{{ order.shippingAddress.fullName || order.user?.name }}</p>
              <p class="phone">{{ order.shippingAddress.phone || 'N/A' }}</p>
              <p class="address">{{ order.shippingAddress.address }}</p>
              <p class="city">{{ order.shippingAddress.city }}</p>
            </div>
            <div class="payment-method">
              <h3>Payment Method</h3>
              <p>
                <span class="method-badge">{{ order.paymentMethod || 'COD' }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-detail-page {
      padding: 0;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .back-btn {
      background: none;
      border: none;
      color: #666;
      font-size: 13px;
      padding: 0;
      cursor: pointer;
      margin-bottom: 12px;
      transition: color 0.2s;
    }

    .back-btn:hover {
      color: #111;
    }

    h1 {
      font-size: 24px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
      color: #111;
    }

    h2 {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    h3 {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 24px 0 12px;
    }

    /* Cards */
    .order-info-card, .order-items-card, .shipping-info-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 30px;
      margin-bottom: 24px;
      border-radius: 8px; /* Slight rounding for modern feel */
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .timeline-card, .review-cta-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px 30px;
      margin-bottom: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .timeline-row {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px dashed #eee;
    }

    .timeline-row:last-child { border-bottom: none; }
    .timeline-dot {
      width: 10px;
      height: 10px;
      margin-top: 7px;
      border-radius: 50%;
      background: #d1d5db;
      flex-shrink: 0;
    }
    .timeline-dot.active { background: #111; }
    .timeline-title { font-weight: 700; font-size: 14px; color: #111; }
    .timeline-time { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .timeline-note { font-size: 12px; color: #374151; margin-top: 4px; }
    .review-cta-card p { margin: 0 0 14px; font-size: 14px; color: #4b5563; }

    .order-info-card {
      display: flex;
      flex-wrap: wrap;
      gap: 40px;
      background: #fafafa;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-row .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #777;
    }

    .info-row .value {
      font-size: 16px;
      font-weight: 600;
      color: #111;
    }

    .info-row .value.highlight {
      color: #d32f2f;
      font-size: 18px;
    }

    /* Tracking Banner */
    .tracking-banner {
      background: white;
      border: 1px dashed #111;
      border-radius: 8px;
      padding: 20px 30px;
      margin-top: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .tracking-banner h4 {
      font-size: 14px;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      font-weight: 800;
      color: #111;
      letter-spacing: 1px;
    }
    .tracking-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .tracking-row .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .tracking-row .value {
      font-size: 15px;
      font-weight: 700;
      color: #111;
    }
    .tracking-row .value.highlight {
      color: #065f46;
    }
    .copy-btn {
      background: #f5f5f5;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      color: #111;
      text-transform: uppercase;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      background: #111;
      color: white;
    }
    .shipping-coordination {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #b45309;
      background: #fffbeb;
      padding: 12px 20px;
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }
    .shipping-coordination .icon {
      font-size: 18px;
    }
    .shipping-coordination p {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
    }

    /* Grid Layout */
    .details-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .details-grid {
        grid-template-columns: 1fr;
      }
      
      .timeline-card, .review-cta-card { padding: 18px; }
    }

    /* Items List */
    .item-row {
      display: flex;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
    }

    .item-image {
      width: 70px;
      height: 70px;
      flex-shrink: 0;
      border: 1px solid #eee;
      border-radius: 4px;
      overflow: hidden;
      margin-right: 20px;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .item-details {
      flex: 1;
    }

    .item-name {
      font-size: 14px;
      font-weight: 600;
      color: #111;
      margin: 0 0 6px 0;
    }

    .item-meta {
      font-size: 12px;
      color: #777;
      margin: 0 0 8px 0;
    }

    .item-price-qty {
      font-size: 13px;
      color: #555;
    }

    .item-price-qty .qty {
      margin-right: 12px;
    }

    .item-subtotal {
      font-weight: 700;
      font-size: 15px;
      color: #111;
    }

    .order-summary {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 2px solid #111;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
    }

    .summary-row.total {
      font-weight: 800;
      text-transform: uppercase;
      color: #111;
    }

    /* Shipping Info */
    .info-content p {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #444;
      line-height: 1.5;
    }

    .info-content .name {
      font-weight: 700;
      color: #111;
      font-size: 15px;
    }

    .method-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      color: #111;
      text-transform: uppercase;
    }

    /* Loading & Error */
    .loading-state, .error-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #111;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .skeleton-wrap { margin: 12px auto 14px; max-width: 380px; }
    .skeleton {
      background: linear-gradient(90deg, #f2f2f2 25%, #e8e8e8 37%, #f2f2f2 63%);
      background-size: 400% 100%;
      animation: shimmer 1.2s ease-in-out infinite;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .skeleton-line { height: 12px; width: 100%; }
    .skeleton-line.short { width: 60%; margin: 0 auto 10px; }
    .skeleton-card { height: 80px; width: 100%; }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: 0 0; }
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .btn-primary {
      display: inline-block;
      background: #111;
      color: white;
      padding: 12px 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      font-size: 12px;
      border: none;
      cursor: pointer;
      margin-top: 20px;
      text-decoration: none;
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #333;
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private userService = inject(UserService);

  order: any = null;
  loading: boolean = true;
  error: string | null = null;
  copied: boolean = false;
  myReviewedProductIds = new Set<string>();

  readonly statusLabels: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Processing: 'Đang xử lý',
    Shipped: 'Đang giao hàng',
    Delivered: 'Giao hàng thành công',
    Cancelled: 'Đã hủy'
  };

  get timelineHistory(): any[] {
    const history = this.order?.statusHistory;
    if (Array.isArray(history) && history.length > 0) return history;
    return [{ status: this.order?.status || 'Pending', timestamp: this.order?.updatedAt || this.order?.createdAt, note: '' }];
  }

  get hasReviewedAllItems(): boolean {
    if (!this.order?.items?.length) return false;
    return this.order.items.every((item: any) => {
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      return !!productId && this.myReviewedProductIds.has(String(productId));
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchOrderDetails(id);
      } else {
        this.error = "Invalid order ID.";
        this.loading = false;
      }
    });
  }

  fetchOrderDetails(id: string) {
    this.loading = true;
    this.error = null;
    forkJoin({
      order: this.orderService.getOrderById(id),
      myReviews: this.userService.getMyReviews().pipe(catchError(() => of([])))
    }).pipe(
      catchError((err: any) => {
        this.error = err.message || "Failed to load order details.";
        this.loading = false;
        return of(null);
      })
    ).subscribe((payload: any) => {
      if (payload?.order) {
        this.order = payload.order;
      }
      const reviews = payload?.myReviews || [];
      this.myReviewedProductIds = new Set(
        reviews
          .map((r: any) => r?.product?._id || r?.product)
          .filter((x: any) => !!x)
          .map((x: any) => String(x))
      );
      this.loading = false;
    });
  }

  copyTracking(trackingNumber: string) {
    if (navigator.clipboard && trackingNumber) {
      navigator.clipboard.writeText(trackingNumber).then(() => {
        this.copied = true;
        setTimeout(() => this.copied = false, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  }

  getImageUrl(item: any): string {
    if (item.image) {
      if (Array.isArray(item.image) && item.image.length > 0) return item.image[0];
      if (typeof item.image === 'string') {
        const parts = item.image.split(',');
        return parts[0].trim();
      }
    }
    if (item.product?.Thumbnail_Images) {
      return item.product.Thumbnail_Images;
    }
    return 'assets/images/placeholder.jpg';
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status || 'N/A';
  }

  goToReview() {
    const firstItem = this.order?.items?.find((item: any) => {
      const productId = typeof item.product === 'object' ? item.product?._id : item.product;
      return !!productId;
    });
    const slug = firstItem?.product?.slug;
    if (!slug) {
      this.router.navigate(['/account/orders']);
      return;
    }
    this.router.navigate(['/products', slug], {
      queryParams: { writeReview: this.hasReviewedAllItems ? 0 : 1, orderId: this.order?._id },
      fragment: 'reviews-section'
    });
  }
}
