const express = require('express');
const { body } = require('express-validator');
const Announcement = require('../controller/annouce_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');

const registerAnnoucement = [
    body('title').isString().withMessage('Title must be a string'),
    body('description').isString().withMessage('Description must be a string'),
    body('studyLevels').isArray().withMessage('Study levels must be an array'),
    body('studyLevels.*').isMongoId().withMessage('Invalid studyLevel ObjectId'), // Validate each element in the studyLevels array as a valid MongoDB ObjectId
    body('courseTypes').isArray().withMessage('Course types must be an array'),
    body('courseTypes.*').isMongoId().withMessage('Invalid courseType ObjectId'), // Validate each element in the courseTypes array as a valid MongoDB ObjectId
];

router.post('/university/annoucement/register', registerAnnoucement, Verifytoken.verify, Verifytoken.Admin, Announcement.createAnnoucement);
router.get('/university/annoucement/get', Verifytoken.verify, Verifytoken.Admin, Announcement.Announcementget);
router.get('/university/annoucement/one', Verifytoken.verify, Verifytoken.Admin, Announcement.getAnnouncementById);
router.delete('/university/announcement/delete', Verifytoken.verify, Verifytoken.Admin, Announcement.deleteAnnouncement);
router.post('/university/announcement/update', Verifytoken.verify, Verifytoken.Admin, Announcement.updateAnnouncement);
router.post('/univesity/announcement/status', Verifytoken.verify, Verifytoken.Admin, Announcement.statusUpdate);
router.post('/university/annoucement/action',Verifytoken.verify, Verifytoken.Admin, Announcement.annoucementAction);

router.get('/student/annoucement/get', Verifytoken.verify, Announcement.getAnnouncementsByStudent);
router.get('/student/annoucement/one', Verifytoken.verify, Announcement.getAnnouncementByStudentOne);
router.get('/student/annoucement/seach', Verifytoken.verify, Announcement.getAnnouncementsByStudentSeach);
router.get('/student/annoucement/latest', Verifytoken.verify, Announcement.getLatestAnnouncement);
module.exports = router;