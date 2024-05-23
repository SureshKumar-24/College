const express = require("express");
const { body } = require("express-validator");
const Student = require("../controller/student_controller");
const router = express.Router();
const Verifytoken = require("../helper/verify_token");
const upload = require("../helper/multer");
const udpatevaliationRules = [
  body("old_password", "Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number")
    .notEmpty()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
  body("new_password", "Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number")
    .notEmpty()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
  body("confirm_password", "Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number")
    .notEmpty()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
];

router.post("/register/student", Verifytoken.verify, Student.createStudent);
router.post("/student/login", Student.login);
router.get("/student/getdata", Verifytoken.verify, Student.getStudent);
router.post("/student/updatepass", Verifytoken.verify, Student.studentupdatepassword);
router.post("/student/forgot", Student.forgotpassword);
router.post("/student/verifyotp", Student.VerifyOtp);
router.post("/student/password-reset", Student.resetpassword);
router.post("/student/update-profile", Verifytoken.verify, upload.single("profile-img"), Student.updateProfile);
router.get("/student/get/studylevel", Verifytoken.verify, Student.getStudentStudyLevel);
router.get("/student/get/course", Verifytoken.verify, Student.getStudentCourse);
router.post("/student/add/admission", Verifytoken.verify, Student.studentacademicform);
router.get("/university/get/admission", Verifytoken.verify, Verifytoken.Admin, Student.getAdmissionlist);
router.post("/university/admission/update", Verifytoken.verify, Verifytoken.Admin, Student.statusUpdate);
router.get("/university/admission/one", Verifytoken.verify, Verifytoken.Admin, Student.getoneAdmission);

router.get("/student/friend/get", Verifytoken.verify, Student.studentfriend);
router.get("/student/chatListing", Verifytoken.verify, Student.chatListing);

module.exports = router;
