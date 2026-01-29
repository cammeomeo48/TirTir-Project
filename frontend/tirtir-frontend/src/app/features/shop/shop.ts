import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { PRODUCTS, ProductData } from '../../core/constants/products.data';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCard],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class ShopComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  isMakeupCollection = false;
  collectionTitle = 'SHOP ALL';
  collectionDescription = 'Discover all TIRTIR products.';
  // Filter state
  showFilters = true;
  sortBy = 'best-selling';

  // Expandable filter groups
  expandedFilters: { [key: string]: boolean } = {
    type: true,
    regimen: true
  };

  // Pagination
  currentPage = 1;
  productsPerPage = 12;

  // All products from data source
  allProducts: ProductData[] = [];

  // Display products (filtered & paginated)
  displayProducts: ProductData[] = [];

  // Explicit array for current page items
  paginatedProducts: ProductData[] = [];

  // Filter options
  productTypes = [
    { label: 'Cushion', value: 'cushion', count: 0 },
    { label: 'Cleanser', value: 'cleanser', count: 0 },
    { label: 'Toner', value: 'toner', count: 0 },
    { label: 'Serum', value: 'serum', count: 0 },
    { label: 'Cream', value: 'cream', count: 0 },
    { label: 'Ampoule', value: 'ampoule', count: 0 },
    { label: 'Sunscreen', value: 'sunscreen', count: 0 },
    { label: 'Mask', value: 'mask', count: 0 },
    { label: 'Lip', value: 'lip', count: 0 },
    { label: 'Fixer', value: 'fixer', count: 0 },
    { label: 'Primer', value: 'primer', count: 0 },
    { label: 'Facial Oil', value: 'facial-oil', count: 0 },
    { label: 'Eye Cream', value: 'eye-cream', count: 0 },
  ];

  // Regimen options
  regimens = [
    { label: 'Hydration', value: 'hydration', count: 0 },
    { label: 'Soothing', value: 'soothing', count: 0 },
    { label: 'Brightening', value: 'brightening', count: 0 },
    { label: 'Pore Care', value: 'pore-care', count: 0 },
    { label: 'Anti-Aging', value: 'anti-aging', count: 0 },
  ];

  constructor() { }

  // Track selected categories for server-side filtering
  selectedCategories: Set<string> = new Set();

  ngOnInit(): void {
    this.isMakeupCollection = this.route.snapshot.routeConfig?.path === 'collections/makeup';

    if (this.isMakeupCollection) {
      this.collectionTitle = 'MAKEUP';
      this.collectionDescription = 'Discover TIRTIR makeup essentials for a long-lasting, luminous finish.';
      // Pre-select makeup categories if needed, or leave open
    }

    // Initial Load
    this.loadProducts();
  }

  loadProducts() {
    const params: any = {
      limit: 1000 // We still fetch many, but backend aggregates can handle pagination if we switch to it
    };

    // Add category filter if any selected
    if (this.selectedCategories.size > 0) {
      // Map internal values ('cushion') back to Display Names ('Cushion') for backend?
      // The backend expects Comma Separated Display Names (e.g. "Cushion,Toner")
      // We need to map our values to the labels or keys expected by backend
      const selectedLabels = this.productTypes
        .filter(t => this.selectedCategories.has(t.value))
        .map(t => t.label) // "Cushion", "Lip"
        .join(',');

      if (selectedLabels) {
        params.category = selectedLabels;
      }
    }

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.allProducts = response.data;
        // Update counts (optional: if you want counts to reflect "remaining" or "global")
        // Usually facets show GLOBAL counts even when filtered, or filtered counts. 
        // Our backend returns "Global" counts if we don't apply filters in the facet pipeline, 
        // BUT currently it applies matchStage to everything. So counts will shrink.
        if (response.categories && response.categories.length > 0) {
          this.updateSidebarCounts(response.categories);
        }
        this.updateDisplayProducts();
      },
      error: (err) => console.error('Failed to load products', err)
    });
  }

  onFilterChange(event: any, typeValue: string) {
    if (event.target.checked) {
      this.selectedCategories.add(typeValue);
    } else {
      this.selectedCategories.delete(typeValue);
    }
    // Reload from server with new filters
    this.loadProducts();
  }

  updateSidebarCounts(backendCategories: any[]) {
    // Map backend count to frontend options
    this.productTypes.forEach(type => {
      // Find matching category (Backend returns Display Name e.g. "Cushion", "Toner")
      const match = backendCategories.find(c => c.name.toLowerCase() === type.label.toLowerCase());
      // Only update count if we found a match? Or set to 0? 
      // If we are filtering, missing items happen.
      type.count = match ? match.count : 0;
    });
  }

  calculateCounts() {
    this.productTypes.forEach(type => {
      type.count = this.allProducts.filter(p => p.category === type.value).length;
    });
  }

  updateDisplayProducts() {
    let filtered = this.allProducts;

    // Filter by collection if needed
    if (this.isMakeupCollection) {
      // Makeup categories: cushion, lip, fixer, primer
      const makeupCategories = ['cushion', 'lip', 'fixer', 'primer'];
      filtered = filtered.filter(p => makeupCategories.includes(p.category)); // API must map this correctly
    }

    // Apply sorting
    if (this.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'newest') {
      // Mock sort by ID/index for now as we don't have date
      filtered = [...filtered].reverse();
    }
    // Default 'best-selling' - leave as is (mock order)

    this.displayProducts = filtered;
    this.currentPage = 1; // Reset to page 1 on filter change
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    this.paginatedProducts = this.displayProducts.slice(startIndex, startIndex + this.productsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.displayProducts.length / this.productsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleFilterGroup(group: string) {
    this.expandedFilters[group] = !this.expandedFilters[group];
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
