import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { Address } from '../../../core/models';
import { LocationService, LocationItem } from '../../../core/services/location.service';

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
    private locationService = inject(LocationService);

    addresses: Address[] = [];
    loading = false;
    successMessage = '';
    errorMessage = '';

    // Form mode and state
    showForm = false;
    editMode = false;
    editingAddressId: string | null = null;
    addressForm!: FormGroup;

    // Dynamic location data from API
    provinces: LocationItem[] = [];
    districts: LocationItem[] = [];
    wards: LocationItem[] = [];

    ngOnInit(): void {
        this.initForm();
        this.loadAddresses();
        this.loadProvinces();
    }

    loadProvinces(): void {
        this.locationService.getProvinces().subscribe(data => {
            this.provinces = data;
        });
    }

    onProvinceChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const val = select.value;
        if (!val) {
            this.districts = [];
            this.wards = [];
            this.addressForm.patchValue({ district: '', ward: '' });
            return;
        }
        const provinceId = val.split('|')[0];
        this.locationService.getDistricts(provinceId).subscribe(data => {
            this.districts = data;
            this.wards = [];
            this.addressForm.patchValue({ district: '', ward: '' });
        });
    }

    onDistrictChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const val = select.value;
        if (!val) {
            this.wards = [];
            this.addressForm.patchValue({ ward: '' });
            return;
        }
        const districtId = val.split('|')[0];
        this.locationService.getWards(districtId).subscribe(data => {
            this.wards = data;
            this.addressForm.patchValue({ ward: '' });
        });
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
        
        // Find the province to extract ID so we can fetch districts
        const p = this.provinces.find(prov => prov.full_name === address.city || prov.name === address.city);
        
        const initialPatch = {
            ...address,
            city: p ? `${p.id}|${p.full_name}` : '',
            district: '',
            ward: ''
        };
        this.addressForm.patchValue(initialPatch);

        if (p) {
            this.locationService.getDistricts(p.id).subscribe(dData => {
                this.districts = dData;
                const d = this.districts.find(dist => dist.full_name === address.district || dist.name === address.district);
                if (d) {
                    this.addressForm.patchValue({ district: `${d.id}|${d.full_name}` });
                    this.locationService.getWards(d.id).subscribe(wData => {
                        this.wards = wData;
                        const w = this.wards.find(ward => ward.full_name === address.ward || ward.name === address.ward);
                        if (w) {
                            this.addressForm.patchValue({ ward: `${w.id}|${w.full_name}` });
                        }
                    });
                }
            });
        }
    }

    closeForm(): void {
        this.showForm = false;
        this.editMode = false;
        this.editingAddressId = null;
        this.addressForm.reset();
        this.districts = [];
        this.wards = [];
    }

    onSubmit(): void {
        if (this.addressForm.invalid) {
            this.addressForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.successMessage = '';
        this.errorMessage = '';

        const rawVal = this.addressForm.value;
        const cityParts = (rawVal.city || '').split('|');
        const districtParts = (rawVal.district || '').split('|');
        const wardParts = (rawVal.ward || '').split('|');

        // Extract just the full string names to send to DB
        const formData = {
            ...rawVal,
            city: cityParts.length > 1 ? cityParts[1] : cityParts[0],
            district: districtParts.length > 1 ? districtParts[1] : districtParts[0],
            ward: wardParts.length > 1 ? wardParts[1] : wardParts[0]
        };

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
