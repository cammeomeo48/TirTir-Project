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
            Code: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')]],
            Discount_Type: ['percentage', Validators.required],
            Discount_Value: [0, [Validators.required, Validators.min(0.01)]],
            Start_Date: ['', Validators.required],
            End_Date: ['', Validators.required],
            Min_Order_Amount: [0, [Validators.min(0)]],
            Max_Discount_Amount: [null],
            Usage_Limit: [null, [Validators.min(1)]],
            Status: ['active', Validators.required]
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
                const startDate = new Date(coupon.Start_Date).toISOString().split('T')[0];
                const endDate = new Date(coupon.End_Date).toISOString().split('T')[0];

                this.couponForm.patchValue({
                    ...coupon,
                    Start_Date: startDate,
                    End_Date: endDate
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
            Discount_Value: Number(formValue.Discount_Value),
            Min_Order_Amount: formValue.Min_Order_Amount ? Number(formValue.Min_Order_Amount) : undefined,
            Max_Discount_Amount: formValue.Max_Discount_Amount ? Number(formValue.Max_Discount_Amount) : undefined,
            Usage_Limit: formValue.Usage_Limit ? Number(formValue.Usage_Limit) : undefined,
        };

        if (this.isEditMode && this.couponId) {
            this.couponService.updateCoupon(this.couponId, couponData).subscribe({
                next: () => {
                    this.router.navigate(['/coupons']);
                },
                error: (err) => {
                    this.error = 'Failed to update coupon';
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
                    this.error = 'Failed to create coupon';
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
