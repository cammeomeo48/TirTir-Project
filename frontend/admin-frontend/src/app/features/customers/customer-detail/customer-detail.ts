import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../../core/services/customer.service';

@Component({
    selector: 'app-customer-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './customer-detail.html',
    styleUrls: ['./customer-detail.css']
})
export class CustomerDetailComponent implements OnInit {
    customer: Customer | null = null;
    orders: any[] = [];
    loading = true;
    error: string | null = null;
    updating = false;

    constructor(
        private route: ActivatedRoute,
        private customerService: CustomerService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadCustomerData(id);
        }
    }

    loadCustomerData(id: string): void {
        this.loading = true;
        this.error = null;

        // Load customer details and orders in parallel (mock-style sequential for now as observables)
        this.customerService.getCustomerById(id).subscribe({
            next: (data) => {
                this.customer = data;
                this.loadOrders(id);
            },
            error: (err) => {
                this.error = 'Failed to load customer details';
                this.loading = false;
                console.error('Customer details error:', err);
            }
        });
    }

    loadOrders(id: string): void {
        this.customerService.getCustomerOrders(id).subscribe({
            next: (data) => {
                this.orders = Array.isArray(data) ? data : [];
                this.loading = false;
            },
            error: (err) => {
                console.error('Customer orders error:', err);
                // Don't block page if orders fail
                this.orders = [];
                this.loading = false;
            }
        });
    }

    toggleStatus(): void {
        if (!this.customer || this.updating) return;

        const newStatus = this.customer.status === 'active' ? 'inactive' : 'active';
        const confirmMsg = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this customer?`;

        if (confirm(confirmMsg)) {
            this.updating = true;
            this.customerService.updateCustomerStatus(this.customer._id, newStatus).subscribe({
                next: (updatedCustomer) => {
                    if (this.customer) { // Check again to satisfy type safety
                        this.customer.status = updatedCustomer.status;
                    }
                    this.updating = false;
                },
                error: (err) => {
                    console.error('Status update error:', err);
                    alert('Failed to update status');
                    this.updating = false;
                }
            });
        }
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }
}
