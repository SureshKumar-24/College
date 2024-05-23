const express = require('express');
const { body } = require('express-validator');
const Query = require('../controller/query_contoller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');

router.get('/student/query/get', Verifytoken.verify, Query.getStudentQuery);


router.post('/university/query/create', Verifytoken.verify, Query.QueryAdd);
router.post('/univesity/query/status', Verifytoken.verify, Verifytoken.Admin, Query.statusUpdate);
router.get('/university/query/get', Verifytoken.verify, Verifytoken.Admin, Query.getAdminQuery);
router.get('/univerity/query/one', Verifytoken.verify, Verifytoken.Admin, Query.resourcegetone);
router.post('/university/query/update', Verifytoken.verify, Verifytoken.Admin, Query.updateQuery);
router.delete('/university/query/delete', Verifytoken.verify, Verifytoken.Admin, Query.deleteQuery);
module.exports = router;