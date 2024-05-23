const express = require('express');
const { body } = require('express-validator');
const Idea = require('../controller/idea_controller');
const router = express.Router();
const Verifytoken = require('../helper/verify_token');
const upload = require("../helper/multer");

// const registerValidationRules = [
//     body('title').isString().withMessage('Title should be text only'),
//     body('description')
//         .isString().withMessage('Description should be text only')
//         .isLength({ min: 10, max: 1000 }).withMessage('Description should be between 10 and 500 words'),
// ];


router.post('/student/idea/add', Verifytoken.verify, upload.single("idea-img"), Idea.addPost);
router.get('/student/idea/getlist', Verifytoken.verify, Idea.getPost);
router.post('/student/idea/update', Verifytoken.verify, upload.single("idea-img"), Idea.updatePost);
router.delete('/student/idea/delete', Verifytoken.verify, Idea.deletePost);
//public access
router.get('/student/idea/public', Verifytoken.verify, Idea.getPostPublic);
router.post('/student/idea/comment', Verifytoken.verify, Idea.addCommentOnPost);
router.get('/student/idea/get/comment', Verifytoken.verify, Idea.getComments);

//------------------------------------------Community Category----------------------//
router.post('/univesrity/community/category/add', Verifytoken.verify, Verifytoken.Admin, Idea.addCategoryCommunity);
router.get('/univesrity/community/category/get', Verifytoken.verify, Verifytoken.Admin, Idea.findallCategory);
router.post('/univesrity/community/category/update', Verifytoken.verify, Verifytoken.Admin, Idea.updateCategory);
router.delete('/univesrity/community/category/delete', Verifytoken.verify, Verifytoken.Admin, Idea.deleteCommunity);

//------------------------------------------Community --------------------------------------//

router.get('/student/community/category/get', Verifytoken.verify, Idea.getCommunityStudent);
router.post('/student/community/add', Verifytoken.verify, upload.single("community-img"), Idea.addCommunityPost);
router.get('/student/community/getlist', Verifytoken.verify, Idea.getCommunityPost);
router.post('/student/community/update', Verifytoken.verify, upload.single("community-img"), Idea.updateCommunityPost);
router.delete('/student/community/delete', Verifytoken.verify, Idea.deleteCommunityPost);

//student community 
router.get('/student/community/public', Verifytoken.verify, Idea.getCommunityPostPublic);
router.post('/student/community/comment', Verifytoken.verify, Idea.addCommentOnCommunityPost);
router.get('/student/community/get/comment', Verifytoken.verify, Idea.getCommentsCommunityPost);

module.exports = router;