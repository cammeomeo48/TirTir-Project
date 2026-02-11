import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private apiUrl = `${environment.apiUrl}/inventory`;

    constructor(private http: HttpClient) { }

    getInventoryAlerts(): Observable<any> {
        return this.http.get(`${this.apiUrl}/alerts`);
    }

    getStockLogs(): Observable<any> {
        return this.http.get(`${this.apiUrl}/logs`);
    }

    adjustStock(adjustmentData: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/adjust`, adjustmentData);
    }

    cleanupPendingOrders(): Observable<any> {
        return this.http.post(`${this.apiUrl}/cleanup`, {});
    }
}
