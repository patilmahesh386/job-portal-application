import { Platform } from 'react-native';
import api from '../api/axios'; // Import your configured axios instance

export const registerPushTokenWithBackend = async (userId, pushToken) => {
    try {
        const response = await api.post('/registertoken', {
            userId,
            pushToken,
            deviceType: Platform.OS,
        });

        console.log('Backend Registration Response:', response.data);
        return response.data;
    } catch (error) {
        console.error(
            'Failed to register token with backend:',
            error.response?.data || error.message
        );
        throw error;
    }
};

export const sendNotificationWithBackend = async (userId, title, body, data) => {
    try {
        const response = await api.post('/send/notfication', {
            userId,
            title,
            body,
            data,
        });
        console.log('Backend Notification Response:', response.data);
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log('Notice: Push notification not delivered:', errorMsg);
        return { success: false, message: errorMsg, skipped: true };
    }
};