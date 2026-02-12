import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Cart, CartItem } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
    templateUrl: './cart.html',
    styleUrls: ['./cart.css'],
})
export class CartComponent implements OnInit {
    cartService = inject(CartService);
    authService = inject(AuthService);
    router = inject(Router);

    cart: Cart | null = null;
    loading = true;
    error = '';
    promoCode = '';

    ngOnInit(): void {
        this.loadCart();
    }

    loadCart(): void {
        this.loading = true;
        this.cartService.getCart().subscribe({
            next: (cart) => {
                this.cart = cart;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.message;
                this.loading = false;
            },
        });
    }

    updateQuantity(item: CartItem, newQuantity: number): void {
        if (newQuantity < 1) return;

        this.cartService.addToCart({
            productId: item.product._id,
            quantity: newQuantity,
            shade: item.shade,
        }).subscribe({
            next: () => {
                this.loadCart();
            },
            error: (err) => {
                this.error = err.message;
            },
        });
    }

    getImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `http://localhost:5001/${cleanUrl}`;
    }

    getSubtotal(): number {
        if (!this.cart) return 0;
        return this.cart.totalPrice || 0;
    }

    getShipping(): number {
        return 0; // Free shipping
    }

    getTotal(): number {
        return this.getSubtotal() + this.getShipping();
    }

    goToCheckout(): void {
        this.router.navigate(['/checkout']);
    }

    continueShoppping(): void {
        this.router.navigate(['/shop']);
    }

    applyPromoCode(): void {
        if (!this.promoCode.trim()) return;
        // TODO: Implement promo code application with backend
        console.log('Applying promo code:', this.promoCode);
        // For now, just show a message
        alert('Promo code functionality will be available soon!');
    }

    removeItem(item: CartItem): void {
        if (!confirm('Remove this item from your cart?')) return;

        // Set quantity to 0 to remove item
        this.cartService.addToCart({
            productId: item.product._id,
            quantity: 0,
            shade: item.shade,
        }).subscribe({
            next: () => {
                this.loadCart();
            },
            error: (err) => {
                this.error = err.message;
            },
        });
    }
}
