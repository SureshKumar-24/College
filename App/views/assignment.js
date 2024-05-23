const Joi = require("joi");

const assignmentValidations = {};
assignmentValidations.studentSubmit = Joi.object({
  staffId: Joi.string().hex().length(24).required(),
  subject: Joi.string().hex().length(24).required(),
  categoryId: Joi.string().hex().length(24).required(),
  title: Joi.string().trim().required().max(300),
  additional_Remarks: Joi.string().trim().allow(null, "").max(300),
});

assignmentValidations.check = Joi.object({
  assignmentId:Joi.string().hex().length(24).required(),
  status: Joi.string().valid("Approved", "Rejected", "Pending", "Revised").required(),
  reason: Joi.string().trim().max(300).allow("",null), 
});


module.exports = assignmentValidations;
