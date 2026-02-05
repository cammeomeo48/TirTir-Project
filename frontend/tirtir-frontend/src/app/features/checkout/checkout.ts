import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Cart } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
    templateUrl: './checkout.html',
    styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cartService = inject(CartService);
    private orderService = inject(OrderService);
    private router = inject(Router);
    private http = inject(HttpClient);

    checkoutForm: FormGroup;
    cart: Cart | null = null;
    loading = false;
    error = '';

    constructor() {
        this.checkoutForm = this.fb.group({
            fullName: ['', Validators.required],
            phone: ['', Validators.required],
            address: ['', Validators.required],
            city: ['', Validators.required],
            paymentMethod: ['VNPAY', Validators.required],
        });
    }

    ngOnInit(): void {
        this.cartService.cart$.subscribe(cart => {
            this.cart = cart;
            if (!cart || cart.items.length === 0) {
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

        const { fullName, phone, address, city, paymentMethod } = this.checkoutForm.value;

        this.orderService.createOrder({
            shippingAddress: { fullName, phone, address, city },
            paymentMethod,
        }).subscribe({
            next: (response: any) => {
                // 2. CHUYỂN HƯỚNG THANH TOÁN LUÔN (KHÔNG CÒN CASE COD)
                if (paymentMethod === 'VNPAY' || paymentMethod === 'CARD') {
                    this.createVnPayUrl(response.orderId, this.getTotal(), paymentMethod);
                } else if (paymentMethod === 'MOMO') {
                    // Logic Momo (Sắp có)
                    alert('Ví Momo đang bảo trì. Vui lòng chọn VNPay.');
                    this.loading = false;
                    // Hoặc chuyển hướng nếu đã tích hợp xong
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Lỗi đặt hàng';
            },
        });
    }

    // Hàm createVnPayUrl giữ nguyên như cũ
    createVnPayUrl(orderId: string, amount: number, method: string): void {
        const body = {
            orderId: orderId,
            amount: amount,
            paymentMethod: method === 'CARD' ? 'CARD' : 'VNPAY',
            bankCode: '' 
        };
        this.http.post<{ paymentUrl: string }>('http://localhost:5000/api/payments/create-url', body)
            .subscribe({
                next: (res) => window.location.href = res.paymentUrl,
                error: (err) => {
                    this.loading = false;
                    alert('Lỗi kết nối cổng thanh toán');
                }
            });
    }
    getImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://localhost:5001/${url.startsWith('/') ? url.substring(1) : url}`;
    }

    getTotal(): number {
        return this.cart?.totalPrice || 0;
    }

    getFieldError(fieldName: string): string {
        const field = this.checkoutForm.get(fieldName);
        return field && field.invalid && field.touched ? 'This field is required' : '';
    }
}
