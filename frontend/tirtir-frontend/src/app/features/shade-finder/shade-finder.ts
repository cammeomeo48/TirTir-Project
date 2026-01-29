import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shade-finder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shade-finder.html',
  styleUrls: ['./shade-finder.css']
})
export class ShadeFinderComponent {
  isCameraActive = false;
  stream: MediaStream | null = null;
  error: string | null = null;

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.isCameraActive = true;
    } catch (err) {
      this.error = 'Could not access camera. Please allow camera permissions.';
      console.error(err);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isCameraActive = false;
  }
}
