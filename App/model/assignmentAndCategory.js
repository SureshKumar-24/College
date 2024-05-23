const mongoose = require("mongoose");

/* ADMIN GONA DEFINE THE WHOLE {
courseType:Id
studyLevel:Id
semester:1
subjects:English
catgories:[ID,ID]
           |  |
           document category
}*/
var documentSchema = new mongoose.Schema({
  courseType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  studyLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyLevel",
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  categories: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CategoryOfDocument",
        required: true,
      },
    ],
  },
});

// ASSIGNMENT , THESIS , PROJECT REPORT
const CategoryOfDocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

const CategoryOfDocument = mongoose.model(
  "CategoryOfDocument",
  CategoryOfDocumentSchema
);
const Document = mongoose.model("Document", documentSchema);
module.exports = {
  CategoryOfDocument,
  Document,
};
