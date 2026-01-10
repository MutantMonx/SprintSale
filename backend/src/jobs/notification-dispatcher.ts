import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
// TODO: Import Firebase Admin for FCM when configured
// import admin from 'firebase-admin';

export interface NotificationPayload {
    userId: string;
    listingId: string;
    type: 'new_listing' | 'price_drop' | 'search_complete' | 'system';
    title: string;
    body: string;
    data?: Record<string, string>;
}

class NotificationDispatcher {
    async dispatch(payload: NotificationPayload): Promise<void> {
        const { userId, listingId, type, title, body, data } = payload;

        try {
            // Create in-app notification
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    listingId,
                    channel: 'IN_APP',
                    status: 'DELIVERED',
                    payload: {
                        type,
                        title,
                        body,
                        ...data,
                    },
                },
            });

            logger.debug(`Created in-app notification: ${notification.id}`);

            // Send push notifications to registered devices
            await this.sendPushNotifications(userId, {
                notification: { title, body },
                data: {
                    type,
                    listingId,
                    notificationId: notification.id,
                    ...data,
                },
            });

            // TODO: WebSocket real-time notification
            // socketServer.sendToUser(userId, 'notification', notification);

        } catch (error) {
            logger.error('Failed to dispatch notification:', error);
        }
    }

    private async sendPushNotifications(
        userId: string,
        message: { notification: { title: string; body: string }; data: Record<string, string> }
    ): Promise<void> {
        try {
            // Get user's registered devices
            const devices = await prisma.mobileDevice.findMany({
                where: {
                    userId,
                    isActive: true,
                },
            });

            if (devices.length === 0) {
                logger.debug(`No registered devices for user: ${userId}`);
                return;
            }

            // TODO: Implement actual Firebase push
            /*
            const tokens = devices.map(d => d.deviceToken);
            
            const response = await admin.messaging().sendEachForMulticast({
              tokens,
              notification: message.notification,
              data: message.data,
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  clickAction: 'OPEN_NOTIFICATION',
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: 1,
                  },
                },
              },
            });
      
            // Handle failed tokens
            response.responses.forEach((resp, idx) => {
              if (!resp.success && resp.error) {
                logger.error(`FCM send failed for device ${devices[idx].id}:`, resp.error);
                
                // Deactivate invalid tokens
                if (resp.error.code === 'messaging/invalid-registration-token' ||
                    resp.error.code === 'messaging/registration-token-not-registered') {
                  prisma.mobileDevice.update({
                    where: { id: devices[idx].id },
                    data: { isActive: false },
                  }).catch(() => {});
                }
              }
            });
      
            logger.info(`Sent push notifications: ${response.successCount}/${tokens.length} successful`);
            */

            logger.debug(`Would send push to ${devices.length} devices (FCM not configured)`);
        } catch (error) {
            logger.error('Failed to send push notifications:', error);
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: {
                userId,
                readAt: null,
            },
        });
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                readAt: new Date(),
                status: 'READ',
            },
        });
    }

    async markAllAsRead(userId: string): Promise<number> {
        const result = await prisma.notification.updateMany({
            where: {
                userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
                status: 'READ',
            },
        });
        return result.count;
    }
}

export const notificationDispatcher = new NotificationDispatcher();
