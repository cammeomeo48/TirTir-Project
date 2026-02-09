import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { ProductData } from '../../core/constants/products.data';

@Component({
    selector: 'app-gift-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gift-card.html',
    styleUrl: './gift-card.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GiftCardComponent {
    private cartService = inject(CartService);

    // Mock product data for the gift card
    giftCardProduct: ProductData = {
        id: 'tirtir-gift-card',
        slug: 'tirtir-gift-card',
        name: 'TIRTIR GIFT CARD',
        price: 10, // Default price
        description: 'Shopping for someone else but not sure what to give them? Give them the gift of choice with a TIRTIR gift card.',
        images: ['https://tirtir.global/cdn/shop/files/gift_card_600x.jpg?v=1704870562'], // Placeholder or use a local asset if available
        category: 'Gift Card',
        rating: 5,
        reviewCount: 0,
        fullDescription: 'Give the gift of choice with a TIRTIR gift card.',
        keyFeatures: ['Valid for all products', 'No expiration date'],
        howToUse: 'Redeem at checkout.',
        ingredients: 'N/A',
        descriptionImages: []
    };

    selectedAmount = 10;
    amounts = [10, 25, 50, 100];

    // Map amounts to backend Product IDs
    private giftCardIds: { [key: number]: string } = {
        10: 'tirtir-gift-card-10',
        25: 'tirtir-gift-card-25',
        50: 'tirtir-gift-card-50',
        100: 'tirtir-gift-card-100'
    };

    selectAmount(amount: number) {
        this.selectedAmount = amount;
        this.giftCardProduct.price = amount;
    }

    addToCart() {
        const productId = this.giftCardIds[this.selectedAmount];
        if (!productId) {
            alert('Invalid amount selected');
            return;
        }

        this.cartService.addToCart({ productId, quantity: 1 }).subscribe({
            next: () => alert(`Gift Card ($${this.selectedAmount}) added to cart!`),
            error: (err) => alert('Failed to add to cart: ' + err.message)
        });
    }
}
