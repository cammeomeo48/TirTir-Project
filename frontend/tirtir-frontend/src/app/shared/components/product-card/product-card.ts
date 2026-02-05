import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  @Input() product: any;
  // Individual inputs for use with products.data.ts
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() subtitle: string = '';
  @Input() price: number = 0;
  @Input() originalPrice?: number;
  @Input() image: string = '';
  @Input() badges: string[] = [];
  @Input() productSlug: string = '';
  @Input() swatches: { color: string }[] = [];
  @Input() shadeCount: number = 0;

  get displayProduct() {
    if (this.product) {
      return {
        ...this.product,
        image: this.getImageUrl(this.product)
      };
    }
    return {
      id: this.id,
      name: this.name,
      subtitle: this.subtitle,
      price: this.price,
      originalPrice: this.originalPrice,
      image: this.image,
      badges: this.badges,
      slug: this.productSlug,
      swatches: this.swatches,
      shadeCount: this.shadeCount,
    };
  }

  get productLink(): string {
    if (this.product?.slug) {
      return this.product.slug;
    }
    if (this.productSlug) {
      return this.productSlug;
    }
    return this.product?.id || this.id;
  }

  private getImageUrl(product: any): string {
    // Check Thumbnail_Images first (it's a STRING, not an array!)
    if (product.Thumbnail_Images && typeof product.Thumbnail_Images === 'string' && product.Thumbnail_Images.trim() !== '') {
      const imagePath = product.Thumbnail_Images;

      // If starts with 'assets/', prepend the backend server URL
      if (imagePath.startsWith('assets/')) {
        return `http://localhost:5001/${imagePath}`;
      }

      // If already a full URL, return as is
      if (imagePath.startsWith('http')) {
        return imagePath;
      }

      // Otherwise prepend backend URL with proper slashing
      return `http://localhost:5001/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
    }

    // Fallback to images array if Thumbnail_Images doesn't work
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const imagePath = product.images[0];

      if (imagePath && typeof imagePath === 'string') {
        if (imagePath.startsWith('assets/')) {
          return `http://localhost:5001/${imagePath}`;
        }
        if (imagePath.startsWith('http')) {
          return imagePath;
        }
        return `http://localhost:5001/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
      }
    }

    // Fallback to image field if exists (for backward compatibility)
    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      const imagePath = product.image;
      if (imagePath.startsWith('assets/')) {
        return `http://localhost:5001/${imagePath}`;
      }
      if (imagePath.startsWith('http') || imagePath.startsWith('/assets')) {
        return imagePath;
      }
      return `http://localhost:5001/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
    }

    // Final fallback to a placeholder
    return 'https://placehold.co/400x400/f5f5f5/999?text=No+Image';
  }
}
