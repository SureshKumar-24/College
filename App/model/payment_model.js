const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      refPath: "creatorModel",
      default: null,
    },
    universityId:{
      type:Schema.Types.ObjectId,
      ref:"University"
    },
    creatorModel: {
      type: String,
      default: "",
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
    paymentType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
    },
    hasSubOptions: {
      type: Boolean,
      default: false,
    },
    option: [
      {
        name: {
          type: String,
        },
        amount: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AddPayment", paymentSchema);
