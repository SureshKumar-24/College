const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");
const assignmentControllers=require('../controller/assignment');

router.post('/university/student/assignment', Verifytoken.verify, upload.single("file"),assignmentControllers.studentSubmit);
router.put('/university/student/re-submit', Verifytoken.verify, upload.single("file"),assignmentControllers.reSubmit);
router.get('/university/student/assignment/list', Verifytoken.verify,assignmentControllers.assignmentListing);
router.get('/university/teacher/assignment-submit/list', Verifytoken.verify,assignmentControllers.assignmentListing);
router.put('/university/teacher/assignment/check', Verifytoken.verify,assignmentControllers.checkAssignment);
module.exports=router;
