const express = require('express');
const { body } = require('express-validator');
const Resource = require('../controller/resource_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

//-------------------------------Academic-----------------------------------------//
//Academic Resource Category
router.post('/university/academic/category', Verifytoken.verify, Resource.addCategory);
router.get('/university/academic/get', Verifytoken.verify, Resource.GetallCategory);
router.delete('/university/academic/delete', Verifytoken.verify, Resource.deleteCategory);
router.post('/university/academic/update', Verifytoken.verify, Resource.updateCategory);
router.get('/university/category/getone', Verifytoken.verify, Resource.findoneCategory);
//Academic SubCategory 
router.post('/university/academic/subcategory', Verifytoken.verify, Resource.addSubCategory);
router.get('/university/academic/subcategory/get', Verifytoken.verify, Resource.findSubCategory);
router.post('/university/subcategory/update', Verifytoken.verify, Resource.editSubCategory);
router.delete('/university/academic/subcategory/delete', Verifytoken.verify, Resource.deleteSubCategory);
//Add academic Admin
router.post('/university/resource/category/get', Verifytoken.verify, Resource.findCategoryforResource);
router.post('/university/resource/add', Verifytoken.verify, upload.array("media", 5), Resource.addResource);
router.get('/university/resource/all', Verifytoken.verify, Verifytoken.Admin, Resource.getallResource);
router.post('/univesity/resource/status', Verifytoken.verify, Verifytoken.Admin, Resource.statusUpdate);
router.get('/university/resource/get/one', Verifytoken.verify, Verifytoken.Admin, Resource.resourcegetone);
router.post('/university/resource/update', Verifytoken.verify, Verifytoken.Admin, upload.array("media", 5), Resource.updateResource);
router.post('/university/resource/file/delete', Verifytoken.verify, Verifytoken.Admin, Resource.deleteresource);
//--------------------------------Library-------------------------------------------//
//Library Category
router.post('/university/library/category', Verifytoken.verify, Resource.addCategory);
router.get('/university/library/get', Verifytoken.verify, Resource.GetallCategory);
router.delete('/university/library/delete', Verifytoken.verify, Resource.deleteCategory);
router.post('/university/library/update', Verifytoken.verify, Resource.updateCategory);
//Library SubCategory 
router.post('/university/library/subcategory', Verifytoken.verify, Resource.addSubCategory);
router.get('/university/library/subcategory/get', Verifytoken.verify, Resource.findSubCategory);
router.delete('/university/library/subcategory/delete', Verifytoken.verify, Resource.deleteSubCategory);

//-------------------------------PastPaper-----------------------------------------//
//PastPaper
router.get('/university/pastpaper/get', Verifytoken.verify, Resource.getallPastPaperResource);
router.get('/university/pastpaper/getone', Verifytoken.verify, Resource.PastPapergetone);
router.post('/university/pastpaper/add', Verifytoken.verify, upload.array("media", 5), Resource.addPastPaperResource);
router.post('/university/pastpaper/topic', Verifytoken.verify, Resource.AddPastPaperTopic);
router.get('/university/pastpaper/topic/get', Verifytoken.verify, Resource.getTopic);
router.get('/university/pastpaper/topic/list', Verifytoken.verify, Resource.getTopicList);
router.delete('/university/pastpaper/topic/delete', Verifytoken.verify, Resource.deleteTopic);
router.post('/university/pastpaper/topic/update', Verifytoken.verify, Resource.updateTopic);
//PastPaper SubCategory 
// router.post('/university/pastpaper/subcategory', Verifytoken.verify, Resource.addSubCategory);
// router.get('/university/pastpaper/subcategory/get', Verifytoken.verify, Resource.findSubCategory);
// router.delete('/university/pastpaper/subcategory/delete', Verifytoken.verify, Resource.deleteSubCategory);

//---------------------------------------Student Get All resources---------------------------//
router.get('/student/academic/get', Verifytoken.verify, Resource.getResourceByStudent);
router.get('/student/resource/search', Verifytoken.verify, Resource.getSearchResourceByStudent);
router.get('/student/resource/get/one', Verifytoken.verify, Resource.resourceStudentgetone);
module.exports = router;