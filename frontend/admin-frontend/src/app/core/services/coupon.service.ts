import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CouponService {
    private apiUrl = `${environment.apiUrl}/coupons`;

    constructor(private http: HttpClient) { }

    getAllCoupons(): Observable<any> {
        return this.http.get(this.apiUrl);
    }

    createCoupon(couponData: any): Observable<any> {
        return this.http.post(this.apiUrl, couponData);
    }

    updateCoupon(id: string, couponData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, couponData);
    }

    deleteCoupon(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getActiveCoupons(): Observable<any> {
        return this.http.get(`${this.apiUrl}/active`);
    }
}
