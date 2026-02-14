import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';

interface Product {
    _id: string;
    Product_Name: string;
    Product_ID: string; // SKU
    Category: string;
    Price: number;
    Thumbnail_Images: string[];
    stock: number;
    status?: string;
}

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './product-list.html',
    styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    loading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    pageSize = 20;
    totalPages = 1;

    // Search & Filters
    searchQuery = '';
    selectedCategory = '';
    selectedStockStatus = '';

    categories = ['All', 'Makeup', 'Skincare'];
    stockStatuses = [
        { value: '', label: 'All Stock Levels' },
        { value: 'in-stock', label: 'In Stock (>20)' },
        { value: 'low-stock', label: 'Low Stock (1-20)' },
        { value: 'out-of-stock', label: 'Out of Stock (0)' }
    ];

    constructor(private productService: ProductService) { }

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.loading = true;
        this.error = null;

        this.productService.getAllProducts().subscribe({
            next: (data: any) => {
                // Handle both array response and wrapped object response
                this.products = Array.isArray(data) ? data : (data.products || data.data || []);
                this.applyFilters();
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load products';
                this.loading = false;
                console.error('Product load error:', err);
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.products];

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.Product_Name.toLowerCase().includes(query) ||
                p.Product_ID.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (this.selectedCategory && this.selectedCategory !== 'All') {
            filtered = filtered.filter(p => p.Category === this.selectedCategory);
        }

        // Stock status filter
        if (this.selectedStockStatus) {
            switch (this.selectedStockStatus) {
                case 'in-stock':
                    filtered = filtered.filter(p => p.stock > 20);
                    break;
                case 'low-stock':
                    filtered = filtered.filter(p => p.stock > 0 && p.stock <= 20);
                    break;
                case 'out-of-stock':
                    filtered = filtered.filter(p => p.stock === 0);
                    break;
            }
        }

        this.filteredProducts = filtered;
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        this.currentPage = 1; // Reset to first page when filters change
    }

    getPaginatedProducts(): Product[] {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredProducts.slice(start, end);
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    onCategoryChange(): void {
        this.applyFilters();
    }

    onStockStatusChange(): void {
        this.applyFilters();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    deleteProduct(product: Product): void {
        if (confirm(`Are you sure you want to delete "${product.Product_Name}"?`)) {
            this.productService.deleteProduct(product._id).subscribe({
                next: () => {
                    this.loadProducts(); // Reload list
                },
                error: (err: any) => {
                    alert('Failed to delete product');
                    console.error('Delete error:', err);
                }
            });
        }
    }

    getStockStatus(stock: number): string {
        if (stock === 0) return 'out-of-stock';
        if (stock <= 20) return 'low-stock';
        return 'in-stock';
    }

    getStockLabel(stock: number): string {
        if (stock === 0) return 'Out of Stock';
        if (stock <= 20) return 'Low Stock';
        return 'In Stock';
    }

    getMainImage(product: Product): string {
        return product.Thumbnail_Images && product.Thumbnail_Images.length > 0
            ? product.Thumbnail_Images[0]
            : 'assets/placeholder-product.png';
    }
}
