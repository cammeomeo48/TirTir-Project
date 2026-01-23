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
      return this.product;
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
}
