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
    Order_ID: string;
    User: {
        _id: string;
        Name: string;
        Email: string;
    };
    Order_Items: OrderItem[];
    Total_Price: number;
    Order_Status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    Payment_Method: string;
    Shipping_Address: {
        Street: string;
        City: string;
        State: string;
        Zip_Code: string;
        Country: string;
    };
    createdAt: string;
    updatedAt: string;
    status_history?: StatusHistory[];
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
    private apiUrl = `${environment.apiUrl}/admin/orders`;

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
        return this.http.put(`${this.apiUrl}/${orderId}/status`, { status, note });
    }

    getOrderTracking(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}/tracking`);
    }

    getOrderStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }
}
