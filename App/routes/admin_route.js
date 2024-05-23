const express = require('express');
const { body } = require('express-validator');
const Admin = require('../controller/admin_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');

const registerValidationRules = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('username').isString().withMessage('Name is required'),
    body('password', 'Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number').notEmpty().isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }),
    body('confirm_password', 'Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number').notEmpty().isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }),
]
router.post('/register', registerValidationRules, Admin.register);
router.post('/super/admin/login', Admin.superAdminLogin);
router.post('/admin/login', Admin.adminLogin);
router.post('/university_type', Verifytoken.verify, Verifytoken.SuperAdmin, Admin.university_type);
router.get('/university_type', Admin.getunivserity_type);
router.get('/university/dashboard', Verifytoken.verify, Verifytoken.Admin, Admin.getDashboard);
router.get('/univesity/admission/list', Verifytoken.verify, Admin.getAdmissionList);
router.get('/univesity/admission/one', Verifytoken.verify, Admin.getoneAdmission);
module.exports = router;
