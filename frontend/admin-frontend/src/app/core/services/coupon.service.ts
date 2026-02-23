import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Coupon {
    _id?: string;
    Code: string;
    Discount_Type: 'percentage' | 'fixed';
    Discount_Value: number;
    Min_Order_Amount?: number;
    Max_Discount_Amount?: number;
    Start_Date: string;
    End_Date: string;
    Usage_Limit?: number;
    Used_Count: number;
    Status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CouponService {
    private apiUrl = `${environment.apiUrl}/coupons`;

    constructor(private http: HttpClient) { }

    getAllCoupons(params?: any): Observable<any> {
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

    getCouponById(id: string): Observable<Coupon> {
        return this.http.get<Coupon>(`${this.apiUrl}/${id}`);
    }

    createCoupon(coupon: Coupon): Observable<Coupon> {
        return this.http.post<Coupon>(this.apiUrl, coupon);
    }

    updateCoupon(id: string, coupon: Partial<Coupon>): Observable<Coupon> {
        return this.http.put<Coupon>(`${this.apiUrl}/${id}`, coupon);
    }

    deleteCoupon(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    toggleCouponStatus(id: string, status: 'active' | 'inactive'): Observable<Coupon> {
        return this.http.patch<Coupon>(`${this.apiUrl}/${id}/status`, { status });
    }

    getCouponStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/stats`);
    }
}
