const University = require('../model/university_model');
const Student = require('../model/student_model');
const Staff = require('../model/staff_model');
const Announcement = require('../model/annouce_model');
const Notification = require('../model/notification_model');
const moment = require('moment');
const { validationResult } = require("express-validator");

module.exports.createAnnoucement = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    try {
        const emailId = req.user.email;
        const {
            title, description, startDate, expiryDate, studyLevels, courseTypes,
        } = req.body;
        const targetAudienced = req.body.targetAudience || false;
        // Check if the university associated with the currently logged-in user's email exists
        const Staffdata = await Staff.findOne({ email: emailId });
        if (!Staffdata) {
            const university = await University.findOne({
                business_email: emailId
            });

            if (!university) {
                return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
            }

            // Generate the announcementId with "ANN" + 5 random digits + current month
            const prefix = 'ANN-';
            const randomDigits = Math.floor(10000 + Math.random() * 90000);
            const currentMonth = new Date().getMonth() + 1; // Note: Months are 0-based, so we add 1.
            const announcementId = `${prefix}${randomDigits}${currentMonth}`;

            const currentDate = new Date();
            const dateOfPost = moment(currentDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ"); // Format the date as required
            const formatDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
            const expiryDateStore = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            const formatStartDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
            const StartDateStore = moment(formatStartDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

            const newAnnouncement = new Announcement({
                announcementId,
                title,
                description,
                startDate: StartDateStore,
                expiryDate: expiryDateStore,
                dateOfPosting: dateOfPost,
                studyLevels,
                courseTypes,
                targetAudience: targetAudienced,
                university: university._id,
            });

            // Save the new announcement document to the database
            await newAnnouncement.save();
            const notificationData = new Notification({
                title: 'New Announcement: ' + title,
                body: 'Check out the latest announcement!',
                studyLevels,
                courseTypes,
                university: university._id,
            });
            await notificationData.save();

            return res.status(201).json({ success: true, status: 201, msg: 'Annoucement created successfully', data: newAnnouncement });
        }

        // For Staff accounts, use their university's information
        // Generate the announcementId with "ANN" + 5 random digits + current month
        const prefix = 'ANN-';
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const currentMonth = new Date().getMonth() + 1; // Note: Months are 0-based, so we add 1.
        const announcementId = `${prefix}${randomDigits}${currentMonth}`;

        // Capture the current date and time
        const newAnnouncement = new Announcement({
            announcementId,
            title,
            description,
            startDate,
            expiryDate,
            studyLevels,
            courseTypes,
            university: Staffdata.university,
            createdBy: Staffdata._id
        });

        // Save the new announcement document to the database
        await newAnnouncement.save();

        const notificationData = {
            title: 'New Announcement: ' + title,
            body: 'Check out the latest announcement!',
            studyLevels,
            courseTypes,
            university: Staffdata.university,
        };
        const Notifydata = new Notification(notificationData);
        await Notifydata.save();
        return res.status(201).json({ success: true, status: 201, msg: 'Annoucement created successfully', data: newAnnouncement });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.Announcementget = async (req, res) => {
    try {
        const email = req.user.email;
        console.log('emailbyadmin', email);
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        let filter = { university: university[0]._id };
        if (searchValue) {
            filter.$or = [
                { announcementId: { $regex: searchValue, $options: 'i' } },
                { title: { $regex: searchValue, $options: 'i' } },
                { description: { $regex: searchValue, $options: 'i' } },
                { status: { $regex: searchValue, $options: 'i' } },
                { action: { $regex: searchValue, $options: 'i' } },
                { "studyLevel.study_name": { $regex: searchValue, $options: 'i' } },
                { "course.course_name": { $regex: searchValue, $options: 'i' } },
            ];
        }

        const annoucedata = await Announcement.aggregate([
            {
                $match: filter // Apply the filter criteria
            },
            {
                $sort: {
                    dateOfPosting: -1 // Sort by date field in descending order (latest first)
                }
            },
            {
                $project: {
                    _id: 1,
                    announcementId: 1,
                    title: 1,
                    description: 1,
                    startDate: 1,
                    expiryDate: 1,
                    dateOfPosting: 1,
                    status: 1,
                    action: 1,
                    targetAudience: 1,
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const formattedData = annoucedata.map((announcement) => {
            return {
                ...announcement,
                startDate: moment(announcement.startDate).format('DD-MM-YYYY'),
                expiryDate: moment(announcement.expiryDate).format('DD-MM-YYYY'),
                dateOfPosting: moment(announcement.expiryDate).format('DD-MM-YYYY'),
            };
        });

        return res.status(200).json({ success: true, status: 200, msg: "Annoucement Data Successfully", data: formattedData });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAnnouncementById = async (req, res) => {
    try {
        const id = req.query.id; // Get the 'id' from the query parameters

        if (!id) {
            return res.status(400).json({ success: false, status: 400, msg: 'ID parameter is required' });
        }

        // Find the announcement based on the 'announcementId'
        const announcement = await Announcement.findById(id)
            .populate('studyLevels', 'study_name -_id')
            .populate('courseTypes', 'course_name -_id')
            .populate('createdBy', 'staffId')
            .sort('-createdAt');

        if (!announcement) {
            return res.status(404).json({ success: false, status: 404, msg: 'Announcement not found' });
        }

        // Format the date fields if needed
        const formattedAnnouncement = {
            ...announcement.toObject(),
            startDate: moment(announcement.startDate).format('DD-MM-YYYY'),
            expiryDate: moment(announcement.expiryDate).format('DD-MM-YYYY'),
            dateOfPosting: moment(announcement.dateOfPosting).format('DD-MM-YYYY'),
        };

        return res.status(200).json({ success: true, status: 200, msg: 'Announcement retrieved successfully', data: formattedAnnouncement });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteAnnouncement = async (req, res) => {
    const { id } = req.query; // Get the 'id' from the query parameters

    try {
        const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

        if (deletedAnnouncement === null) {
            return res.status(404).json({ success: false, status: 404, msg: "Announcement doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Announcement deleted" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.statusUpdate = async (req, res) => {
    try {
        const { id, announcementStatus } = req.body;

        // Check that the announcementStatus is either 'active' or 'inactive'
        if (announcementStatus !== 'active' && announcementStatus !== 'inactive') {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid announcementStatus. It should be 'active' or 'inactive'." });
        }

        // Find the announcement by ID
        const announcementData = await Announcement.findById(id);

        if (!announcementData) {
            return res.status(404).json({ success: false, status: 404, msg: "Announcement not found" });
        }

        // Check if the requested status is the same as the current status
        if (announcementStatus === announcementData.status) {
            return res.status(400).json({ success: false, status: 400, msg: `Announcement is already ${announcementStatus}` });
        }

        // Define the update query
        const updateQuery = { _id: id };

        // Define the update fields
        const updateFields = { status: announcementStatus };

        // Use findOneAndUpdate to update the announcement's status
        const updatedAnnouncement = await Announcement.findOneAndUpdate(updateQuery, updateFields, { new: true }).select('status');

        return res.status(200).json({ success: true, status: 200, msg: 'Announcement status updated successfully', data: updatedAnnouncement });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.annoucementAction = async (req, res) => {
    try {

        const id = req.body.id;
        const status = req.body.status;
        // Find the university by business_email
        const annoucement = await Announcement.findById(id);

        if (!annoucement) {
            return res.status(404).json({ success: false, status: 400, msg: "Annoucement Not Found" });
        }

        // Send email notification if the status is updated to "Accepted"
        if (status === "Accept") {
            annoucement.action = 'accept',
                annoucement.status = "active"
            await annoucement.save();
            return res.status(200).json({ success: true, status: 200, msg: "Annoucement Accept successfully" });
        } else if (status === "Reject") {
            annoucement.action = 'reject',
                annoucement.status = "inactive"
            await annoucement.save();
            return res.status(200).json({ success: true, status: 200, msg: "Annoucement Reject successfully" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.updateAnnouncement = async (req, res) => {
    try {
        const { id, title, description, startDate, expiryDate, studyLevels, courseTypes, targetAudience } = req.body;

        // Create an empty object to hold the fields that will be updated
        const updateFields = {};
        const formatDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
        const expiryDateStore = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        const formatStartDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
        const StartDateStore = moment(formatStartDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

        // Check if each field is present in the request body and add it to the updateFields object if it is
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (startDate) updateFields.startDate = StartDateStore;
        if (expiryDate) updateFields.expiryDate = expiryDateStore;
        if (studyLevels) updateFields.studyLevels = studyLevels;
        if (courseTypes) updateFields.courseTypes = courseTypes;
        if (targetAudience) updateFields.targetAudience = targetAudience;
        // Use findByIdAndUpdate to find and update the announcement by its ID
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedAnnouncement) {
            return res.status(404).json({ success: false, status: 404, msg: 'Announcement not found' });
        }

        return res.status(200).json({ success: true, status: 200, msg: 'Announcement updated successfully', data: updatedAnnouncement });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAnnouncementsByStudent = async (req, res) => {
    try {
        const email = req.user.email;
        console.log('email', email);
        const studentData = await Student.findOne({ email });
        console.log('studentData', studentData);
        // Create a base query for filtering
        const filter = {};

        if (studentData) {
            filter.studyLevels = studentData.studyLevel;
            filter.courseTypes = studentData.courseEnrolled;
            filter.university = studentData.university;
        }

        // Define the sorting order based on the query parameters
        let sortOption = { startDate: -1 }; // Default to sorting by start date in descending order (most recent announcements first)

        // Create a query object for finding announcements
        const query = {
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
        };

        const announcements = await Announcement.find(query)
            .select('_id announcementId title description startDate expiryDate dateOfPosting')
            .sort(sortOption);

        // Format the announcement dates before sending the response
        const formattedAnnouncements = announcements.map((announcement) => ({
            ...announcement.toObject(),
            startDate: moment(announcement.startDate).format('DD MMMM YYYY'),
            expiryDate: moment(announcement.expiryDate).format('DD MMMM YYYY'),
            dateOfPosting: moment(announcement.dateOfPosting).format('DD MMMM YYYY'),
        }));

        return res.status(200).json({ success: true, status: 200, msg: 'Announcements retrieved successfully', data: formattedAnnouncements });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAnnouncementByStudentOne = async (req, res) => {
    try {
        const id = req.query.id;
        const email = req.user.email;
        const studentData = await Student.findOne({ email });

        if (!studentData) {
            return res.status(404).json({ success: false, status: 404, msg: 'Student not found' });
        }

        const announcement = await Announcement.findOne({
            _id: id,
            studyLevels: studentData.studyLevel,
            university: studentData.university,
            courseTypes: studentData.courseEnrolled,
        }).select('_id announcementId title description startDate expiryDate dateOfPosting ');

        if (!announcement) {
            return res.status(404).json({ success: false, status: 404, msg: 'Announcement not found for the specified student' });
        }

        // Format the announcement dates before sending the response
        const formattedAnnouncement = {
            ...announcement.toObject(),
            startDate: moment(announcement.startDate).format('DD MMMM YYYY'),
            expiryDate: moment(announcement.expiryDate).format('DD MMMM YYYY'),
            dateOfPosting: moment(announcement.dateOfPosting).format('DD MMMM YYYY'),
        };

        return res.status(200).json({ success: true, status: 200, msg: 'Announcement retrieved successfully', data: formattedAnnouncement });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAnnouncementsByStudentSeach = async (req, res) => {
    try {
        const email = req.user.email;
        const value = req.query.value;
        const studentData = await Student.findOne({ email });

        // Create a base query for filtering
        const filter = {};

        if (studentData) {
            filter.studyLevels = studentData.studyLevel;
            filter.courseTypes = studentData.courseEnrolled;
            filter.university = studentData.university;
        }


        // Define the sorting order based on the query parameters
        let sortOption = { startDate: -1 }; // Default to sorting by start date in descending order (most recent announcements first)

        // If 'sort' is provided and set to "Oldest," sort in ascending order (oldest announcements first)

        // Create a query object for finding announcements
        const query = {
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
        };

        if (value) {
            query.$or = [
                { announcementId: { $regex: value, $options: 'i' } }, // Case-insensitive search for newsTitle
                { title: { $regex: value, $options: 'i' } },
            ];
        }

        const announcements = await Announcement.find(query)
            .select('_id announcementId title description startDate expiryDate dateOfPosting')
            .sort(sortOption);

        // Format the announcement dates before sending the response
        const formattedAnnouncements = announcements.map((announcement) => ({
            ...announcement.toObject(),
            startDate: moment(announcement.startDate).format('DD MMMM YYYY'),
            expiryDate: moment(announcement.expiryDate).format('DD MMMM YYYY'),
            dateOfPosting: moment(announcement.dateOfPosting).format('DD MMMM YYYY'),
        }));

        return res.status(200).json({ success: true, status: 200, msg: 'Announcements retrieved successfully', data: formattedAnnouncements });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getLatestAnnouncement = async (req, res) => {
    try {
        const email = req.user.email;
        const studentData = await Student.findOne({ email });

        // Create a base query for filtering
        const filter = {};

        if (studentData) {
            filter.studyLevels = studentData.studyLevel;
            filter.courseTypes = studentData.courseEnrolled;
            filter.university = studentData.university;
        }

        // Create a query object for finding the latest announcement
        const query = {
            ...filter,
        };

        const latestAnnouncement = await Announcement.findOne(query)
            .select('_id announcementId title description startDate expiryDate dateOfPosting')
            .sort({ startDate: -1 }) // Sort by startDate in descending order (most recent first)
            .limit(1); // Limit the result to one document

        if (!latestAnnouncement) {
            return res.status(404).json({ success: false, status: 404, msg: 'No announcements found' });
        }

        // Format the announcement dates before sending the response
        const formattedAnnouncement = {
            ...latestAnnouncement.toObject(),
            startDate: moment(latestAnnouncement.startDate).format('DD MMMM YYYY'),
            expiryDate: moment(latestAnnouncement.expiryDate).format('DD MMMM YYYY'),
            dateOfPosting: moment(latestAnnouncement.dateOfPosting).format('DD MMMM YYYY'),
        };

        return res.status(200).json({ success: true, status: 200, msg: 'Latest announcement retrieved successfully', data: formattedAnnouncement });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};






