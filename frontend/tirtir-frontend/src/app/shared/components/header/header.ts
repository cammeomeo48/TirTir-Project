import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ProductData } from '../../../core/constants/products.data';
import { MenuItem, MenuService } from '../../../core/services/menu.service';
import { CartService } from '../../../core/services/cart.service'; // Added Import
import { MakeupMegaMenuComponent } from '../makeup-mega-menu/makeup-mega-menu';
import { SkincareMegaMenuComponent } from '../skincare-mega-menu/skincare-mega-menu';
import { ProductService } from '../../../core/services/product.service';

import { CommonModule } from '@angular/common'; // Ensure CommonModule is imported

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MakeupMegaMenuComponent, SkincareMegaMenuComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit {
  // Use inject() pattern
  private menuService = inject(MenuService);
  private cartService = inject(CartService); // Injected CartService
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private productService = inject(ProductService);

  searchTerm = '';
  showSearch = false;
  suggestions = signal<ProductData[]>([]);
  private searchSubject = new Subject<string>();

  // Expose signal for template
  cartCount = this.cartService.cartCount;

  menuItems: MenuItem[] = [];
  showMakeupMenu = false;
  showSkincareMenu = false;

  constructor() { }

  ngOnInit() {
    this.menuService.getMenuItems().subscribe({
      next: (data) => {
        this.menuItems = data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load menu items', err),
    });

    // Setup search suggestions
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term.trim()) return of({ data: [] });
        return this.productService.getProducts({ keyword: term, limit: 5 });
      })
    ).subscribe({
      next: (response: any) => {
        this.suggestions.set(response.data);
      }
    });
  }

  get makeupCategories() {
    return this.menuItems.find(item => item.label === 'Makeup')?.children || [];
  }

  get skincareCategories() {
    return this.menuItems.find(item => item.label === 'Skincare')?.children || [];
  }

  // Giữ lại logic hover của bạn để kích hoạt Mega Menu
  onMakeupHover(show: boolean) {
    this.showMakeupMenu = show;
  }

  onSkincareHover(show: boolean) {
    this.showSkincareMenu = show;
  }

  onSearchInput() {
    this.searchSubject.next(this.searchTerm);
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.closeSearch();
    }
  }

  onSearch() {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/shop'], {
        queryParams: { q: this.searchTerm.trim() }
      });
      this.closeSearch();
    }
  }

  closeSearch() {
    this.showSearch = false;
    this.searchTerm = '';
    this.suggestions.set([]);
  }

  selectSuggestion(product: ProductData) {
    this.router.navigate(['/products', product.slug]);
    this.closeSearch();
  }
}// trigger reload
