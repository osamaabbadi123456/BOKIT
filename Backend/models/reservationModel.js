//mongoose
const mongoose = require("mongoose");

//schema
const reservationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide the reservation title"],
    trim: true,
  },

  pitch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pitch",
    required: [true, "Reservation must be linked to a pitch"],
  },

  date: {
    type: Date,
    required: [true, "Please provide the reservation date and time"],
  },
  startTime: {
    type: Date,
    required: [true, "Please provide the reservation start time"],
  },
  endTime: {
    type: Date,
    required: [true, "Please provide the reservation end time"],
  },
  price: {
    type: Number,
    required: [true, "Please provide the price for the reservation"],
    min: [0, "Price cannot be less than 0"],
  },

  maxPlayers: {
    type: Number,
    required: [true, "Please provide the max players for the reservation"],
    //min: [12, "There must be at least 12 player"],
  },

  currentPlayers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  waitList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

//export
const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
