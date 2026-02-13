import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [adminAuthGuard],
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent
            },
            {
                path: 'products',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/products/product-list/product-list').then(
                                (m) => m.ProductListComponent
                            ),
                    },
                    {
                        path: 'add',
                        loadComponent: () =>
                            import('./features/products/product-form/product-form').then(
                                (m) => m.ProductFormComponent
                            ),
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () =>
                            import('./features/products/product-form/product-form').then(
                                (m) => m.ProductFormComponent
                            ),
                    },
                    {
                        path: 'low-stock',
                        loadComponent: () =>
                            import('./features/products/low-stock-alerts/low-stock-alerts').then(
                                (m) => m.LowStockAlertsComponent
                            ),
                    },
                ],
            },
            {
                path: 'orders',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/orders/order-list/order-list').then(
                                (m) => m.OrderListComponent
                            ),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./features/orders/order-detail/order-detail').then(
                                (m) => m.OrderDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'customers',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/customers/customer-list/customer-list').then(
                                (m) => m.CustomerListComponent
                            ),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./features/customers/customer-detail/customer-detail').then(
                                (m) => m.CustomerDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'coupons',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/coupons/coupon-list/coupon-list').then(
                                (m) => m.CouponListComponent
                            ),
                    },
                    {
                        path: 'add',
                        loadComponent: () =>
                            import('./features/coupons/coupon-form/coupon-form').then(
                                (m) => m.CouponFormComponent
                            ),
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () =>
                            import('./features/coupons/coupon-form/coupon-form').then(
                                (m) => m.CouponFormComponent
                            ),
                    },
                ],
            },
            {
                path: 'inventory',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/inventory/inventory-dashboard/inventory-dashboard').then(
                                (m) => m.InventoryDashboardComponent
                            ),
                    },
                    {
                        path: 'logs',
                        loadComponent: () =>
                            import('./features/inventory/stock-logs/stock-logs').then(
                                (m) => m.StockLogsComponent
                            ),
                    },
                    {
                        path: 'adjust/:id',
                        loadComponent: () =>
                            import('./features/inventory/stock-adjustment/stock-adjustment').then(
                                (m) => m.StockAdjustmentComponent
                            ),
                    },
                ],
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
