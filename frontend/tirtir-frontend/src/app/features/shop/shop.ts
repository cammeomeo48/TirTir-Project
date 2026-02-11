import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  isMakeupCollection = false;
  isSkincareCollection = false; // Added
  collectionTitle = 'SHOP ALL';
  collectionDescription = 'Discover all TIRTIR products.';
  searchTerm = '';
  // Filter state
  showFilters = true;
  isLoading = false;
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

  // Filter options definitions (Source of Truth)
  private readonly allProductTypes = [
    { label: 'Cushion', value: 'cushion', count: 0, category: 'makeup' },
    { label: 'Cleanser', value: 'cleanser', count: 0, category: 'skincare' },
    { label: 'Toner', value: 'toner', count: 0, category: 'skincare' },
    { label: 'Serum', value: 'serum', count: 0, category: 'skincare' },
    { label: 'Cream', value: 'cream', count: 0, category: 'skincare' },
    { label: 'Ampoule', value: 'ampoule', count: 0, category: 'skincare' },
    { label: 'Sunscreen', value: 'sunscreen', count: 0, category: 'skincare' },
    { label: 'Mask', value: 'mask', count: 0, category: 'skincare' },
    { label: 'Lip', value: 'lip', count: 0, category: 'makeup' },
    { label: 'Setting Spray', value: 'setting-spray', count: 0, category: 'makeup' },
    { label: 'Primer', value: 'primer', count: 0, category: 'makeup' },
    { label: 'Facial Oil', value: 'facial-oil', count: 0, category: 'skincare' },
    { label: 'Eye Cream', value: 'eye-cream', count: 0, category: 'skincare' },
  ];

  // Regimen options definitions
  private readonly allRegimens = [
    { label: 'Hydration', value: 'hydration', count: 0 },
    { label: 'Soothing', value: 'soothing', count: 0 },
    { label: 'Brightening', value: 'brightening', count: 0 },
    { label: 'Pore Care', value: 'pore-care', count: 0 },
    { label: 'Wrinkle Care', value: 'wrinkle-care', count: 0 },
    { label: 'Dark Circles', value: 'dark-circles', count: 0 },
    { label: 'Skin Barrier', value: 'barrier', count: 0 },
  ];

  // Active Filter Options (Displayed in Sidebar)
  productTypes = [...this.allProductTypes];
  regimens = [...this.allRegimens];

  constructor() { }

  // Track selected categories for filtering
  selectedCategories: string[] = [];
  selectedRegimens: string[] = [];

  ngOnInit(): void {
    // Combine route params and query params handling
    this.route.queryParams.subscribe(params => {
      const categoryParam = params['category'];

      // Reset state on nav change
      this.selectedCategories = [];
      this.selectedRegimens = [];
      this.searchTerm = params['q'] || '';

      if (categoryParam === 'makeup') {
        this.setupMakeupView();
      } else if (categoryParam === 'skincare') {
        this.setupSkincareView();
      } else if (this.searchTerm) {
        this.setupSearchView();
      } else {
        this.setupShopAllView();
      }

      // Pre-select category if passed and valid (and not just defining the view)
      // If the view is 'makeup', we don't necessarily want to check 'makeup' box, 
      // usually we want to see ALL makeup. But if user clicked "Cushion", that's different.
      // For now, the 'category' param acts as the VIEW SWITCHER as per requirements.

      this.loadProducts();
    });
  }

  setupMakeupView() {
    this.isMakeupCollection = true;
    this.isSkincareCollection = false;
    this.collectionTitle = 'MAKEUP';
    this.collectionDescription = 'Discover TIRTIR makeup essentials for a long-lasting, luminous finish.';

    // Filter sidebar: Show only makeup categories
    this.productTypes = this.allProductTypes.filter(t => t.category === 'makeup');
    // Restore regimens for makeup as user requested counts "on all pages"
    this.regimens = [...this.allRegimens];

    // Don't auto-select. Let categorySlug context handle the base filtering.
    this.selectedCategories = [];
  }

  setupSkincareView() {
    this.isMakeupCollection = false;
    this.isSkincareCollection = true;
    this.collectionTitle = 'SKINCARE';
    this.collectionDescription = 'Discover TIRTIR skincare essentials for healthy, radiant skin.';

    this.productTypes = this.allProductTypes.filter(t => t.category === 'skincare');
    this.regimens = [...this.allRegimens];

    this.selectedCategories = [];
  }

  setupShopAllView() {
    this.isMakeupCollection = false;
    this.isSkincareCollection = false;
    this.collectionTitle = 'SHOP ALL';
    this.collectionDescription = 'Discover all TIRTIR products.';

    this.productTypes = [...this.allProductTypes];
    this.regimens = [...this.allRegimens];
    // No default selection -> Show all
  }

  setupSearchView() {
    this.isMakeupCollection = false;
    this.isSkincareCollection = false;
    this.collectionTitle = `SEARCH: "${this.searchTerm}"`;
    this.collectionDescription = `Results for your search.`;
    this.productTypes = [...this.allProductTypes];
    this.regimens = [...this.allRegimens];
  }

  loadProducts() {
    const params: any = {
      limit: 1000
    };

    if (this.searchTerm) {
      params.keyword = this.searchTerm;
    }

    // 1. apply Context/Scope via categorySlug
    if (this.isMakeupCollection) {
      params.categorySlug = 'makeup';
    } else if (this.isSkincareCollection) {
      params.categorySlug = 'skincare';
    }

    // 2. Apply User Filters (Sidebar) via 'category' param
    if (this.selectedCategories.length > 0) {
      // Map 'cushion' (value) -> 'Cushion' (Label) as backend expects
      const selectedLabels = this.allProductTypes
        .filter(t => this.selectedCategories.includes(t.value))
        .map(t => t.label)
        .join(',');

      params.category = selectedLabels;
    }

    // 3. Apply Regimen Filters
    if (this.selectedRegimens.length > 0) {
      const selectedConcernLabels = this.allRegimens
        .filter(r => this.selectedRegimens.includes(r.value))
        .map(r => r.label)
        .join(',');

      params.concern = selectedConcernLabels;
    }

    if (this.sortBy) {
      params.sort = this.sortBy;
    }

    this.isLoading = true;
    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.allProducts = response.data;
        this.mapCounts(response);
        this.updateDisplayProducts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // FIXED: Toggle Logic
  toggleCategory(value: string) {
    const index = this.selectedCategories.indexOf(value);
    if (index >= 0) {
      this.selectedCategories.splice(index, 1); // Remove
    } else {
      this.selectedCategories.push(value); // Add
    }
    this.loadProducts();
  }

  toggleRegimen(value: string) {
    const index = this.selectedRegimens.indexOf(value);
    if (index >= 0) {
      this.selectedRegimens.splice(index, 1);
    } else {
      this.selectedRegimens.push(value);
    }
    this.loadProducts();
  }

  // FIXED: Map API Counts to UI Options
  mapCounts(response: any) {
    const apiCategories = response.categories || [];
    const apiConcerns = response.concerns || [];

    // Map Categories
    this.productTypes.forEach(uiItem => {
      let count = 0;

      // Umbrella Logic for 'lip'
      if (uiItem.value === 'lip') {
        const tints = apiCategories.find((c: any) => c.name?.toLowerCase() === 'tint')?.count || 0;
        const balms = apiCategories.find((c: any) => c.name?.toLowerCase() === 'balm')?.count || 0;
        const lips = apiCategories.find((c: any) => c.name?.toLowerCase() === 'lip')?.count || 0;
        count = tints + balms + lips;
      } else {
        // Direct Match by SLUG (value) or LABEL - API usually returns Name (Label)
        const match = apiCategories.find(
          (c: any) => c.name && (
            c.name.toLowerCase() === uiItem.value.toLowerCase() ||
            c.name.toLowerCase() === uiItem.label.toLowerCase() ||
            c.name.toLowerCase().includes(uiItem.label.toLowerCase())
          )
        );
        count = match ? match.count : 0;
      }

      uiItem.count = count;
    });

    // Map Regimens (Concerns)
    this.regimens.forEach(uiItem => {
      // FIX: SUM all matching counts (e.g. "Hydrating" + "Hydration")
      const matches = apiConcerns.filter(
        (c: any) => {
          if (!c.name) return false;
          const dbName = c.name.trim().toLowerCase();
          const uiLabel = uiItem.label.toLowerCase();

          return dbName === uiLabel ||
            dbName.includes(uiLabel.substring(0, 5)) ||
            uiLabel.includes(dbName.substring(0, 5)) ||
            (uiLabel.includes('wrinkle') && (dbName.includes('wrinkle') || dbName.includes('aging'))) ||
            (uiLabel.includes('hydration') && dbName.includes('hydrat')) ||
            (uiLabel.includes('skin barrier') && dbName.includes('barrier'));
        }
      );
      uiItem.count = matches.reduce((sum: number, m: any) => sum + (m.count || 0), 0);
    });
  }

  calculateCounts() {
    // Deprecated in favor of mapCounts from API
  }

  updateDisplayProducts() {
    // Client-side filtering is no longer needed for category/regimen as it's handled via params/backend
    // However, if we need to do any client-side post-processing, do it here.

    this.displayProducts = this.allProducts;
    this.currentPage = 1;
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

  trackByProduct(index: number, product: ProductData): string {
    return product.id;
  }
}
