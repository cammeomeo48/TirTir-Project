import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem, MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  menuItems: MenuItem[] = [];

  constructor(
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.menuService.getMenuItems().subscribe({
      next: (data) => {
        this.menuItems = data;
        this.cdr.markForCheck(); // Ensure UI updates
      },
      error: (err) => console.error('Failed to load menu items', err),
    });
  }
}
