import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
    selector: 'app-makeup',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ProductCard],
    templateUrl: './makeup.html',
    styleUrl: './makeup.css',
})
export class MakeupComponent implements OnInit {
    collectionTitle = 'MAKEUP';
    collectionDescription = 'Discover TIRTIR makeup essentials for a long-lasting, luminous finish.';

    // Filter state
    showFilters = true;
    sortBy = 'featured';

    // Expandable filter groups
    expandedFilters: { [key: string]: boolean } = {
        type: true,
    };

    // Pagination
    currentPage = 1;
    totalPages = 2;
    pages = [1, 2];

    // Makeup-specific product types matching TIRTIR
    productTypes = [
        { label: 'Cushion', value: 'cushion', count: 12 },
        { label: 'Lip Balm', value: 'lip-balm', count: 3 },
        { label: 'Lip Oil', value: 'lip-oil', count: 2 },
        { label: 'Lip Plumper', value: 'lip-plumper', count: 1 },
        { label: 'Lip Tint', value: 'lip-tint', count: 4 },
        { label: 'Makeup Fixer', value: 'makeup-fixer', count: 2 },
    ];

    // Sub-category banners
    subCategories = [
        {
            label: 'FACE',
            routerLink: '/collections/face',
            image: 'https://placehold.co/800x400/f6e4de/333?text=FACE',
            description: 'Cushions, Concealers & More'
        },
        {
            label: 'LIPS',
            routerLink: '/collections/lips',
            image: 'https://placehold.co/800x400/e8d5d0/333?text=LIPS',
            description: 'Tints, Balms & Glosses'
        }
    ];

