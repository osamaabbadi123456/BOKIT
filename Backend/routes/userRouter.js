//modules
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protectMiddleware = require("../middlewares/protectMiddleware");
const restrictedTo = require("../middlewares/restrictedToMiddleware");
const { uploadUser } = require("../middlewares/uploadMiddleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");

//players routes
router.get(
  "/me",
  protectMiddleware,
  restrictedTo("player"),
  userController.getMyProfile
);

router.patch(
  "/me",
  protectMiddleware,
  restrictedTo("player"),
  uploadUser.single("profilePicture"),
  userController.updateMyProfile
);

router.delete(
  "/me",
  protectMiddleware,
  restrictedTo("player"),
  userController.deleteMyProfile
);

router.get(
  "/me/bookings",
  protectMiddleware,
  restrictedTo("player"),
  userController.getMyBookings
);

//public routes
router.get("/:id", optionalAuthMiddleware, userController.getUserById);

//export
module.exports = router;
