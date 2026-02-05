import { Component, ElementRef, ViewChild, OnDestroy, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AiAdvisorService, SkinAnalysis } from '../../core/services/ai-advisor.service';
// TODO: Re-enable when MediaPipe package is installed
// import { FaceTrackerService } from '../../core/services/face-tracker.service';

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

  // AI Analysis Results
  aiAnalysis: SkinAnalysis | null = null;
  isAiAnalyzing = false;

  // UI States
  showResultModal = signal(false);
  explanationText = '';

  // Advanced Lighting & Validation State
  lightingStatus = signal<{ isValid: boolean, message: string, type: 'success' | 'warning' | 'error' }>({
    isValid: false,
    message: 'Đang khởi động camera...',
    type: 'warning'
  });

  colorHistory: { r: number, g: number, b: number }[] = [];
  readonly HISTORY_SIZE = 15; // Smooth over ~0.5s (assuming 30fps)

  constructor(
    // TODO: Re-enable when MediaPipe package is installed
    // public faceTracker: FaceTrackerService,
    private http: HttpClient,
    private aiAdvisor: AiAdvisorService
  ) { }

  async ngOnInit() {
    // TODO: Re-enable when MediaPipe package is installed
    // await this.faceTracker.initialize();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  // TODO: Temporary mock for faceTracker - remove when MediaPipe is installed
  private mockFaceTracker = {
    isFaceDetected: () => false,
    facePoints: () => null,
    detectFace: (video: HTMLVideoElement) => { }
  };

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
    // TODO: Re-enable when MediaPipe is installed
    // this.faceTracker.isFaceDetected.set(false);
  }

  detectLoop() {
    if (!this.isCameraActive || !this.videoElement.nativeElement) return;

    // TODO: Re-enable when MediaPipe is installed
    // this.faceTracker.detectFace(this.videoElement.nativeElement);
    this.mockFaceTracker.detectFace(this.videoElement.nativeElement);

    // Real-time Validation Logic
    // TODO: Re-enable when MediaPipe is installed
    if (this.mockFaceTracker.isFaceDetected()) {
      this.processRealtimeValidation();
    } else {
      this.lightingStatus.set({ isValid: false, message: 'Không tìm thấy khuôn mặt. Vui lòng nhìn thẳng vào camera.', type: 'warning' });
      this.colorHistory = []; // Reset history when face is lost
    }

    this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
  }

  processRealtimeValidation() {
    // TODO: Re-enable when MediaPipe is installed
    // This function requires FaceTrackerService to work properly
    return;

    /* DISABLED UNTIL MEDIAPIPE IS INSTALLED
    const points = this.mockFaceTracker.facePoints();
    if (!points) return;

    // 1. Extract raw colors from 5 key points
    const rawColors = [
        this.extractColor(points.forehead.x, points.forehead.y),
        this.extractColor(points.nose.x, points.nose.y),
        this.extractColor(points.leftCheek.x, points.leftCheek.y),
        this.extractColor(points.rightCheek.x, points.rightCheek.y),
        this.extractColor(points.chin.x, points.chin.y)
    ].filter(c => c !== null) as {r: number, g: number, b: number}[];

    if (rawColors.length === 0) return;

    // 2. Average current frame color
    const currentFrameAvg = rawColors.reduce((acc: {r: number, g: number, b: number}, curr: {r: number, g: number, b: number}) => ({
        r: acc.r + curr.r,
        g: acc.g + curr.g,
        b: acc.b + curr.b
    }), {r: 0, g: 0, b: 0});

    currentFrameAvg.r /= rawColors.length;
    currentFrameAvg.g /= rawColors.length;
    currentFrameAvg.b /= rawColors.length;

    // 3. Add to History Queue (Moving Average)
    this.colorHistory.push(currentFrameAvg);
    if (this.colorHistory.length > this.HISTORY_SIZE) {
        this.colorHistory.shift();
    }

    // 4. Calculate Smoothed Color
    const smoothedColor = this.colorHistory.reduce((acc: {r: number, g: number, b: number}, curr: {r: number, g: number, b: number}) => ({
        r: acc.r + curr.r,
        g: acc.g + curr.g,
        b: acc.b + curr.b
    }), {r: 0, g: 0, b: 0});

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
    */
  }

  scanShade() {
    // TODO: Re-enable when MediaPipe is installed
    if (!this.mockFaceTracker.isFaceDetected()) return;

    // Check if lighting is valid BEFORE proceeding (Double Check)
    if (!this.lightingStatus().isValid) {
      this.error = this.lightingStatus().message;
      return;
    }

    this.isProcessing = true;
    this.error = null;

    // Use the SMOOTHED color from history for better accuracy
    if (this.colorHistory.length > 0) {
      const smoothedColor = this.colorHistory.reduce((acc: { r: number, g: number, b: number }, curr: { r: number, g: number, b: number }) => ({
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
      this.error = "Chưa có dữ liệu màu da ổn định. Vui lòng giữ yên khuôn mặt.";
    }
  }

  validateSkinColor(r: number, g: number, b: number): { isValid: boolean, reason?: string } {
    // 1. Basic Luminance Check (Legacy)
    const l_legacy = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (l_legacy <= 30) return { isValid: false, reason: "Ánh sáng quá yếu (Luminance < 30). Vui lòng bật thêm đèn." };

    // 2. Advanced LAB Boundary Check
    const lab = this.rgbToLab(r, g, b);

    const SKIN_BOUNDARIES = {
      min_L: 25,
      min_a: 5, max_a: 45,
      min_b: 5, max_b: 55
    };

    if (lab.L < SKIN_BOUNDARIES.min_L) return { isValid: false, reason: "Da quá tối so với ngưỡng cho phép. Vui lòng di chuyển ra nơi sáng hơn." };
    if (lab.a < SKIN_BOUNDARIES.min_a || lab.a > SKIN_BOUNDARIES.max_a) return { isValid: false, reason: "Màu da bị ám xanh/đỏ bất thường. Kiểm tra lại ánh sáng (tránh đèn neon)." };
    if (lab.b < SKIN_BOUNDARIES.min_b || lab.b > SKIN_BOUNDARIES.max_b) return { isValid: false, reason: "Màu da bị ám vàng/lam bất thường. Kiểm tra lại ánh sáng (tránh đèn sợi đốt)." };

    return { isValid: true };
  }

  // Helper: RGB to LAB conversion for Frontend Validation
  rgbToLab(r: number, g: number, b: number) {
    let r_ = r / 255, g_ = g / 255, b_ = b / 255;

    if (r_ > 0.04045) r_ = Math.pow(((r_ + 0.055) / 1.055), 2.4);
    else r_ = r_ / 12.92;

    if (g_ > 0.04045) g_ = Math.pow(((g_ + 0.055) / 1.055), 2.4);
    else g_ = g_ / 12.92;

    if (b_ > 0.04045) b_ = Math.pow(((b_ + 0.055) / 1.055), 2.4);
    else b_ = b_ / 12.92;

    r_ = r_ * 100; g_ = g_ * 100; b_ = b_ * 100;

    let X = r_ * 0.4124 + g_ * 0.3576 + b_ * 0.1805;
    let Y = r_ * 0.2126 + g_ * 0.7152 + b_ * 0.0722;
    let Z = r_ * 0.0193 + g_ * 0.1192 + b_ * 0.9505;

    X = X / 95.047; Y = Y / 100.000; Z = Z / 108.883;

    const func = (t: number) => (t > 0.008856) ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);

    X = func(X); Y = func(Y); Z = func(Z);

    const L = (116 * Y) - 16;
    const a = 500 * (X - Y);
    const b_val = 200 * (Y - Z);

    return { L, a, b: b_val };
  }

  checkLighting(r: number, g: number, b: number): boolean {
    // Calculate Luminance (standard formula)
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return l > 30; // Threshold for low light
  }

  extractColor(x: number, y: number): { r: number, g: number, b: number } | null {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert normalized coordinates to pixel coordinates
    // Note: Video is mirrored in CSS (transform: scaleX(-1)), but data is raw.
    // FaceTracker returns normalized x (0-1). 
    // If MediaPipe processes the raw stream, x is correct for the raw stream.
    const pixelX = Math.floor(x * canvas.width);
    const pixelY = Math.floor(y * canvas.height);

    // Get 10x10 area average
    const size = 10;
    const startX = Math.max(0, pixelX - size / 2);
    const startY = Math.max(0, pixelY - size / 2);

    try {
      const frame = ctx.getImageData(startX, startY, size, size);
      let r = 0, g = 0, b = 0;
      const count = frame.data.length / 4;

      for (let i = 0; i < frame.data.length; i += 4) {
        r += frame.data[i];
        g += frame.data[i + 1];
        b += frame.data[i + 2];
      }

      return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
      };
    } catch (e) {
      console.error("Error extracting color", e);
      return null;
    }
  }

  findMatch(color: { r: number, g: number, b: number }) {
    const payload = {
      ...color,
      skinType: this.selectedSkinType
    };

    this.http.post<any[]>('http://localhost:5001/api/shades/match', payload).subscribe({
      next: (res) => {
        this.recommendedShades = res;
        this.generateExplanation();
        this.showResultModal.set(true);
        this.isProcessing = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Failed to fetch matches";
        this.isProcessing = false;
      }
    });
  }

  /**
   * NEW: AI-Powered Skin Analysis
   * Uses Gemini Vision to analyze skin and provide intelligent recommendations
   */
  async scanWithAI() {
    if (!this.videoElement?.nativeElement) {
      this.error = 'Camera not initialized';
      return;
    }

    this.isProcessing = true;
    this.isAiAnalyzing = true;
    this.error = null;

    try {
      // Capture current video frame as base64
      const imageData = this.aiAdvisor.videoFrameToBase64(this.videoElement.nativeElement);

      // Send to AI for analysis
      console.log('🤖 Sending image to Gemini AI...');
      this.aiAdvisor.analyzeSkin(imageData, this.selectedSkinType).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.aiAnalysis = response.data;

            // Use AI analysis to enhance shade matching
            // Extract the smoothed color from history
            if (this.colorHistory.length > 0) {
              const smoothedColor = this.colorHistory.reduce(
                (acc, curr) => ({
                  r: acc.r + curr.r,
                  g: acc.g + curr.g,
                  b: acc.b + curr.b
                }),
                { r: 0, g: 0, b: 0 }
              );

              smoothedColor.r = Math.round(smoothedColor.r / this.colorHistory.length);
              smoothedColor.g = Math.round(smoothedColor.g / this.colorHistory.length);
              smoothedColor.b = Math.round(smoothedColor.b / this.colorHistory.length);

              // Find matches with AI-enhanced parameters
              this.findMatchWithAI(smoothedColor, this.aiAnalysis);
            } else {
              this.isProcessing = false;
              this.isAiAnalyzing = false;
              this.error = 'Chưa có dữ liệu màu da ổn định. Vui lòng giữ yên khuôn mặt.';
            }
          } else {
            this.isProcessing = false;
            this.isAiAnalyzing = false;
            this.error = response.message || 'AI analysis failed';
          }
        },
        error: (err) => {
          console.error('AI Analysis failed:', err);
          this.isProcessing = false;
          this.isAiAnalyzing = false;
          this.error = 'Could not analyze skin. Using fallback method.';

          // Fallback to traditional method
          if (this.colorHistory.length > 0) {
            const smoothedColor = this.colorHistory.reduce(
              (acc, curr) => ({
                r: acc.r + curr.r,
                g: acc.g + curr.g,
                b: acc.b + curr.b
              }),
              { r: 0, g: 0, b: 0 }
            );

            smoothedColor.r = Math.round(smoothedColor.r / this.colorHistory.length);
            smoothedColor.g = Math.round(smoothedColor.g / this.colorHistory.length);
            smoothedColor.b = Math.round(smoothedColor.b / this.colorHistory.length);

            this.findMatch(smoothedColor);
          }
        }
      });

    } catch (error) {
      console.error('AI Scan error:', error);
      this.isProcessing = false;
      this.isAiAnalyzing = false;
      this.error = 'Failed to capture image for AI analysis';
    }
  }

  /**
   * Find shade matches enhanced with AI analysis
   */
  findMatchWithAI(color: { r: number, g: number, b: number }, aiAnalysis: SkinAnalysis) {
    const payload = {
      ...color,
      skinType: this.selectedSkinType,
      // Include AI insights
      undertone: aiAnalysis.undertone,
      brightness: aiAnalysis.brightness,
      toneShift: aiAnalysis.recommendedToneShift
    };

    this.http.post<any[]>('http://localhost:5000/api/shades/match', payload).subscribe({
      next: (res) => {
        this.recommendedShades = res;

        // Use AI-generated explanation instead of hardcoded
        this.explanationText = aiAnalysis.explanation;

        this.showResultModal.set(true);
        this.isProcessing = false;
        this.isAiAnalyzing = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Failed to fetch matches";
        this.isProcessing = false;
        this.isAiAnalyzing = false;
      }
    });
  }

  generateExplanation() {
    // Use AI explanation if available
    if (this.aiAnalysis) {
      this.explanationText = this.aiAnalysis.explanation;
      return;
    }

    // Fallback to old logic
    if (this.selectedSkinType === 'Oily') {
      this.explanationText = "Vì da bạn là da dầu, AI chọn màu sáng hơn 1 tone để tránh bị xuống tông cuối ngày.";
    } else if (this.selectedSkinType === 'Dry') {
      this.explanationText = "Vì da bạn là da khô, AI chọn màu có độ ẩm cao và tone tự nhiên để tránh bị mốc nền.";
    } else {
      this.explanationText = "Màu này khớp hoàn hảo với tone da tự nhiên của bạn.";
    }
  }

  closeModal() {
    this.showResultModal.set(false);
    // We don't clear recommendedShades immediately so the user can see them again if needed, 
    // or we can clear them. For now, let's keep them but hide the modal.
    // actually, let's clear them to reset the flow
    // this.recommendedShades = []; 
  }
}
