import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BrandGalleryComponent } from '../../shared/components/brand-gallery/brand-gallery';
import { CustomerReviewsComponent } from '../../shared/components/customer-reviews/customer-reviews';
import { getProductBySlug, ProductData, PRODUCTS } from '../../core/constants/products.data';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandGalleryComponent, CustomerReviewsComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  product!: ProductData;
  selectedImage: string = '';
  selectedShade: string = '';
  quantity = 1;
  activeAccordion: string | null = 'description';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      const foundProduct = getProductBySlug(slug);

      if (foundProduct) {
        this.product = foundProduct;
        this.selectedImage = this.product.images[0];
        if (this.product.shades && this.product.shades.length > 0) {
          // Select a middle shade by default
          const midIndex = Math.floor(this.product.shades.length / 2);
          this.selectedShade = this.product.shades[midIndex].name;
        }
      } else {
        // Fallback to first product if not found
        this.product = PRODUCTS[0];
        this.selectedImage = this.product.images[0];
        if (this.product.shades && this.product.shades.length > 0) {
          this.selectedShade = this.product.shades[0].name;
        }
      }
    });
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }

  selectShade(shade: string) {
    this.selectedShade = shade;
  }

  increaseQty() {
    this.quantity++;
  }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  toggleAccordion(section: string) {
    this.activeAccordion = this.activeAccordion === section ? null : section;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }
}

