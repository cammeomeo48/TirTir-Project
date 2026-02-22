import { Component, ElementRef, ViewChild, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FaceTrackerService } from '../../core/services/face-tracker.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shade-finder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shade-finder.html',
  styleUrls: ['./shade-finder.css']
})
export class ShadeFinderComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  isCameraActive = false;
  isProcessing = false;
  stream: MediaStream | null = null;
  error: string | null = null;
  animationFrameId: number | null = null;

  selectedSkinType = 'Normal';
  recommendedShades: any[] = [];

  // UI States
  showResultModal = signal(false);
  explanationText = '';

  // Lighting & Validation State
  lightingStatus = signal<{ isValid: boolean, message: string, type: 'success' | 'warning' | 'error' }>({
    isValid: false,
    message: 'Đang khởi động camera...',
    type: 'warning'
  });

  colorHistory: { r: number, g: number, b: number }[] = [];
  readonly HISTORY_SIZE = 15;

  // Toast notification
  toastMessage = signal<string | null>(null);
  private toastTimer: any = null;

  constructor(
    public faceTracker: FaceTrackerService,
    private http: HttpClient,
    private cartService: CartService
  ) { }

  async ngOnInit() {
    await this.faceTracker.initialize();
    // Auto-start camera — browser will prompt user for permission
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      video.onloadeddata = () => {
        this.isCameraActive = true;
        this.detectLoop();
      };
    } catch (err) {
      this.error = 'Không truy cập được camera. Vui lòng cấp quyền camera.';
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isCameraActive = false;
    this.faceTracker.isFaceDetected.set(false);
  }

  detectLoop() {
    if (!this.isCameraActive || !this.videoElement?.nativeElement) return;

    this.faceTracker.detectFace(this.videoElement.nativeElement);

    if (this.faceTracker.isFaceDetected()) {
      this.processRealtimeValidation();
    } else {
      this.lightingStatus.set({
        isValid: false,
        message: 'Không tìm thấy khuôn mặt. Vui lòng nhìn thẳng vào camera.',
        type: 'warning'
      });
      this.colorHistory = [];
    }

    this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
  }

  processRealtimeValidation() {
    const points = this.faceTracker.facePoints();
    if (!points) return;

    const rawColors = [
      this.extractColor(points.forehead.x, points.forehead.y),
      this.extractColor(points.nose.x, points.nose.y),
      this.extractColor(points.leftCheek.x, points.leftCheek.y),
      this.extractColor(points.rightCheek.x, points.rightCheek.y),
      this.extractColor(points.chin.x, points.chin.y)
    ].filter(c => c !== null) as { r: number, g: number, b: number }[];

    if (rawColors.length === 0) return;

    const currentFrameAvg = rawColors.reduce(
      (acc, curr) => ({ r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b }),
      { r: 0, g: 0, b: 0 }
    );
    currentFrameAvg.r /= rawColors.length;
    currentFrameAvg.g /= rawColors.length;
    currentFrameAvg.b /= rawColors.length;

    this.colorHistory.push(currentFrameAvg);
    if (this.colorHistory.length > this.HISTORY_SIZE) this.colorHistory.shift();

    const smoothed = this.colorHistory.reduce(
      (acc, curr) => ({ r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b }),
      { r: 0, g: 0, b: 0 }
    );
    smoothed.r = Math.round(smoothed.r / this.colorHistory.length);
    smoothed.g = Math.round(smoothed.g / this.colorHistory.length);
    smoothed.b = Math.round(smoothed.b / this.colorHistory.length);

    const validation = this.validateSkinColor(smoothed.r, smoothed.g, smoothed.b);
    if (validation.isValid) {
      this.lightingStatus.set({ isValid: true, message: 'Ánh sáng tốt — Sẵn sàng quét!', type: 'success' });
    } else {
      this.lightingStatus.set({ isValid: false, message: validation.reason || 'Ánh sáng không đạt.', type: 'error' });
    }
  }

  scanShade() {
    if (this.isProcessing) return;
    if (!this.faceTracker.isFaceDetected()) return;
    if (!this.lightingStatus().isValid) {
      this.error = this.lightingStatus().message;
      return;
    }

    this.isProcessing = true;
    this.error = null;

    if (this.colorHistory.length > 0) {
      const sum = this.colorHistory.reduce(
        (acc, curr) => ({ r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b }),
        { r: 0, g: 0, b: 0 }
      );
      this.findMatch({
        r: Math.round(sum.r / this.colorHistory.length),
        g: Math.round(sum.g / this.colorHistory.length),
        b: Math.round(sum.b / this.colorHistory.length)
      });
    } else {
      this.isProcessing = false;
      this.error = 'Chưa có dữ liệu màu da ổn định. Vui lòng giữ yên khuôn mặt.';
    }
  }

  validateSkinColor(r: number, g: number, b: number): { isValid: boolean, reason?: string } {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luminance <= 30) return { isValid: false, reason: 'Ánh sáng quá yếu. Vui lòng bật thêm đèn.' };

    const lab = this.rgbToLab(r, g, b);
    const BOUNDS = { min_L: 25, min_a: 5, max_a: 45, min_b: 5, max_b: 55 };

    if (lab.L < BOUNDS.min_L) return { isValid: false, reason: 'Da quá tối. Di chuyển ra nơi sáng hơn.' };
    if (lab.a < BOUNDS.min_a || lab.a > BOUNDS.max_a) return { isValid: false, reason: 'Màu da bị ám. Kiểm tra lại ánh sáng.' };
    if (lab.b < BOUNDS.min_b || lab.b > BOUNDS.max_b) return { isValid: false, reason: 'Màu da bị ám vàng. Kiểm tra ánh sáng.' };

    return { isValid: true };
  }

  rgbToLab(r: number, g: number, b: number) {
    let r_ = r / 255, g_ = g / 255, b_ = b / 255;
    if (r_ > 0.04045) r_ = Math.pow((r_ + 0.055) / 1.055, 2.4); else r_ /= 12.92;
    if (g_ > 0.04045) g_ = Math.pow((g_ + 0.055) / 1.055, 2.4); else g_ /= 12.92;
    if (b_ > 0.04045) b_ = Math.pow((b_ + 0.055) / 1.055, 2.4); else b_ /= 12.92;
    r_ *= 100; g_ *= 100; b_ *= 100;
    let X = r_ * 0.4124 + g_ * 0.3576 + b_ * 0.1805;
    let Y = r_ * 0.2126 + g_ * 0.7152 + b_ * 0.0722;
    let Z = r_ * 0.0193 + g_ * 0.1192 + b_ * 0.9505;
    X /= 95.047; Y /= 100; Z /= 108.883;
    const f = (t: number) => t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
    return { L: 116 * f(Y) - 16, a: 500 * (f(X) - f(Y)), b: 200 * (f(Y) - f(Z)) };
  }

  extractColor(x: number, y: number): { r: number, g: number, b: number } | null {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const px = Math.floor(x * canvas.width);
    const py = Math.floor(y * canvas.height);
    const size = 10;
    const sx = Math.max(0, px - size / 2);
    const sy = Math.max(0, py - size / 2);

    try {
      const frame = ctx.getImageData(sx, sy, size, size);
      let r = 0, g = 0, b = 0;
      const count = frame.data.length / 4;
      for (let i = 0; i < frame.data.length; i += 4) {
        r += frame.data[i]; g += frame.data[i + 1]; b += frame.data[i + 2];
      }
      return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
    } catch { return null; }
  }

  findMatch(color: { r: number, g: number, b: number }) {
    this.http.post<any[]>(`${environment.apiUrl}/shades/match`, {
      ...color,
      skinType: this.selectedSkinType
    }).subscribe({
      next: (res) => {
        this.recommendedShades = res;
        this.explanationText = `Gợi ý dựa trên tone da và loại da ${this.selectedSkinType} của bạn.`;
        this.showResultModal.set(true);
        this.isProcessing = false;
      },
      error: () => {
        this.error = 'Không thể tìm shade phù hợp. Vui lòng thử lại.';
        this.isProcessing = false;
      }
    });
  }

  closeModal() {
    this.showResultModal.set(false);
    this.recommendedShades = [];
  }

  addToCart(shade: any) {
    if (!shade?.productId) return;
    this.cartService.addToCart({ productId: shade.productId, quantity: 1, shade: shade.name }).subscribe({
      next: () => this.showToast('✅ Đã thêm vào giỏ hàng!'),
      error: () => this.showToast('❌ Không thể thêm. Vui lòng thử lại.')
    });
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
