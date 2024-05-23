const express = require('express');
const { body } = require('express-validator');
const Workshop = require('../controller/workshop_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

router.post('/university/workshop/create', Verifytoken.verify, upload.single("media-img"), Workshop.createAcademicWorkshop);
router.get('/student/workshop/get', Verifytoken.verify, Workshop.getWorkshop);
router.get('/student/workshop/one', Verifytoken.verify, Workshop.getWorkshopById);
router.get('/student/workshop/search', Verifytoken.verify, Workshop.searchWorkshop);
router.get('/student/workshop/latest', Verifytoken.verify, Workshop.getLatestWorkshop);
router.post('/student/workshop/enroll', Verifytoken.verify, Workshop.studentEnrollWorkshop);
router.post('/student/workshop/unenroll', Verifytoken.verify, Workshop.studentUnenrollWorkshop);
router.get('/student/workshop/enroll/get', Verifytoken.verify, Workshop.studentEnrollWorkshopall);


router.post('/univesity/workshop/status', Verifytoken.verify, Verifytoken.Admin, Workshop.statusUpdate);
router.get('/university/workshop/get', Verifytoken.verify, Verifytoken.Admin, Workshop.getallWorkshop);
router.get('/univerity/workshop/one', Verifytoken.verify, Verifytoken.Admin, Workshop.admingetworkshopId);
router.post('/university/workshop/update', Verifytoken.verify, Verifytoken.Admin, upload.single("media-img"), Workshop.updateWorkshop);
router.delete('/university/workshop/delete', Verifytoken.verify, Verifytoken.Admin, Workshop.deleteWorkshop);

module.exports = router;