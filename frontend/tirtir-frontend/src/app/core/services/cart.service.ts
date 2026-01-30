import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { Cart, AddToCartRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private apiUrl = `${environment.apiUrl}/cart`;
    private http = inject(HttpClient);

    // Cart state management
    private cartSubject = new BehaviorSubject<Cart | null>(null);
    public cart$ = this.cartSubject.asObservable();

    // Signal-based cart count for header badge
    private cartCountSignal = signal<number>(0);
    public cartCount = computed(() => this.cartCountSignal());

    constructor() {
        // Load cart on initialization if user is authenticated
        this.loadCart();
    }

    /**
     * Load cart from backend
     */
    loadCart(): void {
        this.getCart().subscribe({
            next: (cart) => {
                this.cartSubject.next(cart);
                this.updateCartCount(cart);
            },
            error: (error) => {
                // Cart might be empty or user not authenticated
                console.log('Cart load info:', error.message);
                this.cartSubject.next(null);
                this.cartCountSignal.set(0);
            },
        });
    }

    /**
     * Get cart from backend
     */
    getCart(): Observable<Cart> {
        return this.http.get<Cart>(this.apiUrl).pipe(catchError(this.handleError));
    }

    /**
     * Add item to cart
     */
    addToCart(item: AddToCartRequest): Observable<Cart> {
        return this.http.post<Cart>(`${this.apiUrl}/add`, item).pipe(
            tap((cart) => {
                this.cartSubject.next(cart);
                this.updateCartCount(cart);
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Update cart item quantity
     * Backend handles this through the same add endpoint
     */
    updateCartItem(productId: string, quantity: number, shade?: string): Observable<Cart> {
        return this.addToCart({ productId, quantity, shade });
    }

    /**
     * Remove item from cart (set quantity to 0)
     */
    removeCartItem(productId: string, shade?: string): Observable<Cart> {
        // Backend doesn't have explicit remove endpoint
        // We'll need to handle this by fetching cart, filtering item, and updating
        // For now, we'll reload cart after manual removal
        return this.getCart().pipe(
            tap((cart) => {
                this.cartSubject.next(cart);
                this.updateCartCount(cart);
            })
        );
    }

    /**
     * Clear cart (called after successful order)
     */
    clearCart(): void {
        this.cartSubject.next(null);
        this.cartCountSignal.set(0);
    }

    /**
     * Get current cart value (synchronous)
     */
    get currentCartValue(): Cart | null {
        return this.cartSubject.value;
    }

    /**
     * Update cart count signal
     */
    private updateCartCount(cart: Cart | null): void {
        if (cart && cart.items) {
            const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            this.cartCountSignal.set(totalCount);
        } else {
            this.cartCountSignal.set(0);
        }
    }

    /**
     * Error handler
     */
    private handleError(error: any): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error?.message) {
            errorMessage = error.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('Cart Error:', error);
        return throwError(() => new Error(errorMessage));
    }
}
