import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MENU_ITEMS } from '../constants/menu.data'; // Import dữ liệu từ file menu.data.ts

export interface MenuItem {
    _id?: string;
    label: string;
    routerLink: string;
    queryParams?: any;
    children?: MenuItem[];
    order?: number;
    image?: string; 
    description?: string;
}

@Injectable({
    providedIn: 'root',
})
export class MenuService {
    // private apiUrl = 'http://127.0.0.1:5000/api/menus'; 

    constructor(private http: HttpClient) { }

    getMenuItems(): Observable<MenuItem[]> {
        // Trả về dữ liệu từ file constant thay vì hardcode ở đây
        return of(MENU_ITEMS);
        
        // Sau này khi Backend sẵn sàng, bạn có thể uncomment dòng dưới:
        // return this.http.get<MenuItem[]>(this.apiUrl);
    }
}