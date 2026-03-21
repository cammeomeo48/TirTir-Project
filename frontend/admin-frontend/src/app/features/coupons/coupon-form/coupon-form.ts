import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CouponService, Coupon } from '../../../core/services/coupon.service';

@Component({
    selector: 'app-coupon-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './coupon-form.html',
    styleUrls: ['./coupon-form.css']
})
export class CouponFormComponent implements OnInit {
    couponForm: FormGroup;
    isEditMode = false;
    couponId: string | null = null;
    loading = false;
    error: string | null = null;
    submitting = false;

    constructor(
        private fb: FormBuilder,
        private couponService: CouponService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.couponForm = this.fb.group({
            code: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')]],
            discountType: ['percentage', Validators.required],
            discountValue: [0, [Validators.required, Validators.min(0.01)]],
            validFrom: ['', Validators.required],
            validTo: ['', Validators.required],
            minOrderValue: [0, [Validators.min(0)]],
            maxDiscount: [null],
            usageLimit: [null, [Validators.min(1)]],
            active: [true, Validators.required]
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.couponId = id;
            this.loadCoupon(id);
        }
    }

    loadCoupon(id: string): void {
        this.loading = true;
        this.couponService.getCouponById(id).subscribe({
            next: (coupon) => {
                // Format dates for input[type="date"]
                const validFrom = new Date(coupon.validFrom).toISOString().split('T')[0];
                const validTo = new Date(coupon.validTo).toISOString().split('T')[0];

                this.couponForm.patchValue({
                    ...coupon,
                    validFrom,
                    validTo
                });
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load coupon details';
                this.loading = false;
                console.error('Load error:', err);
            }
        });
    }

    onSubmit(): void {
        if (this.couponForm.invalid) {
            this.markFormGroupTouched(this.couponForm);
            return;
        }

        this.submitting = true;
        this.error = null;

        const formValue = this.couponForm.value;
        // Ensure numeric values are numbers
        const couponData: Coupon = {
            ...formValue,
            discountValue: Number(formValue.discountValue),
            minOrderValue: formValue.minOrderValue ? Number(formValue.minOrderValue) : 0,
            maxDiscount: formValue.maxDiscount ? Number(formValue.maxDiscount) : undefined,
            usageLimit: formValue.usageLimit ? Number(formValue.usageLimit) : undefined,
            usedCount: this.isEditMode ? formValue.usedCount : 0,
        };

        if (this.isEditMode && this.couponId) {
            this.couponService.updateCoupon(this.couponId, couponData).subscribe({
                next: () => {
                    this.router.navigate(['/coupons']);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Failed to update coupon';
                    this.submitting = false;
                    console.error('Update error:', err);
                }
            });
        } else {
            this.couponService.createCoupon(couponData).subscribe({
                next: () => {
                    this.router.navigate(['/coupons']);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Failed to create coupon';
                    this.submitting = false;
                    console.error('Create error:', err);
                }
            });
        }
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
