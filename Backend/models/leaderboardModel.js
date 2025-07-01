//modules
const mongoose = require("mongoose");

//schema
const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["wins", "mvp", "goals", "assists", "interceptions", "cleanSheets"],
    required: true,
    unique: true,
  },

  topPlayers: [
    {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      statValue: { type: Number, default: 0 },
      matches: { type: Number, default: 0 },
    },
  ],
});

//export
const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
module.exports = Leaderboard;
