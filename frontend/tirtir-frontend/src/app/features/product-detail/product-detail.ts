import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BrandGalleryComponent } from '../../shared/components/brand-gallery/brand-gallery';
import { CustomerReviewsComponent } from '../../shared/components/customer-reviews/customer-reviews';
import { getProductBySlug, ProductData, PRODUCTS } from '../../core/constants/products.data';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomerReviewsComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  private cdr = inject(ChangeDetectorRef); // Re-inject for robust fix

  product!: ProductData;
  selectedImage: string = '';
  selectedShade: string = '';
  quantity = 1;
  activeAccordion: string | null = 'description';
  addingToCart = false;

  constructor() { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];

      this.productService.getProductDetail(slug).subscribe({
        next: (data) => {
          setTimeout(() => {
            this.product = data;
            this.selectedImage = this.product.images[0];
            if (this.product.shades && this.product.shades.length > 0) {
              // Select a middle shade by default
              const midIndex = Math.floor(this.product.shades.length / 2);
              this.selectedShade = this.product.shades[midIndex].name;
            }
            this.cdr.detectChanges(); // NUCLEAR FIX: Force check inside timeout
          }, 0);
        },
        error: (err: any) => {
          console.error('Product not found', err);
          // Handle Not Found - maybe redirect or show error
        }
      });
    });
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }

  selectShade(shadeName: string) {
    this.selectedShade = shadeName;

    // Find the shade object to get its image
    const shadeObj = this.product.shades?.find(s => s.name === shadeName);
    if (shadeObj && shadeObj.image) {
      this.selectedImage = shadeObj.image;
    }
  }

  increaseQty() {
    this.quantity++;
  }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    if (!this.product) return;

    // 1. Validate Shade Selection if product has shades
    if (this.product.shades && this.product.shades.length > 0 && !this.selectedShade) {
      alert('Please select a shade');
      return;
    }

    this.addingToCart = true;

    // 2. Call Service
    this.cartService.addToCart({
      productId: this.product.id,
      quantity: this.quantity,
      shade: this.selectedShade || undefined
    }).subscribe({
      next: (cart) => {
        setTimeout(() => {
          this.addingToCart = false;
          // Use a better toast later, for now consistent alert
          alert(`Added ${this.quantity} item(s) to cart!`);
          this.cdr.detectChanges(); // Ensure view updates
        }, 0);
      },
      error: (err: any) => {
        setTimeout(() => {
          this.addingToCart = false;
          console.error('Add to cart failed', err);
          alert(err.message || 'Failed to add to cart');
          this.cdr.detectChanges(); // Ensure view updates
        }, 0);
      }
    });
  }

  toggleAccordion(section: string) {
    this.activeAccordion = this.activeAccordion === section ? null : section;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }
}

