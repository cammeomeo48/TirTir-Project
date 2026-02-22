import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

    // Observable for messages
    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    messages$ = this.messagesSubject.asObservable();

    constructor() { }

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

        // Optimistic update
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, newMessage]);

        // Calls POST /api/v1/chat (matches router.post('/') in chat.routes.js)
        return this.http.post<any>(`${this.apiUrl}`, { message: text });
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
