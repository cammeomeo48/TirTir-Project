import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderItem {
    Product: {
        _id: string;
        Product_Name: string;
        Product_ID: string;
        Thumbnail_Images: string[];
    };
    Quantity: number;
    Price: number;
}

export interface Order {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    items: any[];
    Order_Items: OrderItem[];
    totalAmount: number;
    Total_Price: number;
    status: string;
    paymentMethod: string;
    paymentStatus?: string;
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        city: string;
    };
    status_history?: StatusHistory[];
    createdAt: string;
    updatedAt: string;
}

export interface StatusHistory {
    status: string;
    timestamp: string;
    updated_by?: string;
    note?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = `${environment.apiUrl}/orders`;

    constructor(private http: HttpClient) { }

    getAllOrders(): Observable<any> {
        return this.http.get(`${this.apiUrl}`);
    }

    getOrderById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    getOrdersByStatus(status: string): Observable<any> {
        const params = new HttpParams().set('status', status);
        return this.http.get(this.apiUrl, { params });
    }

    getOrdersByDateRange(startDate: string, endDate: string): Observable<any> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get(this.apiUrl, { params });
    }

    updateOrderStatus(orderId: string, status: string, note?: string): Observable<any> {
        // Correct endpoint: /api/v1/orders/update-status (PUT)
        // Correct payload: { orderId, status }
        // Note: The backend route is /orders/update-status, NOT /admin/orders/...
        // We need to use the base apiUrl but point to /orders
        const baseUrl = this.apiUrl.replace('/admin/orders', '/orders');
        return this.http.put(`${baseUrl}/update-status`, { orderId, status, note });
    }

    getOrderTracking(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}/tracking`);
    }

    getOrderStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }
}
