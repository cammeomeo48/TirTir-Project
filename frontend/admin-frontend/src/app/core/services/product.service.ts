import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    getAllProducts(): Observable<any> {
        // Admin panel must see ALL products from DB, not paginated (default limit=12).
        // Pass a large limit to disable effective pagination on the admin fetch.
        return this.http.get(`${this.apiUrl}/products?limit=1000&page=1`);
    }

    getProductById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/products/${id}`);
    }

    createProduct(productData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/admin/products`, productData);
    }

    updateProduct(id: string, productData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/products/${id}`, productData);
    }

    deleteProduct(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/products/${id}`);
    }

    updateStock(id: string, stockData: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/admin/products/${id}/stock`, stockData);
    }

    getLowStockProducts(): Observable<any> {
        return this.http.get(`${this.apiUrl}/products/low-stock`);
    }

    // Aliases for consistency
    getProduct(id: string): Observable<any> {
        return this.getProductById(id);
    }

    addProduct(productData: any): Observable<any> {
        return this.createProduct(productData);
    }

    getStockHistory(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/products/${id}/stock-history`);
    }

    uploadImage(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post(`${this.apiUrl}/upload/product`, formData);
    }
}
