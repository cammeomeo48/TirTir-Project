import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
    id?: string;
    text: string;
    sender: 'user' | 'bot'; // 'user' or 'bot'
    timestamp: Date;
    productData?: {
        id: string;
        name: string;
        price: number;
        image: string;
        desc: string;
        slug: string;
    };
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

    // POST /chat/start
    initiateChat(userData?: any): Observable<any> {
        return of({ success: true, message: 'Chat initiated' });
    }

    // GET /chat/history
    getChatHistory(): Observable<ChatMessage[]> {
        return this.http.get<ChatMessage[]>(`${this.apiUrl}/history`).pipe(
            catchError(error => {
                console.error('Failed to load chat history:', error);
                return of([]);
            })
        );
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
                if (response) {
                    // Response format from /api/v1/chat:
                    // { intent, message, type, data }
                    const botText = response.message;
                    
                    if (botText) {
                        const botMessage: ChatMessage = {
                            text: botText,
                            sender: 'bot',
                            timestamp: new Date()
                        };

                        // If response contains product data, attach it
                        if (response.type === 'product' && response.data) {
                            botMessage.productData = response.data;
                        }

                        this.handleIncomingMessage(botMessage);
                    }
                }
            }),
            catchError((error: any) => {
                console.error('Backend API /chat failed:', error.message);
                
                // Handle specific error cases
                let errorText = 'Sorry, I am currently unable to process your request. Please try again later.';
                
                if (error.status === 503) {
                    errorText = '❌ Chatbot service is not available. Please try again in a moment.';
                }
                
                this.handleIncomingMessage({
                    text: errorText,
                    sender: 'bot',
                    timestamp: new Date()
                });
                throw error;
            })
        );
    }

    getQuickReplies(): Observable<QuickReply[]> {
        return of([
            { label: 'Tư vấn loại da', value: 'Tư vấn cushion cho da nhạy cảm' },
            { label: 'Mã giảm giá', value: 'Có mã giảm giá nào không?' },
            { label: 'Kiểm tra đơn', value: 'Làm sao để kiểm tra đơn hàng?' }
        ]);
    }
}
