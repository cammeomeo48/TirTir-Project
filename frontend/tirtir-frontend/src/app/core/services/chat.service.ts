import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
    id?: string;
    text: string;
    sender: 'user' | 'bot'; // 'user' or 'bot'
    timestamp: Date;
}

export interface QuickReply {
    label: string;
    value: string;
    icon?: string; // Optional icon class or URL
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/chat`; // Assuming environment.apiUrl exists

    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    messages$ = this.messagesSubject.asObservable();

    // Store active audio to prevent overlapping and allow stopping
    private activeAudio: HTMLAudioElement | null = null;

    // Signal-based state for settings
    private alertSoundEnabledSignal = signal<boolean>(true);
    public alertSoundEnabled = computed(() => this.alertSoundEnabledSignal());

    private desktopNotificationEnabledSignal = signal<boolean>(false);
    public desktopNotificationEnabled = computed(() => this.desktopNotificationEnabledSignal());

    constructor() {
        this.loadSettings();
        this.checkNotificationPermission();
    }

    private loadSettings(): void {
        const savedSound = localStorage.getItem('chatAlertSound');
        if (savedSound !== null) {
            this.alertSoundEnabledSignal.set(savedSound === 'true');
        }
    }

    public toggleAlertSound(enabled: boolean): void {
        this.alertSoundEnabledSignal.set(enabled);
        localStorage.setItem('chatAlertSound', enabled.toString());
    }

    public async requestDesktopNotification(): Promise<void> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return;
        }

        if (Notification.permission === 'granted') {
            this.desktopNotificationEnabledSignal.set(true);
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.desktopNotificationEnabledSignal.set(permission === 'granted');
        }
    }

    private checkNotificationPermission(): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            this.desktopNotificationEnabledSignal.set(true);
        }
    }

    // Call this whenever a message arrives from the bot/admin
    public handleIncomingMessage(message: ChatMessage): void {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, message]);

        if (message.sender === 'bot') {
            this.playAlertSound();
            this.showDesktopNotification(message);
        }
    }

    private playAlertSound(): void {
        if (this.alertSoundEnabled()) {
            // Stop any currently playing sound
            if (this.activeAudio) {
                this.activeAudio.pause();
                this.activeAudio.currentTime = 0;
            }

            // [PLACEHOLDER]: Notification Sound Logic
            console.log('Attempting to play sound from: /assets/sounds/notification.mp3');
            this.activeAudio = new Audio('/assets/sounds/notification.mp3');

            this.activeAudio.play().then(() => {
                console.log('Sound played successfully 🔔');

                // Cắt ngang file âm thanh nếu nó quá dài (chỉ cho kêu 15 giây báo hiệu)
                setTimeout(() => {
                    if (this.activeAudio) {
                        this.activeAudio.pause();
                        this.activeAudio.currentTime = 0;
                    }
                }, 15000);

            }).catch(e => {
                console.error('Audio play failed (File missing or browser blocking autoplay):', e.message);
            });
        }
    }

    private showDesktopNotification(message: ChatMessage): void {
        if (this.desktopNotificationEnabled() && document.hidden) {
            new Notification('New message from Support', {
                body: message.text,
                icon: '/assets/logo.png' // Adjust if needed
            });
        }
    }

    // POST /chat/start - Client-side only (Mock)
    initiateChat(userData?: any): Observable<any> {
        // Mock success response
        return new Observable(observer => {
            observer.next({ success: true });
            observer.complete();
        });
    }

    // GET /chat/history - Client-side only (Mock)
    getChatHistory(): Observable<ChatMessage[]> {
        // Mock empty history
        return new Observable(observer => {
            observer.next([]);
            observer.complete();
        });
    }

    // POST /chat (Real Backend API)
    sendMessage(text: string): Observable<any> {
        const newMessage: ChatMessage = {
            text,
            sender: 'user',
            timestamp: new Date()
        };

        // Optimistic update (show User's message instantly)
        this.handleIncomingMessage(newMessage);

        // Calls POST /api/v1/chat
        return this.http.post<any>(`${this.apiUrl}`, { message: text }).pipe(
            tap(response => {
                // [REAL LOGIC]: Handle real bot response when Backend is ready
                if (response) {
                    const botText = response.reply || response.response || response.message;
                    if (botText) {
                        this.handleIncomingMessage({
                            text: botText,
                            sender: 'bot',
                            timestamp: new Date()
                        });
                    } else if (typeof response === 'string') {
                        this.handleIncomingMessage({
                            text: response,
                            sender: 'bot',
                            timestamp: new Date()
                        });
                    }
                }
            }),
            catchError((error: any) => {
                console.warn('Backend API /chat failed. Falling back to Mock Messaage...', error.message);

                // [PLACEHOLDER LOGIC]: Simulate bot response until BE is complete
                setTimeout(() => {
                    this.handleIncomingMessage({
                        text: 'This is a simulated AI response! (Backend API is currently offline/incomplete).',
                        sender: 'bot',
                        timestamp: new Date()
                    });
                }, 1000);

                // Return a safe observable so the component's 'next' block executes and stops the typing indicator
                return of(null);
            })
        );
    }

    // GET /chat/options - Client-side only (Mock)
    getQuickReplies(): Observable<QuickReply[]> {
        // Mock TIRTIR default options
        return new Observable(observer => {
            observer.next([
                { label: 'Shipping Inquiry', value: 'shipping', icon: '📦' },
                { label: 'Product Inquiry', value: 'product', icon: '💄' },
                { label: 'Return/Refund', value: 'refund', icon: '💵' },
                { label: 'Modify/Cancel', value: 'order', icon: '✏️' },
                { label: 'Other Inquiries', value: 'other', icon: '❓' }
            ]);
            observer.complete();
        });
    }
}
