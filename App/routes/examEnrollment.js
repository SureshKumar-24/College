const Router = require("express").Router();
const examEnrollmentController = require("../controller/exam_enrollment");
const Verifytoken = require("../helper/verify_token");

Router.post("/university/exam/enroll", Verifytoken.verify, Verifytoken.Admin, examEnrollmentController.addExam);
Router.post("/university/exam/data", Verifytoken.verify, Verifytoken.Admin, examEnrollmentController.addExamUpper);
Router.get("/university/exam/get", Verifytoken.verify, Verifytoken.Admin, examEnrollmentController.getExams);

module.exports = Router;
