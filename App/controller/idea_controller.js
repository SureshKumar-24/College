const imageUploadAws = require('../helper/imageUpload');
const Student = require('../model/student_model');
const mongoose = require('mongoose');
const { Idea, Community, CommunityCategory } = require('../model/idea_model');
const University = require('../model/university_model');
const { validationResult } = require("express-validator");

//Add Post Idea
module.exports.addPost = async (req, res) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(422).json({ success: false, status: 422, errors: errors.array() });
    // }
    try {
        const id = req.user.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const { title, description } = req.body;
        const studentdata = await Student.findById(id);
        let url = "";

        if (req.file) {
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "idea-corner");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        };

        const postidea = new Idea({
            title,
            description,
            file: url,
            university: studentdata.university,
            postby: id
        });
        await postidea.save();

        return res.status(200).json({ success: true, status: 200, msg: "Post Idea Successfully", data: postidea });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: true, status: 500, msg: "Internal Server Error", error: error.msg });
    }
}

//Get Idea Post By User
module.exports.getPost = async (req, res) => {
    try {
        const id = req.user.id;
        const userPosts = await Idea.find({ postby: id })
            .sort({ createdAt: 'desc' })
            .select('-createdAt -updatedAt  -__v')
            .exec();

        if (userPosts.length === 0) {
            return res.status(200).json({ success: true, status: 200, posts: null });
        }

        return res.status(200).json({ success: true, status: 200, posts: userPosts });
    } catch (error) {
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.message });
    }
}

//Update Post by user
module.exports.updatePost = async (req, res) => {
    try {
        const { id, title, description } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }
        let url = "";

        if (req.file) {
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "idea-corner");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        };

        let filter = {};
        if (title) filter.title = title;
        if (description) filter.description = description;
        if (url) filter.file = url;

        const updatePost = await Idea.findByIdAndUpdate(id, filter, { new: true });

        if (!updatePost) {
            return res.status(400).json({ success: false, status: 400, msg: "Post doen't exist" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Update Post Successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.msg });
    }
}

