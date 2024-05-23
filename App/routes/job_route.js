const express = require('express');
const { body } = require('express-validator');
const Job = require('../controller/job_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

router.get('/student/job/get', Verifytoken.verify, Job.getJob);
router.get('/student/job/one', Verifytoken.verify, Job.getJobById);
router.get('/student/job/search', Verifytoken.verify, Job.searchJob);
router.get('/student/job/latest', Verifytoken.verify, Job.getLatestJob);
router.post('/student/job/enroll', Verifytoken.verify, upload.single("media-img"), Job.studentEnrollJob);
// router.post('/student/job/unenroll', Verifytoken.verify, Job.studentUnenrollJob);
// router.get('/student/job/enroll/get', Verifytoken.verify, Job.studentEnrollJoball);


router.post('/university/job/create', Verifytoken.verify, upload.single("media-img"), Job.createAcademicJob);
router.post('/univesity/job/status', Verifytoken.verify, Verifytoken.Admin, Job.statusUpdate);
router.get('/university/job/get', Verifytoken.verify, Verifytoken.Admin, Job.getallJob);
router.get('/univerity/job/one', Verifytoken.verify, Verifytoken.Admin, Job.admingetjobId);
router.post('/university/job/update', Verifytoken.verify, Verifytoken.Admin, upload.single("media-img"), Job.updateJob);
// router.delete('/university/job/delete', Verifytoken.verify, Verifytoken.Admin, Job.deleteJob);

module.exports = router;