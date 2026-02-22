import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';

@Component({
    selector: 'app-chat-messages',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-messages.component.html',
    styleUrls: ['./chat-messages.component.scss']
})
export class ChatMessagesComponent {
    @Output() startChat = new EventEmitter<void>();

    // Placeholder for history list
    history: any[] = [
        {
            id: 1,
            lastMessage: 'Please select the issue related below 👇',
            timestamp: new Date(),
            sender: 'TIRTIR Global'
        }
    ];

    constructor(private chatService: ChatService) { }

    ngOnInit() {
        // In a real app, we would fetch history here
        // this.chatService.getChatHistory().subscribe(history => this.history = history);
    }

    onStartNewChat() {
        this.startChat.emit();
    }
}
