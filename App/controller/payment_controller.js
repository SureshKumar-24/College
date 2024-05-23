const AddPayment = require("../model/payment_model");
const Admin = require("../model/admin_model");
const University = require("../model/university_model");
const Student = require("../model/student_model");
const paymentValidation = require("../views/payment");
const mongoose = require("mongoose");
const https = require("https");
let baseUrl = "https://api.maxicashapp.com/payentry?";
//data={PayType:”MaxiCash”,Amount:”{TOTAL_AMOUNT}”,Currency:”maxiDollar”,Telephone:”{MAXICASH_TELEPHONE_NO}”,MerchantID:”{YOUR_MERCHANT_ID}”,MerchantPassword:”{YOUR_MERCHANT_PASSWORD}”,Language:”fr”,Reference:”{REFERENCE_OF_TRANSACTION}”,Accepturl:”{SUCCESS_URL}”,Cancelurl:”{CANCEL_URL}”,Declineurl:”{FAILURE_URL}”,NotifyURL:”{NOTIFY_URL}”}

const paymentController = {};

//-------------ADD PAYMENT TYPE AND OPTION FROM ADMIN AND STUDENT TO PAY BY TITLE---->
paymentController.addPaymentFromAdmin = async (req, res) => {
  try {
    let { error } = paymentValidation.addPayments.validate(req.body);
    if (error) {
      return res.status(400).json({ status: "400", msg: "Invalid fields", error: error.details[0].message.replace(/"/g, "") });
    }
    req.body.createdBy = req.user.id;
    let univ = await University.findOne({ business_email: req.user.email });
    req.body.universityId = univ._id;
    let [admin, student] = await Promise.allSettled([Admin.findById(req.user.id), Student.findById(req.user.id)]);

    if (admin.status == "fulfilled" && admin.value !== null) {
      req.body.creatorModel = "Admin";
    }
    if (student.status == "fulfilled" && student.value !== null) {
      req.body.creatorModel = "Student";
    }

    let paymentAdded = await AddPayment.create(req.body);
    if (!paymentAdded) {
      return res.status(400).json({ msg: "400", msg: "Unable to create the payment, Please check the fields carefully" });
    }
    res.status(200).json({ status: "200", msg: "Payment added successfully", paymentAdded });
  } catch (errors) {
    console.log(errors);
    res.status(500).json({ status: "500", msg: "Some internal server error occur", errors });
  }
};

//------------------GET PAYMENT TYPE BY ADMIN ID FOR A PARTICULAR UNIVERSITY--->
paymentController.getPaymentTypeToPay = async (req, res) => {
  try {
    console.log(req.user.id, "This is user id which is going to payment for any type");
    // let student = await Student.findById(req.user.id);
    // let email = await University.findById({ _id: student.university });
    // let createdBy = await Admin.findOne({ email: email.business_email });
    // let paymentTypesOfUniversity = await AddPayment.find({ createdBy });

    let result = await Student.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: "universities",
          localField: "university",
          foreignField: "_id",
          as: "universityData",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "universityData.business_email",
          foreignField: "email",
          as: "adminData",
        },
      },
      {
        $lookup: {
          from: "addpayments",
          localField: "adminData._id",
          foreignField: "createdBy",
          as: "paymentTypesOfUniversity",
        },
      },
      { $unwind: "$paymentTypesOfUniversity" },
    ]);

    let paymentTypesOfUniversity = result.map((doc) => doc.paymentTypesOfUniversity);
    res.status(200).json({ status: "200", msg: "Payment Types fetched Successfully", data: paymentTypesOfUniversity });
  } catch (errors) {
    console.log(errors);
    res.status(500).json({ status: "500", msg: "Some internal server error occur", errors });
  }
};

module.exports = paymentController;
