import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InventoryStats {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
}

export interface StockLog {
    _id: string;
    product: {
        _id: string;
        name: string;
        sku: string;
    };
    action: 'add' | 'remove' | 'set' | 'order';
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    user?: {
        name: string;
    };
    createdAt: string;
}

export interface StockAdjustment {
    productId: string;
    action: 'add' | 'remove' | 'set';
    quantity: number;
    reason: string;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private apiUrl = `${environment.apiUrl}/admin/inventory`;

    constructor(private http: HttpClient) { }

    getInventoryStats(): Observable<InventoryStats> {
        return this.http.get<InventoryStats>(`${this.apiUrl}/stats`);
    }

    getLowStockAlerts(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/alerts`);
    }

    getStockLogs(filters?: any): Observable<any> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params = params.set(key, filters[key]);
                }
            });
        }
        return this.http.get<any>(`${this.apiUrl}/logs`, { params });
    }

    adjustStock(data: StockAdjustment): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/adjust`, data);
    }
}
