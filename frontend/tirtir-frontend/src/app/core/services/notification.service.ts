import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { switchMap, tap, retry, shareReplay, takeWhile } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment'; // Adjust if needed
import { INotification } from '../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);

    // Use explicit URL or environment variable
    private apiUrl = 'http://localhost:5001/api/v1/notifications';

    // State Management
    private notificationsSubject = new BehaviorSubject<INotification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    private pollingSubscription?: Subscription;

    constructor() {
        // Only start polling in browser environment
        if (isPlatformBrowser(this.platformId)) {
            this.startPolling();
        }
    }

    /**
     * Start polling every 60 seconds
     */
    private startPolling() {
        this.pollingSubscription = timer(0, 60000)
            .pipe(
                switchMap(() => this.fetchNotifications())
            )
            .subscribe();
    }

    /**
     * Fetch notifications from API
     */
    fetchNotifications(): Observable<any> {
        return this.http.get<{ success: boolean; data: INotification[] }>(this.apiUrl)
            .pipe(
                tap(response => {
                    if (response.success) {
                        this.updateState(response.data);
                    }
                }),
                retry(2) // Retry twice on failure
            );
    }

    /**
     * Update local state (notifications and unread count)
     */
    private updateState(notifications: INotification[]) {
        this.notificationsSubject.next(notifications);

        // Calculate unread count
        const count = notifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(count);
    }

    /**
     * Mark a single notification as read
     * Optimistic UI update
     */
    markAsRead(id: string): Observable<any> {
        // 1. Optimistic Update
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n =>
            n._id === id ? { ...n, isRead: true } : n
        );
        this.updateState(updatedNotifications);

        // 2. Call API
        return this.http.put(`${this.apiUrl}/${id}/read`, {}).pipe(
            tap({
                error: () => {
                    // Revert on error (optional, usually skipped for read status)
                    this.updateState(currentNotifications);
                }
            })
        );
    }

    /**
     * Mark all notifications as read
     * Optimistic UI update
     */
    markAllAsRead(): Observable<any> {
        // 1. Optimistic Update
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({ ...n, isRead: true }));
        this.updateState(updatedNotifications);

        // 2. Call API
        return this.http.put(`${this.apiUrl}/read-all`, {});
    }

    /**
     * Get top N notifications for dropdown
     */
    getRecent(limit: number = 5): Observable<INotification[]> {
        return this.notifications$; // Logic to slice can be done in component or selector
    }
}
