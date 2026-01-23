import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MenuItem {
    _id?: string;
    label: string;
    routerLink: string;
    queryParams?: any;
    children?: MenuItem[];
    order?: number;
}

@Injectable({
    providedIn: 'root',
})
export class MenuService {
    private apiUrl = 'http://127.0.0.1:5000/api/menus'; // Adjust if environment config exists

    constructor(private http: HttpClient) { }

    getMenuItems(): Observable<MenuItem[]> {
        return this.http.get<MenuItem[]>(this.apiUrl);
    }
}
