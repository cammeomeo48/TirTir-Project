import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem, MenuService } from '../../../core/services/menu.service';
import { MakeupMegaMenuComponent } from '../makeup-mega-menu/makeup-mega-menu';
import { SkincareMegaMenuComponent } from '../skincare-mega-menu/skincare-mega-menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MakeupMegaMenuComponent, SkincareMegaMenuComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit {
  menuItems: MenuItem[] = [];
  showMakeupMenu = false;
  showSkincareMenu = false;

  constructor(
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.menuService.getMenuItems().subscribe({
      next: (data) => {
        this.menuItems = data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load menu items', err),
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
}// trigger reload
