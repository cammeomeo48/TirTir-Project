import { Component, ElementRef, ViewChild, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { forkJoin, of, take } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { FaceTrackerService } from '../../core/services/face-tracker.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

/** Response shape from POST /api/v1/shades/match */
interface ShadeMatch {
  _id: string;
  Product_ID: string;
  Product_Name: string;
  Shade_Name: string;
  Shade_Code: string;
  Hex_Code: string;
  Image_URL: string;
  Shade_Image: string;
  matchScore: number;
  deltaE: number;
  predictedUndertone: string;
  adjustmentNote: string;
  Undertone: string;
  Skin_Tone: string;
  Coverage: number;
  Hydration: number;
  Coverage_Profile: string;
  Finish_Type: string;
  Oxidation_Risk_Level: string;
}

/** Response from POST /api/ai/analyze-face */
interface SkinProfile {
  skinTone: string;
  undertone: string;
  skinType: string;
  concerns?: string[];
  confidence: number;
}

/** Single routine step from Gemini */
interface RoutineStep {
  step: string;
  product_id: string;
  reason: string;
  product?: {
    Name: string;
    Category: string;
    Price: number;
    Thumbnail_Images: string;
    slug?: string;
    _id: string;
  } | null;
}

/** Response from POST /api/ai/recommend-routine */
interface RoutineData {
  routine: RoutineStep[];
  advice: string;
}

@Component({
  selector: 'app-shade-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  // Shade match results
  matchResults: ShadeMatch[] = [];
  bestMatch: ShadeMatch | null = null;
  userUndertone = '';

  // AI Routine results
  skinProfile = signal<SkinProfile | null>(null);
  routine = signal<RoutineData | null>(null);
  isLoadingRoutine = signal(false);
  routineError = signal<string | null>(null);

  // UI
  showResultModal = signal(false);
  activeTab = signal<'shade' | 'routine'>('shade');
  toastMessage = signal<string | null>(null);
  private toastTimer: any = null;

  private readonly backendBase = environment.apiUrl.replace('/api/v1', '');
  private readonly apiBase = environment.apiUrl; // /api/v1
  private readonly aiBase = environment.apiUrl.replace('/v1', ''); // /api

  // Lighting & Validation
  lightingStatus = signal<{ isValid: boolean, message: string, type: 'success' | 'warning' | 'error' }>({
    isValid: false,
    message: 'Đang khởi động camera...',
    type: 'warning'
  });

  colorHistory: { r: number, g: number, b: number }[] = [];
  readonly HISTORY_SIZE = 15;

  constructor(
    public faceTracker: FaceTrackerService,
    private http: HttpClient,
    private cartService: CartService
  ) { }

  async ngOnInit() {
    await this.faceTracker.initialize();
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

    const avg = rawColors.reduce((a, c) => ({ r: a.r + c.r, g: a.g + c.g, b: a.b + c.b }), { r: 0, g: 0, b: 0 });
    avg.r /= rawColors.length; avg.g /= rawColors.length; avg.b /= rawColors.length;

    this.colorHistory.push(avg);
    if (this.colorHistory.length > this.HISTORY_SIZE) this.colorHistory.shift();

    const sm = this.colorHistory.reduce((a, c) => ({ r: a.r + c.r, g: a.g + c.g, b: a.b + c.b }), { r: 0, g: 0, b: 0 });
    sm.r = Math.round(sm.r / this.colorHistory.length);
    sm.g = Math.round(sm.g / this.colorHistory.length);
    sm.b = Math.round(sm.b / this.colorHistory.length);

    const v = this.validateSkinColor(sm.r, sm.g, sm.b);
    this.lightingStatus.set(v.isValid
      ? { isValid: true, message: 'Ánh sáng tốt — Sẵn sàng quét!', type: 'success' }
      : { isValid: false, message: v.reason || 'Ánh sáng không đạt.', type: 'error' }
    );
  }

  /**
   * Capture a JPEG base64 snapshot from the video stream.
   * Reuses the existing hidden canvas element.
   */
  private captureBase64(): string | null {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;
    if (!video || !canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  scanShade() {
    if (this.isProcessing) return;
    if (!this.faceTracker.isFaceDetected() || !this.lightingStatus().isValid) {
      this.error = this.lightingStatus().message;
      return;
    }
    if (this.colorHistory.length < 5) {
      this.error = 'Chưa đủ dữ liệu. Giữ yên khuôn mặt thêm 2 giây.';
      return;
    }

    this.isProcessing = true;
    this.error = null;
    this.routine.set(null);
    this.skinProfile.set(null);
    this.routineError.set(null);
    this.activeTab.set('shade');

    // ── 1. Average colour from history ─────────────────────────────────────
    const sum = this.colorHistory.reduce((a, c) => ({ r: a.r + c.r, g: a.g + c.g, b: a.b + c.b }), { r: 0, g: 0, b: 0 });
    const color = {
      r: Math.round(sum.r / this.colorHistory.length),
      g: Math.round(sum.g / this.colorHistory.length),
      b: Math.round(sum.b / this.colorHistory.length)
    };

    // ── 2. Capture base64 once, reuse for AI ───────────────────────────────
    const imageData = this.captureBase64();

    // ── 3. Shade match (RGB) ────────────────────────────────────────────────
    const shade$ = this.http.post<ShadeMatch[]>(`${this.apiBase}/shades/match`, {
      ...color,
      skinType: this.selectedSkinType
    }).pipe(catchError(() => of([])));

    // ── 4. AI face analyze → recommend-routine (chained) ──────────────────
    const routine$ = imageData
      ? this.http.post<{ success: boolean; data: SkinProfile }>(
          `${this.aiBase}/ai/analyze-face`,
          { imageData }
        ).pipe(
          catchError(() => of(null)),
          switchMap(res => {
            if (!res?.success || !res.data) {
              return of(null);
            }
            const profile = res.data;
            this.skinProfile.set(profile);

            return this.http.post<{ success: boolean; data: RoutineData }>(
              `${this.aiBase}/ai/recommend-routine`,
              {
                skinType:  profile.skinType  || this.selectedSkinType,
                skinTone:  profile.skinTone,
                undertone: profile.undertone,
                concerns:  profile.concerns
              }
            ).pipe(catchError(() => of(null)));
          })
        )
      : of(null);

    // ── 5. Fire both in parallel ────────────────────────────────────────────
    this.isLoadingRoutine.set(true);

    forkJoin({ shade: shade$, routine: routine$ })
      .pipe(take(1))
      .subscribe({
        next: ({ shade, routine }) => {
          // Shade results
          const shadeResults = shade as ShadeMatch[];
          this.matchResults = shadeResults;
          this.bestMatch = shadeResults.length > 0 ? shadeResults[0] : null;
          this.userUndertone = this.bestMatch?.predictedUndertone || '';

          // Routine results
          if (routine && (routine as any).success && (routine as any).data) {
            this.routine.set((routine as any).data as RoutineData);
          } else {
            this.routineError.set('AI Routine không khả dụng lúc này. Vui lòng thử lại sau.');
          }

          this.isLoadingRoutine.set(false);
          this.isProcessing = false;
          this.showResultModal.set(true);
        },
        error: () => {
          this.error = 'Không thể kết nối server. Vui lòng thử lại.';
          this.isProcessing = false;
          this.isLoadingRoutine.set(false);
        }
      });
  }

  /** Resolve image path: relative → full URL, absolute → as-is */
  resolveImage(path: string | undefined): string {
    if (!path) return 'https://placehold.co/300x300/f5f5f5/999?text=No+Image';
    if (path.startsWith('http')) return path;
    return `${this.backendBase}/${path.startsWith('/') ? path.slice(1) : path}`;
  }

  /** Compute match percentage from matchScore */
  matchPercent(score: number): number {
    return Math.max(0, Math.min(100, Math.round(100 - score * 3)));
  }

  addToCart(match: ShadeMatch) {
    if (!match.Product_ID) return;
    this.cartService.addToCart({
      productId: match.Product_ID,
      quantity: 1,
      shade: match.Shade_Name
    }).subscribe({
      next: () => this.showToast(`✅ Đã thêm ${match.Product_Name} - ${match.Shade_Name} vào giỏ!`),
      error: () => this.showToast('❌ Không thể thêm. Vui lòng thử lại.')
    });
  }

  addRoutineProductToCart(step: RoutineStep) {
    if (!step.product?._id) return;
    this.cartService.addToCart({
      productId: step.product._id,
      quantity: 1
    }).subscribe({
      next: () => this.showToast(`✅ Đã thêm ${step.product?.Name} vào giỏ!`),
      error: () => this.showToast('❌ Không thể thêm. Vui lòng thử lại.')
    });
  }

  closeModal() {
    this.showResultModal.set(false);
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 3000);
  }

  // ──── Color Science Utils ────

  validateSkinColor(r: number, g: number, b: number): { isValid: boolean, reason?: string } {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum <= 30) return { isValid: false, reason: 'Ánh sáng quá yếu. Vui lòng bật thêm đèn.' };
    const lab = this.rgbToLab(r, g, b);
    if (lab.L < 25) return { isValid: false, reason: 'Da quá tối. Di chuyển ra nơi sáng hơn.' };
    if (lab.a < 5 || lab.a > 45) return { isValid: false, reason: 'Màu da bị ám. Kiểm tra lại ánh sáng.' };
    if (lab.b < 5 || lab.b > 55) return { isValid: false, reason: 'Ánh sáng bị ám vàng/xanh. Kiểm tra lại.' };
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
    const sz = 10;
    try {
      const frame = ctx.getImageData(Math.max(0, px - sz / 2), Math.max(0, py - sz / 2), sz, sz);
      let r = 0, g = 0, b = 0;
      const n = frame.data.length / 4;
      for (let i = 0; i < frame.data.length; i += 4) {
        r += frame.data[i]; g += frame.data[i + 1]; b += frame.data[i + 2];
      }
      return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
    } catch { return null; }
  }
}
