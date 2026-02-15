import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, QuickReply } from '../../../core/services/chat.service';

@Component({
    selector: 'app-chat-conversation',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-conversation.component.html',
    styleUrls: ['./chat-conversation.component.scss']
})
export class ChatConversationComponent implements OnInit, AfterViewChecked {
    @Output() back = new EventEmitter<void>();
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    messages: ChatMessage[] = [];
    newMessage = '';
    quickReplies: QuickReply[] = [];
    isTyping = false;

    constructor(private chatService: ChatService) { }

    ngOnInit() {
        this.chatService.messages$.subscribe(msgs => {
            this.messages = msgs;
            this.scrollToBottom();
        });

        this.chatService.initiateChat().subscribe(response => {
            // Handle session init if needed
        });

        this.chatService.getQuickReplies().subscribe(replies => {
            this.quickReplies = replies;
        });

        // Initial bot message if empty
        if (this.messages.length === 0) {
            this.messages.push({
                text: 'Thank you for reaching out to TIRTIR Global Customer Service Team❤️. How may we assist you today?✨',
                sender: 'bot',
                timestamp: new Date()
            });
        }
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    goBack() {
        this.back.emit();
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;

        const msg = this.newMessage;
        this.newMessage = '';

        this.chatService.sendMessage(msg).subscribe({
            next: (response: any) => {
                // Backend returns JSON from Python script.
                // Assuming response has 'response', 'message', or we take the whole object if it is string
                const botReply = response.response || response.message || JSON.stringify(response);

                this.messages.push({
                    text: botReply,
                    sender: 'bot',
                    timestamp: new Date()
                });

                this.isTyping = false;
                this.scrollToBottom();
            },
            error: (err) => {
                console.error('Failed to send message', err);
                this.isTyping = false;
                this.messages.push({
                    text: "Sorry, I'm having trouble connecting to the server.",
                    sender: 'bot',
                    timestamp: new Date()
                });
            }
        });

        // Simulate bot thinking/typing
        this.isTyping = true;
    }

    sendQuickReply(reply: QuickReply) {
        this.newMessage = reply.label;
        this.sendMessage();
    }
}
