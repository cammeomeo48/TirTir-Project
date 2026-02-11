import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

    updateOrderStatus(orderId: string, status: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/update-status`, { orderId, status });
    }

    getOrderTracking(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}/tracking`);
    }
}
