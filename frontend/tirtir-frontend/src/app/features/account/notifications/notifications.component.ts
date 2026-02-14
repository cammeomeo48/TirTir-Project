import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { INotification } from '../../../core/models/notification.model';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, TimeAgoPipe],
    template: `
    <div class="notifications-page">
      <div class="page-header">
        <h1>Your Notifications</h1>
        <button class="mark-all-btn" (click)="markAllRead()" *ngIf="(unreadCount$ | async)! > 0">
          Mark all as read
        </button>
      </div>

      <div class="notification-list" *ngIf="notifications$ | async as notifications">
        <div class="notification-card" *ngFor="let item of notifications"
             [class.unread]="!item.isRead"
             (click)="onNotificationClick(item)">
          
          <div class="icon-wrapper" [ngClass]="item.type">
            <ng-container [ngSwitch]="item.type">
              <span *ngSwitchCase="'order'">📦</span>
              <span *ngSwitchCase="'promotion'">🔥</span>
              <span *ngSwitchDefault>🔔</span>
            </ng-container>
          </div>

          <div class="content-wrapper">
            <div class="header-row">
              <span class="title">{{ item.title }}</span>
              <span class="time">{{ item.createdAt | timeAgo }}</span>
            </div>
            <p class="message">{{ item.message }}</p>
          </div>

          <div class="status-indicator" *ngIf="!item.isRead"></div>
        </div>

        <div class="empty-state" *ngIf="notifications.length === 0">
          <div class="empty-icon">🔕</div>
          <h3>No notifications yet</h3>
          <p>We'll let you know when something important happens.</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .notifications-page {
      padding: 24px;
      max-width: 800px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    h1 {
      font-size: 24px;
      margin: 0;
      color: #333;
    }

    .mark-all-btn {
      background: none;
      border: 1px solid #FF6B9D;
      color: #FF6B9D;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .mark-all-btn:hover {
      background: #FF6B9D;
      color: white;
    }

    .notification-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-card {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      background: white;
      border: 1px solid #eee;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .notification-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-color: #ddd;
    }

    .notification-card.unread {
      background: #f0f9ff;
      border-color: #bae6fd;
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .icon-wrapper.order { background: #e3f2fd; color: #2196f3; }
    .icon-wrapper.promotion { background: #ffebee; color: #f44336; }
    .icon-wrapper.system { background: #f5f5f5; color: #757575; }

    .content-wrapper {
      flex: 1;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .title {
      font-weight: 600;
      color: #333;
      font-size: 15px;
    }

    .time {
      font-size: 12px;
      color: #999;
    }

    .message {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      background: #2196f3;
      border-radius: 50%;
      position: absolute;
      top: 20px;
      right: 16px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: #333;
      margin: 0 0 8px;
    }
  `]
})
export class NotificationsComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private router = inject(Router);

    notifications$ = this.notificationService.notifications$;
    unreadCount$ = this.notificationService.unreadCount$;

    ngOnInit() {
        this.notificationService.fetchNotifications().subscribe();
    }

    onNotificationClick(item: INotification) {
        if (!item.isRead) {
            this.notificationService.markAsRead(item._id).subscribe();
        }
        if (item.link) {
            this.router.navigateByUrl(item.link);
        }
    }

    markAllRead() {
        this.notificationService.markAllAsRead().subscribe();
    }
}
