import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Review {
    _id: string;
    user: { name: string; email: string };
    product: { Product_Name: string; _id: string };
    rating: number;
    comment: string;
    createdAt: string;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private apiUrl = `${environment.apiUrl}/admin/reviews`;

    constructor(private http: HttpClient) { }

    getAllReviews(): Observable<any> {
        return this.http.get<any>(this.apiUrl);
    }

    deleteReview(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
