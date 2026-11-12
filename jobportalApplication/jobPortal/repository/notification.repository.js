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

const getActiveTokensByUserIds = async (userIds) => {
  return await UserPushToken.find({ userId: { $in: userIds }, isActive: true });
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

const createNotificationsBatch = async (docs) => {
  if (!docs || docs.length === 0) return [];
  return await Notification.insertMany(docs, { ordered: false });
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
  getActiveTokensByUserIds,
  createNotificationLog,
  createNotificationsBatch,
  getNotificationsByUserId,
};