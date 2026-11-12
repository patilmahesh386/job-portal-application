import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    notifyCandidatesNewJobWithBackend,
    registerPushTokenWithBackend,
    sendNotificationWithBackend,
} from '../service/notification';

// Async Thunk calls the service method, not Axios directly
export const registerPushToken = createAsyncThunk(
    'notification/registerPushToken',
    async ({ userId, pushToken }, { rejectWithValue }) => {
        try {
            const data = await registerPushTokenWithBackend(userId, pushToken);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to register push token'
            );
        }
    }
);


export const sendNotification = createAsyncThunk(
    "send/notification",
    async ({ userId, title, body, data }, thunkApi) => {
        try {
            if (!userId) {
                return { success: false, skipped: true, message: "No userId provided" };
            }
            const response = await sendNotificationWithBackend(userId, title, body, data);
            return response;
        } catch (error) {
            return {
                success: false,
                skipped: true,
                message: error.response?.data?.message || error.message || "Notification skipped",
            };
        }
    }
);

export const notifyCandidatesNewJob = createAsyncThunk(
    "notification/notifyCandidatesNewJob",
    async (jobData, thunkApi) => {
        try {
            const response = await notifyCandidatesNewJobWithBackend(jobData);
            return response;
        } catch (error) {
            return {
                success: false,
                skipped: true,
                message: error.response?.data?.message || error.message || "Broadcast skipped",
            };
        }
    }
);

const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        notifications: null,
        pushToken: null,
        receivedNotification: null, // Stores latest foreground notification
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        setPushToken: (state, action) => {
            state.pushToken = action.payload;
        },
        setReceivedNotification: (state, action) => {
            state.receivedNotification = action.payload;
        },
        clearNotification: (state) => {
            state.receivedNotification = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerPushToken.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(registerPushToken.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(registerPushToken.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            .addCase(sendNotification.fulfilled, (state, action) => {
                state.notifications = action.payload,
                    state.error = null,
                    state.status = 'succeeded';
            })

            .addCase(sendNotification.rejected, (state, action) => {
                state.error = action.payload,
                    state.status = 'failed';
            })

            .addCase(sendNotification.pending, (state, action) => {
                state.status = 'loading',
                    state.error = null
            })
    },
});

export const { setPushToken, setReceivedNotification, clearNotification } =
    notificationSlice.actions;

export default notificationSlice.reducer;