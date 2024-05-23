const express = require('express');
const { body } = require('express-validator');
const Studylevel = require('../controller/studylevel_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');


router.post('/study/register', Verifytoken.verify, Verifytoken.Admin, Studylevel.createStudyLevel);
router.post('/course/register', Verifytoken.verify, Verifytoken.Admin, Studylevel.createCourse);
router.get('/getAllStudyLevelsByUniversity', Verifytoken.verify, Verifytoken.Admin, Studylevel.getAllStudyLevelsByUniversity);
router.post('/course/all', Verifytoken.verify, Verifytoken.Admin, Studylevel.allcourse);
router.get('/study/all', Verifytoken.verify, Verifytoken.Admin, Studylevel.getStudy);
router.post('/univesity/study/courses', Verifytoken.verify, Verifytoken.Admin, Studylevel.courseToStudylevel);
router.delete('/course/delete', Verifytoken.verify, Verifytoken.Admin, Studylevel.deleteCourse);
router.delete('/study/delete', Verifytoken.verify, Verifytoken.Admin, Studylevel.deleteStudy);
module.exports = router;