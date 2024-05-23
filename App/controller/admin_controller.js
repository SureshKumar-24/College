const Admin = require('../model/admin_model');
const University_type = require('../model/university_type_model');
const University = require('../model/university_model');
const Admission = require("../model/admission_model");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const Student = require('../model/student_model');
const Staff = require('../model/staff_model');
const Announcement = require('../model/annouce_model');
const Event = require('../model/event_model');
const News = require('../model/news_model');
const { validationResult } = require("express-validator");
require("dotenv").config();
const mongoose = require('mongoose');

module.exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, status: 422, errors: errors.array() });
    }
    try {
        const { username, email, password, confirm_password } = req.body;
        let isUniqueUsername = await Admin.findOne({
            username: { $eq: username },
            $or: [
                {
                    email: { $ne: email },
                },
            ],
        });
        if (isUniqueUsername) {
            return res
                .status(400)
                .json({ success: true, status: 200, msg: "Username already exists" });
        }

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res
                .status(400)
                .json({ msg: "User with this email already exists" });
        } else {
            if (password == confirm_password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                const newAdmin = new Admin({
                    username,
                    email,
                    password: hashedPassword,
                });
                await newAdmin.save();
                return res.status(200).json({ success: true, status: 200, msg: "Admin Saved Successfully" });
            } else {
                return res.status(400).json({ success: false, status: 400, msg: "Password doen't match properly" });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.adminLogin = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email }, '_id username email profilePicture password role');;
        console.log('admin', admin);
        if (!admin) {
            return res.status(400).json({ success: false, status: 400, msg: "Admin not found" });
        }

        const matchPassword = await bcrypt.compare(password, admin.password);

        if (!matchPassword) {
            return res.status(400).json({ success: false, status: 400, msg: "Password doesn't match" });
        }

        // Check if the role is Admin
        if (admin.role == 'Admin') {
            const payload = {
                id: admin._id,
                email: admin.email
            };
            const token = JWT.sign(payload, process.env.JWT_KEY, { expiresIn: '10d' });
            const admindata = await Admin.findOne({ email }, '_id username email profilePicture ');
            return res.status(200).json({
                success: true,
                status: 200,
                msg: "Admin Login",
                user: admindata,
                token: token
            });
        } else {
            return res.status(400).json({ success: false, status: 400, msg: "You are not authorized to log in as Admin" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.superAdminLogin = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const superAdmin = await Admin.findOne({ email });

        if (!superAdmin) {
            return res.status(400).json({ success: false, status: 400, msg: "SuperAdmin not found" });
        }

        const matchPassword = await bcrypt.compare(password, superAdmin.password);

        if (!matchPassword) {
            return res.status(400).json({ success: false, status: 400, msg: "Password doesn't match" });
        }

        // Check if the role is SuperAdmin
        if (superAdmin.role == 'SuperAdmin') {
            const payload = {
                id: superAdmin._id,
                email: superAdmin.email
            };
            const token = JWT.sign(payload, process.env.JWT_KEY, { expiresIn: '10d' });
            const superAdmindata = await Admin.findOne({ email }, '_id username email profilePicture ');
            return res.status(200).json({
                success: true,
                status: 200,
                msg: "SuperAdmin Login",
                user: superAdmindata,
                token: token
            });
        } else {
            return res.status(400).json({ success: false, status: 400, msg: "You are not authorized to log in as SuperAdmin" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.university_type = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    try {
        const typeNames = req.body.university_type;
        const uni_type = await University_type.findOne({ typeNames });
        if (uni_type) {
            return res.status(400).json({ success: false, status: 400, msg: "University Type Already Exist" });
        } else {
            const newUniversity_type = new University_type({
                typeNames
            });
            await newUniversity_type.save();
            return res.status(200).json({ success: true, status: 200, msg: "University Type Saved Successfully", newUniversity_type });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getunivserity_type = async (req, res) => {
    try {
        const getunivserity_type = await University_type.find({}, 'typeNames');
        return res.status(200).json({ success: true, status: 200, msg: "University Type", getunivserity_type });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getDashboard = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.findOne({ business_email: email });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: "University not found" });
        }

        const Status = "active";

        const totalAnnouncementDocuments = await Announcement.find({ university: university._id });
        const totalAnnouncement = totalAnnouncementDocuments.length;

        const activeAnnouncementDocuments = await Announcement.find({ university: university._id, status: Status });
        const activeAnnouncement = activeAnnouncementDocuments.length;

        const totalNewsDocuments = await News.find({ university: university._id });
        const totalNews = totalNewsDocuments.length;

        const activeNewsDocuments = await News.find({ university: university._id, status: Status });
        const activeNews = activeNewsDocuments.length;

        const totalEventDocuments = await Event.find({ university: university._id });
        const totalEvent = totalEventDocuments.length;

        const activeEventDocuments = await Event.find({ university: university._id, status: Status });
        const activeEvent = activeEventDocuments.length;

        const totalStudentDocuments = await Student.find({ university: university._id, status: Status });
        const totalStudent = totalStudentDocuments.length;

        const totalStaffDocuments = await Staff.find({ university: university._id, status: Status });
        const totalStaff = totalStaffDocuments.length;
        const response = {
            totalAnnouncement,
            activeAnnouncement,
            totalNews,
            activeNews,
            totalEvent,
            activeEvent,
            totalStudent,
            totalStaff
        };

        return res.status(200).json({ success: true, status: 200, data: response });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

//Admin Admission List
module.exports.getAdmissionList = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;
        // Create a filter object to build the search query
        let filter = { university: university[0]._id };
        if (searchValue) {
            // Define the search criteria for each field with case-insensitive search
            filter.$or = [
                { RequestId: { $regex: searchValue, $options: 'i' } },
                { "student.studentId": { $regex: searchValue, $options: 'i' } },
                { "studyLevels.study_name": { $regex: searchValue, $options: 'i' } },
                { "courses.course_name": { $regex: searchValue, $options: 'i' } }
            ];
        }
        const totalCountQuery = Admission.find(filter).countDocuments();
        const Admissiondata = await Admission.aggregate([
            {
                $lookup: {
                    from: "students",
                    localField: "student",
                    foreignField: "_id",
                    as: "student"
                },
            },
            {
                $lookup: {
                    from: "studylevels",
                    localField: "studyLevels",
                    foreignField: "_id",
                    as: "studyLevels"
                },
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseTypes",
                    foreignField: "_id",
                    as: "courses"
                },
            },
            {
                $match: filter
            },
            {
                $project: {
                    RequestId: 1,
                    status: 1,
                    "student.studentId": 1,
                    "student.firstName": 1,
                    "student.lastName": 1,
                    "studyLevels.study_name": 1,
                    "courses.course_name": 1
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
        return res.status(200).json({ success: true, status: 200, msg: "Event Data Successfully", data: Admissiondata, count: totalCount });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getoneAdmission = async (req, res) => {
    try {
        const id = req.query.id;
        const Admissiondata = await Admission.findById(id).select('-university -createdAt -updatedAt -__v')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id')
            .populate({
                path: 'student',
                select: '-password -modify -isOnline -otp -role -expire_at -createdBy -lastLoginTime -billingAddress -university -__v', // Exclude password, online, and modify fields
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' },
                    { path: 'semester', select: 'semesterNumber _id' }
                ]
            });
            
        if (!Admissiondata) {
            return res.status(400).json({ success: false, status: 400, msg: "Admission doesn't exist" })
        }
        return res.status(200).json({ success: true, status: 200, msg: "Admission Get Successfully", data: Admissiondata });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}