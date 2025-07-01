//modules
const Leaderboard = require("../models/leaderboardModel");
const User = require("../models/userModel");

//list of stat types your leaderboard will support
const statTypes = [
  "wins",
  "mvp",
  "goals",
  "assists",
  "interceptions",
  "cleanSheets",
];

const updateLeaderboard = async () => {
  try {
    //loop through each stat type to update its leaderboard
    for (const stat of statTypes) {
      //remove the old leaderboard entry completely
      await Leaderboard.deleteOne({ type: stat });

      //fetch users with this stat > 0 and project needed fields
      const users = await User.find({ [`stats.${stat}`]: { $gt: 0 } })
        .select("firstName lastName profilePicture stats.matches stats." + stat)
        .lean(); //lean() gives raw JS objects

      //sort users: highest stat first, if tie then fewer matches wins
      const sorted = users.sort((a, b) => {
        if (b.stats[stat] !== a.stats[stat]) {
          return b.stats[stat] - a.stats[stat]; //stat descending
        }
        return a.stats.matches - b.stats.matches; //matches ascending
      });

      //format top 50 users into leaderboard entries
      const top50 = sorted.slice(0, 50).map((user) => ({
        player: user._id,
        statValue: user.stats[stat],
        matches: user.stats.matches,
      }));

      //upsert the leaderboard document
      await Leaderboard.findOneAndUpdate(
        { type: stat },
        { type: stat, topPlayers: top50 },
        { upsert: true, new: true } //if no doc , add one
      );
    }

    console.log("Leaderboards updated successfully");
  } catch (err) {
    console.error("Error updating leaderboards:", err);
  }
};

module.exports = updateLeaderboard;
