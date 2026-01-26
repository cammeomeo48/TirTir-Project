
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductData } from '../../core/constants/products.data';
import { ProductService } from '../../core/services/product.service';

interface CategoryConfig {
    title: string;
    description: string;
    productCategories: string[];
    productSlugs?: string[];
}

@Component({
    selector: 'app-collection',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ProductCard],
    templateUrl: './collection.html',
    styleUrl: './collection.css',
})
export class CollectionComponent implements OnInit {
    collectionTitle = 'ALL PRODUCTS';
    collectionDescription = 'Discover all TIRTIR products.';
    sortBy = 'best-selling';
    currentPage = 1;
    productsPerPage = 12;
    products: ProductData[] = [];
    collectionSlug = '';
    paginatedProducts: ProductData[] = [];

    // Category mappings
    categoryConfigs: { [key: string]: CategoryConfig } = {
        // Main categories
        'skincare': {
            title: 'SKINCARE',
            description: 'Discover TIRTIR skincare essentials for healthy, radiant skin.',
            productCategories: ['cleanser', 'toner', 'serum', 'ampoule', 'cream', 'sunscreen', 'facial-oil', 'eye-cream', 'mask', 'gift-set', 'skincare'],
        },
        'makeup': {
            title: 'MAKEUP',
            description: 'Discover TIRTIR makeup essentials for a long-lasting, luminous finish.',
            productCategories: ['cushion', 'lip', 'makeup', 'primer', 'fixer', 'tint', 'balm'],
        },
        // Sub-categories - Face
        'face-makeup': {
            title: 'FACE',
            description: 'Foundation, cushion, and base makeup products.',
            productCategories: ['cushion', 'primer', 'fixer'],
        },
        'lip-makeup': {
            title: 'LIP',
            description: 'Lip tints, balms, and glosses for every mood.',
            productCategories: ['lip', 'tint', 'balm'],
        },
        // Sub-categories - Skincare
        'cleansers-toners': {
            title: 'CLEANSE & TONER',
            description: 'Gentle cleansers and hydrating toners for clean, balanced skin.',
            productCategories: ['cleanser', 'toner', 'foam'],
        },
        'treatments': {
            title: 'TREATMENTS',
            description: 'Serums, ampoules, and targeted treatments for skin concerns.',
            productCategories: ['serum', 'ampoule', 'facial-oil', 'eye-cream', 'mask'],
        },
        'moisturize-sunscreen': {
            title: 'MOISTURIZE & SUNSCREEN',
            description: 'Hydrating creams and protective sunscreens for healthy skin.',
            productCategories: ['cream', 'sunscreen'],
        },
    };

    constructor(
        private route: ActivatedRoute,
        private productService: ProductService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.collectionSlug = params['slug'] || 'all';
            this.loadProducts();
        });
    }

    loadProducts(): void {
        const config = this.categoryConfigs[this.collectionSlug];

        // Fetch ALL products for client-side filtering (limit=1000)
        this.productService.getProducts({ limit: 1000 }).subscribe(fetchedProducts => {
            if (config) {
                this.collectionTitle = config.title;
                this.collectionDescription = config.description;

                // Filter products by slugs if provided, otherwise by categories
                if (config.productSlugs && config.productSlugs.length > 0) {
                    this.products = fetchedProducts.filter(p => config.productSlugs!.includes(p.slug));
                } else {
                    this.products = fetchedProducts.filter(p => config.productCategories.includes(p.category));
                }
            } else {
                // Default to all products
                this.products = fetchedProducts;
            }

            // Reset pagination and update
            this.currentPage = 1;
            this.updatePagination();
        });
    }

    updatePagination() {
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        this.paginatedProducts = this.products.slice(startIndex, startIndex + this.productsPerPage);
    }

    get totalPages(): number {
        return Math.ceil(this.products.length / this.productsPerPage);
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}
