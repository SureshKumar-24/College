const { Resource, PastPaper, Topic, TopicList } = require('../model/resource_model');
const Category = require('../model/category_model');
const Sub_Category = require('../model/category_sub_model');
const University = require('../model/university_model');
const Staff = require('../model/staff_model');
const Student = require('../model/student_model');
const mongoose = require('mongoose');
const imageUploadAws = require('../helper/imageUpload');
const validateMongodbId = require('../helper/verify_mongoId');
const Notification = require('../model/notification_model');

//-----------------------------------------------Category---------------------------------------------//
//Category Models 
module.exports.addCategory = async (req, res) => {
    try {
        const { category_name, studyLevels, courseTypes, resourceType } = req.body;
        const emailId = req.user.email;
        const university = await University.findOne({ business_email: emailId });
        const category = new Category({
            category_name,
            studyLevels: studyLevels,
            courseTypes: courseTypes,
            university: university._id,
            resourceType
        });
        await category.save();
        return res.status(200).json({ success: true, status: 200, msg: "Category Created Successfully", data: category });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//Edit Category
module.exports.GetallCategory = async (req, res) => {
    try {
        const emailId = req.user.email;
        const resourceType = req.query.resourceType;
        console.log('resource---', resourceType);
        const university = await University.findOne({ business_email: emailId });
        const GetallCategory = await Category.find({ university: university._id, resourceType: resourceType })
            .select('_id category_name')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id')
            .sort({ createdAt: -1 });
        if (GetallCategory == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Category doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Category Get Successfully", data: GetallCategory });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//Delete Category 
module.exports.deleteCategory = async (req, res) => {
    const { id } = req.query;
    try {
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(400).json({ success: false, status: 400, msg: "Category doesn't exist" });
        }
        await Sub_Category.deleteMany({ Category: deletedCategory._id });

        return res.status(200).json({ success: true, status: 200, msg: "Category Deleted" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
};
//Update Category
module.exports.updateCategory = async (req, res) => {
    try {
        const { id, category_name, studyLevels, courseTypes } = req.body;
        // Create an empty object to hold the fields that will be updated
        const updateFields = {};

        if (category_name) updateFields.category_name = category_name;
        if (studyLevels) updateFields.studyLevels = studyLevels;
        if (courseTypes) updateFields.courseTypes = courseTypes;

        // Use findByIdAndUpdate to find and update the event item by its ID
        const updatedCategory = await Category.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ success: false, status: 404, msg: 'Category not found' });
        }
        return res.status(200).json({ success: true, status: 200, msg: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//find one category
module.exports.findoneCategory = async (req, res) => {
    try {
        const { id } = req.query;
        try {
            validateMongodbId(id);
        } catch (error) {
            return res.status(400).json({ success: false, status: 400, msg: 'Invalid Category ID' });
        }
        const oneCategorydata = await Category.findById(id).select('_id category_name')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id');

        if (!oneCategorydata) {
            return res.status(400).json({ success: false, status: 400, msg: 'Category not exist' });
        }

        return res.status(200).json({ success: true, status: 200, msg: 'Get Category Reterive', data: oneCategorydata });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//-------------------------------------------Sub-Category----------------------------------------------//
//SubCategory 
module.exports.addSubCategory = async (req, res) => {
    try {
        let { sub_category_names, id } = req.body;

        // Ensure sub_category_names is an array
        if (!Array.isArray(sub_category_names)) {
            // Convert to an array with a single element
            sub_category_names = [sub_category_names];
        }

        // Use insertMany to insert multiple sub-categories
        const subCategories = sub_category_names.map(sub_category_name => ({
            sub_category_name,
            Category: id,
        }));
        const insertedSubCategories = await Sub_Category.insertMany(subCategories);

        return res.status(200).json({ success: true, status: 200, msg: "Sub_Categories Created Successfully", data: insertedSubCategories });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

//Find all the SubCategory
module.exports.findSubCategory = async (req, res) => {
    try {
        const { id } = req.query;
        const findSubCategory = await Sub_Category.find({ Category: id }).select('_id sub_category_name Category')
            .populate('Category', 'category_name _id')
            .sort({ createdAt: -1 });
        if (findSubCategory == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Sub-Category doesn't exist" });
        }
        return res.status(200).json({ success: true, status: 200, msg: "SubCategory Retrieve Successfully", data: findSubCategory })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//Delete Sub-Category
module.exports.deleteSubCategory = async (req, res) => {
    const { id } = req.query;
    try {
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const deleteSubCategory = await Sub_Category.findByIdAndDelete(id);
        if (deleteSubCategory == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Sub-Category doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Sub-Category Deleted" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//Edit Sub-Category=
module.exports.editSubCategory = async (req, res) => {
    try {
        const { id, name } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const updateSubCategory = await Sub_Category.findByIdAndUpdate(id, { sub_category_name: name }, { new: true });

        if (!updateSubCategory) {
            return res.status(400).json({ success: true, status: 400, msg: "Sub-Category doesn't exist" })
        }

        return res.status(200).json({ success: true, status: 200, msg: "Subcategory Updated Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.msg });
    }
}
//-------------------------------------------Add-Academic Resource----------------------------------------------//
module.exports.findCategoryforResource = async (req, res) => {
    try {
        const { studyLevels, courseTypes, resourceType } = req.body;
        const GetCategory = await Category.find({ studyLevels: studyLevels, courseTypes: courseTypes, resourceType: resourceType }).select('_id category_name resourceType');
        if (!GetCategory) {
            return res.status(400).json({ success: false, status: 400, msg: "Category doesn't exist for studylevel and courseTypes" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Get All Category Success", data: GetCategory });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.addResource = async (req, res) => {
    try {
        const { category_id, sub_category_id, studyLevels, title, courseTypes, name, resourceType, filearray } = req.body;
        const emailId = req.user.email;
        console.log('filearray', filearray);
        console.log('filearray', filearray.file);
        let studyLeveldata = [];
        let courseTypedata = [];
        let subcategoryTypedata = [];

        const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);
        const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);
        const subcategory = sub_category_id.split(',').map(id => id.trim()).filter(Boolean);

        if (studyLevelArray.length === 0 || courseArray.length === 0) {
            return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
        }

        studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
        courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        subcategoryTypedata = subcategory.map(id => new mongoose.Types.ObjectId(id));

        let urls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                let imageObj = await imageUploadAws(req.files[i], "univ-connect-profile", "resources");

                if (!imageObj.error) {
                    urls.push(imageObj.uploadData?.Location);
                } else {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        msg: 'Image upload error',
                        error: imageObj.error
                    });
                }
            }
        }

        console.log('Filearray', filearray);

        if (urls.length > 0 && name && name.length === urls.length) {
            for (let i = 0; i < urls.length; i++) {
                filearray.push({
                    file: urls[i],
                    name: name[i]
                });
            }
        } else if (urls.length === 1 && name) {
            // Single file and name case
            filearray.push({
                file: urls[0],
                name: name
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                msg: 'Invalid file and name data',
            });
        }

        // Generate Id
        const prefix = 'RS-';
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const currentMonth = new Date().getMonth() + 1;
        const resId = `${prefix}${randomDigits}${currentMonth}`;

        const Staffdata = await Staff.findOne({ email: emailId });
        if (!Staffdata) {
            const university = await University.findOne({
                business_email: emailId
            });

            if (!university) {
                return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
            }

            const Resources = new Resource({
                ID: resId,
                title: title,
                category: category_id,
                sub_category: subcategoryTypedata,
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
                resourceType: resourceType,
                res: filearray
            });

            await Resources.save();
            return res.status(200).json({ success: true, status: 200, msg: "Resources Created Successfully", data: Resources });
        }
        //Make with staff id
        const Resources = new Resource({
            ID: resId,
            title: title,
            category: category_id,
            sub_category: subcategoryTypedata,
            studyLevels: studyLeveldata,
            courseTypes: courseTypedata,
            resourceType: resourceType,
            res: filearray,
            university: Staffdata.university,
            createdBy: Staffdata._id
        });

        // await Resources.save();
        return res.status(200).json({ success: true, status: 200, msg: "Sub_Category Created Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

//----------------------------------------Student Resource-------------------------------------------------------//
module.exports.getResourceByStudent = async (req, res) => {
    try {
        let { resourceType } = req.query;
        console.log(resourceType);
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevels = studentdata.studyLevel;
            filter.courseTypes = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }
        // Create a query object for finding workshops
        const query = {
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
            resourceType: resourceType,
        };

        const Resourcedata = await Resource.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'sub_category'
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    _id: 1,
                    ID: 1,
                    title: 1,
                    "category.category_name": 1,
                    "sub_category.sub_category_name": 1,
                    res: 1
                }
            }
        ])

        // Transform the response to show only file and name properties in the res array

        return res.status(200).json({ success: true, status: 200, msg: `${resourceType} retrieved successfully`, data: Resourcedata });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getSearchResourceByStudent = async (req, res) => {
    try {
        let { resourceType, value } = req.query;
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevels = studentdata.studyLevel;
            filter.courseTypes = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }
        // Create a query object for finding workshops
        const query = {
            resourceType: resourceType,
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
            status: "active"
        };
        if (value) {
            query.$or = [
                { title: { $regex: value, $options: 'i' } },
                { "category.category_name": { $regex: value, $options: 'i' } }, // Case-insensitive search for newsTitle
                { "sub_category.sub_category_name": { $regex: value, $options: 'i' } },
            ];
        }
        const Resourcedata = await Resource.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'sub_category'
                }
            },
            {
                $match: query
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    _id: 1,
                    ID: 1,
                    title: 1,
                    "category.category_name": 1,
                    "sub_category.sub_category_name": 1,
                    res: 1
                }
            }
        ])
        // Transform the response to show only file and name properties in the res array
        const transformedData = Resourcedata.map(resource => ({
            _id: resource._id,
            ID: resource.ID,
            title: resource.title,
            category: resource.category,
            sub_category: resource.sub_category,
            res: resource.res.map(item => ({
                file: item.file,
                name: item.name,
            })),
        }));

        resourceType = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);

        return res.status(200).json({ success: true, status: 200, msg: `${resourceType} retrieved successfully`, data: transformedData });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

//----------------------------------------Admin Side-------------------------------------------------------//
module.exports.getallResource = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue, resourceType } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;
        let filter = { university: university[0]._id, resourceType: resourceType };

        if (searchValue) {
            filter.$or = [
                { ID: { $regex: searchValue, $options: 'i' } },
                { title: { $regex: searchValue, $options: 'i' } },
                { "category.category_name": { $regex: searchValue, $options: 'i' } }, // Case-insensitive search for newsTitle
                { "sub_category.sub_category_name": { $regex: searchValue, $options: 'i' } },
            ];
        };

        const totalCountQuery = Resource.find(filter).countDocuments();
        const Resourcedata = await Resource.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'sub_category'
                }
            },
            {
                $match: filter
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    _id: 1,
                    ID: 1,
                    title: 1,
                    "category.category_name": 1,
                    "sub_category.sub_category_name": 1,
                    status: 1,
                    res: 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ])
        // Transform the response to show only file and name properties in the res array
        // console.log('resourcedata', Resourcedata);

        const totalCount = await totalCountQuery;
        resourceType = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
        return res.status(200).json({ success: true, status: 200, msg: `${resourceType} retrieved successfully`, data: Resourcedata, count: totalCount });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.statusUpdate = async (req, res) => {
    try {
        const { id, status } = req.body;

        // Check that the studentStatus is either 'active' or 'inactive'
        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Status. It should be 'active' or 'inactive'." });
        }

        // Find the student by ID
        const resourceStatus = await Resource.findById(id);

        if (!resourceStatus) {
            return res.status(404).json({ success: false, status: 404, msg: "Resource not found" });
        }

        // Check if the requested status is the same as the current status
        if (status === resourceStatus.status) {
            return res.status(400).json({ success: false, status: 400, msg: `Resource is already ${status}` });
        }
        // Define the update query
        const updateQuery = { _id: id };
        // Define the update fields
        const updateFields = { status: status };

        // Use findOneAndUpdate to update the student's status
        const updatedResource = await Resource.findOneAndUpdate(updateQuery, updateFields, { new: true });

        return res.status(200).json({ success: true, status: 200, msg: 'Resource status updated successfully', data: updatedResource });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.updateResource = async (req, res) => {
    try {
        const { id, title, studyLevels, courseTypes, name, category_id, sub_category_id } = req.body;

        // Create an empty object to hold the fields that will be updated
        const updateFields = {};


        let studyLeveldata;
        let courseTypedata;
        let subcategoryTypedata;

        if (studyLevels) {
            const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);

            // Check if studyLevelArray is not empty
            if (studyLevelArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Study levels cannot be empty' });
            }

            studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
        }
        // Check if courseTypes is defined and not empty
        if (courseTypes) {
            const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);

            // Check if courseArray is not empty
            if (courseArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Course types cannot be empty' });
            }

            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        }

        // Check if sub_category_id is defined and not empty
        if (sub_category_id) {
            const subcategory = sub_category_id.split(',').map(id => id.trim()).filter(Boolean);

            // Check if subcategory is not empty
            if (subcategory.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Subcategories cannot be empty' });
            }

            subcategoryTypedata = subcategory.map(id => new mongoose.Types.ObjectId(id));
        }

        let urls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                let imageObj = await imageUploadAws(req.files[i], "univ-connect-profile", "resources");

                if (!imageObj.error) {
                    urls.push(imageObj.uploadData?.Location);
                } else {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        msg: 'Image upload error',
                        error: imageObj.error
                    });
                }
            }
        }

        let filearray = [];

        if (urls.length > 0 && name && name.length === urls.length) {
            for (let i = 0; i < urls.length; i++) {
                filearray.push({
                    file: urls[i],
                    name: name[i]
                });
            }
        } else if (urls.length === 1 && name) {
            // Single file and name case
            filearray.push({
                file: urls[0],
                name: name
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                msg: 'Invalid file and name data',
            });
        }
        // Check if each field is present in the request body and add it to the updateFields object if it is
        if (title) updateFields.title = title;
        if (studyLeveldata) updateFields.studyLevels = studyLeveldata;
        if (courseTypedata) updateFields.courseTypes = courseTypedata;
        if (subcategoryTypedata) updateFields.sub_category = subcategoryTypedata;
        if (category_id) updateFields.category = category_id;
        // Use findByIdAndUpdate to find and update the event item by its ID
        const updatedResource = await Resource.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedResource) {
            return res.status(404).json({ success: false, status: 404, msg: 'Resource not found' });
        }
        return res.status(200).json({ success: true, status: 200, msg: 'Resource updated successfully', data: updatedResource });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.resourcegetone = async (req, res) => {
    try {
        const id = req.query.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const email = req.user.email;
        const university = await University.findOne({ business_email: email });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: "University not found" });
        }

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            university: university._id,
        };

        const Resourcedata = await Resource.findOne(filter)
            .select('_id title res')
            .populate('category', 'category_name _id')
            .populate('sub_category', 'sub_category_name _id')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id');

        if (!Resourcedata) {
            return res.status(404).json({ success: false, status: 404, msg: "Resource not found" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Get One Resource Successfully", data: Resourcedata });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteresource = async (req, res) => {
    try {
        const resource_id = req.query.resourceId;
        const id = req.query.id;
        if (!mongoose.isValidObjectId(resource_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const updatedResource = await Resource.findOneAndUpdate(
            { _id: id, "res._id": resource_id },
            { $pull: { res: { _id: resource_id } } },
            { new: true }
        );
        if (!updatedResource) {
            return res.status(400).json({ success: false, status: 400, msg: "No resource Found" })
        }
        return res.status(200).json({ success: true, status: 200, msg: "Delete Resource Successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.resourceStudentgetone = async (req, res) => {
    try {
        const id = req.query.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const filter = {
            _id: new mongoose.Types.ObjectId(id),
        };

        const Resourcedata = await Resource.findOne(filter)
            .select('_id title res')
            .populate([
                { path: 'category', select: 'category_name _id' },
                { path: 'sub_category', select: 'sub_category_name _id' }
            ]);

        if (!Resourcedata) {
            return res.status(404).json({ success: false, status: 404, msg: "Resource not found" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Get One Resource Successfully", data: Resourcedata });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
//PastPaper Api Side
module.exports.AddPastPaperTopic = async (req, res) => {
    try {
        const { studyid, courseid, semesterid, subjectid, topicname } = req.body;

        // Validate IDs
        if (
            !mongoose.isValidObjectId(studyid) ||
            !mongoose.isValidObjectId(courseid) ||
            !mongoose.isValidObjectId(semesterid) ||
            !mongoose.isValidObjectId(subjectid)
        ) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const existingTopic = await Topic.findOne({
            topicname: topicname,
            subject: subjectid,
        });

        if (existingTopic) {
            return res.status(400).json({ success: false, status: 400, msg: "Topic Name can't Same" });
        }
        // Create and save a new Topic
        const addTopic = new Topic({
            topicname: topicname,
            subject: subjectid,
        });
        await addTopic.save();

        const existingTopicList = await TopicList.findOne({
            semester: semesterid,
            subject: subjectid,
            studyLevels: studyid,
            courseTypes: courseid,
        });

        if (existingTopicList) {
            // If exists, do not create a new TopicList
            return res.status(200).json({ success: true, status: 200, msg: "Topic added successfully" });
        }

        // Create and save a new TopicList
        const addTopicList = new TopicList({
            semester: semesterid,
            subject: subjectid,
            studyLevels: studyid,
            courseTypes: courseid,
        });
        await addTopicList.save();

        return res.status(201).json({ success: true, status: 201, msg: "Topic added successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", error: error.message });
    }
};

module.exports.getTopicList = async (req, res) => {
    try {
        const { subjectid, semesterid } = req.query;
        let filter = {};

        if (semesterid) {
            console.log('hello');
            if (!mongoose.isValidObjectId(semesterid)) {
                return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
            }
            filter.semester = semesterid;

        } else {
            if (!mongoose.isValidObjectId(subjectid)) {
                return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
            }
            filter.subject = subjectid;
        }
        console.log('filter', filter);
        const TopicFind = await TopicList.find(filter)
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id')
            .populate('subject', 'subject_name _id');

        if (!TopicFind || TopicFind.length === 0) {
            return res.status(404).json({ success: false, status: 404, msg: "Topics not found" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Topics retrieved successfully", data: TopicFind });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getTopic = async (req, res) => {
    try {
        const { subjectid } = req.query;
        if (!mongoose.isValidObjectId(subjectid)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const TopicFind = await Topic.find({ subject: subjectid }).select('topicname');

        if (!TopicFind || TopicFind.length === 0) {
            return res.status(404).json({ success: false, status: 404, msg: "Topics not found" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Topics retrieved successfully", data: TopicFind });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.updateTopic = async (req, res) => {
    try {
        const { topicid, topicname } = req.body;

        if (!mongoose.isValidObjectId(topicid)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const TopicFind = await Topic.findByIdAndUpdate(topicid, { topicname: topicname }, { new: true });
        if (!TopicFind) {
            return res.status(400).json({ success: true, status: 400, msg: "Topic can't doesn't exist" });
        }
        return res.status(200).json({ success: true, status: 200, msg: "Update Topic", data: TopicFind });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.deleteTopic = async (req, res) => {
    try {
        const topicid = req.query.topicid;

        if (!mongoose.isValidObjectId(topicid)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const TopicFind = await Topic.findByIdAndDelete(topicid);
        if (!TopicFind) {
            return res.status(400).json({ success: true, status: 400, msg: "Topic can't doesn't exist" });
        }
        return res.status(200).json({ success: true, status: 200, msg: "Delete Topic Success" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.addPastPaperResource = async (req, res) => {
    try {
        const { semester, subject, studyLevels, title, courseTypes, name, topic } = req.body;
        console.log(semester, subject, studyLevels, title, courseTypes, name, topic);
        const emailId = req.user.email;

        let studyLeveldata = [];
        let courseTypedata = [];

        const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);
        const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);


        if (studyLevelArray.length === 0 || courseArray.length === 0) {
            return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
        }

        studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
        courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));

        let urls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                let imageObj = await imageUploadAws(req.files[i], "univ-connect-profile", "resources");

                if (!imageObj.error) {
                    urls.push(imageObj.uploadData?.Location);
                } else {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        msg: 'Image upload error',
                        error: imageObj.error
                    });
                }
            }
        }

        let filearray = [];

        if (urls.length > 0 && name && name.length === urls.length) {
            for (let i = 0; i < urls.length; i++) {
                filearray.push({
                    file: urls[i],
                    name: name[i]
                });
            }
        } else if (urls.length === 1 && name) {
            // Single file and name case
            filearray.push({
                file: urls[0],
                name: name
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                msg: 'Invalid file and name data',
            });
        }

        // Generate Id
        const prefix = 'RS-';
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const currentMonth = new Date().getMonth() + 1;
        const resId = `${prefix}${randomDigits}${currentMonth}`;

        const Staffdata = await Staff.findOne({ email: emailId });
        if (!Staffdata) {
            const university = await University.findOne({
                business_email: emailId
            });

            if (!university) {
                return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
            }

            const ResourcesPastPaper = new PastPaper({
                ID: resId,
                title,
                semester,
                subject,
                topic,
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
                res: filearray
            });

            await ResourcesPastPaper.save();
            return res.status(200).json({ success: true, status: 200, msg: "Resources PastPaper Created Successfully", data: ResourcesPastPaper });
        }
        //Make with staff id
        const Resources = new Resource({
            ID: resId,
            title,
            semester,
            subject,
            topic,
            studyLevels: studyLeveldata,
            courseTypes: courseTypedata,
            res: filearray,
            university: Staffdata.university,
            createdBy: Staffdata._id
        });
        // await Resources.save();
        return res.status(200).json({ success: true, status: 200, msg: "Sub_Category Created Successfully", data: Resources });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getallPastPaperResource = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue, resourceType } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;
        let filter = { university: university[0]._id, resourceType: "pastpaper" };

        if (searchValue) {
            filter.$or = [
                { ID: { $regex: searchValue, $options: 'i' } },
                { title: { $regex: searchValue, $options: 'i' } },
                { "topic.topicname": { $regex: searchValue, $options: 'i' } }, // Case-insensitive search for newsTitle
                { "semester.subject_name": { $regex: searchValue, $options: 'i' } },
                { "subject.subject_name": { $regex: searchValue, $options: 'i' } },
            ];
        };

        const totalCountQuery = PastPaper.find(filter).countDocuments();
        const Resourcedata = await PastPaper.aggregate([
            {
                $lookup: {
                    from: 'topics',
                    localField: 'topic',
                    foreignField: '_id',
                    as: 'topic'
                }
            },
            {
                $lookup: {
                    from: 'semesters',
                    localField: 'semester',
                    foreignField: '_id',
                    as: 'semester'
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subject'
                }
            },
            {
                $lookup: {
                    from: 'studylevels',
                    localField: 'studyLevels',
                    foreignField: '_id',
                    as: 'studyLevel'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseTypes',
                    foreignField: '_id',
                    as: 'courseTypes'
                }
            },
            {
                $match: filter
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    _id: 1,
                    ID: 1,
                    title: 1,
                    "topic.topicname": 1,
                    "semester.semesterNumber": 1,
                    "subject.subject_name": 1,
                    "studyLevel.study_name": 1,
                    "courseTypes.course_name": 1,
                    status: 1,
                    res: 1,
                    createdBy: 1,
                    resourceType: 1,
                    university: 1,
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const totalCount = await totalCountQuery;
        return res.status(200).json({ success: true, status: 200, msg: `PastPaper retrieved successfully`, data: Resourcedata, count: totalCount });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.PastPapergetone = async (req, res) => {
    try {
        const id = req.query.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const email = req.user.email;
        const university = await University.findOne({ business_email: email });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: "University not found" });
        }

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            university: university._id,
        };

        const Resourcedata = await PastPaper.findOne(filter)
            .select('_id title res')
            .populate('topic', 'topicname _id')
            .populate('semester', 'semesterNumber _id')
            .populate('subject', 'subject_name _id')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id');

        if (!Resourcedata) {
            return res.status(404).json({ success: false, status: 404, msg: "Resource not found" });
        }

        return res.status(200).json({ success: true, status: 200, msg: "Get One PastPaper Resource Successfully", data: Resourcedata });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};