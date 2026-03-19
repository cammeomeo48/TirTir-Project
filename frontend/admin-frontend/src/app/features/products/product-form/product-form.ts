import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { environment } from '../../../../environments/environment';
import { ShadeService, Shade } from '../../../core/services/shade.service';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
    templateUrl: './product-form.html',
    styleUrls: ['./product-form.css']
})
export class ProductFormComponent implements OnInit {
    productForm!: FormGroup;
    isEditMode = false;
    productId: string | null = null;
    loading = false;
    uploadingImage = false;
    error: string | null = null;
    imagePreview: string | null = null;

    categories = ['Makeup', 'Skincare', 'Gift Card'];

    get shouldShowVariants(): boolean {
        return this.productForm.get('Category')?.value !== 'Gift Card';
    }

    // ─── Shade Management ──────────────────────────────────────
    shades: Shade[] = [];
    shadesLoading = false;
    shadesError: string | null = null;

    // Add shade form
    showAddShade = false;
    newShade: Partial<Shade> = {};
    savingShade = false;

    // Edit shade
    editingShadeId: string | null = null;
    editShadeDraft: Partial<Shade> = {};

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private shadeService: ShadeService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.productId = this.route.snapshot.paramMap.get('id');
        if (this.productId) {
            this.isEditMode = true;
            this.loadProduct(this.productId);
            this.loadShades(this.productId);
        }
    }

    initForm(): void {
        this.productForm = this.fb.group({
            Product_Name: ['', [Validators.required, Validators.minLength(3)]],
            Product_ID: ['', [Validators.required]],
            Category: ['Makeup', [Validators.required]],
            Price: [0, [Validators.required, Validators.min(0)]],
            Stock_Quantity: [0, [Validators.required, Validators.min(0)]],
            Description: [''],
            Thumbnail_Images: ['']
        });
    }

    loadProduct(id: string): void {
        this.loading = true;
        this.productService.getProduct(id).subscribe({
            next: (product: any) => {
                this.productForm.patchValue({
                    Product_Name: product.Product_Name || product.Name,
                    Product_ID: product.Product_ID,
                    Category: product.Category,
                    Price: product.Price,
                    Stock_Quantity: product.Stock_Quantity || product.stock || 0,
                    Description: product.Description || product.Description_Short || '',
                    Thumbnail_Images: typeof product.Thumbnail_Images === 'string' ? product.Thumbnail_Images : (Array.isArray(product.Thumbnail_Images) ? product.Thumbnail_Images[0] : '')
                });
                
                const thumb = this.productForm.get('Thumbnail_Images')?.value;
                if (thumb) {
                    this.imagePreview = this.resolveImageUrl(thumb);
                }
                this.loading = false;
            },
            error: (err: any) => {
                this.error = 'Failed to load product';
                this.loading = false;
            }
        });
    }

    // ─── Shade Operations ──────────────────────────────────────

    loadShades(productId: string): void {
        this.shadesLoading = true;
        this.shadeService.getShadesByProduct(productId).subscribe({
            next: (data) => {
                this.shades = data;
                this.shadesLoading = false;
            },
            error: () => {
                this.shadesLoading = false;
                this.shadesError = 'Could not load shades';
            }
        });
    }

    openAddShade(): void {
        this.showAddShade = true;
        this.newShade = {
            Product_ID: this.productId || '',
            Parent_ID: this.productId || '',
            Hex_Code: '#000000',
            Shade_Name: '',
            Shade_Code: '',
            Shade_Category_Name: '',
            Shade_ID: `SH-${Date.now()}`
        };
    }

    cancelAddShade(): void {
        this.showAddShade = false;
        this.newShade = {};
    }

    saveShade(): void {
        if (!this.newShade.Shade_Name || !this.newShade.Hex_Code) return;
        this.savingShade = true;
        this.shadeService.createShade(this.newShade).subscribe({
            next: (created) => {
                this.shades = [...this.shades, created];
                this.showAddShade = false;
                this.newShade = {};
                this.savingShade = false;
            },
            error: (err) => {
                console.error('Create shade error:', err);
                this.savingShade = false;
            }
        });
    }

    openEditShade(shade: Shade): void {
        this.editingShadeId = shade.Shade_ID;
        this.editShadeDraft = { ...shade };
    }

    cancelEditShade(): void {
        this.editingShadeId = null;
    }

    saveEditShade(): void {
        if (!this.editingShadeId) return;
        this.savingShade = true;
        this.shadeService.updateShade(this.editingShadeId, this.editShadeDraft).subscribe({
            next: (updated) => {
                const idx = this.shades.findIndex(s => s.Shade_ID === this.editingShadeId);
                if (idx !== -1) this.shades[idx] = updated;
                this.editingShadeId = null;
                this.savingShade = false;
            },
            error: (err) => {
                console.error('Update shade error:', err);
                this.savingShade = false;
            }
        });
    }

    deleteShade(shade: Shade): void {
        if (!confirm(`Delete shade "${shade.Shade_Name}"?`)) return;
        this.shadeService.deleteShade(shade.Shade_ID).subscribe({
            next: () => {
                this.shades = this.shades.filter(s => s.Shade_ID !== shade.Shade_ID);
            },
            error: (err) => console.error('Delete shade error:', err)
        });
    }

    // ─── Image ─────────────────────────────────────────────────

    onImageChange(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => { this.imagePreview = e.target.result; };
            reader.readAsDataURL(file);
            this.uploadingImage = true;
            this.productService.uploadImage(file).subscribe({
                next: (response: any) => {
                    this.uploadingImage = false;
                    if (response.success) {
                        this.productForm.patchValue({ Thumbnail_Images: response.data.url });
                    }
                },
                error: () => {
                    this.uploadingImage = false;
                    this.error = 'Failed to upload image';
                }
            });
        }
    }

    resolveImageUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('data:') || path.startsWith('http')) return path;
        
        const backendBase = environment.apiUrl.replace('/api/v1', '');
        const clean = path.startsWith('/') ? path.slice(1) : path;
        return `${backendBase}/${clean}`;
    }

    // ─── Submit ────────────────────────────────────────────────

    onSubmit(): void {
        if (this.productForm.invalid) {
            Object.keys(this.productForm.controls).forEach(key => this.productForm.controls[key].markAsTouched());
            return;
        }
        this.loading = true;
        this.error = null;
        const productData = { ...this.productForm.value, Name: this.productForm.value.Product_Name };
        const save$ = this.isEditMode && this.productId
            ? this.productService.updateProduct(this.productId, productData)
            : this.productService.addProduct(productData);
        save$.subscribe({
            next: () => this.router.navigate(['/products']),
            error: (err: any) => {
                this.error = this.isEditMode ? 'Failed to update product' : 'Failed to create product';
                this.loading = false;
            }
        });
    }

    cancel(): void { this.router.navigate(['/products']); }

    getFieldError(field: string): string {
        const control = this.productForm.get(field);
        if (control?.hasError('required')) return `${field} is required`;
        if (control?.hasError('minlength')) return `${field} is too short`;
        if (control?.hasError('min')) return `${field} must be greater than 0`;
        return '';
    }
}
