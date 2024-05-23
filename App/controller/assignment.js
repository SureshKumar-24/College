"use strict";
const { validationResult } = require("express-validator");
const { isValidObjectId, default: mongoose } = require("mongoose");
const Assignment = require("../model/assignment");
const assignmentValidations = require("../views/assignment");
const generalUpload = require("../helper/genralUpload");
const Student = require("../model/student_model");
const Staff = require("../model/staff_model");
const validateMongodbId = require("../helper/verify_mongoId");
const deleteFile = require("../helper/deleteFileFromS3");
const assignmentControllers = {};

assignmentControllers.studentSubmit = async (req, res) => {
  try {
    let { error } = assignmentValidations.studentSubmit.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "400",
        msg: "Invalid Field Values",
        error: error.details[0].message.replace(/"/g, ""),
      });
    }
    // console.log(req.body);
    // console.log(req.file,"ReqFile")
    if (req.file) {
      let resultObj = await generalUpload(
        req.file,
        "univ-connect-profile",
        "assignments",
        "assignment" // this is assignment type so it only allows pdf and images
      );
      let url = "";
      if (!resultObj.error) {
        url = resultObj.uploadData?.Location;
        req.body.document_Link = url;
      } else {
        return res.status(400).json({
          success: false,
          status: 400,
          msg: "Unable to upload file",
          error: resultObj.error,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        status: 400,
        msg: "Pdf Or Image File Is Compulsory",
      });
    }
    // assigning studentID // req.body now contain all the fiedl requied in an assignment document
    req.body.studentId = req.user.id;
    let assignmentUploaded = await Assignment.create(req.body);
    if (!assignmentUploaded) {
      return res.status(400).json({
        success: false,
        status: 400,
        msg: "Assignment Submission failed",
      });
    }
    return res.status(200).json({
      status: "200",
      msg: "Assigment Submitted Successfully",
      assignmentUploaded,
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      success: false,
      status: 500,
      msg: "Internal Server Error",
      errors: errors.message,
    });
  }
};
assignmentControllers.assignmentListing = async (req, res) => {
  try {
    let { id } = req.user;
    let type = "";
    console.log(id);
    const [teacher, student] = await Promise.allSettled([
      Staff.findById(id),
      Student.findById(id),
    ]);
    // console.log(teacher, student, "=-=-===");
    if (teacher.status == "fulfilled" && teacher.value !== null) {
      type = "staff";
    }
    if (student.status == "fulfilled" && student.value !== null) {
      type = "student";
    }
    let listing = {};
    console.log(type);
    let { page } = req.query;
    if (!page) {
      page = 1;
    }
    let skipitem = (page - 1) * 10;
    if (type === "staff") {
      let staffId = req.user.id;
      listing = await Assignment.aggregate([
        { $match: { staffId: new mongoose.Types.ObjectId(staffId) } },
        { $skip: skipitem },
        { $limit: 10 },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "studentDetail",
          },
        },
        {
          $lookup: {
            from: "staffs",
            localField: "staffId",
            foreignField: "_id",
            as: "staffDetail",
          },
        },
        {
          $lookup: {
            from: "subjects",
            localField: "subject",
            foreignField: "_id",
            as: "subjectDetail",
          },
        },
        {
          $lookup: {
            from: "categoryofdocuments",
            localField: "categoryId",
            foreignField: "_id",
            as: "categories",
          },
        },
        { $unwind: "$studentDetail" },
        { $unwind: "$staffDetail" },
        { $unwind: "$subjectDetail" },
        { $unwind: "$categories" },
        {
          $project: {
            _id: 1,
            "studentDetail._id": 1,
            "studentDetail.firstName": 1,
            "studentDetail.lastName": 1,
            "staffDetail._id": 1,
            "staffDetail.firstName": 1,
            "staffDetail.lastName": 1,
            "subjectDetail._id": 1,
            "subjectDetail.subject_name": 1,
            "categories._id": 1,
            "categories.name": 1,
            title: 1,
            additional_Remarks: 1,
            document_Link: 1,
            status: 1,
            reason: 1,
            createdAt: 1,
            documentId: 1,
          },
        },
      ]);
    } else if (type === "student") {
      // console.log("Working", type);
      let studentId = req.user.id;
      // console.log(studentId);
      // listing = await Assignment.find({ studentId });
      listing = await Assignment.aggregate([
        { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
        { $skip: skipitem },
        { $limit: 10 },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "studentDetail",
          },
        },
        {
          $lookup: {
            from: "staffs",
            localField: "staffId",
            foreignField: "_id",
            as: "staffDetail",
          },
        },
        {
          $lookup: {
            from: "subjects",
            localField: "subject",
            foreignField: "_id",
            as: "subjectDetail",
          },
        },
        {
          $lookup: {
            from: "categoryofdocuments",
            localField: "categoryId",
            foreignField: "_id",
            as: "categories",
          },
        },
        { $unwind: "$studentDetail" },
        { $unwind: "$staffDetail" },
        { $unwind: "$subjectDetail" },
        { $unwind: "$categories" },
        {
          $project: {
            _id: 1,
            "studentDetail._id": 1,
            "studentDetail.firstName": 1,
            "studentDetail.lastName": 1,
            "staffDetail._id": 1,
            "staffDetail.firstName": 1,
            "staffDetail.lastName": 1,
            "subjectDetail._id": 1,
            "subjectDetail.subject_name": 1,
            "categories._id": 1,
            "categories.name": 1,
            title: 1,
            additional_Remarks: 1,
            document_Link: 1,
            status: 1,
            reason: 1,
            createdAt: 1,
            documentId: 1,
          },
        },
      ]);
      // console.log(listing,"Listing")
    } else {
      return res.status(400).json({ status: 400, msg: "Invalid Type" });
    }
    if (listing.length === 0) {
      return res.status(400).json({
        status: "400",
        msg: "No listing was found",
      });
    }
    return res.status(200).json({
      status: "200",
      msg: "Assigment List Fetched Successfully",
      listing,
    });
  } catch (errors) {
    return res.status(500).json({
      success: false,
      status: 500,
      msg: "Internal Server Error",
      errors: errors.message,
    });
  }
};

