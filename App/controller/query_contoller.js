const moment = require('moment');
const University = require('../model/university_model');
const Student = require('../model/student_model');
const Staff = require('../model/staff_model');
const Notification = require('../model/notification_model');
const Query = require('../model/query_model');
const mongoose = require('mongoose');
module.exports.QueryAdd = async (req, res) => {
    try {

        const emailid = req.user.email; // Get the email of the currently logged-in user (Admin or Staff)
        const {
            title,
            studyLevels,
            courseTypes,
            link,
            type,
            description,
            expiryDate
        } = req.body;

        const targetAudienced = req.body.targetAudience || false;
        const formatDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
        const expiryDateStore = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        const currentDate = new Date();
        const DateStore = moment(currentDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        // Check if the university associated with the currently logged-in user's email exists
        const Staffdata = await Staff.findOne({ email: emailid });
        if (!Staffdata) {
            const university = await University.findOne({ business_email: emailid });

            if (!university) {
                return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
            }

            const newQuery = new Query({
                title,
                link,
                description,
                type,
                expiryDate: expiryDateStore,
                targetAudience: targetAudienced,
                studyLevels: studyLevels,
                courseTypes: courseTypes,
                university: university._id,
                publishDate: DateStore
            });

            await newQuery.save();
            const Notifydata = new Notification({
                title: 'New Query: ' + title,
                body: 'Check out the latest Query!',
                studyLevels: studyLevels,
                courseTypes: courseTypes,
                university: university._id
            });
            await Notifydata.save();
            return res.status(201).json({ success: true, status: 201, msg: 'Query created successfully', data: newQuery });
        }

        const newQuery = new Query({
            title,
            link,
            type,
            description,
            expiryDate: expiryDateStore,
            targetAudience: targetAudienced,
            studyLevels: studyLevels,
            courseTypes: courseTypes,
            university: Staffdata.university,
            createdBy: Staffdata._id,
            publishDate: DateStore
        });

        await newQuery.save();

        return res.status(201).json({ success: true, status: 201, msg: 'Query created successfully', data: newQuery });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getAdminQuery = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;
        let filter = { university: university[0]._id };

        if (searchValue) {
            filter.$or = [
                { title: { $regex: searchValue, $options: 'i' } },
                { description: { $regex: searchValue, $options: 'i' } },
            ];
        };

        const totalCountQuery = Query.find(filter).countDocuments();
        const queryData = await Query.aggregate([
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
                    title: 1,
                    description: 1,
                    status: 1,
                    link: 1,
                    type: 1,
                    expiryDate: 1,
                    targetAudience: 1,
                    createdBy: 1,
                    publishDate: 1,
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ])

        const Querydata = queryData.map((query) => {
            return {
                ...query,
                publishDate: moment(query.publishDate).format('DD-MM-YYYY'),
                expiryDate: moment(query.expiryDate).format('DD-MM-YYYY'),
            }
        });
        const totalCount = await totalCountQuery;
        return res.status(200).json({ success: true, status: 200, msg: `Query retrieved successfully`, data: Querydata, count: totalCount });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getStudentQuery = async (req, res) => {
    try {
        let { value } = req.query;
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevels = studentdata.studyLevel;
            filter.courseTypes = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }
        const status = "active";
        const searchQuery = {
            studyLevels: filter.studyLevel,
            university: filter.university,
            courseTypes: filter.courses,
            status: status
        };

        // If a value is provided, add the search conditions
        if (value) {
            searchQuery.$or = [
                { title: { $regex: value, $options: 'i' } }, // Case-insensitive search for newsTitle
                { categoryname: { $regex: value, $options: 'i' } }
            ];
        }
        const querydata = await Query.find(filter)
            .select('title description expiryDate link type expiryDate publishDate')
        const formattedquerydata = querydata.map((Query) => {
            return {
                ...Query._doc,
                expiryDate: moment(Query.expiryDate).format('DD-MM-YYYY'),
                publishDate: moment(Query.publishDate).format('DD-MM-YYYY')
            }
        });

        return res.status(200).json({ success: true, status: 200, msg: 'Query retrieved successfully', data: formattedquerydata });

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

        const Querydata = await Query.findOne(filter)
            .select('_id title description link type targetAudience publishDate expiryDate')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id');

        if (!Querydata) {
            return res.status(404).json({ success: false, status: 404, msg: "Query not found" });
        }
        const Querydataformat = {
            ...Querydata.toObject(),
            publishDate: moment(Querydata.startDate).format('DD-MM-YYYY'),
            expiryDate: moment(Querydata.expiryDate).format('DD-MM-YYYY'),
        };

        return res.status(200).json({ success: true, status: 200, msg: "Get One Query Successfully", data: Querydataformat });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.updateQuery = async (req, res) => {
    try {
        const { id, title, studyLevels, courseTypes, link, type, description, expiryDate } = req.body;
        const targetAudienced = req.body.targetAudience || false;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        // Create an empty object to hold the fields that will be updated
        const updateFields = {};
        let studyLeveldata;
        let courseTypedata;

        if (targetAudienced == 'false') {
            const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);
            const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);

            if (studyLevelArray.length === 0 || courseArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
            }
            // Convert studyLevel and courses IDs to mongoose Schema Types
            studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        }
        const formatexpiryDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
        const expiryDateStore = moment(formatexpiryDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

        // Check if each field is present in the request body and add it to the updateFields object if it is
        if (title) updateFields.title = title;
        if (expiryDateStore) updateFields.expiryDate = expiryDateStore;
        if (link) updateFields.link = link;
        if (type) updateFields.type = type;
        if (description) updateFields.description = description;
        if (studyLeveldata) updateFields.studyLevels = studyLeveldata;
        if (courseTypedata) updateFields.courseTypes = courseTypedata;
        // Use findByIdAndUpdate to find and update the event item by its ID
        const updatedQuery = await Query.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedQuery) {
            return res.status(404).json({ success: false, status: 404, msg: 'Query not found' });
        }
        return res.status(200).json({ success: true, status: 200, msg: 'Query updated successfully', data: updatedQuery });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.statusUpdate = async (req, res) => {
    try {
        const { id, status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        // Check that the studentStatus is either 'active' or 'inactive'
        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Status. It should be 'active' or 'inactive'." });
        }

        const queryStatus = await Query.findById(id);

        if (!queryStatus) {
            return res.status(404).json({ success: false, status: 404, msg: "Query not found" });
        }

        // Check if the requested status is the same as the current status
        if (status === queryStatus.status) {
            return res.status(400).json({ success: false, status: 400, msg: `Query is already ${status}` });
        }
        // Define the update query
        const updateQuery = { _id: id };
        // Define the update fields
        const updateFields = { status: status };

        // Use findOneAndUpdate to update the student's status
        const updatedQuery = await Query.findOneAndUpdate(updateQuery, updateFields, { new: true });

        return res.status(200).json({ success: true, status: 200, msg: 'Query status updated successfully', data: updatedQuery });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteQuery = async (req, res) => {
    try {
        const { id } = req.query;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const deleteQuery = await Query.findByIdAndDelete(id);
        if (deleteQuery == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Query doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Query Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};