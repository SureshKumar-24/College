const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const examSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    courseType: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studyLevel: {
      type: Schema.Types.ObjectId,
      ref: "StudyLevel",
      required: true,
    },
    semester: {
      type: Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    typeOfExam: [
      {
        examType: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const examEnrollmentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    examType: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    courseType: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studyLevel: {
      type: Schema.Types.ObjectId,
      ref: "StudyLevel",
      required: true,
    },
    semester: {
      type: Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    syllabus: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    lastDate: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

let ExamType = mongoose.model("ExamType", examSchema);
let ExamEnrollment = mongoose.model("ExamEnrollment", examEnrollmentSchema);

module.exports = { ExamType, ExamEnrollment };
