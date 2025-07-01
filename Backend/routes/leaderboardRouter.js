//modules
const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");

//routes
router.get("/:type", leaderboardController.getLeaderboardByType);

//export
module.exports = router;
