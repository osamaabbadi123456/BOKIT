//modules
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config();

//middleware to protect routes
const protectMiddleware = async (req, res, next) => {
  try {
    let token;

    //get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]; // Extract token
    }

    //if no token, reject request
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message:
          "You are not logged in. Please log in to access this resource.",
      });
    }

    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    //attach user to request
    req.user = currentUser;

    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

//export
module.exports = protectMiddleware;
