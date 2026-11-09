const { Expo } = require('expo-server-sdk');
const { messaging } = require('../config/firebase.config');
const notificationRepository = require('../repository/notification.repository');

const expo = new Expo();

/**
 * Register or update user push token in DB
 */
const registerToken = async (userId, pushToken, deviceType) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    throw new Error(`Invalid Expo push token: ${pushToken}`);
  }
  return await notificationRepository.saveOrUpdatePushToken(userId, pushToken, deviceType);
};

/**
 * Send notification using Expo Server SDK
 */
const sendToUserViaExpo = async (userId, { title, body, data = {} }) => {
  const tokenRecords = await notificationRepository.getActiveTokensByUserId(userId);

  if (!tokenRecords || tokenRecords.length === 0) {
    console.log(`[Notification Service] No active push tokens for user ${userId}. Saved log as SKIPPED.`);
    await notificationRepository.createNotificationLog({
      userId,
      title,
      body,
      data,
      status: 'SKIPPED',
      error: 'No active push tokens found for this user',
    });
    return [];
  }

  const messages = tokenRecords
    .filter((record) => Expo.isExpoPushToken(record.pushToken))
    .map((record) => ({
      to: record.pushToken,
      sound: 'default',
      title,
      body,
      data,
    }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);

      // Automatic cleanup for unregistered/inactive tokens
      ticketChunk.forEach(async (ticket, index) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const badToken = chunk[index].to;
          await notificationRepository.deactivatePushToken(badToken);
        }
      });
    } catch (error) {
      console.error('Error sending push chunk:', error);
    }
  }

  const isSuccess = tickets.some((t) => t.status === 'ok');

  // Notification history/log saved in MongoDB
  await notificationRepository.createNotificationLog({
    userId,
    title,
    body,
    data,
    status: isSuccess ? 'SENT' : 'FAILED',
    error: isSuccess ? null : 'Failed to deliver to Expo push service',
  });

  return tickets;
};

/**
 * Get notification history for a user
 */
const getUserHistory = async (userId) => {
  return await notificationRepository.getNotificationsByUserId(userId);
};

/**
 * Send notification directly using Firebase Admin SDK
 */
const sendDirectFcmMessage = async (fcmToken, title, body, data = {}) => {
  const message = {
    token: fcmToken,
    notification: { title, body },
    data,
  };

  try {
    const response = await messaging.send(message);
    console.log('FCM Message sent successfully:', response);
    return response;
  } catch (error) {
    console.error('FCM Message sending failed:', error);
    throw error;
  }
};

module.exports = {
  registerToken,
  sendToUserViaExpo,
  getUserHistory,
  sendDirectFcmMessage,
};