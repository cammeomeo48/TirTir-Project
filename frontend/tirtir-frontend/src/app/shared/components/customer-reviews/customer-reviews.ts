import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Review {
    id: number;
    author: string;
    date: string;
    rating: number;
    title: string;
    content: string;
    verified: boolean;
    helpful: number;
    shade?: string;
}

@Component({
    selector: 'app-customer-reviews',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './customer-reviews.html',
    styleUrl: './customer-reviews.css',
})
export class CustomerReviewsComponent {
    @Input() productName: string = '';

    averageRating = 4.8;
    totalReviews = 2847;

    ratingBreakdown = [
        { stars: 5, percentage: 85 },
        { stars: 4, percentage: 10 },
        { stars: 3, percentage: 3 },
        { stars: 2, percentage: 1 },
        { stars: 1, percentage: 1 },
    ];

    reviews: Review[] = [
        {
            id: 1,
            author: 'Sarah M.',
            date: 'January 15, 2026',
            rating: 5,
            title: 'Best cushion I\'ve ever used!',
            content: 'I\'ve tried so many cushion foundations and this is by far the best. The coverage is amazing, it lasts all day, and my skin looks so natural and dewy. The 40 shade range made it easy to find my perfect match.',
            verified: true,
            helpful: 128,
            shade: '21N Ivory',
        },
        {
            id: 2,
            author: 'Emily K.',
            date: 'January 12, 2026',
            rating: 5,
            title: 'Perfect match for my skin tone',
            content: 'Finally found a foundation that matches my skin perfectly! The texture is so smooth and it blends like a dream. Definitely repurchasing.',
            verified: true,
            helpful: 89,
            shade: '17C Porcelain',
        },
        {
            id: 3,
            author: 'Jessica L.',
            date: 'January 10, 2026',
            rating: 4,
            title: 'Great coverage, slightly drying',
            content: 'Love the coverage and longevity of this cushion. It looks flawless for hours. Only giving 4 stars because it can be slightly drying on my skin in winter, but using a good moisturizer underneath fixes that.',
            verified: true,
            helpful: 56,
            shade: '23N Sand',
        },
        {
            id: 4,
            author: 'Michelle T.',
            date: 'January 8, 2026',
            rating: 5,
            title: 'Worth every penny!',
            content: 'This is a game changer! My makeup has never looked so good. The finish is beautiful and it photographs amazingly. All my friends have asked what I\'m wearing.',
            verified: true,
            helpful: 43,
        },
    ];

    getStars(rating: number): number[] {
        return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
    }

    getStarClass(filled: number): string {
        return filled ? 'star filled' : 'star empty';
    }
}
