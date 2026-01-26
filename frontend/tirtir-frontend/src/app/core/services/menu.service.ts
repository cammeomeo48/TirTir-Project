import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MENU_ITEMS } from '../constants/menu.data';
import { PRODUCTS, ProductData } from '../constants/products.data';

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

    constructor(private http: HttpClient) { }

    getMenuItems(): Observable<MenuItem[]> {
        // Return the static menu structure directly
        // The previous logic attempted to build it from PRODUCTS which is now empty
        return of(MENU_ITEMS);
    }
}