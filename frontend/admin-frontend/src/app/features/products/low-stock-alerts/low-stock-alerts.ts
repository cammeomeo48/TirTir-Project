import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';

interface Product {
    _id: string;
    Product_Name: string;
    Product_ID: string;
    Category: string;
    Price: number;
    Thumbnail_Images: string[];
    stock: number;
}

@Component({
    selector: 'app-low-stock-alerts',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './low-stock-alerts.html',
    styleUrls: ['./low-stock-alerts.css']
})
export class LowStockAlertsComponent implements OnInit {
    lowStockProducts: Product[] = [];
    loading = true;
    error: string | null = null;

    constructor(private productService: ProductService) { }

    ngOnInit(): void {
        this.loadLowStockProducts();
    }

    loadLowStockProducts(): void {
        this.loading = true;
        this.error = null;

        this.productService.getLowStockProducts().subscribe({
            next: (data: any) => {
                // Handle both array response and wrapped object response
                const products = Array.isArray(data) ? data : (data.products || data.data || []);
                this.lowStockProducts = products.sort((a: Product, b: Product) => a.stock - b.stock);
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load low stock products';
                this.loading = false;
                console.error('Low stock load error:', err);
            }
        });
    }

    getStockStatus(stock: number): string {
        if (stock === 0) return 'out-of-stock';
        if (stock <= 10) return 'critical';
        return 'low-stock';
    }

    getStockLabel(stock: number): string {
        if (stock === 0) return 'Out of Stock';
        if (stock <= 10) return 'Critical';
        return 'Low Stock';
    }

    getMainImage(product: Product): string {
        return product.Thumbnail_Images && product.Thumbnail_Images.length > 0
            ? product.Thumbnail_Images[0]
            : 'assets/placeholder-product.png';
    }

    quickRestock(product: Product): void {
        const quantity = prompt(`How many units to add for "${product.Product_Name}"?`, '50');
        if (quantity && !isNaN(Number(quantity))) {
            // TODO: Implement stock adjustment API call
            alert(`Feature coming soon: Add ${quantity} units to ${product.Product_Name}`);
        }
    }
}