assignmentControllers.checkAssignment = async (req, res) => {
  try {
    let { error } = assignmentValidations.check.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "400",
        msg: "Invalid Field Values",
        error: error.details[0].message.replace(/"/g, ""),
      });
    }
    let { assignmentId, status, reason } = req.body;
    let query = {};
    if (reason || reason === null || reason === "") {
      query.reason = reason;
      query.status = status;
    } else {
      query.status = status;
    }
    let updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      query,
      { new: true }
    );
    if (!updatedAssignment) {
      return res
        .status(400)
        .json({ status: "400", message: "Unable to Check Assignment" });
    }
    return res.status(200).json({
      status: "200",
      message: "Assignment Checked Successfully",
      data: updatedAssignment,
    });
  } catch (errors) {
    return res.status(500).json({
      success: false,
      status: 500,
      msg: "Internal Server Error",
      errors: errors.message,
    });
  }
};

assignmentControllers.reSubmit = async (req, res) => {
  try {
    let { assignmentId } = req.body;
    var url = "";
    if (!assignmentId) {
      return res.status(400).json({
        status: "400",
        message: "Something is wrong with assignmentId",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        status: "400",
        message: "Image Or Pdf File is Required",
      });
    }
    let assignmenDetails = await Assignment.findById(assignmentId);
    // console.log(assignmenDetails);
    if (!assignmenDetails) {
      return res.status(400).json({
        status: "400",
        message: "No assignment exists with provided Assignment Id",
      });
    }
    if (assignmenDetails.status === "Revised") {
      let assignmentURL = assignmenDetails.document_Link;
      console.log("Original assignment Doc Link", assignmentURL);
      if (assignmentURL) {
        // Delete the previous upoad file
        let fileToDelete = assignmentURL.split("/");
        fileToDelete = fileToDelete[3] + "/" + fileToDelete[4];
        // console.log(fileToDelete);
        let isDeleted = await deleteFile("univ-connect-profile", fileToDelete);
        if (isDeleted.error) {
          return res
            .status(400)
            .json({ message: "Previous File Deletion Failed", status: "400" });
        }
      }
      // now uploading new one
      let resultObj = await generalUpload(
        req.file,
        "univ-connect-profile",
        "assignments",
        "assignment"
      );
      // console.log(resultObj)
      if (!resultObj.error) {
        url = resultObj.uploadData?.Location;
      } else {
        return res.status(400).json({
          success: false,
          status: 400,
          msg: "Unable to upload file",
          error: resultObj.error,
        });
      }
    }
    console.log("New Url ", url);
    const updatedAssign = await Assignment.findByIdAndUpdate(
      assignmentId,
      { document_Link: url },
      { new: true }
    );
    if (!updatedAssign) {
      return res.status(400).json({
        success: false,
        status: 400,
        msg: "Assignment Updation failed",
      });
    }
    return res.status(200).json({
      status: "200",
      msg: "Assigment ReUploaded Successfully",
      data: updatedAssign,
    });
  } catch (errors) {
    console.log(errors);
    return res.status(500).json({
      success: false,
      status: 500,
      msg: "Internal Server Error",
      errors: errors.message,
    });
  }
};
module.exports = assignmentControllers;
