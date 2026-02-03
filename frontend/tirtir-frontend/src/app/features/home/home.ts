import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef); // Injected CDR

  bestSellers: any[] = [];
  newArrivals: any[] = [];
  trending: any[] = [];

  // Carousel state
  currentSlide = 0;
  totalSlides = 3;
  private autoPlayInterval: any;

  constructor() { }

  ngOnInit() {
    this.loadBestSellers();
    this.loadNewArrivals();
    this.loadTrending();
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }


  loadBestSellers() {
    // Best Sellers: Mask Fit Red Cushion, Waterism Glow Tint, Milk Skin Toner, SOS Serum
    const slugs = ['mask-fit-red-cushion', 'waterism-glow-tint', 'milk-skin-toner', 'sos-serum'];
    this.loadProductsBySlug(slugs, 'bestSellers');
  }

  loadNewArrivals() {
    // New Arrivals: Matcha Calming Duo Set, Hydro UV Shield Sunscreen, Organic Jojoba Oil, 
    // Collagen Core Glow Mask, Matcha Skin Toner, Water Mellow Lip Balm
    const slugs = [
      'matcha-calming-duo-set',
      'hydro-uv-shield-sunscreen',
      'organic-jojoba-oil',
      'collagen-core-glow-mask',
      'matcha-skin-toner',
      'water-mellow-lip-balm'
    ];
    this.loadProductsBySlug(slugs, 'newArrivals');
  }

  loadTrending() {
    // Trending: Mask Fit Red Cushion, Waterism Glow Tint, Mask Fit Aura Cushion, Milk Creamy Foam Cleanser
    const slugs = [
      'mask-fit-red-cushion',
      'waterism-glow-tint',
      'mask-fit-aura-cushion',
      'milk-creamy-foam-cleanser'
    ];
    this.loadProductsBySlug(slugs, 'trending');
  }

  private loadProductsBySlug(slugs: string[], target: 'bestSellers' | 'newArrivals' | 'trending') {
    // Fetch products with search query to get them by name
    this.productService.getProducts({ limit: 100 }).subscribe({
      next: (response) => {
        // Filter products by matching slugs or names
        const products = response.data.filter(product => {
          const productSlug = product.slug?.toLowerCase() || product.name.toLowerCase().replace(/\s+/g, '-');
          return slugs.some(slug =>
            productSlug.includes(slug) ||
            slug.includes(productSlug) ||
            product.name.toLowerCase().replace(/\s+/g, '-').includes(slug)
          );
        });

        // Sort products to match the order of slugs
        const sortedProducts = slugs.map(slug =>
          products.find(p => {
            const pSlug = p.slug?.toLowerCase() || p.name.toLowerCase().replace(/\s+/g, '-');
            return pSlug.includes(slug) || slug.includes(pSlug) || p.name.toLowerCase().replace(/\s+/g, '-').includes(slug);
          })
        ).filter(p => p !== undefined);

        this[target] = sortedProducts;
        this.cdr.detectChanges();
      },
      error: (e) => console.error(`Failed to load ${target}`, e)
    });
  }

  // Carousel Methods
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.resetAutoPlay();
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.resetAutoPlay();
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.resetAutoPlay();
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
