import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProductData } from '../constants/products.data';

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
      images: bp.images && bp.images.length > 0 ? bp.images : [bp.Thumbnail_Images],
      shades: bp.shades?.map(s => ({ name: s.Name || s.Shade_Name, color: s.Color_Code || '#000000', image: s.Image_Url })),
      sizes: [{ name: 'Standard', price: bp.Price }],
      category: bp.Is_Skincare ? 'skincare' : 'makeup',
      subcategory: 'face', // Default fallback, logic needs to be smarter if possible or inferred from category slug
    };
  }
}
