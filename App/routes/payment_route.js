const Router = require("express").Router();
const paymentController = require("../controller/payment_controller");
const Verifytoken = require("../helper/verify_token");

Router.post("/addPayment", Verifytoken.verify, paymentController.addPaymentFromAdmin);
Router.get("/getPaymentTypes", Verifytoken.verify, paymentController.getPaymentTypeToPay);

module.exports = Router;
