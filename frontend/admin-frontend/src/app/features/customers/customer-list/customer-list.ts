import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../../core/services/customer.service';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './customer-list.html',
    styleUrls: ['./customer-list.css']
})
export class CustomerListComponent implements OnInit {
    customers: Customer[] = [];
    filteredCustomers: Customer[] = [];
    loading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;

    // Filters
    searchQuery = '';
    selectedStatus = '';

    sortMode: 'newest' | 'none' = 'none';

    constructor(
        private customerService: CustomerService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const sort = params['sort'];
            this.sortMode = sort === 'newest' ? 'newest' : 'none';
            if (this.customers.length > 0) this.applyFilters();
        });
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.loading = true;
        this.error = null;

        this.customerService.getAllCustomers().subscribe({
            next: (data: any) => {
                // Handle array or wrapped response
                this.customers = Array.isArray(data) ? data : (data.users || data.data || []);
                this.applyFilters();
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load customers';
                this.loading = false;
                console.error('Customer load error:', err);
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.customers];

        // Sort newest first when deep-linked from General
        if (this.sortMode === 'newest') {
            filtered.sort((a: any, b: any) => {
                const ta = new Date(a.createdAt || a.Created_At || 0).getTime();
                const tb = new Date(b.createdAt || b.Created_At || 0).getTime();
                return tb - ta;
            });
        }

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                (c.name || '').toLowerCase().includes(query) ||
                (c.email || '').toLowerCase().includes(query)
            );
        }

        // Status filter
        if (this.selectedStatus) {
            filtered = filtered.filter(c => c.status === this.selectedStatus);
        }

        this.filteredCustomers = filtered;
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        this.currentPage = 1;
    }

    onSearch(): void {
        this.applyFilters();
    }

    onStatusChange(): void {
        this.applyFilters();
    }

    get paginatedCustomers(): Customer[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredCustomers.slice(startIndex, startIndex + this.pageSize);
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
