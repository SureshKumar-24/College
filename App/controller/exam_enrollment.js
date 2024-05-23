const { ExamType, ExamEnrollment } = require("../model/exam_enrollment");
const { isValidObjectId, default: mongoose } = require("mongoose");
const Student = require("../model/student_model");
const examValidation = require("../views/examEnrollment");
const examEnrollmentController = {};

function stringId(id) {}

examEnrollmentController.addExam = async (req, res) => {
  try {
    let { error } = examValidation.exam.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "400",
        msg: "Invalid Field Values",
        error: error.details[0].message.replace(/"/g, ""),
      });
    }
    console.log(req.body, req.user);
    req.body.createdBy = req.user.id;
    const exam = await ExamEnrollment.create(req.body);
    if (!exam) {
      return res.status(400).json({ msg: "Unable to do exam enrollment", status: "400" });
    }
    res.status(200).json({ msg: "Successfully created the exam enrollment", status: "200", exam });
  } catch (errors) {
    console.log(errors);
    res.status(500).json({ msg: "Some internal server error occur", status: "500", errors });
  }
};

examEnrollmentController.addExamUpper = async (req, res) => {
  try {
    let { error } = examValidation.examUpper.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "400",
        msg: "Invalid Field Values",
        error: error.details[0].message.replace(/"/g, ""),
      });
    }
    console.log(req.body, req.user);
    req.body.createdBy = req.user.id;
    const exam = await ExamType.create(req.body);
    if (!exam) {
      return res.status(400).json({ msg: "Unable to do exam enrollment", status: "400" });
    }
    res.status(200).json({ msg: "Successfully created the exam enrollment", status: "200", exam });
  } catch (errors) {
    console.log(errors);
    res.status(500).json({ msg: "Some internal server error occur", status: "500", errors });
  }
};

examEnrollmentController.getExams = async (req, res) => {
  try {
    const id = req.user.id;
    const exams = await ExamType.find({ createdBy: id });
    res.status(200).json({ msg: "Exam listing fetched successfully", status: "200", exams });
  } catch (errors) {
    console.log(errors);
    res.status(500).json({ msg: "Some internal server error occur", status: "500", errors });
  }
};

module.exports = examEnrollmentController;
