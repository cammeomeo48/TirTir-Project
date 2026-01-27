import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductCarousel } from '../../shared/components/product-carousel/product-carousel';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCard, ProductCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private productService = inject(ProductService);

  bestSellers: any[] = [];
  newArrivals: any[] = [];
  trending: any[] = [];

  constructor() { }

  ngOnInit() {
    this.loadBestSellers();
    this.loadNewArrivals();
    this.loadTrending();
  }

  loadBestSellers() {
    this.productService.getProducts({ sort: 'best_seller', limit: 4 }).subscribe({
      next: (data) => this.bestSellers = data,
      error: (e) => console.error('Failed to load best sellers', e)
    });
  }

  loadNewArrivals() {
    this.productService.getProducts({ sort: 'newest', limit: 4 }).subscribe({
      next: (data) => this.newArrivals = data,
      error: (e) => console.error('Failed to load new arrivals', e)
    });
  }

  loadTrending() {
    // Trending could be best sellers or another criteria. Using default for now.
    this.productService.getProducts({ limit: 4, page: 2 }).subscribe({
      next: (data) => this.trending = data,
      error: (e) => console.error('Failed to load trending', e)
    });
  }
}
