import { Component, ElementRef, ViewChild, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AiAdvisorService, SkinAnalysis } from '../../core/services/ai-advisor.service';
import { FaceTrackerService } from '../../core/services/face-tracker.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shade-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
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

  // AI Analysis Results
  aiAnalysis: SkinAnalysis | null = null;
  isAiAnalyzing = false;

  // UI States
  showResultModal = signal(false);
  explanationText = '';
  recommendationData: any = null;

  // Advanced Lighting & Validation State
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
    private aiAdvisor: AiAdvisorService,
    private cartService: CartService
  ) { }

  async ngOnInit() {
    await this.faceTracker.initialize();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      video.onloadeddata = () => {
        this.isCameraActive = true;
        this.detectLoop();
      };
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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isCameraActive = false;
    this.faceTracker.isFaceDetected.set(false);
  }

  detectLoop() {
    if (!this.isCameraActive || !this.videoElement.nativeElement) return;

    this.faceTracker.detectFace(this.videoElement.nativeElement);

    // Real-time Validation Logic
    if (this.faceTracker.isFaceDetected()) {
      this.processRealtimeValidation();
    } else {
      this.lightingStatus.set({ isValid: false, message: 'Không tìm thấy khuôn mặt. Vui lòng nhìn thẳng vào camera.', type: 'warning' });
      this.colorHistory = [];
    }

    this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
  }

  // BUG 1 FIX: Re-enabled — uses faceTracker.facePoints() (was mockFaceTracker, now real service)
  processRealtimeValidation() {
    const points = this.faceTracker.facePoints();
    if (!points) return;

    // 1. Extract raw colors from 5 key landmark points
    const rawColors = [
      this.extractColor(points.forehead.x, points.forehead.y),
      this.extractColor(points.nose.x, points.nose.y),
      this.extractColor(points.leftCheek.x, points.leftCheek.y),
      this.extractColor(points.rightCheek.x, points.rightCheek.y),
      this.extractColor(points.chin.x, points.chin.y)
    ].filter(c => c !== null) as { r: number, g: number, b: number }[];

    if (rawColors.length === 0) return;

    // 2. Average current frame color across all points
    const currentFrameAvg = rawColors.reduce((acc, curr) => ({
      r: acc.r + curr.r,
      g: acc.g + curr.g,
      b: acc.b + curr.b
    }), { r: 0, g: 0, b: 0 });

    currentFrameAvg.r /= rawColors.length;
    currentFrameAvg.g /= rawColors.length;
    currentFrameAvg.b /= rawColors.length;

    // 3. Add to Moving Average History
    this.colorHistory.push(currentFrameAvg);
    if (this.colorHistory.length > this.HISTORY_SIZE) {
      this.colorHistory.shift();
    }

    // 4. Calculate Smoothed Color
    const smoothedColor = this.colorHistory.reduce((acc, curr) => ({
      r: acc.r + curr.r,
      g: acc.g + curr.g,
      b: acc.b + curr.b
    }), { r: 0, g: 0, b: 0 });

    smoothedColor.r = Math.round(smoothedColor.r / this.colorHistory.length);
    smoothedColor.g = Math.round(smoothedColor.g / this.colorHistory.length);
    smoothedColor.b = Math.round(smoothedColor.b / this.colorHistory.length);

    // 5. Validate Smoothed Color
    const validation = this.validateSkinColor(smoothedColor.r, smoothedColor.g, smoothedColor.b);

    // 6. Update UI State
    if (validation.isValid) {
      this.lightingStatus.set({ isValid: true, message: 'Ánh sáng tốt. Sẵn sàng quét.', type: 'success' });
    } else {
      this.lightingStatus.set({ isValid: false, message: validation.reason || 'Ánh sáng không đạt chuẩn.', type: 'error' });
    }
  }

  scanShade() {
    if (!this.faceTracker.isFaceDetected()) return;

    if (!this.lightingStatus().isValid) {
      this.error = this.lightingStatus().message;
      return;
    }

    this.isProcessing = true;
    this.error = null;

    if (this.colorHistory.length > 0) {
      const smoothedColor = this.colorHistory.reduce((acc, curr) => ({
        r: acc.r + curr.r,
        g: acc.g + curr.g,
        b: acc.b + curr.b
      }), { r: 0, g: 0, b: 0 });

      smoothedColor.r = Math.round(smoothedColor.r / this.colorHistory.length);
      smoothedColor.g = Math.round(smoothedColor.g / this.colorHistory.length);
      smoothedColor.b = Math.round(smoothedColor.b / this.colorHistory.length);

      this.findMatch(smoothedColor);
    } else {
      this.isProcessing = false;
      this.error = 'Chưa có dữ liệu màu da ổn định. Vui lòng giữ yên khuôn mặt.';
    }
  }

  validateSkinColor(r: number, g: number, b: number): { isValid: boolean, reason?: string } {
    const l_legacy = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (l_legacy <= 30) return { isValid: false, reason: 'Ánh sáng quá yếu (Luminance < 30). Vui lòng bật thêm đèn.' };

    const lab = this.rgbToLab(r, g, b);
    const SKIN_BOUNDARIES = { min_L: 25, min_a: 5, max_a: 45, min_b: 5, max_b: 55 };

    if (lab.L < SKIN_BOUNDARIES.min_L) return { isValid: false, reason: 'Da quá tối. Vui lòng di chuyển ra nơi sáng hơn.' };
    if (lab.a < SKIN_BOUNDARIES.min_a || lab.a > SKIN_BOUNDARIES.max_a) return { isValid: false, reason: 'Màu da bị ám xanh/đỏ. Kiểm tra lại ánh sáng.' };
    if (lab.b < SKIN_BOUNDARIES.min_b || lab.b > SKIN_BOUNDARIES.max_b) return { isValid: false, reason: 'Màu da bị ám vàng/lam. Kiểm tra lại ánh sáng.' };

    return { isValid: true };
  }

  rgbToLab(r: number, g: number, b: number) {
    let r_ = r / 255, g_ = g / 255, b_ = b / 255;

    if (r_ > 0.04045) r_ = Math.pow(((r_ + 0.055) / 1.055), 2.4); else r_ = r_ / 12.92;
    if (g_ > 0.04045) g_ = Math.pow(((g_ + 0.055) / 1.055), 2.4); else g_ = g_ / 12.92;
    if (b_ > 0.04045) b_ = Math.pow(((b_ + 0.055) / 1.055), 2.4); else b_ = b_ / 12.92;

    r_ = r_ * 100; g_ = g_ * 100; b_ = b_ * 100;

    let X = r_ * 0.4124 + g_ * 0.3576 + b_ * 0.1805;
    let Y = r_ * 0.2126 + g_ * 0.7152 + b_ * 0.0722;
    let Z = r_ * 0.0193 + g_ * 0.1192 + b_ * 0.9505;

    X = X / 95.047; Y = Y / 100.000; Z = Z / 108.883;

    const func = (t: number) => (t > 0.008856) ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);
    X = func(X); Y = func(Y); Z = func(Z);

    return { L: (116 * Y) - 16, a: 500 * (X - Y), b: 200 * (Y - Z) };
  }

  checkLighting(r: number, g: number, b: number): boolean {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 30;
  }

  extractColor(x: number, y: number): { r: number, g: number, b: number } | null {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const pixelX = Math.floor(x * canvas.width);
    const pixelY = Math.floor(y * canvas.height);
    const size = 10;
    const startX = Math.max(0, pixelX - size / 2);
    const startY = Math.max(0, pixelY - size / 2);

    try {
      const frame = ctx.getImageData(startX, startY, size, size);
      let r = 0, g = 0, b = 0;
      const count = frame.data.length / 4;
      for (let i = 0; i < frame.data.length; i += 4) {
        r += frame.data[i]; g += frame.data[i + 1]; b += frame.data[i + 2];
      }
      return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
    } catch (e) {
      return null;
    }
  }

  // BUG 6 FIX: Uses environment.apiUrl instead of hardcoded localhost:5001
  findMatch(color: { r: number, g: number, b: number }) {
    this.http.post<any[]>(`${environment.apiUrl}/shades/match`, {
      ...color,
      skinType: this.selectedSkinType
    }).subscribe({
      next: (res) => {
        this.recommendedShades = res;
        this.explanationText = `Đề xuất dựa trên tone da và loại da ${this.selectedSkinType} của bạn.`;
        this.showResultModal.set(true);
        this.isProcessing = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Không thể tìm shade phù hợp. Vui lòng thử lại.';
        this.isProcessing = false;
      }
    });
  }

  /**
   * BUG 2 FIX + PHASE B: AI Scan with ROI optimization
   * - Uses extractFaceROIPatches when face points available (~10KB payload)
   * - Fallback to full frame when face not tracked
   * - Fallback to center-sample when colorHistory empty
   */
  async scanWithAI() {
    // TASK 5: Anti-spam guard — block duplicate clicks while processing
    if (this.isProcessing) return;

    if (!this.videoElement?.nativeElement) {
      this.error = 'Camera chưa được khởi động';
      return;
    }

    this.isProcessing = true;
    this.isAiAnalyzing = true;
    this.error = null;

    try {
      const video = this.videoElement.nativeElement;
      const facePoints = this.faceTracker.facePoints();

      // PHASE B: Send optimized ROI patches if face is tracked (~10KB vs ~200KB)
      let analysisObservable;
      if (facePoints) {
        console.log('📦 Phase B: Sending 5 ROI patches (~10KB)');
        const roiPayload = this.aiAdvisor.extractFaceROIPatches(video, facePoints, this.selectedSkinType);

        // Use avgRgb directly for colorHistory if history is empty
        if (this.colorHistory.length === 0) {
          this.colorHistory.push(roiPayload.avgRgb);
        }

        analysisObservable = this.aiAdvisor.analyzeSkinFromROI(roiPayload);
      } else {
        // Fallback: full frame (no face tracking data available)
        console.log('🖼️ Fallback: Sending full frame');
        const imageData = this.aiAdvisor.videoFrameToBase64(video);
        analysisObservable = this.aiAdvisor.analyzeSkin(imageData, this.selectedSkinType);
      }

      analysisObservable.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.aiAnalysis = response.data;

            // Compute color for shade matching
            let colorForMatch: { r: number; g: number; b: number };

            if (this.colorHistory.length > 0) {
              const sum = this.colorHistory.reduce((acc, curr) => ({
                r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b
              }), { r: 0, g: 0, b: 0 });
              colorForMatch = {
                r: Math.round(sum.r / this.colorHistory.length),
                g: Math.round(sum.g / this.colorHistory.length),
                b: Math.round(sum.b / this.colorHistory.length)
              };
            } else {
              // BUG 2 FIX: Direct center-sample fallback instead of blocking user
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth; canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                const cx = Math.floor(canvas.width / 2), cy = Math.floor(canvas.height / 2);
                const size = 20;
                const frame = ctx.getImageData(cx - size / 2, cy - size / 2, size, size);
                let r = 0, g = 0, b = 0;
                const count = frame.data.length / 4;
                for (let i = 0; i < frame.data.length; i += 4) {
                  r += frame.data[i]; g += frame.data[i + 1]; b += frame.data[i + 2];
                }
                colorForMatch = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
              } else {
                colorForMatch = { r: 180, g: 150, b: 130 }; // safe neutral fallback
              }
            }

            this.findMatchWithAI(colorForMatch, this.aiAnalysis!);
          } else {
            this.isProcessing = false;
            this.isAiAnalyzing = false;
            this.error = response.message || 'Phân tích AI thất bại.';
          }
        },
        error: (err) => {
          console.error('AI Analysis failed:', err);
          this.isProcessing = false;
          this.isAiAnalyzing = false;
          this.error = 'Không thể phân tích da. Đang dùng phương pháp thay thế...';

          // Fallback to traditional color matching
          if (this.colorHistory.length > 0) {
            const sum = this.colorHistory.reduce((acc, curr) => ({
              r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b
            }), { r: 0, g: 0, b: 0 });
            this.findMatch({
              r: Math.round(sum.r / this.colorHistory.length),
              g: Math.round(sum.g / this.colorHistory.length),
              b: Math.round(sum.b / this.colorHistory.length)
            });
          }
        }
      });

    } catch (error) {
      console.error('AI Scan error:', error);
      this.isProcessing = false;
      this.isAiAnalyzing = false;
      this.error = 'Không thể chụp ảnh. Vui lòng thử lại.';
    }
  }

  // BUG 6 FIX: Uses environment.apiUrl (was hardcoded localhost:5001)
  findMatchWithAI(color: { r: number, g: number, b: number }, aiAnalysis: SkinAnalysis) {
    const payload = {
      ...color,
      skinType: this.selectedSkinType,
      undertone: aiAnalysis.undertone,
      brightness: aiAnalysis.skinTone,
      toneShift: aiAnalysis.recommendedToneShift || 'exact'
    };

    this.http.post<any[]>(`${environment.apiUrl}/shades/match`, payload).subscribe({
      next: (res) => {
        this.recommendedShades = res;
        this.explanationText = aiAnalysis.explanation || this.generateLocalExplanation(aiAnalysis);
        this.fetchRoutine(payload);
        this.showResultModal.set(true);
        this.isProcessing = false;
        this.isAiAnalyzing = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Không thể tìm shade phù hợp.';
        this.isProcessing = false;
        this.isAiAnalyzing = false;
      }
    });
  }

  fetchRoutine(payload: any) {
    this.aiAdvisor.getRecommendations({
      skinType: payload.skinType,
      skinTone: this.aiAnalysis?.skinTone || 'Medium',
      undertone: payload.undertone,
      concerns: this.aiAnalysis?.concerns || []
    }).subscribe(res => {
      if (res.success && res.data) {
        this.recommendationData = res.data;
      }
    });
  }

  generateLocalExplanation(ai: SkinAnalysis): string {
    let text = `AI xác định tone da bạn là ${ai.skinTone} với undertone ${ai.undertone}.`;
    if (ai.concerns && ai.concerns.length > 0 && !ai.concerns.includes('None')) {
      text += ` Phát hiện một số vấn đề: ${ai.concerns.join(', ')}.`;
    }
    return text;
  }

  closeModal() {
    this.showResultModal.set(false);
    this.recommendationData = null;
  }

  // BUG 5 FIX: Add all routine products to cart
  addAllToCart() {
    if (!this.recommendationData?.routine) return;

    let addedCount = 0;
    const total = this.recommendationData.routine.filter((s: any) => s.product?._id).length;

    for (const step of this.recommendationData.routine) {
      if (step.product?._id) {
        this.cartService.addToCart({ productId: step.product._id, quantity: 1 }).subscribe({
          next: () => {
            addedCount++;
            if (addedCount === total) {
              alert('✅ Đã thêm tất cả sản phẩm vào giỏ hàng!');
            }
          },
          error: (err) => console.error('Add to cart error:', err)
        });
      }
    }
  }
}
