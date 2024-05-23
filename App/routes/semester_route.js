const express = require('express');
const { body } = require('express-validator');
const Subject = require('../controller/semester_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');

router.post('/university/semester/add', Verifytoken.verify, Subject.addSemester);
router.get('/university/semester/all', Verifytoken.verify, Subject.getAllSemesterList);
router.delete('/university/semester/delete', Verifytoken.verify, Subject.deleteAllSemester);
router.get('/university/semester/edit/all', Verifytoken.verify, Subject.EditSemester);
router.post('/university/semester/list', Verifytoken.verify, Subject.EditSingleSemester);
//For Subject Page
router.get('/universtiy/semester/get', Verifytoken.verify, Subject.getAllSemesteronSubject);
router.post('/university/subject/add', Verifytoken.verify, Subject.addSubject);
router.get('/university/semester/list', Verifytoken.verify, Subject.getAllSubjectListing);
router.get('/university/subject/get', Verifytoken.verify, Subject.getAllSubject);
router.delete('/university/subject/delete', Verifytoken.verify, Subject.deleteSubject);
router.post('/univesity/subject/update', Verifytoken.verify, Subject.updateSubject);
module.exports = router;