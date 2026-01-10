import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { devicesApi } from './api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Permission for push notifications not granted');
        return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    // Register with backend
    try {
        await devicesApi.register({
            deviceToken: token.data,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            deviceName: Device.modelName || undefined,
        });
    } catch (error) {
        console.error('Failed to register device:', error);
    }

    return token.data;
}

export function useNotificationListener(
    onNotification?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                onNotification?.(notification);
            }
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                onNotificationResponse?.(response);
            }
        );

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [onNotification, onNotificationResponse]);
}
