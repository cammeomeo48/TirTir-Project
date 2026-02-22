import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-home.component.html',
    styleUrls: ['./chat-home.component.scss']
})
export class ChatHomeComponent {
    @Output() startChat = new EventEmitter<void>();

    onStartChat() {
        this.startChat.emit();
    }
}
