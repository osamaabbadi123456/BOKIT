//modules
const Leaderboard = require("../models/leaderboardModel");

//get leaderboard
exports.getLeaderboardByType = async (req, res) => {
  try {
    const validTypes = [
      "wins",
      "mvp",
      "goals",
      "assists",
      "interceptions",
      "cleanSheets",
    ];
    const { type } = req.params;

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid leaderboard type",
      });
    }

    const leaderboard = await Leaderboard.findOne({ type }).populate({
      path: "topPlayers.player",
      select: "firstName lastName profilePicture",
    });

    if (!leaderboard) {
      return res.status(404).json({
        status: "fail",
        message: "Leaderboard not found",
      });
    }

    //format response to merge player info into each entry
    const players = leaderboard.topPlayers.map((entry, index) => ({
      rank: index + 1,
      userId: entry.player._id,
      firstName: entry.player.firstName,
      lastName: entry.player.lastName,
      profilePicture: entry.player.profilePicture,
      matches: entry.matches,
      statValue: entry.statValue,
    }));

    res.status(200).json({
      status: "success",
      data: {
        leaderboard: {
          type,
          players,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to load leaderboard",
    });
  }
};
