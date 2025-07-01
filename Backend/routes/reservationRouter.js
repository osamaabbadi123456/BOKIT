//modules
const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const protectMiddleware = require("../middlewares/protectMiddleware");
const restrictedToMiddleware = require("../middlewares/restrictedToMiddleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");

//public routes
router.get(
  "/",
  optionalAuthMiddleware,
  reservationController.getAllReservations
);

router.get(
  "/:id",
  optionalAuthMiddleware,
  reservationController.getReservationById
);

//admin routes
router.post(
  "/",
  protectMiddleware,
  restrictedToMiddleware("admin"),
  reservationController.createReservation
);

router.delete(
  "/:id",
  protectMiddleware,
  restrictedToMiddleware("admin"),
  reservationController.deleteReservation
);

router.post(
  "/:id/kick",
  protectMiddleware,
  restrictedToMiddleware("admin"),
  reservationController.kickPlayer
);

router.post(
  "/:id/summary",
  protectMiddleware,
  restrictedToMiddleware("admin"),
  reservationController.addSummary
);

//player routes
router.post(
  "/:id/join",
  protectMiddleware,
  restrictedToMiddleware("player"),
  reservationController.joinReservation
);

router.post(
  "/:id/cancel",
  protectMiddleware,
  restrictedToMiddleware("player"),
  reservationController.cancelReservation
);

router.post(
  "/:id/waitlist/remove",
  protectMiddleware,
  restrictedToMiddleware("player"),
  reservationController.removeFromWaitlist
);

//export the router
module.exports = router;
