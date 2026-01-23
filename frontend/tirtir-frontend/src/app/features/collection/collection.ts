import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { PRODUCTS, ProductData } from '../../core/constants/products.data';

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
            productCategories: ['cleanser', 'toner', 'serum', 'ampoule', 'cream', 'sunscreen', 'facial-oil', 'eye-cream', 'mask', 'gift-set'],
        },
        'makeup': {
            title: 'MAKEUP',
            description: 'Discover TIRTIR makeup essentials for a long-lasting, luminous finish.',
            productCategories: ['cushion', 'lip', 'makeup'],
            productSlugs: [
                'mask-fit-red-cushion', 'mask-fit-all-cover-cushion', 'mask-fit-aura-cushion',
                'mask-fit-tone-up-essence', 'mask-fit-make-up-fixer',
                'waterism-glow-melting-balm', 'waterism-glow-tint', 'mini-waterism-glow-tint', 'water-mellow-lip-balm'
            ],
        },
        // Sub-categories - Face
        'face': {
            title: 'FACE',
            description: 'Foundation, cushion, and base makeup products.',
            productCategories: ['cushion', 'makeup'],
            productSlugs: [
                'mask-fit-red-cushion', 'mask-fit-all-cover-cushion', 'mask-fit-aura-cushion',
                'mask-fit-tone-up-essence', 'mask-fit-make-up-fixer'
            ],
        },
        'lip': {
            title: 'LIP',
            description: 'Lip tints, balms, and glosses for every mood.',
            productCategories: ['lip'],
            productSlugs: [
                'waterism-glow-melting-balm', 'waterism-glow-tint', 'mini-waterism-glow-tint', 'water-mellow-lip-balm'
            ],
        },
        // Sub-categories - Skincare
        'cleanse-toner': {
            title: 'CLEANSE & TONER',
            description: 'Gentle cleansers and hydrating toners for clean, balanced skin.',
            productCategories: ['cleanser', 'toner'],
            productSlugs: [
                'hydro-boost-enzyme-cleansing-balm', 'milk-creamy-foam-cleanser',
                'milk-skin-toner', 'matcha-skin-toner'
            ],
        },
        'treatments': {
            title: 'TREATMENTS',
            description: 'Serums, ampoules, and targeted treatments for skin concerns.',
            productCategories: ['serum', 'ampoule', 'facial-oil', 'eye-cream', 'mask'],
            productSlugs: [
                'sos-serum', 'ceramic-milk-ampoule', 'organic-jojoba-oil',
                'collagen-lifting-eye-cream', 'collagen-core-glow-mask', 'dermatir-pure-rosemary-calming-mask'
            ],
        },
        'moisturize-sunscreen': {
            title: 'MOISTURIZE & SUNSCREEN',
            description: 'Hydrating creams and protective sunscreens for healthy skin.',
            productCategories: ['cream', 'sunscreen', 'gift-set'],
            productSlugs: [
                'ceramic-cream', 'matcha-calming-cream', 'hydro-uv-shield-sunscreen', 'matcha-calming-duo-set'
            ],
        },
    };

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.collectionSlug = params['slug'] || 'all';
            this.loadProducts();
        });
    }

    loadProducts(): void {
        const config = this.categoryConfigs[this.collectionSlug];

        if (config) {
            this.collectionTitle = config.title;
            this.collectionDescription = config.description;

            // Filter products by slugs if provided, otherwise by categories
            if (config.productSlugs && config.productSlugs.length > 0) {
                this.products = PRODUCTS.filter(p => config.productSlugs!.includes(p.slug));
            } else {
                this.products = PRODUCTS.filter(p => config.productCategories.includes(p.category));
            }
        } else {
            // Default to all products
            this.products = PRODUCTS;
        }

        // Reset pagination and update
        this.currentPage = 1;
        this.updatePagination();
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
