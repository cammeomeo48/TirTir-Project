import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
    selector: 'app-cushion',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ProductCard],
    templateUrl: './cushion.html',
    styleUrl: './cushion.css',
})
export class CushionComponent implements OnInit {
    collectionTitle = 'CUSHION';
    collectionDescription = 'Discover TIRTIR\'s iconic cushion foundations for long-lasting, flawless coverage.';

    // Filter state
    showFilters = true;
    sortBy = 'featured';

    // Expandable filter groups
    expandedFilters: { [key: string]: boolean } = {
        type: true,
    };

    // Pagination (single page for cushions)
    currentPage = 1;
    totalPages = 1;
    pages = [1];

    // Cushion-specific product types
    productTypes = [
        { label: 'Full Size', value: 'full-size', count: 4 },
        { label: 'Mini', value: 'mini', count: 4 },
    ];

    // Sub-category banners for related collections
    subCategories = [
        {
            label: 'BASE',
            routerLink: '/collections/base',
            image: 'https://placehold.co/400x200/f6e4de/333?text=BASE',
            description: 'Primers & Foundations'
        },
        {
            label: 'FIXERS',
            routerLink: '/collections/fixers',
            image: 'https://placehold.co/400x200/e8d8d0/333?text=FIXERS',
            description: 'Setting Sprays'
        },
        {
            label: 'LIPS',
            routerLink: '/collections/lips',
            image: 'https://placehold.co/400x200/f0d8d8/333?text=LIPS',
            description: 'Tints & Balms'
        },
        {
            label: 'FACE',
            routerLink: '/collections/face',
            image: 'https://placehold.co/400x200/e8e0d8/333?text=FACE',
            description: 'Concealers & More'
        }
    ];

    // Mock cushion products matching TIRTIR collection
    products = [
        {
            id: 1,
            name: 'Mask Fit AI Filter Cushion',
            subtitle: 'For Flawless Coverage',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/e8e0d5/333?text=AI+Filter',
            badges: ['SALE'],
            shadeCount: 25,
            swatches: [
                { color: '#f5dcd0' },
                { color: '#e8c8b8' },
                { color: '#d8b4a0' },
                { color: '#c8a088' },
                { color: '#b08868' },
            ],
            category: 'full-size'
        },
        {
            id: 2,
            name: 'Mask Fit Red Cushion',
            subtitle: 'For Long-Lasting Glow',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/f5e6e0/333?text=Red+Cushion',
            badges: ['SALE', '40 SHADES'],
            shadeCount: 40,
            swatches: [
                { color: '#f5d5c8' },
                { color: '#e8c4b0' },
                { color: '#d4a88c' },
                { color: '#c49070' },
                { color: '#a87050' },
            ],
            category: 'full-size'
        },
        {
            id: 3,
            name: 'Mask Fit All Cover Cushion',
            subtitle: 'Matte, full-cover cushion',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/e8ddd5/333?text=All+Cover',
            badges: ['SALE'],
            shadeCount: 25,
            swatches: [
                { color: '#f0dcd0' },
                { color: '#e0c8b8' },
                { color: '#d0b4a0' },
            ],
            category: 'full-size'
        },
        {
            id: 4,
            name: 'Mask Fit Aura Cushion',
            subtitle: 'Radiant glow cushion',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/fff5f0/333?text=Aura',
            badges: ['SALE'],
            shadeCount: 25,
            swatches: [
                { color: '#f8e0d8' },
                { color: '#e8d0c0' },
                { color: '#d8c0b0' },
            ],
            category: 'full-size'
        },
        {
            id: 5,
            name: 'Mask Fit Red Cushion Mini',
            subtitle: 'For Long-Lasting Glow',
            price: 15.00,
            image: 'https://placehold.co/400x500/f8e0d8/333?text=Red+Mini',
            badges: [],
            shadeCount: 40,
            category: 'mini'
        },
        {
            id: 6,
            name: 'Mask Fit Aura Cushion Mini',
            subtitle: 'Radiant glow cushion',
            price: 15.00,
            image: 'https://placehold.co/400x500/fff8f5/333?text=Aura+Mini',
            badges: [],
            shadeCount: 25,
            category: 'mini'
        },
        {
            id: 7,
            name: 'Mask Fit All Cover Cushion Mini',
            subtitle: 'Matte, full-cover cushion',
            price: 15.00,
            image: 'https://placehold.co/400x500/e8ddd0/333?text=Cover+Mini',
            badges: [],
            shadeCount: 25,
            category: 'mini'
        },
        {
            id: 8,
            name: 'Mask Fit AI Filter Cushion Mini',
            subtitle: 'For Flawless Coverage',
            price: 15.00,
            image: 'https://placehold.co/400x500/f0e8e0/333?text=AI+Mini',
            badges: [],
            shadeCount: 25,
            category: 'mini'
        },
    ];

    constructor() { }

    ngOnInit(): void { }

    get visibleProducts() {
        return this.products;
    }

    get productCount() {
        return this.products.length;
    }

    toggleFilters() {
        this.showFilters = !this.showFilters;
    }

    toggleFilterGroup(group: string) {
        this.expandedFilters[group] = !this.expandedFilters[group];
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}
