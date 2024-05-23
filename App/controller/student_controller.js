require("dotenv").config();
const Student = require("../model/student_model");
const University = require("../model/university_model");
const Staff = require("../model/staff_model");
const Admission = require("../model/admission_model");
const StudyLevel = require("../model/studylevel_model");
const Course = require("../model/course_model");
const Chat = require("../model/chat_model");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const JWT = require("jsonwebtoken");
const moment = require("moment");
const imageUploadAws = require("../helper/imageUpload");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nickm2878@gmail.com",
    pass: "kdmgpvsgvcdqzica",
  },
});
// Create a new student with university reference based on user's email
module.exports.createStudent = async (req, res) => {
  try {
    const emailid = req.user.email;
    const {
      firstName,
      lastName,
      email,
      studyLevel,
      courseEnrolled,
      phoneNumber,
      yearOfStudy,
      expectedGraduationDate,
      profilePicture,
      bio,
      password,
    } = req.body;

    // Check if the email already exists
    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      return res.status(400).json({ success: false, status: 400, msg: "Student with this email already exists" });
    }

    // Find the university document based on the user's email
    const Staffdata = await Staff.findOne({ email: emailid });
    if (!Staffdata) {
      // Handle the case when Staffdata is null (e.g., return an error response)
      const university = await University.findOne({
        business_email: emailid,
      });

      if (!university) {
        return res.status(400).json({ success: false, status: 400, msg: "University not found for the provided email" });
      }
      const studentId = generateStudentId(university.university_name, firstName);

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newStudent = new Student({
        studentId,
        firstName,
        lastName,
        email,
        studyLevel,
        courseEnrolled,
        phoneNumber,
        yearOfStudy,
        expectedGraduationDate,
        profilePicture,
        bio,
        password: hashedPassword,
        university: university._id,
      });

      await newStudent.save();

      return res.status(201).json({ success: true, status: 201, msg: "Student created successfully", data: newStudent });
    }
    const university = await University.findOne({
      _id: Staffdata.university,
    });

    if (!university) {
      return res.status(400).json({ success: false, status: 400, msg: "University not found for the provided email" });
    }

    const studentId = generateStudentId(university.university_name, firstName);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      studentId,
      firstName,
      lastName,
      email,
      studyLevel,
      courseEnrolled,
      phoneNumber,
      yearOfStudy,
      expectedGraduationDate,
      profilePicture,
      bio,
      password: hashedPassword,
      university: Staffdata.university,
      createdBy: Staffdata._id,
    });

    await newStudent.save();

    return res.status(201).json({ success: true, status: 201, msg: "Student created successfully", data: newStudent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

// Function to generate a studentId
function generateStudentId(universityName, firstName) {
  // Extract the first three letters of the university name in uppercase
  const universityLetters = universityName.slice(0, 3).toUpperCase();

  // Extract the first three letters of the first name in uppercase
  const firstNameLetters = firstName.slice(0, 3).toUpperCase();

  // Generate 5 random digits
  const randomDigits = generateRandomDigits(5);

  // Combine the parts to create the studentId
  return universityLetters + firstNameLetters + randomDigits;
}
// Function to generate random digits
function generateRandomDigits(length) {
  let result = "";
  const characters = "0123456789";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

module.exports.login = async (req, res) => {
  try {
    const { email, password, university } = req.body;
    const studentdata = await Student.findOne({ email });

    if (!studentdata) {
      return res.status(400).json({ success: false, status: 400, msg: "User is not found" });
    }

    const matchPassword = await bcrypt.compare(password, studentdata.password);

    if (!matchPassword) {
      return res.status(400).json({ success: false, status: 400, msg: "Password doesn't match" });
    }

    // Check if the student's university matches the one provided in the request
    if (studentdata.university.toString() !== university) {
      return res.status(403).json({ success: false, status: 400, msg: "You are not student of this university" });
    }

    const payload = {
      id: studentdata._id,
      email: studentdata.email,
    };

    const now = moment.utc().format("YYYY-MM-DD HH:mm:ss");
    studentdata.lastLoginTime = now;
    await studentdata.save();
    const token = JWT.sign(payload, process.env.JWT_KEY, { expiresIn: "10d" });

    return res.status(200).json({
      success: true,
      status: 200,
      msg: "Student Login Successfully",
      student_id: studentdata.studentId,
      name: studentdata.firstName,
      avatar: studentdata.profilePicture,
      token: token,
      count: studentdata.modify,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getStudent = async (req, res) => {
  try {
    const email = req.user.email;

    // Find the student document based on the student's email
    const student = await Student.aggregate([
      {
        $match: { email },
      },
      {
        $lookup: {
          from: "studylevels", // Name of the StudyLevel collection
          localField: "studyLevel",
          foreignField: "_id",
          as: "studyname",
        },
      },
      {
        $lookup: {
          from: "courses", // Name of the Course collection
          localField: "courseEnrolled",
          foreignField: "_id",
          as: "coursetype",
        },
      },
      {
        $project: {
          studentId: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          yearOfStudy: 1,
          profilePicture: 1,
          bio: 1,
          phoneNumber: 1,
          studylevel: { $arrayElemAt: ["$studyname.study_name", 0] }, // Extract the study_name field
          coursetype: { $arrayElemAt: ["$coursetype.course_name", 0] },
          studentAddress: 1,
        },
      },
    ]);

    if (student.length === 0) {
      return res.status(404).json({ success: false, status: 400, msg: "Student not found" });
    }

    return res.status(200).json({ success: true, status: 200, student: student[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.studentupdatepassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const { current_password, new_password, confirm_password } = req.body;
  try {
    const email = req.user.email;
    const studentData = await Student.findOne({ email });
    const matchPassword = await bcrypt.compare(current_password, studentData.password);

    if (!matchPassword) {
      return res.status(400).json({ success: false, status: 400, msg: "Old password doesn't match" });
    } else if (current_password === new_password) {
      return res.status(400).json({ success: false, status: 400, msg: "Old and New passwords cannot be the same" });
    } else {
      if (new_password == confirm_password) {
        if (studentData) {
          const hashPassword = await bcrypt.hash(new_password, 12);
          await Student.updateOne({ email: email }, { $set: { password: hashPassword } });
        }
        return res.status(200).json({ success: true, status: 200, msg: "Password reset Successfully" });
      } else {
        return res.status(400).json({ success: false, status: 400, msg: "New-password & Confirm-password not matched" });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.forgotpassword = async (req, res) => {
  try {
    const email = req.body.email;
    const studentData = await Student.findOne({ email });
    if (!studentData) {
      return res.status(400).json({ success: false, status: 400, msg: "Email is not Registered" });
    } else {
      const otp = Math.floor(Math.random() * 899999 + 100000);
      const expiryTime = moment.utc().add(1, "m").format("YYYY-MM-DD HH:mm:ss");
      studentData.otp = otp;
      studentData.expire_at = expiryTime;
      await studentData.save();

      // Attach the email template with OTP and expiration message
      await transporter.sendMail({
        to: email,
        from: "UnivConnect <nickm2878@gmail.com>",
        subject: "Reset Password OTP",
        html: `
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f1f1f1;
                                margin: 0;
                                padding: 0;
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
            
                            .otp {
                                text-align: center;
                                font-size: 24px;
                                font-weight: bold;
                                margin-top: 20px;
                                margin-bottom: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Reset Password OTP</h1>
                            <p>Hello,</p>
                            <p>We received a request to reset your password. Here is your reset OTP:</p>
                            <div class="otp">${otp}</div>
                            <p><strong>Please note that this OTP expires within one minute.</strong></p>
                            <p>If you did not request a password reset, please ignore this email.</p>
                            <p>Best regards,<br>Your UnivConnect Team</p>
                            <p>If you need further assistance, please contact us at support@univconnect.com.</p>
                        </div>
                    </body>
                    </html>
                `,
      });

      res.status(200).json({
        success: true,
        status: 200,
        msg: "OTP sent to registered email Successfully",
        data: otp,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.VerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const studentData = await Student.findOne({ email });

    if (!studentData) {
      return res.status(400).json({ success: false, status: 400, msg: "Your OTP is incorrect" });
    }

    const now = moment.utc().format("YYYY-MM-DD HH:mm:ss");

    const expireTime = moment(studentData.expire_at).format("YYYY-MM-DD HH:mm:ss");

    if (moment(now).isAfter(expireTime)) {
      return res.status(400).json({ success: false, status: 400, msg: "Your OTP has expired" });
    }

    if (studentData.otp == otp) {
      studentData.expire_at = now;
      await studentData.save();
      return res.status(200).json({ success: true, status: 200, msg: "Otp Verify" });
    } else {
      return res.status(400).json({ success: false, status: 400, msg: "Your OTP is incorrect" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.resetpassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { new_password, confirm_password, email } = req.body;

    if (new_password == confirm_password) {
      const studentdata = await Student.findOne({ email });

      if (studentdata) {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(new_password, salt);
        await Student.updateOne({ email }, { $set: { password: hashPassword } });
        return res.status(200).json({ success: true, status: 200, msg: "Password reset Successfully" });
      } else {
        return res.status(400).json({ success: false, status: 400, msg: "Student not found with the provided email" });
      }
    } else {
      return res.status(400).json({ success: false, status: 400, msg: "new_password & confirm_password do not match" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { bio, phoneNumber, country, state, city, pincode } = req.body;
    const _id = req.user.id;

    if (!mongoose.isValidObjectId(_id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
    }

    if (!req.file && !bio && !(country && pincode)) {
      return res.status(400).json({ success: false, status: 400, msg: "Image, bio, or student address not provided" });
    }

    let url = ""; // Initialize the URL variable

    if (req.file) {
      console.log("req.file----------", req.file);
      let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "student-profile");
      if (!imageObj.error) {
        url = imageObj.uploadData?.Location;
      } else {
        return res.status(400).json({ error: imageObj.error });
      }
    }

    const updateFields = {};

    if (bio || phoneNumber) {
      updateFields.bio = bio;
      updateFields.phoneNumber = phoneNumber;
    }

    if (country || state || city || pincode) {
      // Create or update the studentAddress array
      console.log("address", `${country}   ${state}   ${city}   ${pincode}`);
      updateFields.studentAddress = {
        country: country,
        state: state,
        city: city,
        pincode: pincode,
      };
    }

    if (url) {
      updateFields.profilePicture = url;
    }

    const Studentdata = await Student.findByIdAndUpdate(
      _id,
      { $set: { modify: 1, ...updateFields } },
      {
        new: true,
      }
    );

    // Create a new object with only the fields you want to include in the response
    const responseData = {
      success: true,
      status: 200,
      msg: "Student data Updated Successfully",
      Studentdata: {
        _id: Studentdata._id,
        studentId: Studentdata.studentId,
        firstName: Studentdata.firstName,
        lastName: Studentdata.lastName,
        email: Studentdata.email,
        studyLevel: Studentdata.studyLevel,
        courseEnrolled: Studentdata.courseEnrolled,
        phoneNumber: Studentdata.phoneNumber,
        yearOfStudy: Studentdata.yearOfStudy,
        expectedGraduationDate: Studentdata.expectedGraduationDate,
        profilePicture: Studentdata.profilePicture,
        studentAddress: Studentdata.studentAddress,
      },
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getOneStudent = async (req, res) => {
  try {
    const id = req.query.id; // Get the ID from the query string
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
    }
    const student = await Student.findById(id).select("-password").populate("studyLevel", "study_name").populate("courseEnrolled", "course_name");

    if (!student) {
      return res.status(404).json({ success: false, status: 404, msg: "Student Doesn't Exist" });
    } else {
      return res.status(200).json({ success: true, status: 200, msg: "Student Data One", data: student });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

//Admission From Student Side
module.exports.studentacademicform = async (req, res) => {
  try {
    const id = req.user.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
    }
    const { studyLevel, courseType, Info } = req.body;
    const student = await Student.findById(id);
    const prefix = "AM-";
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const currentMonth = new Date().getMonth() + 1; // Note: Months are 0-based, so we add 1.
    const admisionId = `${prefix}${randomDigits}${currentMonth}`;

    const admission = new Admission({
      RequestId: admisionId,
      student: student._id,
      studyLevels: studyLevel,
      courseTypes: courseType,
      university: student.university,
      info: Info,
    });
    await admission.save();
    return res.status(201).json({ success: true, status: 201, msg: "Admission Form Successfully", data: admission });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getStudentStudyLevel = async (req, res) => {
  try {
    const id = req.user.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
    }
    const student = await Student.findById(id);
    const studylevel = await StudyLevel.find({ university: student.university }).select("study_name");
    if (!studylevel) {
      return res.status(400).json({ success: true, status: 400, msg: "No Study Level exist" });
    }
    return res.status(200).json({ success: true, status: 200, msg: "Study Level Get Successfully", data: studylevel });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getStudentCourse = async (req, res) => {
  try {
    const Id = req.query.study_id;
    if (!mongoose.isValidObjectId(Id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid study ID" });
    }
    const courses = await Course.find({ studyLevels: Id }).select("course_name");
    if (!courses) {
      return res.status(400).json({ success: true, status: 400, msg: "No Courses exist" });
    }
    return res.status(200).json({ success: true, status: 200, msg: "Courses Get Successfully", data: courses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getAdmissionlist = async (req, res) => {
  try {
    const email = req.user.email;
    const value = req.query.value;
    const university = await University.find({ business_email: email });
    const id = university[0]._id;

    let query = { university: id };
    if (value) {
      // If value is provided, add regex conditions for search
      query = {
        university: id,
        $or: [{ RequestId: { $regex: new RegExp(value, "i") } }],
      };
    }

    const admissiondata = await Admission.find(query)
      .select("RequestId")
      .populate({
        path: "student",
        select: "studentId firstName lastName phoneNumber yearOfStudy expectedGraduationDate profilePicture studentAddress studyLevel courseEnrolled",
        populate: [
          { path: "courseEnrolled", select: "course_name" },
          { path: "studyLevel", select: "study_name" },
        ],
      })
      .populate("studyLevels", "study_name")
      .populate("courseTypes", "course_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, status: 200, msg: "All Admission Form Successfully", data: admissiondata });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.statusUpdate = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid study ID" });
    }
    // Check that the studentStatus is either 'active' or 'inactive'
    if (status !== "active" && status !== "completed") {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid status. It should be 'active' or 'completed'." });
    }

    // Find the student by ID
    const statusdata = await Admission.findById(id);

    if (!statusdata) {
      return res.status(404).json({ success: false, status: 404, msg: "Admission Form not found" });
    }

    // Check if the requested status is the same as the current status
    if (status === statusdata.status) {
      return res.status(400).json({ success: false, status: 400, msg: `Admission is already ${status}` });
    }

    // Define the update query
    const updateQuery = { _id: id };

    // Define the update fields
    const updateFields = { status: status };

    // Use findOneAndUpdate to update the student's status
    const updatedAdmission = await Admission.findOneAndUpdate(updateQuery, updateFields, { new: true });

    return res.status(200).json({ success: true, status: 200, msg: "Admission status updated successfully", data: updatedAdmission });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.getoneAdmission = async (req, res) => {
  try {
    const id = req.query.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, status: 400, msg: "Invalid study ID" });
    }

    const admissiondata = await Admission.findById(id)
      .select("RequestId")
      .populate({
        path: "student",
        select: "studentId firstName lastName phoneNumber yearOfStudy expectedGraduationDate profilePicture studentAddress studyLevel courseEnrolled",
        populate: [
          { path: "courseEnrolled", select: "course_name" },
          { path: "studyLevel", select: "study_name" },
        ],
      })
      .populate("studyLevels", "study_name")
      .populate("courseTypes", "course_name");

    if (!admissiondata) {
      return res.status(400).json({ success: true, status: 400, msg: "Admission Not Found" });
    }
    return res.status(200).json({ success: true, status: 200, msg: "Get One Admission Successfully", data: admissiondata });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.studentfriend = async (req, res) => {
  try {
    const { id } = req.user;

    const Studentdata = await Student.findById(id).populate("studyLevel", "study_name").populate("courseEnrolled", "course_name");

    const study_id = Studentdata.studyLevel._id;
    const course_id = Studentdata.courseEnrolled._id;
    const university = Studentdata.university;

    let filter = {
      studyLevel: study_id,
      courseEnrolled: course_id,
      university: university,
      status: "active",
    };

    const StudentAllFriend = await Student.find(filter).select("firstName lastName email profilePicture");

    const filteredFriends = StudentAllFriend.filter((student) => student._id.toString() !== id);

    return res.status(200).json({ success: true, status: 200, msg: "Get All Friend", data: filteredFriends });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

module.exports.chatListing = async (req, res) => {
  try {
    const { id } = req.user;
    console.log(id, "User id");
    let chatListing = await Chat.aggregate([
      {
        $match: { senderId: new mongoose.Types.ObjectId(id) },
      },
      {
        $group: {
          _id: "$receiverId",
          latestChat: { $first: "$$ROOT" }, // first used here to get the latest chat doc based on receiver id
        },
      },
      {
        $replaceRoot: { newRoot: "$latestChat" },
      },
      {
        $lookup: {
          from: "students",
          localField: "receiverId",
          foreignField: "_id",
          as: "receiver",
        },
      },
      {
        $unwind: "$receiver",
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          senderId: 1,
          message: 1,
          file: 1,
          time: 1,
          "receiver.firstName": 1,
          "receiver._id": 1,
          "receiver.lastName": 1,
          "receiver.email": 1,
          "receiver.profilePicture": 1,
          createdAt: 1,
        },
      },
    ]);

    if (chatListing.length == 0) {
      return res.status(400).json({ success: false, status: 400, meg: "Start Chat Now" });
    }

    return res.status(200).json({ success: true, status: 200, msg: "Get All Friend Chat", chatListing });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, status: 500, msg: error.msg });
  }
};

