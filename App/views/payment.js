const Joi = require("joi");

const paymentValidation = {};

paymentValidation.addPayments = Joi.object({
  courseType: Joi.string().required(),
  studyLevel: Joi.string().required(),
  semester: Joi.string().required(),
  paymentType: Joi.string().required(),
  amount: Joi.number(),
  hasSubOptions: Joi.boolean().default(false),
  option: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      amount: Joi.number(),
    })
  ),
});

module.exports = paymentValidation;
