//modules
const express = require("express");
const router = express.Router();
const pitchController = require("../controllers/pitchController");
const protectMiddleware = require("../middlewares/protectMiddleware");
const restrictedToMiddleware = require("../middlewares/restrictedToMiddleware");
const { uploadPitch } = require("../middlewares/uploadMiddleware");

//public routes
router.get("/", pitchController.getAllPitches);

router.get("/:id", pitchController.getPitchById);

//admin routes
router.post(
  "/",
  protectMiddleware,
  restrictedToMiddleware("admin"),
  uploadPitch.fields([
    { name: "backgroundImage", maxCount: 1 },
    { name: "images" },
  ]),
  pitchController.createPitch
);

router.delete(
  "/:id",
  protectMiddleware,
  restrictedToMiddleware("admin"),
  pitchController.deletePitch
);

//export the router
module.exports = router;
