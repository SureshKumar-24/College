const Staff = require('../model/staff_model');
const Student = require('../model/student_model');
const bcrypt = require("bcrypt");
const University = require('../model/university_model');
const Admin = require('../model/admin_model');
const JWT = require("jsonwebtoken");
const imageUploadAws = require('../helper/imageUpload');
const moment = require('moment');
require("dotenv").config();

const mongoose = require('mongoose');
module.exports.createStaff = async (req, res) => {
    try {
        const emailid = req.user.email;
        const {
            firstName,
            lastName,
            email,
            department,
            role,
            accountType,
            accountExpiryDate,
            bio,
            password
        } = req.body;

        // Check if the email already exists
        const university = await University.findOne({
            business_email: emailid
        });

        // Check if a staff with the same email and belonging to the same university already exists
        const existingStaff = await Staff.findOne({ email, university: university._id });
        console.log('existingstaffff', existingStaff);
        if (existingStaff != null) {
            return res.status(400).json({ success: false, status: 400, msg: 'Staff with this email already exists at the same university' });
        } else {

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const Admindata = await Admin.findOne({ email: emailid });

            if (!req.file) {
                return res.status(400).json({ success: false, status: 400, msg: 'Profile Image not provided' });
            }

            let url = ""; // Initialize the URL variable

            if (req.file) {
                let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "staff-profile");
                if (!imageObj.error) {
                    url = imageObj.uploadData?.Location;
                } else {
                    return res.status(400).json({ error: imageObj.error });
                }
            }
            // Generate a random 5-digit number
            const randomDigits = Math.floor(10000 + Math.random() * 90000);

            // Create the modified firstName
            const staff_id = req.body.firstName.substring(0, 3).toUpperCase() + randomDigits;
            const newStaff = new Staff({
                staffId: staff_id,
                firstName,
                lastName,
                email,
                department: department,
                role,
                createdBy: Admindata.role,
                accountType,
                accountExpiryDate,
                profilePicture: url,
                bio,
                password: hashedPassword,
                university: university ? university._id : null, // Set the university reference based on the user's email
            });

            await newStaff.save();

            return res.status(201).json({ success: true, status: 201, msg: 'Staff created successfully', data: newStaff });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.staffLogin = async (req, res) => {
    try {
        const { email, password, univid } = req.body;
        const staffdata = await Staff.findOne({ email, university: univid });
        if (staffdata) {
            const matchPassword = await bcrypt.compare(password, staffdata.password);
            console.log('matchpassword', matchPassword);
            if (!matchPassword) {
                return res.status(400).json({ success: false, status: 400, msg: "Password doesn't match" });
            } else {
                const payload = {
                    id: staffdata._id,
                    email: staffdata.email
                }
                const token = JWT.sign( payload , process.env.JWT_KEY, { expiresIn: '10d' });
                const staff = await Staff.findOne({ email, university: univid }).select('_id email profilePicture ');
                return res.status(200).json({
                    success: true, status: 200,
                    msg: "Staff Login Successfully",
                    data: staff,
                    token: token,
                });
            }
        }
        else {
            return res.status(400).json({ success: false, status: 400, msg: "Staff is not found" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getOneStaff = async (req, res) => {
    try {
        const id = req.query.id; // Get the ID from the query string

        const staff = await Staff.findById(id)
            .select('-password');

        if (!staff) {
            return res.status(404).json({ success: false, status: 404, msg: "Student Doesn't Exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Student Data One", data: staff });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAllStaff = async (req, res) => {
    try {
        const id = req.user.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const Studentdata = await Student.findById(id);
        const Staffdata = await Staff.find({ university: Studentdata.university }).select('firstName lastName');
        return res.status(200).json({ success: true, status: 200, data: Staffdata });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: "Internal Server Error", data: error.msg })
    }
}
