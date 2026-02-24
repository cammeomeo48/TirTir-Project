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
      padding: 0;
      max-width: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }

    h1 {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0;
      color: #111;
    }

    .mark-all-btn {
      background: none;
      border: 1px solid #111;
      color: #111;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s;
    }

    .mark-all-btn:hover {
      background: #111;
      color: white;
    }

    .notification-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .notification-card {
      display: flex;
      align-items: flex-start;
      padding: 30px;
      background: white;
      border: 1px solid #e0e0e0;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
    }

    .notification-card:hover {
      border-color: #111;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }

    .notification-card.unread {
      background: #fafafa;
      border-color: #111;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-right: 24px;
      flex-shrink: 0;
      border: 1px solid #eee;
    }

    .icon-wrapper.order { border-color: #dbeafe; }
    .icon-wrapper.promotion { border-color: #ffebee; }
    .icon-wrapper.system { border-color: #f5f5f5; }

    .content-wrapper {
      flex: 1;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .title {
      font-weight: 800;
      color: #111;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .time {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .message {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      background: #111;
      position: absolute;
      top: 30px;
      right: 30px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      color: #999;
      border: 1px dashed #ddd;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 24px;
      opacity: 0.3;
    }

    .empty-state h3 {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #111;
      margin: 0 0 10px;
    }

    .empty-state p {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
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
