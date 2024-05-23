const express = require('express');
const { body } = require('express-validator');
const News = require('../controller/news_controller');
const Student = require('../controller/student_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");


router.get('/news/get', Verifytoken.verify, News.getNews);
router.get('/news/one', Verifytoken.verify, News.getNewsById);
router.get('/news/latest', Verifytoken.verify, News.getLatestNews);
router.get('/news/search', Verifytoken.verify, News.searchNews);
router.post('/news/category/register', Verifytoken.verify, Verifytoken.SuperAdmin, News.createCategory);

router.post('/university/news/create', Verifytoken.verify, upload.single("media-img"), News.createNews);
router.get('/news/category', News.getNewsCategory);

router.get('/university/news/get', Verifytoken.verify, Verifytoken.Admin, News.getallNews);
router.get('/university/news/one', Verifytoken.verify, Verifytoken.Admin, News.getoneNews);
router.post('/university/news/update', Verifytoken.verify, Verifytoken.Admin, upload.single("media-img"), News.updateNews);
router.post('/univesity/news/status', Verifytoken.verify, Verifytoken.Admin, News.statusUpdate);
router.delete('/university/news/delete', Verifytoken.verify, Verifytoken.Admin, News.deleteNews);

module.exports = router;