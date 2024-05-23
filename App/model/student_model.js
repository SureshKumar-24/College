const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    studyLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyLevel", // Reference to the StudyLevel model
      required: true,
    },
    courseEnrolled: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", // Reference to the Course model
      required: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      // required: true, // University reference is required
    },
    phoneNumber: {
      type: String,
    },
    yearOfStudy: {
      type: String,
    },
    expectedGraduationDate: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University", // Reference to the University model
    },
    studentAddress: [
      {
        country: String, // Lowercase field name
        state: String,
        city: String,
        pincode: String, // Lowercase field name
      },
    ],
    billingAddress: {
      address: String,
      postalCode: String,
      location: String,
      country: String,
    },
    lastLoginTime: Date,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active", // Default status is 'active'
    },
    otp: {
      type: Number,
    },
    expire_at: {
      type: String,
    },
    createdBy: {
      // Add a field to track the creator/owner
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // Reference to a User model (adjust the ref value as needed)
    },
    modify: {
      type: Number,
      default: 0,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      default: null,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "Student",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
  }
);

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