    // Mock products matching TIRTIR makeup collection
    products = [
        {
            id: 1,
            name: 'Mood Glider Lip And Blush Stick',
            subtitle: 'One swipe, lips & cheeks perfected',
            price: 18.00,
            originalPrice: 20.00,
            image: 'https://placehold.co/400x500/f8e8e5/333?text=Mood+Glider',
            badges: ['SALE'],
            category: 'lip-tint'
        },
        {
            id: 2,
            name: 'Prism Highlighter Duo',
            subtitle: 'Two textures. One prism glow.',
            price: 22.00,
            image: 'https://placehold.co/400x500/fff0f5/333?text=Prism+Duo',
            badges: ['NEW'],
            category: 'highlighter'
        },
        {
            id: 3,
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
            category: 'cushion'
        },
        {
            id: 4,
            name: 'Mask Fit AI Filter Cushion',
            subtitle: 'For Flawless Coverage',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/e8e0d5/333?text=AI+Filter',
            badges: ['SALE'],
            shadeCount: 25,
            swatches: [
                { color: '#f0dcd0' },
                { color: '#e0c8b8' },
                { color: '#d0b4a0' },
            ],
            category: 'cushion'
        },
        {
            id: 5,
            name: 'Mask Fit Red Cushion Mini',
            subtitle: 'For Long-Lasting Glow',
            price: 15.00,
            image: 'https://placehold.co/400x500/f8e0d8/333?text=Red+Mini',
            badges: [],
            shadeCount: 40,
            category: 'cushion'
        },
        {
            id: 6,
            name: 'Glide & Hide Blurring Concealer',
            subtitle: 'Two-in-one concealer for every detail',
            price: 13.60,
            originalPrice: 16.00,
            image: 'https://placehold.co/400x500/f5f0eb/333?text=Concealer',
            badges: ['SALE'],
            category: 'concealer'
        },
        {
            id: 7,
            name: 'Mini Waterism Glow Tint',
            subtitle: 'Travel-size lip tint',
            price: 8.00,
            image: 'https://placehold.co/400x500/ffcdd2/333?text=Mini+Tint',
            badges: [],
            swatches: [
                { color: '#e57373' },
                { color: '#f48fb1' },
                { color: '#ce93d8' },
            ],
            category: 'lip-tint'
        },
        {
            id: 8,
            name: 'Mask Fit All Cover Cushion',
            subtitle: 'Matte, full-cover cushion',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/e8ddd5/333?text=All+Cover',
            badges: ['SALE'],
            shadeCount: 25,
            category: 'cushion'
        },
        {
            id: 9,
            name: 'Mask Fit Red Cushion Sachet',
            subtitle: 'Find your perfect shade',
            price: 1.50,
            image: 'https://placehold.co/400x500/f0e5e0/333?text=Sachet',
            badges: [],
            category: 'cushion'
        },
        {
            id: 10,
            name: 'Mask Fit Makeup Fixer',
            subtitle: 'Long-lasting setting spray',
            price: 12.75,
            originalPrice: 15.00,
            image: 'https://placehold.co/400x500/e8f0f5/333?text=Fixer',
            badges: ['SALE'],
            category: 'makeup-fixer'
        },
        {
            id: 11,
            name: 'Mask Fit Aura Cushion',
            subtitle: 'Radiant glow cushion',
            price: 20.00,
            originalPrice: 25.00,
            image: 'https://placehold.co/400x500/fff5f0/333?text=Aura',
            badges: ['SALE'],
            shadeCount: 25,
            category: 'cushion'
        },
        {
            id: 12,
            name: 'Mask Fit Red Foundation',
            subtitle: 'Lightweight, liquid foundation',
            price: 27.00,
            image: 'https://placehold.co/400x500/f5e8e0/333?text=Foundation',
            badges: ['NEW'],
            shadeCount: 40,
            category: 'foundation'
        },
        {
            id: 13,
            name: 'Mask Fit Waterproof Setting Spray',
            subtitle: 'Sweat-proof setting spray',
            price: 12.75,
            originalPrice: 15.00,
            image: 'https://placehold.co/400x500/e5f0f8/333?text=Waterproof',
            badges: ['SALE'],
            category: 'makeup-fixer'
        },
        {
            id: 14,
            name: 'Waterism Glow Tint',
            subtitle: 'For Lightweight Color',
            price: 12.75,
            originalPrice: 15.00,
            image: 'https://placehold.co/400x500/f8d5d0/333?text=Glow+Tint',
            badges: ['SALE'],
            swatches: [
                { color: '#e57373' },
                { color: '#f48fb1' },
                { color: '#ef9a9a' },
            ],
            category: 'lip-tint'
        },
        {
            id: 15,
            name: 'Waterism Glow Melting Balm',
            subtitle: 'For Hydrated Lips',
            price: 12.75,
            originalPrice: 15.00,
            image: 'https://placehold.co/400x500/ffe0e5/333?text=Melting+Balm',
            badges: ['SALE'],
            category: 'lip-balm'
        },
        {
            id: 16,
            name: 'Mask Fit Aura Cushion Mini',
            subtitle: 'Radiant glow cushion',
            price: 15.00,
            image: 'https://placehold.co/400x500/fff8f5/333?text=Aura+Mini',
            badges: [],
            category: 'cushion'
        },
        {
            id: 17,
            name: 'My Glow Lip Oil',
            subtitle: 'Nourishing, glossy lip oil',
            price: 13.00,
            image: 'https://placehold.co/400x500/ffe8e0/333?text=Lip+Oil',
            badges: [],
            swatches: [
                { color: '#ffcdd2' },
                { color: '#f8bbd0' },
            ],
            category: 'lip-oil'
        },
        {
            id: 18,
            name: 'Mask Fit All Cover Cushion Mini',
            subtitle: 'Matte, full-cover cushion',
            price: 15.00,
            image: 'https://placehold.co/400x500/e8ddd0/333?text=Cover+Mini',
            badges: [],
            category: 'cushion'
        },
        {
            id: 19,
            name: 'Water Mellow Lip Balm',
            subtitle: 'Soft, everyday lip balm',
            price: 12.75,
            originalPrice: 15.00,
            image: 'https://placehold.co/400x500/fff0e8/333?text=Mellow+Balm',
            badges: ['SALE'],
            category: 'lip-balm'
        },
        {
            id: 20,
            name: 'Mask Fit Tone Up Essence',
            subtitle: 'Glow-boosting tone-up base',
            price: 25.00,
            image: 'https://placehold.co/400x500/f5f5f5/333?text=Tone+Up',
            badges: [],
            category: 'primer'
        },
        {
            id: 21,
            name: 'Tint Trio Holiday Edition',
            subtitle: 'The gloss set of the season',
            price: 16.00,
            image: 'https://placehold.co/400x500/f8e0e5/333?text=Tint+Trio',
            badges: ['LIMITED'],
            category: 'lip-tint'
        },
        {
            id: 22,
            name: 'Waterism Lip Plumper',
            subtitle: 'Hydration & volume gloss',
            price: 13.50,
            originalPrice: 15.00,
            image: 'https://placehold.co/400x500/fce4ec/333?text=Plumper',
            badges: ['SALE'],
            category: 'lip-plumper'
        },
        {
            id: 23,
            name: 'Mask Fit AI Filter Cushion Mini',
            subtitle: 'For Flawless Coverage',
            price: 15.00,
            image: 'https://placehold.co/400x500/f0e8e0/333?text=AI+Mini',
            badges: [],
            category: 'cushion'
        },
    ];

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void { }

    get visibleProducts() {
        const itemsPerPage = 12;
        const start = (this.currentPage - 1) * itemsPerPage;
        return this.products.slice(start, start + itemsPerPage);
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
