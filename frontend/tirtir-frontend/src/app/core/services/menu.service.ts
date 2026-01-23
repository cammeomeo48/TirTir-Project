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
        // Clone the base menu structure
        const menu = JSON.parse(JSON.stringify(MENU_ITEMS));

        // 1. Populate Makeup Menu
        const makeupItem = menu.find((item: any) => item.label === 'Makeup');
        if (makeupItem) {
            makeupItem.children = this.buildCategoryTree('makeup');
        }

        // 2. Populate Skincare Menu
        const skincareItem = menu.find((item: any) => item.label === 'Skincare');
        if (skincareItem) {
            skincareItem.children = this.buildCategoryTree('skincare');
        }

        return of(menu);
    }

    private buildCategoryTree(category: string): MenuItem[] {
        // Filter products by main category
        const products = PRODUCTS.filter(p => p.category === category);

        // Group by subcategory
        const groups: { [key: string]: MenuItem[] } = {};

        // Display names mapping for subcategories
        const displayNames: { [key: string]: string } = {
            'face': 'Face',
            'lip': 'Lip',
            'cleanse-tone': 'Cleanse & Toner',
            'treatments': 'Treatments',
            'moisturize-sunscreen': 'Moisturize & Sunscreen'
        };

        // Specific order for subcategories if needed
        const order: { [key: string]: number } = {
            'face': 1,
            'lip': 2,
            'cleanse-tone': 1,
            'treatments': 2,
            'moisturize-sunscreen': 3
        };

        products.forEach(p => {
            const sub = p.subcategory || 'other';
            if (!groups[sub]) groups[sub] = [];

            groups[sub].push({
                label: p.name,
                routerLink: `/products/${p.slug}`
            });
        });

        // Convert groups to MenuItems
        return Object.keys(groups)
            .sort((a, b) => (order[a] || 99) - (order[b] || 99))
            .map(key => ({
                label: displayNames[key] || key,
                routerLink: `/collections/${key}`,
                children: groups[key]
            }));
    }
}