import { Injectable, signal } from '@angular/core';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export interface FacePoints {
  forehead: {x: number, y: number};
  nose: {x: number, y: number};
  leftCheek: {x: number, y: number};
  rightCheek: {x: number, y: number};
  chin: {x: number, y: number};
}

@Injectable({ providedIn: 'root' })
export class FaceTrackerService {
  private faceLandmarker: FaceLandmarker | undefined;
  
  // Signals for UI state
  public isFaceDetected = signal(false);
  // Changed to hold multiple points
  public facePoints = signal<FacePoints | null>(null);

  async initialize() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );
    
    this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 1
    });
  }

  detectFace(videoElement: HTMLVideoElement) {
    if (!this.faceLandmarker) return;

    const startTimeMs = performance.now();
    const results = this.faceLandmarker.detectForVideo(videoElement, startTimeMs);

    if (results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0];
      const blendshapes = results.faceBlendshapes[0];

      // 1. Pose Validation (Basic Geometry Check)
      // Check if nose is roughly centered between cheeks (Yaw check)
      const noseX = landmarks[1].x;
      const leftCheekX = landmarks[117].x;
      const rightCheekX = landmarks[346].x;
      const cheekMidpoint = (leftCheekX + rightCheekX) / 2;
      const yawDeviation = Math.abs(noseX - cheekMidpoint);

      // Check if eyes are open (Blendshapes)
      // indices: 9 = eyeBlinkLeft, 10 = eyeBlinkRight (in generic blendshapes, but let's use categories if available or index)
      // MediaPipe Blendshapes are named categories.
      const eyeBlinkLeft = blendshapes.categories.find(c => c.categoryName === 'eyeBlinkLeft')?.score || 0;
      const eyeBlinkRight = blendshapes.categories.find(c => c.categoryName === 'eyeBlinkRight')?.score || 0;
      
      const isEyesOpen = eyeBlinkLeft < 0.5 && eyeBlinkRight < 0.5;
      const isHeadStraight = yawDeviation < 0.05; // 5% deviation allowed

      if (isEyesOpen && isHeadStraight) {
          this.isFaceDetected.set(true);
          
          this.facePoints.set({
            forehead: { x: landmarks[151].x, y: landmarks[151].y },
            nose: { x: landmarks[1].x, y: landmarks[1].y },
            leftCheek: { x: landmarks[117].x, y: landmarks[117].y },
            rightCheek: { x: landmarks[346].x, y: landmarks[346].y },
            chin: { x: landmarks[199].x, y: landmarks[199].y }
          });
      } else {
          // Detect face but pose is bad -> We can treat this as "Face detected but not valid"
          // For now, let's treat it as not detected to force user to adjust, 
          // or we could add a new signal 'isPoseValid' for better UI feedback.
          // To keep it simple per request "Input Gatekeeper", we just block detection.
          this.isFaceDetected.set(false);
          this.facePoints.set(null);
      }

    } else {
      this.isFaceDetected.set(false);
      this.facePoints.set(null);
    }
  }
}
