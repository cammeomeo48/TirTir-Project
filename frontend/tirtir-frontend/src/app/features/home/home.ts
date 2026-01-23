import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductCarousel } from '../../shared/components/product-carousel/product-carousel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCard, ProductCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  // Static mock data for UI development
  // TODO: Replace with real API data later

  bestSellers = [
    {
      id: 1,
      name: 'Mask Fit Red Cushion',
      subtitle: '72-Hour Lasting Coverage',
      price: 24.00,
      originalPrice: 30.00,
      image: 'https://placehold.co/400x500/f5e6e0/000?text=Red+Cushion',
      hoverImage: 'https://placehold.co/400x500/e0d0c8/000?text=Red+Cushion+2',
      badges: ['SALE', 'BEST'],
      shadeCount: 40,
      swatches: [
        { color: '#f5d5c8' },
        { color: '#e8c4b0' },
        { color: '#d4a88c' },
        { color: '#c49070' },
        { color: '#a87050' },
        { color: '#8c5840' }
      ]
    },
    {
      id: 2,
      name: 'Milk Skin Toner',
      subtitle: 'Hydrating Glow',
      price: 28.00,
      image: 'https://placehold.co/400x500/fff/000?text=Milk+Toner',
      badges: ['BEST'],
      shadeCount: null
    },
    {
      id: 3,
      name: 'Ceramic Milk Ampoule',
      subtitle: 'Deep Moisture',
      price: 32.00,
      image: 'https://placehold.co/400x500/f0f0f0/000?text=Ceramic+Ampoule',
      badges: []
    },
    {
      id: 4,
      name: 'Mood Glider',
      subtitle: 'Multi-Use Color',
      price: 18.00,
      image: 'https://placehold.co/400x500/d32f2f/fff?text=Mood+Glider',
      badges: ['NEW'],
      shadeCount: 12
    }
  ];

  newArrivals = [
    {
      id: 5,
      name: 'Glow Lip Balm',
      price: 15.00,
      image: 'https://placehold.co/400x500/ffcdd2/000?text=Lip+Balm',
      badges: ['NEW']
    },
    {
      id: 6,
      name: 'SOS Spot Serum',
      price: 22.00,
      image: 'https://placehold.co/400x500/e3f2fd/000?text=Spot+Serum',
      badges: ['NEW']
    },
    {
      id: 7,
      name: 'Collagen Sheet Mask',
      price: 4.00,
      image: 'https://placehold.co/400x500/e8f5e9/000?text=Sheet+Mask',
      badges: ['NEW']
    },
    {
      id: 8,
      name: 'Vita C Ampoule',
      price: 26.00,
      image: 'https://placehold.co/400x500/fff9c4/000?text=Vita+C',
      badges: ['NEW']
    }
  ];

  trending = [
    {
      id: 9,
      name: 'Real Cover Cushion',
      subtitle: 'Full Coverage',
      price: 26.00,
      image: 'https://placehold.co/400x500/ffe0b2/000?text=Real+Cover',
      badges: [],
      shadeCount: 30
    },
    {
      id: 10,
      name: 'My Glow Blush',
      subtitle: 'Natural Flush',
      price: 16.00,
      image: 'https://placehold.co/400x500/f8bbd0/000?text=Glow+Blush',
      badges: []
    },
    {
      id: 11,
      name: 'Mask Fit All-Cover Cushion',
      price: 28.00,
      image: 'https://placehold.co/400x500/d7ccc8/000?text=All+Cover',
      badges: ['BEST'],
      shadeCount: 25
    },
    {
      id: 12,
      name: 'Rosemary BHA Toner',
      price: 24.00,
      image: 'https://placehold.co/400x500/c8e6c9/000?text=BHA+Toner',
      badges: []
    }
  ];
}
