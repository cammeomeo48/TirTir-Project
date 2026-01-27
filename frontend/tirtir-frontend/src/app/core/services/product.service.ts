import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { ProductData, PRODUCTS, getProductBySlug } from '../constants/products.data';

export interface BackendProduct {
  Product_ID: string;
  Name: string;
  Price: number;
  Thumbnail_Images: string;
  Category: string;
  Is_Skincare: boolean;
  slug?: string;
  description?: string;
  images?: string[];
  category?: string;
  shades?: any[];
  // Add other backend fields here
  Full_Description?: string;
  How_To_Use?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';
  private http = inject(HttpClient);

  getProducts(params?: any): Observable<ProductData[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ data: BackendProduct[] }>(this.apiUrl, { params: httpParams }).pipe(
      map(response => response.data.map(this.mapToProductData))
    );
  }

  getProductDetail(idOrSlug: string): Observable<ProductData> {
    return this.http.get<BackendProduct>(`${this.apiUrl}/${idOrSlug}`).pipe(
      map(this.mapToProductData)
    );
  }

  private mapToProductData(bp: BackendProduct): ProductData {
    // Helper to ensure full URL for images
    const fixUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      // Prepend backend URL. Remove leading slash if present to avoid double slashes.
      const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
      return `http://localhost:5000/${cleanUrl}`;
    };

    return {
      id: bp.Product_ID,
      slug: bp.slug || bp.Product_ID.toLowerCase(), // Fallback
      name: bp.Name,
      price: bp.Price,
      originalPrice: bp.Price * 1.2, // Mock original price
      rating: 4.8, // Mock rating
      reviewCount: 150, // Mock reviews
      description: bp.description || bp.Name,
      fullDescription: bp.Full_Description || bp.description || bp.Name,
      keyFeatures: [], // Mock or empty
      howToUse: bp.How_To_Use || 'Apply gently to skin.',
      ingredients: 'See packaging for details.',
      images: bp.images && bp.images.length > 0
        ? bp.images.map(fixUrl)
        : [fixUrl(bp.Thumbnail_Images)],
      shades: bp.shades?.map(s => ({
        name: s.name || s.Shade_Name || s.Name,
        color: s.color || s.Hex_Code || s.Color_Code || '#000000',
        image: fixUrl(s.image || s.Image_Url || s.Shade_Image)
      })),
      sizes: [{ name: 'Standard', price: bp.Price }],
      // Smart Category Mapping from DB Data
      category: ((): any => {
        const cat = bp.Category ? bp.Category.toLowerCase() : '';
        if (cat.includes('cushion')) return 'cushion';
        if (cat.includes('lip')) return 'lip';
        if (cat.includes('toner')) return 'toner';
        if (cat.includes('serum')) return 'serum';
        if (cat.includes('foam') || cat.includes('cleanser')) return 'cleanser';
        if (cat.includes('cream')) return 'cream';
        if (cat.includes('sunscreen')) return 'sunscreen';
        if (cat.includes('mask')) return 'mask';
        if (cat.includes('primer')) return 'primer';
        if (cat.includes('fixer')) return 'fixer';
        if (cat.includes('oil')) return 'facial-oil';
        if (cat.includes('eye')) return 'eye-cream';
        if (cat.includes('ampoule')) return 'ampoule';

        // Fallback: Check ID for generic Makeup
        if (bp.Product_ID && bp.Product_ID.toUpperCase().includes('MK')) return 'makeup';

        return 'skincare';
      })(),
      subcategory: 'face', // Default fallback
    };
  }
}
