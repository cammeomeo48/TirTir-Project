import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

/**
 * AI Skin Analysis Response Interface
 */
export interface SkinAnalysis {
    undertone: 'Cool' | 'Warm' | 'Neutral';
    confidence: number;
    brightness: 'Light' | 'Medium' | 'Deep';
    skinConcerns: string[];
    recommendedToneShift: 'lighter' | 'exact' | 'deeper';
    explanation: string;
    reasoning: string;
}

/**
 * AI Beauty Advisor Service
 * Communicates with backend to analyze skin using Gemini AI Vision
 */
@Injectable({
    providedIn: 'root'
})
export class AiAdvisorService {
    private apiUrl = 'http://localhost:5000/api/ai';

    constructor(private http: HttpClient) { }

    /**
     * Analyzes skin from camera image using Gemini AI
     * @param imageData Base64 encoded image data
     * @param skinType User's skin type (Normal, Oily, Dry, etc.)
     * @returns Observable with AI analysis results
     */
    analyzeSkin(imageData: string, skinType: string): Observable<{ success: boolean; data?: SkinAnalysis; message?: string }> {
        return this.http.post<{ success: boolean; data?: SkinAnalysis; message?: string }>(
            `${this.apiUrl}/analyze-skin`,
            {
                imageData,
                skinType
            }
        ).pipe(
            catchError((error) => {
                console.error('AI Analysis Error:', error);
                return of({
                    success: false,
                    message: 'Could not connect to AI service. Please try again.'
                });
            })
        );
    }

    /**
     * Checks if AI service is available and configured
     * @returns Observable with health status
     */
    checkHealth(): Observable<{ success: boolean; configured: boolean; initialized: boolean; model: string | null }> {
        return this.http.get<{ success: boolean; configured: boolean; initialized: boolean; model: string | null }>(
            `${this.apiUrl}/health`
        ).pipe(
            catchError((error) => {
                console.error('AI Health Check Error:', error);
                return of({
                    success: false,
                    configured: false,
                    initialized: false,
                    model: null
                });
            })
        );
    }

    /**
     * Converts a canvas element to base64 image data
     * @param canvas HTML Canvas Element
     * @returns Base64 image string
     */
    canvasToBase64(canvas: HTMLCanvasElement): string {
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Converts video frame to base64 image data
     * @param video HTML Video Element
     * @returns Base64 image string
     */
    videoFrameToBase64(video: HTMLVideoElement): string {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
    }
}
