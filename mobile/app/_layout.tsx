import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/auth';
import { registerForPushNotifications, useNotificationListener } from '../src/lib/notifications';

export default function RootLayout() {
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            registerForPushNotifications();
        }
    }, [isAuthenticated]);

    useNotificationListener(
        (notification) => {
            console.log('Received notification:', notification);
        },
        (response) => {
            console.log('Notification tapped:', response);
            // Navigate to listing/notification screen
        }
    );

    if (isLoading) {
        return null; // Or splash screen
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: '#22c55e' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                {isAuthenticated ? (
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                )}
            </Stack>
        </>
    );
}
