import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { MENU_ITEMS } from '../constants/menu.data';

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
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api/menus';

    getMenuItems(): Observable<MenuItem[]> {
        // User requested to use static data (links to product details)
        // instead of dynamic category API
        return of(MENU_ITEMS);
        /*
        return this.http.get<MenuItem[]>(this.apiUrl).pipe(
            catchError(err => {
                console.warn('Menu API failed, using static fallback:', err);
                return of(MENU_ITEMS);
            })
        );
        */
    }
}
