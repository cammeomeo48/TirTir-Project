import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Address {
    Street: string;
    City: string;
    State: string;
    Zip_Code: string;
    Country: string;
}

export interface Customer {
    _id: string;
    Name: string;
    Email: string;
    Phone?: string;
    role: string;
    createdAt: string;
    Addresses?: Address[];
    orders_count?: number;
    total_spent?: number;
    last_order_date?: string;
    status: 'active' | 'inactive';
}

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private apiUrl = `${environment.apiUrl}/admin/users`;

    constructor(private http: HttpClient) { }

    getAllCustomers(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key]) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get<any>(this.apiUrl, { params: httpParams });
    }

    getCustomerById(id: string): Observable<Customer> {
        return this.http.get<Customer>(`${this.apiUrl}/${id}`);
    }

    getCustomerOrders(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${id}/orders`);
    }

    updateCustomerStatus(id: string, status: string): Observable<Customer> {
        return this.http.patch<Customer>(`${this.apiUrl}/${id}/status`, { status });
    }
}
