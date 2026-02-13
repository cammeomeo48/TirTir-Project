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
        return this.http.get(`${this.apiUrl}/products`);
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
}
