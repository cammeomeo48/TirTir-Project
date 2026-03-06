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
    /** Canonical field — backend populates as `items` (array of OrderItem) */
    items: OrderItem[];
    /** Canonical total — backend returns `totalAmount` */
    totalAmount: number;
    status: string;
    paymentMethod: string;
    paymentStatus?: string;
    ghnOrderCode?: string;
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
        return this.http.get(`${environment.apiUrl}/admin/orders`);
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
        // Fix: use environment.apiUrl directly instead of fragile string replace
        return this.http.put(`${environment.apiUrl}/orders/update-status`, { orderId, status, note });
    }

    getOrderTracking(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}/tracking`);
    }

    getOrderStats(): Observable<any> {
        return this.http.get(`${environment.apiUrl}/admin/orders/stats`);
    }

    cancelOrder(orderId: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/orders/${orderId}/cancel`, {});
    }
}
