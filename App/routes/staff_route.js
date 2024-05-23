const express = require('express');
const { body } = require('express-validator');
const Staff = require('../controller/staff_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

router.post('/university/register/staff', Verifytoken.verify, Verifytoken.Admin, upload.single("profile-img"), Staff.createStaff);
router.post('/university/staff/login', Staff.staffLogin);
router.get('/university/staff', Staff.getOneStaff);
router.get('/student/all/staff', Verifytoken.verify, Staff.getAllStaff);
module.exports = router;
