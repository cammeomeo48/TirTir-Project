import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ProductData } from '../../core/constants/products.data';

interface Deal {
    title: string;
    description: string;
    products: ProductData[];
    price: number;
    originalPrice: number;
    discount: number;
}

@Component({
    selector: 'app-deals',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './deals.html',
    styleUrl: './deals.css'
})
export class DealsComponent implements OnInit {
    private productService = inject(ProductService);
    private cdr = inject(ChangeDetectorRef);

    deals: Deal[] = [];
    isLoading = true;

    ngOnInit() {
        this.loadDeals();
    }

    loadDeals() {
        this.isLoading = true;
        this.productService.getProducts({ limit: 100 }).subscribe({
            next: (response) => {
                const products = response.data;
                if (products.length >= 5) {
                    try {
                        this.createRandomDeals(products);
                    } catch (e) {
                        console.error('DealsComponent: Error creating deals', e);
                    }
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load products for deals', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    createRandomDeals(products: ProductData[]) {
        // Shuffle array
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        // Create Combo 1: "Duo Set" (2 products)
        const combo1Products = selected.slice(0, 2);
        const combo1Price = combo1Products.reduce((sum, p) => sum + p.price, 0) * 0.8; // 20% off
        const combo1Original = combo1Products.reduce((sum, p) => sum + p.price, 0);

        const deal1: Deal = {
            title: 'PERFECT DUO SET',
            description: 'Get these 2 essentials for a complete look.',
            products: combo1Products,
            price: Math.round(combo1Price),
            originalPrice: Math.round(combo1Original),
            discount: 20
        };

        // Create Combo 2: "Trio Glow Bundle" (3 products)
        const combo2Products = selected.slice(2, 5);
        const combo2Price = combo2Products.reduce((sum, p) => sum + p.price, 0) * 0.7; // 30% off
        const combo2Original = combo2Products.reduce((sum, p) => sum + p.price, 0);

        const deal2: Deal = {
            title: 'ULTIMATE GLOW TRIO',
            description: 'The ultimate 3-step routine for radiant skin.',
            products: combo2Products,
            price: Math.round(combo2Price),
            originalPrice: Math.round(combo2Original),
            discount: 30
        };

        this.deals = [deal1, deal2];
    }
}
