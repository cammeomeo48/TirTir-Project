import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { Address } from '../../../core/models';

@Component({
    selector: 'app-address-book',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './address-book.html',
    styleUrl: './address-book.css'
})
export class AddressBookComponent implements OnInit {
    private userService = inject(UserService);
    private fb = inject(FormBuilder);

    addresses: Address[] = [];
    loading = false;
    successMessage = '';
    errorMessage = '';

    // Form mode and state
    showForm = false;
    editMode = false;
    editingAddressId: string | null = null;
    addressForm!: FormGroup;

    // Vietnamese address data (simplified for MVP)
    cities = [
        'TP. Hồ Chí Minh',
        'Hà Nội',
        'Đà Nẵng',
        'Cần Thơ',
        'Hải Phòng',
        'Biên Hòa',
        'Nha Trang',
        'Huế'
    ];

    districts = [
        'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5',
        'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
        'Quận 11', 'Quận 12', 'Quận Tân Bình', 'Quận Bình Thạnh',
        'Quận Phú Nhuận', 'Quận Thủ Đức', 'Quận Gò Vấp'
    ];

    wards = [
        'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4',
        'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8',
        'Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao'
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadAddresses();
    }

    initForm(): void {
        this.addressForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
            street: ['', [Validators.required]],
            city: ['', [Validators.required]],
            district: ['', [Validators.required]],
            ward: ['', [Validators.required]],
            isDefault: [false]
        });
    }

    loadAddresses(): void {
        this.loading = true;
        this.userService.getAddresses().subscribe({
            next: (addresses) => {
                this.addresses = addresses;
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to load addresses';
                this.loading = false;
            }
        });
    }

    getDefaultAddress(): Address | undefined {
        return this.addresses.find(addr => addr.isDefault);
    }

    openAddForm(): void {
        this.showForm = true;
        this.editMode = false;
        this.editingAddressId = null;
        this.addressForm.reset({ isDefault: false });
    }

    openEditForm(address: Address): void {
        this.showForm = true;
        this.editMode = true;
        this.editingAddressId = address._id || null;
        this.addressForm.patchValue(address);
    }

    closeForm(): void {
        this.showForm = false;
        this.editMode = false;
        this.editingAddressId = null;
        this.addressForm.reset();
    }

    onSubmit(): void {
        if (this.addressForm.invalid) {
            this.addressForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.successMessage = '';
        this.errorMessage = '';

        const formData = this.addressForm.value;

        if (this.editMode && this.editingAddressId) {
            // Update existing address
            this.userService.updateAddress(this.editingAddressId, formData).subscribe({
                next: (addresses) => {
                    this.addresses = addresses;
                    this.successMessage = 'Address updated successfully!';
                    this.loading = false;
                    this.closeForm();
                },
                error: (error) => {
                    this.errorMessage = error.message || 'Failed to update address';
                    this.loading = false;
                }
            });
        } else {
            // Add new address
            this.userService.addAddress(formData).subscribe({
                next: (addresses) => {
                    this.addresses = addresses;
                    this.successMessage = 'Address added successfully!';
                    this.loading = false;
                    this.closeForm();
                },
                error: (error) => {
                    this.errorMessage = error.message || 'Failed to add address';
                    this.loading = false;
                }
            });
        }
    }

    setAsDefault(addressId: string | undefined): void {
        if (!addressId) return;

        this.loading = true;
        this.userService.setDefaultAddress(addressId).subscribe({
            next: (addresses) => {
                this.addresses = addresses;
                this.successMessage = 'Default address updated!';
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to set default address';
                this.loading = false;
            }
        });
    }

    deleteAddress(addressId: string | undefined): void {
        if (!addressId) return;

        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        this.loading = true;
        this.userService.deleteAddress(addressId).subscribe({
            next: (addresses) => {
                this.addresses = addresses;
                this.successMessage = 'Address deleted successfully!';
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to delete address';
                this.loading = false;
            }
        });
    }
}
