import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.css',
})
export class ProductCarousel {
  @Input() products: any[] = [];
  @Input() title: string = '';
  @Input() subtitle: string = '';
  
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;

  scrollLeft() {
    this.carouselTrack.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight() {
    this.carouselTrack.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }
}
