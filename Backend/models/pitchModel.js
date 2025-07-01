//modules
const mongoose = require("mongoose");

//schema
const pitchSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, "Please provide the pitch name"],
    trim: true,
  },
  backgroundImage: {
    type: String,
    required: [true, "Please provide the background image"],
  },
  playersPerSide: {
    type: Number,
    required: [true, "Please provide number of players per side"],
    min: [5, "Players per side must be at least 5"],
  },
  city: {
    type: String,
    required: [true, "Please provide the pitch city"],
    trim: true,
  },
  location: {
    type: String,
    required: [true, "Please provide the pitch location"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please provide the pitch description"],
  },

  //services:
  services: {
    type: {
      type: String,
      enum: ["Indoor", "Outdoor"],
      required: [true, "Please specify if the pitch is Indoor or Outdoor"],
    },
    water: { type: Boolean, default: false },
    cafeteria: { type: Boolean, default: false },
    lockers: { type: Boolean, default: false },
    bathrooms: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
  },

  images: {
    type: [String],
    default: [],
  },
});

//export
const Pitch = mongoose.model("Pitch", pitchSchema);
module.exports = Pitch;
