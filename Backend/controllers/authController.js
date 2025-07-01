//modules
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const passwordResetOTP = require("../utils/templates/passwordResetOTP");
const dotenv = require("dotenv");
dotenv.config();

//generateToken
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//signup
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, city, age } = req.body;

    //check for existing user by email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "Email or phone already exists",
      });
    }

    //create user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      city,
      age,
    });

    //let Mongoose validate all fields
    await newUser.validate();

    //hash the password
    newUser.password = await bcrypt.hash(password, 10);

    //save the validated and hashed user
    await newUser.save();

    //hide password before sending response
    newUser.password = undefined;

    //response
    res.status(201).json({
      status: "success",
      message: "signed up successfully",
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    //handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((el) => el.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(" | "),
      });
    }

    //default server error
    res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //validate email and password
    const dummyUser = new User({ email, password });
    const validationErr = dummyUser.validateSync(["email", "password"]);

    if (validationErr) {
      const messages = Object.values(validationErr.errors).map(
        (el) => el.message
      );
      return res.status(400).json({
        status: "fail",
        message: messages.join(" | "),
      });
    }

    //find user by email + include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    //compare provided password with hashed one
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    //generate token and hide password
    const token = generateToken(user._id);
    user.password = undefined;

    //respond with success
    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};

//forget password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    //check if user exists
    const user = await User.findOne({ email }).select("+passwordResetExpires");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "No user found with that email",
      });
    }

    //prevent OTP resend within 60 seconds
    if (user.passwordResetExpires && user.passwordResetExpires > Date.now()) {
      const waitTime = Math.ceil(
        (user.passwordResetExpires - Date.now()) / 1000
      );
      return res.status(429).json({
        status: "fail",
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
      });
    }

    //generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //hash the OTP and set expiry
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    user.passwordResetOTP = hashedOTP;
    user.passwordResetExpires = Date.now() + 60 * 1000; //1 minute

    await user.save({ validateBeforeSave: false });

    //send OTP Email
    const { subject, html } = passwordResetOTP({
      firstName: user.firstName,
      lastName: user.lastName,
      otp,
    });

    await sendEmail({
      to: user.email,
      subject,
      html,
      text: `Your BOKIT password reset code is: ${otp}`,
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent to email",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to send OTP. Try again.",
    });
  }
};

//verifyOtp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    //find user and explicitly select OTP fields
    const user = await User.findOne({ email }).select(
      "+passwordResetOTP +passwordResetExpires"
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    //check OTP expiry
    if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
      return res.status(400).json({
        status: "fail",
        message: "OTP expired. Please request a new one.",
      });
    }

    //hash the provided OTP
    const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");

    //compare hashed OTPs
    if (hashedInput !== user.passwordResetOTP) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP. Please check and try again.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "OTP verified. You may reset your password now.",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to verify OTP",
    });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    //find the user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    //validate passwords
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide and confirm your new password",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    //compare new password with old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        status: "fail",
        message: "New password must be different from the current password",
      });
    }

    //hash the password manually
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    //save hashed password and clear OTP fields
    user.password = hashedPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to reset password",
    });
  }
};
