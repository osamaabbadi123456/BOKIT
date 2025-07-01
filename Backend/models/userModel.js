//modules
const mongoose = require("mongoose");

//schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please provide your first name"],
    trim: true,
    maxlength: [10, "First name cannot be more than 10 characters"],
  },
  lastName: {
    type: String,
    required: [true, "Please provide your last name"],
    trim: true,
    maxlength: [15, "Last name cannot be more than 15 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^([a-z0-9_.+-]+)@([a-z0-9-]+\.)+[a-z0-9]{2,4}$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please provide your password"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false, //Password will not appear in any find() by default
  },
  phone: {
    type: String,
    required: [true, "Please provide your phone number"],
    unique: true,
    trim: true,
    match: [/^\+9627[789]\d{7}$/, "Please provide a Jordanian phone number"],
  },
  city: {
    type: String,
    required: [true, "Please provide your city"],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, "Please provide your age"],
    min: [15, "You must be at least 15 years old"],
    max: [45, "You must be younger"],
  },
  preferredPosition: {
    type: String,
    trim: true,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  profilePicture: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["player", "admin"],
    default: "player",
  },

  //player stats
  stats: {
    matches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    mvp: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    interceptions: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },
  },

  //set of badges
  badges: [
    {
      name: String,
      description: String,
      level: Number,
    },
  ],

  suspendedUntil: {
    type: Date,
    default: null,
  },

  suspensionReason: {
    type: String,
    default: "",
  },

  passwordResetOTP: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
});

//export
const User = mongoose.model("User", userSchema);
module.exports = User;
