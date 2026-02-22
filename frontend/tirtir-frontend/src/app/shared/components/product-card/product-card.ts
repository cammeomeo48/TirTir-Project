import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCard {
  @Input() product: any;
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

  private readonly backendUrl = environment.apiUrl.replace('/api/v1', '');

  get displayProduct() {
    if (this.product) {
      return { ...this.product, image: this.getImageUrl(this.product) };
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
    if (this.product?.slug) return this.product.slug;
    if (this.productSlug) return this.productSlug;
    return this.product?.id || this.id;
  }

  getImageUrl(product: any): string {
    const resolve = (path: string): string => {
      if (!path || typeof path !== 'string' || !path.trim()) return '';
      if (path.startsWith('http')) return path;
      return `${this.backendUrl}/${path.startsWith('/') ? path.slice(1) : path}`;
    };

    // 1. Thumbnail_Images (primary field)
    const thumb = resolve(product?.Thumbnail_Images);
    if (thumb) return thumb;

    // 2. images array fallback
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const img = resolve(product.images[0]);
      if (img) return img;
    }

    // 3. image field (legacy)
    const legacy = resolve(product?.image);
    if (legacy) return legacy;

    return 'https://placehold.co/400x400/f5f5f5/999?text=No+Image';
  }
}

