const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const path = require('path');
const upload = require("../helper/multer");
const Verifytoken = require('../helper/verify_token');
const University = require('../controller/university_controller');
const Student = require('../controller/student_controller');

router.post('/register/university', upload.fields([
    { name: 'profile-img', maxCount: 1 },
    { name: 'valid-id', maxCount: 1 }]
), University.Univ);
router.post('/detail/university', Verifytoken.verify, Verifytoken.SuperAdmin, University.getOneUniversity);
router.get('/university', Verifytoken.verify, Verifytoken.SuperAdmin, University.getUniversitiesByStatus);
router.post('/university/action', Verifytoken.verify, Verifytoken.SuperAdmin, University.updateUniversityStatus);
router.get('/university/name', University.getUniversitiesName);
router.get('/university/studentAll', Verifytoken.verify, Verifytoken.Admin, University.getStudentData);
router.delete('/university/student/delete', Verifytoken.verify, Verifytoken.Admin, University.deleteStudent);
router.post('/university/student/update', Verifytoken.verify, Verifytoken.Admin, University.studentUpdate);
router.post('/univesity/student/status', Verifytoken.verify, Verifytoken.Admin, University.statusUpdate);
router.get('/university/student/getone', Verifytoken.verify, Verifytoken.Admin, Student.getOneStudent);

module.exports = router;