//Delete Post by user
module.exports.deletePost = async (req, res) => {
    const { id } = req.query;
    try {
        const deletePost = await Idea.findByIdAndDelete(id);
        if (deletePost == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Post doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Post Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

//Public Post by other student 
module.exports.getPostPublic = async (req, res) => {
    try {
        const id = req.user.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const studentdata = await Student.findById(id);

        const findPost = await Idea.find({
            university: studentdata.university,
            postby: { $ne: studentdata._id } // Exclude posts by the current user
        })
            .sort({ createdAt: 'desc' })
            .select('-createdAt -updatedAt -__v -university')
            .populate({
                path: 'postby',
                select: 'firstName lastName studyLevel profilePicture',
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            })
            .populate({
                path: 'comments.commenter',
                select: 'firstName lastName studyLevel courseEnrolled profilePicture', // Include commenter information
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            })
            .exec();

        // Manually sort comments in descending order by createdAt
        findPost.forEach(post => {
            if (post.comments && post.comments.length > 1) {
                post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                post.comments = post.comments.slice(0, 1); // Keep only the latest comment
            }
        });


        return res.status(200).json({ success: true, status: 200, msg: "Get all Idea", data: findPost });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
}

//Add comment on Post
module.exports.addCommentOnPost = async (req, res) => {
    try {
        const id = req.user.id;
        const { postid, comment } = req.body;

        const findPost = await Idea.findById(postid);
        findPost.comments.push({ commenter: id, text: comment });
        await findPost.save();

        return res.status(200).json({ success: true, status: 200, msg: "Comment Post Successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.message });
    }
}

//Show all comments
module.exports.getComments = async (req, res) => {
    try {
        const id = req.user.id;
        const postid = req.query.postid;
        if (!mongoose.isValidObjectId(postid)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const studentdata = await Student.findById(id);

        const findComments = await Idea.find({
            _id: postid,
            university: studentdata.university,
            commenter: { $ne: studentdata._id } // Exclude comments by the current user
        })
            .sort({ createdAt: 'desc' })
            .select('-_id -createdAt -updatedAt -__v -university')
            .populate({
                path: 'comments.commenter',
                select: 'firstName lastName studyLevel courseEnrolled profilePicture',
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            })
            .populate({
                path: 'comments',
                options: {
                    select: '-_id -createdAt',  // Exclude _id and createdAt from comments
                    sort: { createdAt: -1 } // Sort comments by createdAt in descending order
                },
            })
            .exec();

        return res.status(200).json({ success: true, status: 200, msg: "Get all comments", data: findComments });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
}

//---------------------------------------------------- Community-Category ----------------------------//

//Add category for community 
module.exports.addCategoryCommunity = async (req, res) => {
    try {
        const emailId = req.user.email;
        const Category = req.body.Category;

        const university = await University.findOne({
            business_email: emailId
        });

        if (!university) {
            return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
        }
        const community = new CommunityCategory({
            category_name: Category,
            university: university._id
        });
        await community.save();
        return res.status(201).json({ success: true, status: 201, msg: "Category Add Succesfully", data: community });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
};

//Show all the Category for community
module.exports.findallCategory = async (req, res) => {
    try {
        const emailId = req.user.email;

        console.log('emailid', emailId);

        const university = await University.findOne({
            business_email: emailId
        });
        console.log('university', university._id);
        const communitydata = await CommunityCategory.find({ university: university._id }).select('category_name');

        if (!communitydata) {
            return res.status(400).json({ success: false, status: 400, msg: "Category Community doesn't exist" });
        }
        return res.status(200).json({ success: true, status: 200, msg: "Get Community Category Successfully", data: communitydata });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
};

//Update the Category for Community
module.exports.updateCategory = async (req, res) => {
    try {
        const { id, Category } = req.body;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Id" });
        }

        const updateCategory = await CommunityCategory.findByIdAndUpdate(id, { category_name: Category }, { new: true });

        if (!updateCategory) {
            return res.status(400).json({ success: false, status: 400, msg: "Category Community doesn't exist" })
        }
        return res.status(200).json({ success: true, status: 200, msg: "Category Updated Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
};

//Delete the Category for Community
module.exports.deleteCommunity = async (req, res) => {
    try {
        const { id } = req.query;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Id" });
        }

        const deleteCategory = await CommunityCategory.findByIdAndDelete(id);

        if (deleteCategory == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Category doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Category  Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

//----------------------------------------------------Community----------------------------//

//Student Get community category
module.exports.getCommunityStudent = async (req, res) => {
    try {
        const id = req.user.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const studentdata = await Student.findById(id);

        const community = await CommunityCategory.find({ university: studentdata.university }).select('category_name');

        return res.status(200).json({ success: true, status: 200, msg: "Community get all Successfully", data: community });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

//Add Community Post
module.exports.addCommunityPost = async (req, res) => {
    try {
        const id = req.user.id;
        const { title, description, categoryid } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const studentdata = await Student.findById(id);
        let url = "";

        if (req.file) {
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "community");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        };

        const postcommunity = new Community({
            title,
            description,
            file: url,
            university: studentdata.university,
            postby: id,
            category: categoryid
        });
        await postcommunity.save();

        return res.status(200).json({ success: true, status: 200, msg: "Post Community Successfully", data: postcommunity });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

//Get All Community Post by User
module.exports.getCommunityPost = async (req, res) => {
    try {
        const id = req.user.id;
        const userPosts = await Community.find({ postby: id })
            .sort({ createdAt: 'desc' })
            .populate('category', 'category_name')
            .select('-createdAt -updatedAt  -__v -postby -university')
            .exec();

        if (userPosts.length === 0) {
            return res.status(200).json({ success: true, status: 200, posts: null });
        }

        return res.status(200).json({ success: true, status: 200, posts: userPosts });
    } catch (error) {
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.message });
    }
}

//update Community Post
module.exports.updateCommunityPost = async (req, res) => {
    try {
        const { id, title, description, categoryid } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }
        let url = "";

        if (req.file) {
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "community");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        };

        let filter = {};
        if (title) filter.title = title;
        if (description) filter.description = description;
        if (url) filter.file = url;
        if (categoryid) filter.category = categoryid;

        const updatePost = await Community.findByIdAndUpdate(id, filter, { new: true });

        if (!updatePost) {
            return res.status(400).json({ success: false, status: 400, msg: "Post doen't exist" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Update Post Successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.msg });
    }
}

//Delete Community Post
module.exports.deleteCommunityPost = async (req, res) => {
    try {
        const { id } = req.query;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Id" });
        }
        const deletePost = await Community.findByIdAndDelete(id);
        if (deletePost == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Post doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Post Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

//Get Community Post 
module.exports.getCommunityPostPublic = async (req, res) => {
    try {
        const id = req.user.id;
        const categoryid = req.query.categoryid;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const studentdata = await Student.findById(id);
        const query = {
            university: studentdata.university,
            postby: { $ne: studentdata._id } // Exclude posts by the current user
        };

        if (categoryid) {
            query.category = categoryid;
        }
        const findPost = await Community.find(query)
            .populate('category', 'category_name')
            .sort({ createdAt: 'desc' })
            .select('-createdAt -updatedAt -__v -university')
            .populate({
                path: 'postby',
                select: 'firstName lastName studyLevel profilePicture',
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            })
            .populate({
                path: 'comments.commenter',
                select: 'firstName lastName studyLevel courseEnrolled profilePicture', // Include commenter information
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            })
            .exec();

        // Manually sort comments in descending order by createdAt
        findPost.forEach(post => {
            if (post.comments && post.comments.length > 1) {
                post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                post.comments = post.comments.slice(0, 1); // Keep only the latest comment
            }
        });


        return res.status(200).json({ success: true, status: 200, msg: "Get all Community", data: findPost });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
}

//Add comment on Post
module.exports.addCommentOnCommunityPost = async (req, res) => {
    try {
        const id = req.user.id;
        const { communityid, comment } = req.body;

        if (!mongoose.isValidObjectId(communityid)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Id" });
        }

        const findPost = await Community.findById(communityid);
        findPost.comments.push({ commenter: id, text: comment });
        await findPost.save();

        return res.status(200).json({ success: true, status: 200, msg: "Comment Post Successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.message });
    }
}

//Get comment on Post
module.exports.getCommentsCommunityPost = async (req, res) => {
    try {
        const id = req.user.id;
        const communityid = req.query.communityid;
        if (!mongoose.isValidObjectId(communityid)) {
            return res.status(400).json({ success: true, status: false, msg: "Invalid Id" });
        }

        const studentdata = await Student.findById(id);

        const findComments = await Community.find({
            _id: communityid,
            university: studentdata.university,
            commenter: { $ne: studentdata._id } // Exclude comments by the current user
        })
            .populate('category', 'category_name')
            .sort({ createdAt: 'desc' })
            .select('-_id -createdAt -updatedAt -__v -university')
            .populate({
                path: 'comments.commenter',
                select: 'firstName lastName studyLevel courseEnrolled profilePicture',
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            })
            .populate({
                path: 'comments',
                options: {
                    select: '-_id -createdAt',  // Exclude _id and createdAt from comments
                    sort: { createdAt: -1 } // Sort comments by createdAt in descending order
                },
            })
            .exec();

        return res.status(200).json({ success: true, status: 200, msg: "Get all comments", data: findComments });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
}