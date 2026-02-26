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
    product: {
        _id: string;
        name: string;
        sku: string;
        mainImage?: string;
        Thumbnail_Images?: string[];
    };
    salesCount: number;
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

    /** GET /api/v1/admin/stats/conversion — conversion funnel data */
    getConversionStats(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/admin/stats/conversion`);
    }

    /** GET /api/v1/inventory/alerts — low stock items for dashboard widget */
    getLowStockAlerts(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/inventory/alerts`);
    }

    /** GET /api/v1/admin/stats/ai-insights — AI-powered insights */
    getAiInsights(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/admin/stats/ai-insights`);
    }
}
