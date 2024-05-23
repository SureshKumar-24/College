const Joi = require("joi");
const enrollmentValidation = {};

enrollmentValidation.exam = Joi.object({
  type: Joi.string().required(),
  examType: Joi.string().required(),
  courseType: Joi.string().required(),
  studyLevel: Joi.string().required(),
  semester: Joi.string().required(),
  subject: Joi.string().required(),
  date: Joi.string().required(),
  time: Joi.string().required(),
  location: Joi.string().required(),
  syllabus: Joi.string().required(),
  amount: Joi.string().required(),
  lastDate: Joi.string().required(),
});

enrollmentValidation.examUpper = Joi.object({
  courseType: Joi.string().required(),
  studyLevel: Joi.string().required(),
  semester: Joi.string().required(),
  typeOfExam: Joi.array().items(
    Joi.object({
      examType: Joi.string().required(),
    })
  ),
});

module.exports = enrollmentValidation;
