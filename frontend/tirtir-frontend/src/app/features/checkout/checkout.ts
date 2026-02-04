import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Cart } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';

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
            paymentMethod: ['COD', Validators.required],
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
            next: (response) => {
                this.loading = false;
                this.router.navigate(['/order-confirmation', response.orderId]);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.message || 'Failed to place order';
            },
        });
    }

    getImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000/${url.startsWith('/') ? url.substring(1) : url}`;
    }

    getTotal(): number {
        return this.cart?.totalPrice || 0;
    }

    getFieldError(fieldName: string): string {
        const field = this.checkoutForm.get(fieldName);
        return field && field.invalid && field.touched ? 'This field is required' : '';
    }
}
