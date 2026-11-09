const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

router.post('/registertoken', notificationController.registerToken);
router.post('/send/notfication', notificationController.sendNotification);
router.get('/history/:userId', notificationController.getHistory);

module.exports = router;