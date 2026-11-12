const { Expo } = require('expo-server-sdk');
const { messaging } = require('../config/firebase.config');
const notificationRepository = require('../repository/notification.repository');
const User = require('../models/userRegister.modal');

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

/**
 * Send broadcast notification to all candidates when a new job is created/posted
 */
const notifyCandidatesOnNewJob = async (job, recruiter = {}) => {
  try {
    const jobTitle = job.title || 'New Job Opportunity';
    const company = job.companyName || recruiter.companyName || 'A top company';
    const location = job.jobLocation || 'Remote / Multiple locations';
    const salaryText = job.salary ? ` • ₹${job.salary}` : '';

    const title = `📢 New Job Alert: ${jobTitle}`;
    const body = `${company} is actively hiring for "${jobTitle}" in ${location}${salaryText}. Tap to apply now!`;

    const notificationData = {
      type: 'NEW_JOB_POSTED',
      jobId: String(job._id || job.id || ''),
      title: jobTitle,
      companyName: company,
      jobLocation: location,
      salary: String(job.salary || ''),
    };

    // 1. Fetch all registered candidates
    const candidates = await User.find({ role: 'candidate' }, '_id name email');

    if (!candidates || candidates.length === 0) {
      console.log('[Notification Service] No registered candidates found to notify.');
      return { totalCandidates: 0, sentPush: 0 };
    }

    console.log(`[Notification Service] Found ${candidates.length} candidates. Creating notifications...`);

    // 2. Insert in-app notifications into DB for all candidates
    const notificationDocs = candidates.map((candidate) => ({
      userId: candidate._id,
      title,
      body,
      data: notificationData,
      status: 'SENT',
    }));

    await notificationRepository.createNotificationsBatch(notificationDocs).catch((batchErr) => {
      console.warn('[Notification Service] Batch notification log warning:', batchErr.message);
    });

    // 3. Collect active push tokens for all candidates
    const candidateIds = candidates.map((c) => c._id);
    const tokenRecords = await notificationRepository.getActiveTokensByUserIds(candidateIds);

    const validMessages = (tokenRecords || [])
      .filter((record) => Expo.isExpoPushToken(record.pushToken))
      .map((record) => ({
        to: record.pushToken,
        sound: 'default',
        title,
        body,
        data: notificationData,
        priority: 'high',
        channelId: 'default',
      }));

    let pushCount = 0;
    if (validMessages.length > 0) {
      const chunks = expo.chunkPushNotifications(validMessages);
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          pushCount += ticketChunk.filter((t) => t.status === 'ok').length;

          // Deactivate invalid tokens automatically
          ticketChunk.forEach(async (ticket, index) => {
            if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
              await notificationRepository.deactivatePushToken(chunk[index].to);
            }
          });
        } catch (pushErr) {
          console.error('[Notification Service] Error sending candidate push chunk:', pushErr);
        }
      }
    }

    console.log(
      `[Notification Service] Successfully sent new job notification for "${jobTitle}" to ${candidates.length} candidate accounts (${pushCount} active device push delivered).`
    );

    // 4. Also send a confirmation push to the recruiter who created the job
    const recruiterId = job.createBy || recruiter.id || recruiter._id;
    if (recruiterId) {
      sendToUserViaExpo(recruiterId, {
        title: 'Job Live & Candidates Notified! 🎉',
        body: `Your job listing "${jobTitle}" is now live and ${candidates.length} candidates have received the alert.`,
        data: {
          type: 'JOBPOSTED',
          jobId: String(job._id || job.id || ''),
        },
      }).catch(() => {});
    }

    return {
      success: true,
      totalCandidates: candidates.length,
      sentPush: pushCount,
    };
  } catch (error) {
    console.error('[Notification Service] Error in notifyCandidatesOnNewJob:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  registerToken,
  sendToUserViaExpo,
  getUserHistory,
  sendDirectFcmMessage,
  notifyCandidatesOnNewJob,
};