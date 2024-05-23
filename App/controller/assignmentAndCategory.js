const { validationResult } = require("express-validator");
const Semester = require("../model/semester_model");
const {
  Document,
  CategoryOfDocument,
} = require("../model/assignmentAndCategory");
const { isValidObjectId, default: mongoose } = require("mongoose");
const Student = require("../model/student_model");
const assignAndDocControllers = {};

// FOR CATGORY LIKE ASSIGNMENT

assignAndDocControllers.category = async (req, res) => {
  try {
    let { name } = req.body;
    if (!name || name.length >= 200) {
      return res.status(400).json({ status: 400, message: "Invalid Name" });
    }
    const category = await CategoryOfDocument.create({ name });
    if (!category) {
      return res
        .status(400)
        .json({ status: 400, message: "Unable to create Category" });
    }
    return res.status(200).json({
      status: 200,
      message: "Category Created SuccessFully",
      category,
    });
  } catch (errors) {
    console.log(errors);
    if ((errors.code = 11000)) {
      return res
        .status(400)
        .json({ status: 400, message: "Provided Name already exists" });
    }
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};

assignAndDocControllers.categoryList = async (req, res) => {
  try {
    const categoryList = await CategoryOfDocument.find({});
    if (categoryList.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Unable to fetch Category List",
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Category Fetch SuccessFully",
      data: categoryList,
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};
assignAndDocControllers.categorydelete = async (req, res) => {
  try {
    let categoryId = req.params.id;
    if (!isValidObjectId(categoryId)) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid Category Id" });
    }
    const existingCategory = await Document.find({
      categories: { $in: [categoryId] },
    });
    if (existingCategory.length !== 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "You can't delete Category because it's already Assigned",
      });
    }
    const category = await CategoryOfDocument.findByIdAndDelete(categoryId, {
      new: true,
    });
    if (!category) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Category doesn't exists",
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Category deleted SuccessFully",
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};
assignAndDocControllers.categoryupdate = async (req, res) => {
  try {
    let { categoryId, name } = req.body;
    if (!categoryId || !isValidObjectId(categoryId)) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid Category Id" });
    }
    if (!name || name.length >= 200) {
      return res
        .status(400)
        .json({ status: 400, message: "Something is wrong with Name" });
    }
    const category = await CategoryOfDocument.findByIdAndUpdate(
      categoryId,
      {
        name,
      },
      { new: true }
    );
    if (!category) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Unable to update Category ",
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Category updated SuccessFully",
      category,
    });
  } catch (errors) {
    console.log(errors);
    if ((errors.code = 11000)) {
      return res
        .status(400)
        .json({ status: 400, message: "Provided Name already exists" });
    }
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};

// admin document with category and all details
assignAndDocControllers.validateDoc = async (req, res) => {
  try {
    let { courseType, studyLevel, semester, subject, categories } = req.body;
    let existingDoc = await Document.find({
      courseType,
      studyLevel,
      subject,
      semester,
    });
    // console.log(existingDoc);
    if (existingDoc.length !== 0) {
      return res.status(400).json({
        status: "400",
        message: "An Document already exists with provided field values",
      });
    }
    let validate = await Document.create({
      courseType,
      studyLevel,
      semester,
      subject,
      categories,
    });
    if (!validate) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Validation Document Creation failed",
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Validation Document Created Successfully",
      data: validate,
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};

// get all documents
assignAndDocControllers.docList = async (req, res) => {
  try {
    let { page } = req.query;
    if (!page) {
      page = 1;
    }
    let skipitem = (page - 1) * 10;
    let docList = await Document.aggregate([
      { $match: {} },
      { $skip: skipitem },
      { $limit:10 },
      {
        $lookup: {
          from: "courses",
          localField: "courseType",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $lookup: {
          from: "studylevels",
          localField: "studyLevel",
          foreignField: "_id",
          as: "studyLevel",
        },
      },
      {
        $lookup: {
          from: "semesters",
          localField: "semester",
          foreignField: "_id",
          as: "semester",
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subject",
        },
      },
      {
        $lookup: {
          from: "categoryofdocuments",
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $unwind: "$studyLevel",
      },
      {
        $unwind: "$semester",
      },
      {
        $unwind: "$subject",
      },
      {
        $project: {
          categories: 1,
          "subject.subject_name": 1,
          "subject._id": 1,
          "course.course_name": 1,
          "course._id": 1,
          "semester.semesterNumber": 1,
          "semester._id": 1,
          "studyLevel.study_name": 1,
          "studyLevel._id": 1,
        },
      },
    ]);
    if (docList.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "No existing document",
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Document List Fetched Successfully",
      docList,
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};

// listing of subjects and thier respective categories
assignAndDocControllers.subAndCategoryLists = async (req, res) => {
  try {
    let id = req.user.id;
    console.log(id);
    let studentDetails = await Student.findById(id).select(
      "studyLevel courseEnrolled semester"
    );
    if (!studentDetails) {
      return res
        .status(400)
        .json({ status: "400", message: "Unable to fetch student details" });
    }
    let { type, subjectId } = req.query;
    if (!type) {
      return res.status(400).json({ status: "400", message: "Type is must" });
    }
    let data = {};
    //listing to be shown to user while submitting document without category just subjects
    if (type === "sub") {
      data = await Document.aggregate([
        {
          $match: {
            courseType: studentDetails.courseEnrolled,
            studyLevel: studentDetails.studyLevel,
            semester: studentDetails.semester,
          },
        },
        {
          $lookup: {
            from: "subjects",
            localField: "subject",
            foreignField: "_id",
            as: "subject",
          },
        },
        {
          $project: { "subject._id": 1, "subject.subject_name": 1 },
        },
      ]);
    }
    //showing categories based on subject selected
    else if (type === "category") {
      if (!subjectId) {
        return res.status(400).json({ status: "400", message: "Provide Type" });
      }
      data = await Document.aggregate([
        {
          $match: {
            courseType: studentDetails.courseEnrolled,
            studyLevel: studentDetails.studyLevel,
            semester: studentDetails.semester,
            subject: new mongoose.Types.ObjectId(subjectId),
          },
        },
        {
          $lookup: {
            from: "categoryofdocuments",
            localField: "categories",
            foreignField: "_id",
            as: "category",
          },
        },
        { $project: { category: 1 } },
      ]);
    } else {
      return res.status(400).json({ status: "400", message: "Invalid Type" });
    }
    if (data.length === 0) {
      return res
        .status(400)
        .json({ status: "400", message: "No data with provided values" });
    }
    // just modified the data acc to frontend
    if (type === "category") {
      data = data[0].category;
      // console.log("Data.data", data[0].data);
    } else {
      // console.log("Data",data)
      data = data.map((obj) => obj?.subject[0]);
      // console.log("Data",test)
    }

    return res.status(200).json({
      status: "200",
      message: `${
        type === "category" ? "Category" : type === "sub" ? "Subject" : type
      } List fetched Successfully`,
      category: data,
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      errors: errors.message,
    });
  }
};
module.exports = assignAndDocControllers;
