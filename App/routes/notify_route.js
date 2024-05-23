const express = require('express');
const { body } = require('express-validator');
const Notify = require('../controller/notify_controller');
const Notification = require('../controller/notification_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

router.post('/student/token/store', Verifytoken.verify, Notify.storefcm);
router.get('/student/message/send', Verifytoken.verify, Notify.sendNotification);
router.post('/student/message/send', Verifytoken.verify, upload.single("media"), Notify.sendNotificationByUser);
router.post('/university/notify/register', Verifytoken.verify, Notification.makeNotification);
router.get('/student/notification/get', Verifytoken.verify, Notification.getNotification);
router.post('/student/notification/delete', Verifytoken.verify, Notification.deleteNotification);
module.exports = router;