import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { ShopComponent } from './features/shop/shop';
import { ProductDetailComponent } from './features/product-detail/product-detail';
import { MakeupComponent } from './features/makeup/makeup';
import { CushionComponent } from './features/cushion/cushion';
import { CollectionComponent } from './features/collection/collection';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'shop', component: ShopComponent },
    // Collection pages (category-based product listings)
    { path: 'collections/:slug', component: CollectionComponent },
    // Legacy routes for backward compatibility
    { path: 'makeup/cushions', component: CushionComponent },
    // Product detail page
    { path: 'products/:slug', component: ProductDetailComponent },
    { path: '**', redirectTo: '' }
];
