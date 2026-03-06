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

// Shape for quick edit — only editable fields
interface QuickEditDraft {
    Product_Name: string;
    Price: number;
    stock: number;
    status: string;
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

    // ─── Quick Edit ─────────────────────────────────────────────
    editingId: string | null = null;
    editDraft: QuickEditDraft = { Product_Name: '', Price: 0, stock: 0, status: 'active' };
    saving = false;
    saveError: string | null = null;

    // ─── Delete Confirm ─────────────────────────────────────────
    pendingDeleteId: string | null = null;
    deleteError: string | null = null;

    constructor(private productService: ProductService) { }

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.loading = true;
        this.error = null;

        this.productService.getAllProducts().subscribe({
            next: (data: any) => {
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

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.Product_Name.toLowerCase().includes(query) ||
                p.Product_ID.toLowerCase().includes(query)
            );
        }

        if (this.selectedCategory && this.selectedCategory !== 'All') {
            filtered = filtered.filter(p => p.Category === this.selectedCategory);
        }

        if (this.selectedStockStatus) {
            switch (this.selectedStockStatus) {
                case 'in-stock': filtered = filtered.filter(p => p.stock > 20); break;
                case 'low-stock': filtered = filtered.filter(p => p.stock > 0 && p.stock <= 20); break;
                case 'out-of-stock': filtered = filtered.filter(p => p.stock === 0); break;
            }
        }

        this.filteredProducts = filtered;
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        this.currentPage = 1;
    }

    getPaginatedProducts(): Product[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredProducts.slice(start, start + this.pageSize);
    }

    onSearchChange(): void { this.applyFilters(); }
    onCategoryChange(): void { this.applyFilters(); }
    onStockStatusChange(): void { this.applyFilters(); }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }

    // ─── Quick Edit ─────────────────────────────────────────────

    openEdit(product: Product): void {
        this.editingId = product._id;
        this.editDraft = {
            Product_Name: product.Product_Name,
            Price: product.Price,
            stock: product.stock,
            status: product.status || 'active'
        };
    }

    cancelEdit(): void {
        this.editingId = null;
    }

    saveEdit(product: Product): void {
        if (!this.editDraft.Product_Name?.trim() || this.editDraft.Price < 0) return;
        this.saving = true;
        this.saveError = null;

        const payload = {
            Product_Name: this.editDraft.Product_Name.trim(),
            Price: Number(this.editDraft.Price),
            stock: Number(this.editDraft.stock),
            status: this.editDraft.status
        };

        this.productService.updateProduct(product._id, payload).subscribe({
            next: () => {
                const idx = this.products.findIndex(p => p._id === product._id);
                if (idx !== -1) {
                    this.products[idx] = { ...this.products[idx], ...payload };
                    this.applyFilters();
                }
                this.saving = false;
                this.editingId = null;
            },
            error: (err: any) => {
                this.saveError = err.error?.message || 'Failed to update product. Please try again.';
                this.saving = false;
            }
        });
    }

    // ─── Delete ──────────────────────────────────────────────────
    requestDelete(product: Product): void {
        this.pendingDeleteId = product._id;
        this.deleteError = null;
    }

    cancelDelete(): void {
        this.pendingDeleteId = null;
    }

    confirmDelete(product: Product): void {
        this.deleteError = null;
        this.productService.deleteProduct(product._id).subscribe({
            next: () => {
                this.pendingDeleteId = null;
                this.loadProducts();
            },
            error: (err: any) => {
                this.deleteError = err.error?.message || 'Failed to delete product';
                this.pendingDeleteId = null;
            }
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────
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
        return product.Thumbnail_Images?.length > 0
            ? product.Thumbnail_Images[0]
            : 'assets/placeholder-product.png';
    }
}
