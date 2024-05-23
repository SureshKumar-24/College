const mongoose = require("mongoose");
const generateId=require('../helper/idGenerator')
var assignmentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      default: "",
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CategoryOfDocument",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxLength: 300,
    },
    additional_Remarks: {
      type: String,
      trim: true,
      default: null,
      maxLength: 300,
    },
    document_Link: {
      type: String,
      default: "",
    },
    // two fields for the staff giving result after checking
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Pending", "Revised"],
      default: "Pending",
    },
    reason: {
      type: String,
      trim: true,
      default: null,
      maxLength: 300,
    },
  },
  {
    timestamps: true,
  }
);
assignmentSchema.pre("save", function (next) {
  // do stuff
  this.documentId=generateId("DOC-")
  next();
});
const Assignment = mongoose.model("Assignment", assignmentSchema);
module.exports = Assignment;
