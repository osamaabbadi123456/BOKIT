//modules
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forget-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);

//export
module.exports = router;
