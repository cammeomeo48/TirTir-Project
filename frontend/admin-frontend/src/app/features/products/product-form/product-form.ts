import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './product-form.html',
    styleUrls: ['./product-form.css']
})
export class ProductFormComponent implements OnInit {
    productForm!: FormGroup;
    isEditMode = false;
    productId: string | null = null;
    loading = false;
    error: string | null = null;
    imagePreview: string | null = null;

    categories = ['Makeup', 'Skincare'];

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.initForm();

        // Check if edit mode
        this.productId = this.route.snapshot.paramMap.get('id');
        if (this.productId) {
            this.isEditMode = true;
            this.loadProduct(this.productId);
        }
    }

    initForm(): void {
        this.productForm = this.fb.group({
            Product_Name: ['', [Validators.required, Validators.minLength(3)]],
            Product_ID: ['', [Validators.required]],
            Category: ['Makeup', [Validators.required]],
            Price: [0, [Validators.required, Validators.min(0)]],
            stock: [0, [Validators.required, Validators.min(0)]],
            Description: [''],
            Thumbnail_Images: [[]]
        });
    }

    loadProduct(id: string): void {
        this.loading = true;
        this.productService.getProduct(id).subscribe({
            next: (product: any) => {
                this.productForm.patchValue({
                    Product_Name: product.Product_Name,
                    Product_ID: product.Product_ID,
                    Category: product.Category,
                    Price: product.Price,
                    stock: product.stock,
                    Description: product.Description || '',
                    Thumbnail_Images: product.Thumbnail_Images || []
                });

                if (product.Thumbnail_Images && product.Thumbnail_Images.length > 0) {
                    this.imagePreview = product.Thumbnail_Images[0];
                }

                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load product';
                this.loading = false;
                console.error('Load product error:', err);
            }
        });
    }

    onImageChange(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
                // For now, store the data URL (in production, upload to server)
                this.productForm.patchValue({
                    Thumbnail_Images: [e.target.result]
                });
            };
            reader.readAsDataURL(file);
        }
    }

    onSubmit(): void {
        if (this.productForm.invalid) {
            Object.keys(this.productForm.controls).forEach(key => {
                this.productForm.controls[key].markAsTouched();
            });
            return;
        }

        this.loading = true;
        this.error = null;

        const productData = this.productForm.value;

        if (this.isEditMode && this.productId) {
            // Update existing product
            this.productService.updateProduct(this.productId, productData).subscribe({
                next: () => {
                    this.router.navigate(['/products']);
                },
                error: (err: any) => {
                    this.error = 'Failed to update product';
                    this.loading = false;
                    console.error('Update error:', err);
                }
            });
        } else {
            // Create new product
            this.productService.addProduct(productData).subscribe({
                next: () => {
                    this.router.navigate(['/products']);
                },
                error: (err: any) => {
                    this.error = 'Failed to create product';
                    this.loading = false;
                    console.error('Create error:', err);
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/products']);
    }

    getFieldError(field: string): string {
        const control = this.productForm.get(field);
        if (control?.hasError('required')) return `${field} is required`;
        if (control?.hasError('minlength')) return `${field} is too short`;
        if (control?.hasError('min')) return `${field} must be greater than 0`;
        return '';
    }
}
