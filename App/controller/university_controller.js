const Admin = require("../model/admin_model");
const University = require("../model/university_model");
const Student = require("../model/student_model");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
let imageUploadAws = require("../helper/imageUpload");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nickm2878@gmail.com",
    pass: "kdmgpvsgvcdqzica",
  },
});

module.exports.Univ = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ success: false, status: 400, msg: "Image not Provided" });
    }

    let profile_img = "";
    let valid_id = "";
    if (req.files) {
      console.log("files", req.files);
      let imageObj = await imageUploadAws(req.files["profile-img"], "univ-connect-profile", "university-profile");
      let imageObj1 = await imageUploadAws(req.files["valid-id"], "univ-connect-profile", "university-profile");
      if (!imageObj.error) {
        profile_img = imageObj.uploadData?.Location;
      } else {
        return res.status(400).json({ error: imageObj.error });
      }
      if (!imageObj1.error) {
        valid_id = imageObj1.uploadData?.Location;
      } else {
        return res.status(400).json({ error: imageObj1.error });
      }
    }

    const {
      university_type,
      university_name,
      founded,
      country,
      state,
      city,
      pincode,
      business_email,
      password,
      confirm_password,
      total_courses,
      total_students,
      total_staff,
      firstname,
      lastname,
      email,
      position,
      contact,
    } = req.body;
    const contact_person = [{ firstname, lastname, email, position, contact, valid_id: valid_id }];
    console.log("persone", contact_person);
    const university_address = [{ country, state, city, pincode }];
    console.log("univaddres", university_address);
    if (password == confirm_password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUniversity = new University({
        university_logo: profile_img,
        university_type,
        university_name,
        founded,
        university_address: university_address,
        business_email,
        password: hashedPassword,
        total_courses,
        total_students,
        total_staff,
        contact_person: contact_person,
      });
      await newUniversity.save();
      return res.status(200).json({ success: true, status: 200, msg: "University Enroll Successfully" });
    } else {
      return res.status(403).json({ success: false, status: 403, msg: "Password doen't match properly" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getOneUniversity = async (req, res) => {
  try {
    const id = req.body.id;
    const univesitydetail = await University.findById(id).select("-password -studyLevels -__v");

    if (univesitydetail) {
      return res.status(200).json({ success: true, status: 200, msg: "University Detail get Successfully", data: univesitydetail });
    } else {
      return res.status(400).json({ success: false, status: 400, msg: "Something Wrong" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getUniversitiesByStatus = async (req, res) => {
  try {
    // Pagination parameters from URL params
    let { page, limit, value } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    let query = {}; // Initialize an empty query object

    // Check if value is provided and not empty
    if (value && value.trim() !== "") {
      query["$or"] = [
        { university_type: { $regex: value, $options: "i" } },
        { university_name: { $regex: value, $options: "i" } },
        {
          university_address: {
            $elemMatch: {
              city: { $regex: value, $options: "i" },
            },
          },
        },
        { business_email: { $regex: value, $options: "i" } },
        { status: { $regex: value, $options: "i" } },
      ];
    }

    console.log(query, "query for search");

    // Find universities based on the query
    const universities = await University.find(query).sort({ createdAt: -1 }).select("-password -studyLevels -__v").skip(skip).limit(limit);

    // Count universities that match the query
    const count = await University.countDocuments(query);

    if (universities.length > 0) {
      return res.status(200).json({
        success: true,
        status: 200,
        msg: "All universities retrieved successfully",
        data: universities,
        count: count, // Add the count to the response
      });
    } else {
      return res.status(404).json({
        success: false,
        status: 400,
        msg: "No universities found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.updateUniversityStatus = async (req, res) => {
  try {
    const id = req.body._id;
    const status = req.body.status;
    // Find the university by business_email
    const university = await University.findById(id);

    if (!university) {
      return res.status(404).json({ success: false, status: 400, msg: "University not found with the specified business_email" });
    }

    // Send email notification if the status is updated to "Accepted"
    if (status === "Accepted") {
      university.accountStatus = "Active";
      university.status = "Accepted";
      await university.save();
      await transporter.sendMail({
        to: university.business_email,
        from: "UnivConnect <nickm2878@gmail.com>",
        subject: "Verified Successfully",
        html: `
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f1f1f1;
                            }
                            
                            .container {
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #fff;
                                border-radius: 8px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }
                            
                            h1 {
                                text-align: center;
                                color: #333;
                            }
                            
                            p {
                                margin-bottom: 20px;
                                line-height: 1.5;
                                color: #555;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Verified Successfully</h1>
                            <p>Hello,</p>
                            <p>UnivConnect Superadmin has verified the university details. You can now log in using your business email and password.</p>
                            <p><a href="http://3.82.201.156:3000/admin/login">Log In</a></p>
                            <p>If you did not request this verification, please ignore this email.</p>
                            <p>Best regards,<br>Your UnivConnect Team</p>
                            <p>Thank you for joining UnivConnect. We're excited to have you as part of our community. If you have any questions or need assistance, feel free to contact us at support@univconnect.com.</p>
                        </div>
                    </body>
                    </html>
                `,
      });
    } else if (status === "Rejected") {
      university.status = "Rejected";
      await university.save();
      await transporter.sendMail({
        to: university.business_email,
        from: "UnivConnect <nickm2878@gmail.com>",
        subject: "University Request Rejected",
        html: `
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f1f1f1;
                            }
                            
                            .container {
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #fff;
                                border-radius: 8px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }
                            
                            h1 {
                                text-align: center;
                                color: #333;
                            }
                            
                            p {
                                margin-bottom: 20px;
                                line-height: 1.5;
                                color: #555;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>University Request Rejected</h1>
                            <p>Hello,</p>
                            <p>Your university request has been rejected by UnivConnect Superadmin.</p>
                            <p>If you believe this is in error or need further assistance, please contact us at support@univconnect.com.</p>
                            <p>Best regards,<br>Your UnivConnect Team</p>
                        </div>
                    </body>
                    </html>
                `,
      });
      return res.status(200).json({ success: true, status: 200, msg: "University Request Reject successfully", university });
    }

    // Query the Admin collection based on business_email
    const existingAdmin = await Admin.findOne({ $or: [{ email: university.business_email }, { username: university.university_name }] });

    if (existingAdmin) {
      return res.status(400).json({ msg: "User with this email or name already exists" });
    } else {
      const newAdmin = new Admin({
        username: university.university_name,
        email: university.business_email,
        password: university.password,
        profilePicture: university.university_logo,
      });
      await newAdmin.save();
    }
    return res.status(200).json({ success: true, status: 200, msg: "University Request Accepted successfully", university });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getUniversitiesName = async (req, res) => {
  try {
    const universities = await University.find({ status: "Accepted" }, "university_name university_logo");

    if (universities.length > 0) {
      return res.status(200).json({ success: true, status: 200, msg: "University names retrieved successfully", universities });
    } else {
      return res.status(404).json({ msg: "No universities found with Accepted status" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getStudentData = async (req, res) => {
  try {
    let { page, limit, searchValue } = req.query;
    const email = req.user.email;
    const university = await University.find({ business_email: email }).select("business_email");
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Create a filter object to build the search query
    const filter = {
      university: new mongoose.Types.ObjectId(university[0]._id),
    };

    if (searchValue) {
      // Define the search criteria for each field with case-insensitive search
      filter.$or = [
        { firstName: { $regex: searchValue, $options: "i" } },
        { lastName: { $regex: searchValue, $options: "i" } },
        { email: { $regex: searchValue, $options: "i" } },
        { status: { $regex: searchValue, $options: "i" } },
        { "studyLevelInfo.study_name": { $regex: searchValue, $options: "i" } },
        { "courseEnrolledInfo.course_name": { $regex: searchValue, $options: "i" } },
      ];
    }
    const totalCountQuery = Student.find(filter).countDocuments();
    // Aggregate pipeline to fetch student data with studyLevel and course information
    const students = await Student.aggregate([
      {
        $lookup: {
          from: "studylevels",
          localField: "studyLevel",
          foreignField: "_id",
          as: "studyLevelInfo",
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseEnrolled",
          foreignField: "_id",
          as: "courseEnrolledInfo",
        },
      },
      { $unwind: "$courseEnrolledInfo" },
      {
        $match: filter, // Apply the filter criteria
      },
      {
        $sort: {
          createdAt: -1, // Sort by date field in descending order (latest first)
        },
      },
      {
        $project: {
          studentId: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          status: 1,
          yearOfStudy: 1,
          expectedGraduationDate: 1,
          lastLoginTime: 1,
          "studyLevelInfo.study_name": 1,
          "courseEnrolledInfo.course_name": 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    const totalCount = await totalCountQuery;
    return res.status(200).json({ success: true, status: 200, msg: "Student Data fetch Successfully", data: students, count: totalCount });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.deleteStudent = async (req, res) => {
  const id = req.body.id;
  try {
    const deleteStudent = await Student.findByIdAndDelete(id);
    if (deleteStudent == null) {
      return res.status(400).json({ success: false, status: 400, msg: "Student doesn't exist" });
    } else {
      return res.status(200).json({ success: true, status: 200, msg: "Student Delete Successfully" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.studentUpdate = async (req, res) => {
  try {
    const { id, firstName, lastName, email, studyLevel, courseEnrolled, phoneNumber, yearOfStudy, expectedGraduationDate } = req.body;

    // Create an object to store the fields that need to be updated
    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (studyLevel) updateFields.studyLevel = studyLevel;
    if (courseEnrolled) updateFields.courseEnrolled = courseEnrolled;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (yearOfStudy) updateFields.yearOfStudy = yearOfStudy;
    if (expectedGraduationDate) updateFields.expectedGraduationDate = expectedGraduationDate;

    // Use the id to find and update the student record
    const updatedStudent = await Student.findOneAndUpdate({ _id: id }, updateFields, { new: true });

    if (!updatedStudent) {
      return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
    }

    return res.status(200).json({ success: true, status: 200, msg: "Student updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.statusUpdate = async (req, res) => {
  try {
    const { id, studentStatus } = req.body;

    // Check that the studentStatus is either 'active' or 'inactive'
    if (studentStatus !== "active" && studentStatus !== "inactive") {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid studentStatus. It should be 'active' or 'inactive'." });
    }

    // Find the student by ID
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
    }

    // Check if the requested status is the same as the current status
    if (studentStatus === student.status) {
      return res.status(400).json({ success: false, status: 400, msg: `Student is already ${studentStatus}` });
    }

    // Define the update query
    const updateQuery = { _id: id };

    // Define the update fields
    const updateFields = { status: studentStatus };

    // Use findOneAndUpdate to update the student's status
    const updatedStudent = await Student.findOneAndUpdate(updateQuery, updateFields, { new: true });

    return res.status(200).json({ success: true, status: 200, msg: "Student status updated successfully", data: updatedStudent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.searchStudent = async (req, res) => {
  try {
    const email = req.user.email;
    const university = await University.find({ business_email: email }).select("business_email");
    // Create a base query for filtering

    // Get the search value from the query parameters
    const value = req.query.value;

    // If a value is provided, add the search conditions
    if (value) {
      searchQuery.$or = [
        { studentId: { $regex: value, $options: "i" } },
        { firstName: { $regex: value, $options: "i" } }, // Case-insensitive search for newsTitle
        { lastName: { $regex: value, $options: "i" } },
        { email: { $regex: value, $options: "i" } }, // Case-insensitive search for date
        { yearOfStudy: { $regex: value, $options: "i" } },
        { status: { $regex: value, $options: "i" } },
        { lastLoginTime: { $regex: value, $options: "i" } },
      ];
    }
    // Use the searchQuery and sorting options to query the News model
    const filteredNews = await News.find(searchQuery).select("_id categoryname newsTitle newsDescription date media").sort(sortOption);

    // Convert ObjectIDs to strings

    return res.status(200).json({ success: true, status: 200, msg: "News Get successfully", news: filteredNews });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};
