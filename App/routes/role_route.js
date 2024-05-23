const express = require('express');
const { body } = require('express-validator');
const Role = require('../controller/role_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');

router.post('/university/department/register', Verifytoken.verify, Role.departmentregister);
router.get('/university/department/get', Verifytoken.verify, Role.getDepartment);
router.post('/university/role/register', Verifytoken.verify, Role.roleregister);
router.get('/university/role/get', Verifytoken.verify, Role.getrole);
module.exports = router;