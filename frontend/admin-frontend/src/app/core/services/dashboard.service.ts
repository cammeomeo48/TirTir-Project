import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    lowStockProducts: number;
}

export interface RevenueData {
    labels: string[];
    data: number[];
}

export interface TopProduct {
    _id: string;
    Product_Name: string;
    totalSold: number;
    revenue: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/admin`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
    }

    getRevenueChart(): Observable<RevenueData> {
        return this.http.get<RevenueData>(`${this.apiUrl}/dashboard/revenue`);
    }

    getTopProducts(): Observable<TopProduct[]> {
        return this.http.get<TopProduct[]>(`${this.apiUrl}/dashboard/top-products`);
    }

    getAllOrders(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/orders`);
    }
}
