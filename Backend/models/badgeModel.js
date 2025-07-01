//modules
const mongoose = require("mongoose");

//schema
const badgeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "matches",
      "goals",
      "assists",
      "mvp",
      "interceptions",
      "cleanSheets",
      "wins",
    ],
    required: [true, "Please specify the badge type"],
  },

  name: {
    type: String,
    required: [true, "Please provide the badge name"],
    trim: true,
  },

  description: {
    type: String,
    default: "",
    required: [true, "Please provide the badge description"],
  },

  //badge levels
  levels: [
    {
      level: {
        type: Number,
        required: [true, "Please provide the badge level number"],
      },
      requiredValue: {
        type: Number,
        required: [
          true,
          "Please provide the required stat value for this level",
        ],
        min: [1, "Required value must be at least 1"],
      },
    },
  ],
});

//export
const Badge = mongoose.model("Badge", badgeSchema);
module.exports = Badge;
