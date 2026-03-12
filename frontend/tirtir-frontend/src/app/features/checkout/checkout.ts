import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Cart } from '../../core/models';
// import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './checkout.html',
    styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cartService = inject(CartService);
    private orderService = inject(OrderService);
    private router = inject(Router);
    private http = inject(HttpClient);
    private toastService = inject(ToastService);

    checkoutForm: FormGroup;
    cart: Cart | null = null;
    loading = false;
    error = '';

    constructor() {
        this.checkoutForm = this.fb.group({
            fullName: ['', Validators.required],
            phone: ['', Validators.required],
            address: ['', Validators.required],
            ward: [''],           // Phường / xã (optional but sent to GHN)
            district: [''],       // Quận / huyện (optional but sent to GHN)
            city: ['', Validators.required],
            paymentMethod: ['VNPAY', Validators.required],
        });
    }

    ngOnInit(): void {
        // Load cart data first
        this.loading = true;
        this.cartService.getCart().subscribe({
            next: (cart) => {
                this.cart = cart;
                this.loading = false;
                if (!cart || cart.items.length === 0) {
                    this.router.navigate(['/cart']);
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = 'Failed to load cart';
                this.router.navigate(['/cart']);
            }
        });
    }

    onSubmit(): void {
        if (this.checkoutForm.invalid || !this.cart) {
            this.checkoutForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = '';

        const { fullName, phone, address, ward, district, city, paymentMethod } = this.checkoutForm.value;

        // 1. CHẶN MOMO TRUỚC KHI GỌI API (Vì đang bảo trì)
        if (paymentMethod === 'MOMO') {
            this.toastService.warning('Ví Momo đang bảo trì. Vui lòng chọn VNPay.');
            this.loading = false;
            return;
        }

        this.orderService.createOrder({
            shippingAddress: { fullName, phone, address, ward: ward || '', district: district || '', city },
            paymentMethod,
        }).subscribe({
            next: (response: any) => {
                // 2. CHUYỂN HƯỚNG THANH TOÁN LUÔN (KHÔNG CÒN CASE COD)
                if (paymentMethod === 'VNPAY' || paymentMethod === 'CARD') {
                    this.createVnPayUrl(response.orderId, paymentMethod);
                }
            },
            error: (err) => {
                this.loading = false;
                console.error('Full Checkout Error:', err);
                this.error = err.error?.message || err.message || 'Lỗi đặt hàng';
            },
        });
    }

    // Hàm createVnPayUrl KHÔNG truyền amount từ UI nữa
    createVnPayUrl(orderId: string, method: string): void {
        const body = {
            orderId: orderId,
            paymentMethod: method === 'CARD' ? 'CARD' : 'VNPAY',
            bankCode: ''
        };
        this.http.post<{ paymentUrl: string }>(`${environment.apiUrl}/payments/create-url`, body)
            .subscribe({
                next: (res) => window.location.href = res.paymentUrl,
                error: (err) => {
                    this.loading = false;
                    this.toastService.error('Lỗi kết nối cổng thanh toán');
                }
            });
    }
    getImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const backendBase = environment.apiUrl.replace('/api/v1', '');
        return `${backendBase}/${url.startsWith('/') ? url.substring(1) : url}`;
    }

    onImageError(event: any): void {
        event.target.src = 'assets/placeholder-product.png';
    }

    getSubtotal(): number {
        if (!this.cart || !this.cart.items) return 0;
        return this.cart.items.reduce((sum, item) => sum + ((item.product?.Price || 0) * item.quantity), 0);
    }

    getTotal(): number {
        const subtotal = this.getSubtotal();
        const discountAmount = this.cart?.discountAmount || 0;
        return subtotal - discountAmount;
    }

    getFieldError(fieldName: string): string {
        const field = this.checkoutForm.get(fieldName);
        return field && field.invalid && field.touched ? 'This field is required' : '';
    }
}
