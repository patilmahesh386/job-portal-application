import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken, setPushToken, setReceivedNotification } from '../redux/notificationSlice'; // Added setReceivedNotification import

// 🛠️ FIX 1: Updated Notification Handler Keys (SDK 48/49/50/51+)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,     // Foreground banners
        shouldShowList: true,       // Notification center / tray me show karne ke liye
        shouldPlaySound: true,      // Ensures sound plays
        shouldSetBadge: true,
    }),
});

export function setupNotificationListeners(dispatch, onNotificationTap) {
    const notificationSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            if (dispatch) {
                dispatch(setReceivedNotification(notification));
            }
        }
    );

    // 2. Listener for notification tap response (when user taps on notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            const customData = response.notification.request.content.data;
            console.log('User tapped notification with data:', customData);

            // Trigger custom navigation or handler if provided
            if (onNotificationTap) {
                onNotificationTap(customData, response);
            }
        }
    );

    // Return cleanup function to remove listeners on unmount
    return () => {
        notificationSubscription.remove();
        responseSubscription.remove();
    };
}

export async function registerForPushNotificationsAsync(dispatch, userId) {
    let token;

    if (Platform.OS === 'android') {
        // 🛠️ FIX 2: Added sound parameter to channel configuration
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default', // Channel Sound
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Permission to receive notifications was denied!');
            return null;
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        try {
            let tokenData;
            try {
                tokenData = await Notifications.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined
                );
            } catch (tokenErr) {
                if (tokenErr?.message?.includes('EXPERIENCE_NOT_FOUND')) {
                    console.warn(
                        `[Expo Notifications] Experience/Project ID "${projectId}" not found on Expo servers. ` +
                        `To enable push notifications, run 'eas init' or update "extra.eas.projectId" in app.json with your valid project ID.`
                    );
                } else {
                    console.warn('[Expo Notifications] Error fetching push token:', tokenErr?.message || tokenErr);
                }
            }

            if (tokenData?.data) {
                token = tokenData.data;

                console.log('====================================');
                console.log('🔥 GENERATED EXPO PUSH TOKEN:', token);
                console.log('====================================');

                if (dispatch) {
                    dispatch(setPushToken(token));
                }

                if (dispatch && token && userId) {
                    dispatch(registerPushToken({ userId, pushToken: token, deviceType: Platform.OS }));
                }
            }
        } catch (e) {
            console.warn('Notice: Push notifications registration skipped:', e?.message || e);
        }
    } else {
        console.warn('Must use a physical device for Push Notifications');
    }

    return token;
}