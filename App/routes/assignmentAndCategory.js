const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const assignAndDocControllers =require('../controller/assignmentAndCategory')


//-------------------------CATEGORIES----------------------------------------->>>>>
router.post('/univesity/category/document', Verifytoken.verify, Verifytoken.Admin, assignAndDocControllers.category);
router.get('/univesity/category/document', Verifytoken.verify, assignAndDocControllers.categoryList);
router.put('/univesity/category/document', Verifytoken.verify, Verifytoken.Admin, assignAndDocControllers.categoryupdate);
router.delete('/univesity/category/document/:id', Verifytoken.verify, Verifytoken.Admin, assignAndDocControllers.categorydelete);

//-------------------------VALIDATE DOCUMENT----------------------------------------->>>>>
router.post('/univesity/document', Verifytoken.verify, Verifytoken.Admin, assignAndDocControllers.validateDoc);
router.get('/univesity/document', Verifytoken.verify, assignAndDocControllers.docList);
router.get('/univesity/document/list', Verifytoken.verify, assignAndDocControllers.subAndCategoryLists);
module.exports=router;