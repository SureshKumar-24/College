const express = require('express');
const { body } = require('express-validator');
const Event = require('../controller/event_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

router.post('/university/event/create', Verifytoken.verify, upload.single("media-img"), Event.createEvent);
router.get('/student/event/get', Verifytoken.verify, Event.getEvent);
router.get('/student/event/one', Verifytoken.verify, Event.getEventById);
router.get('/stuent/event/search', Verifytoken.verify, Event.searchEvent);
router.get('/student/event/latest', Verifytoken.verify, Event.getLatestEvent);
router.post('/student/event/enroll', Verifytoken.verify, Event.studentEnrollEvent);
router.post('/student/event/unenroll', Verifytoken.verify, Event.studentUnenrollEvent);
router.get('/student/event/enroll/get', Verifytoken.verify, Event.studentEnrollEventall);


router.post('/univesity/event/status', Verifytoken.verify, Verifytoken.Admin, Event.statusUpdate);
router.get('/university/event/get', Verifytoken.verify, Verifytoken.Admin, Event.getEventByAdmin);
router.get('/univerity/event/one', Verifytoken.verify, Verifytoken.Admin, Event.getEventone);
router.post('/university/event/update', Verifytoken.verify, Verifytoken.Admin, upload.single("media-img"), Event.updateEvent);
router.delete('/university/event/delete', Verifytoken.verify, Verifytoken.Admin, Event.deleteEvent);

module.exports = router;