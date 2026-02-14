import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService, Coupon } from '../../../core/services/coupon.service';

@Component({
    selector: 'app-coupon-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './coupon-list.html',
    styleUrls: ['./coupon-list.css']
})
export class CouponListComponent implements OnInit {
    coupons: Coupon[] = [];
    filteredCoupons: Coupon[] = [];
    loading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;

    // Filters
    searchQuery = '';
    selectedStatus = '';

    constructor(private couponService: CouponService) { }

    ngOnInit(): void {
        this.loadCoupons();
    }

    loadCoupons(): void {
        this.loading = true;
        this.error = null;

        this.couponService.getAllCoupons().subscribe({
            next: (data: any) => {
                // Handle array or wrapped response
                this.coupons = Array.isArray(data) ? data : (data.coupons || data.data || []);
                this.applyFilters();
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load coupons';
                this.loading = false;
                console.error('Coupon load error:', err);
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.coupons];

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.Code.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (this.selectedStatus) {
            filtered = filtered.filter(c => c.Status === this.selectedStatus);
        }

        this.filteredCoupons = filtered;
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        this.currentPage = 1;
    }

    onSearch(): void {
        this.applyFilters();
    }

    onStatusChange(): void {
        this.applyFilters();
    }

    get paginatedCoupons(): Coupon[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredCoupons.slice(startIndex, startIndex + this.pageSize);
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    deleteCoupon(id: string): void {
        if (confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
            this.couponService.deleteCoupon(id).subscribe({
                next: () => {
                    this.loadCoupons();
                },
                error: (err) => {
                    console.error('Delete error:', err);
                    alert('Failed to delete coupon');
                }
            });
        }
    }

    toggleStatus(coupon: Coupon): void {
        const newStatus = coupon.Status === 'active' ? 'inactive' : 'active';
        this.couponService.toggleCouponStatus(coupon._id!, newStatus).subscribe({
            next: (updatedCoupon) => {
                coupon.Status = updatedCoupon.Status;
            },
            error: (err) => {
                console.error('Status update error:', err);
                alert('Failed to update coupon status');
            }
        });
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDiscount(type: string, value: number): string {
        return type === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`;
    }
}
