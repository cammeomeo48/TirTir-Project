import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { ShopComponent } from './features/shop/shop';
import { ProductDetailComponent } from './features/product-detail/product-detail';
import { MakeupComponent } from './features/makeup/makeup';
import { CushionComponent } from './features/cushion/cushion';
import { CollectionComponent } from './features/collection/collection';
import { ShadeFinderComponent } from './features/shade-finder/shade-finder';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password';
import { CartComponent } from './features/cart/cart';
import { CheckoutComponent } from './features/checkout/checkout';
import { OrderConfirmationComponent } from './features/order-confirmation/order-confirmation';
import { OrderHistoryComponent } from './features/account/order-history/order-history';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'shop', component: ShopComponent },
    // Auth routes
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password/:token', component: ResetPasswordComponent },
    // Cart & Checkout (protected)
    { path: 'cart', component: CartComponent, canActivate: [authGuard] },
    { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
    { path: 'order-confirmation/:id', component: OrderConfirmationComponent, canActivate: [authGuard] },
    // Account (protected) - Profile with nested routes
    {
        path: 'account',
        loadComponent: () => import('./features/account/profile-layout/profile-layout').then(m => m.ProfileLayoutComponent),
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'profile', pathMatch: 'full' },
            {
                path: 'profile',
                loadComponent: () => import('./features/account/profile-info/profile-info').then(m => m.ProfileInfoComponent)
            },
            {
                path: 'addresses',
                loadComponent: () => import('./features/account/address-book/address-book').then(m => m.AddressBookComponent)
            },
            {
                path: 'password',
                loadComponent: () => import('./features/account/change-password/change-password').then(m => m.ChangePasswordComponent)
            },
            {
                path: 'orders',
                component: OrderHistoryComponent
            }
        ]
    },
    // Collection pages (category-based product listings)
    { path: 'collections/:slug', component: CollectionComponent },
    // Virtual Services (Shade Finder)
    { path: 'virtual-services', component: ShadeFinderComponent },
    // Legacy routes for backward compatibility
    { path: 'makeup/cushions', component: CushionComponent },
    // Product detail page
    { path: 'products/:slug', component: ProductDetailComponent },
    { path: '**', redirectTo: '' }
];
