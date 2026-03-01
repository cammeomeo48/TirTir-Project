import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef, AfterViewChecked, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

    private destroyRef = inject(DestroyRef);

    constructor(private chatService: ChatService) { }

    ngOnInit() {
        // FE-03: takeUntilDestroyed() prevents the memory leak when the component is destroyed
        this.chatService.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(msgs => {
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

        // FE-04: Set isTyping BEFORE subscribe so the indicator shows while waiting for the response
        this.isTyping = true;

        this.chatService.sendMessage(msg).subscribe({
            next: (response: any) => {
                this.isTyping = false;
                this.scrollToBottom();
            },
            error: (err) => {
                console.error('Failed to send message:', err);
                this.isTyping = false;
            }
        });
    }

    sendQuickReply(reply: QuickReply) {
        this.newMessage = reply.label;
        this.sendMessage();
    }
}
