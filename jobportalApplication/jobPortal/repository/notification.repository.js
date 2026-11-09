const UserPushToken = require('../models/pushnotification.modal');
const Notification = require('../models/notifications.modal');

const saveOrUpdatePushToken = async (userId, pushToken, deviceType) => {
  return await UserPushToken.findOneAndUpdate(
    { pushToken },
    { userId, pushToken, deviceType, isActive: true },
    { upsert: true, new: true }
  );
};

const deactivatePushToken = async (pushToken) => {
  return await UserPushToken.findOneAndUpdate({ pushToken }, { isActive: false });
};

const getActiveTokensByUserId = async (userId) => {
  return await UserPushToken.find({ userId, isActive: true });
};

const createNotificationLog = async ({ userId, title, body, data, status, error }) => {
  return await Notification.create({
    userId,
    title,
    body,
    data,
    status,
    error,
  });
};

const getNotificationsByUserId = async (userId, limit = 20) => {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  saveOrUpdatePushToken,
  deactivatePushToken,
  getActiveTokensByUserId,
  createNotificationLog,
  getNotificationsByUserId,
};