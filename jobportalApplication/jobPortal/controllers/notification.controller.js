const notificationService = require('../service/notification.service');

const registerToken = async (req, res) => {
  try {
    const { userId, pushToken, deviceType } = req.body;

    console.log('------------------------------------');
    console.log('📌 REGISTER PUSH TOKEN RECEIVED');
    console.log('User ID:', userId);
    console.log('Push Token:', pushToken);
    console.log('Device Type:', deviceType);
    console.log('------------------------------------');

    if (!userId || !pushToken) {
      return res.status(400).json({ success: false, message: 'userId and pushToken are required' });
    }

    const result = await notificationService.registerToken(userId, pushToken, deviceType);
    return res.status(200).json({ success: true, message: 'Token registered successfully', data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, message: 'userId, title, and body are required' });
    }

    const tickets = await notificationService.sendToUserViaExpo(userId, { title, body, data });
    return res.status(200).json({ success: true, message: 'Notification process finished', tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationService.getUserHistory(userId);
    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerToken,
  sendNotification,
  getHistory,
};