//modules
const Pitch = require("../models/pitchModel");
const Reservation = require("../models/reservationModel");
const sendEmail = require("../utils/email");
const pitchDeletedTemplate = require("../utils/templates/pitchDeleted");

//create a new pitch
exports.createPitch = async (req, res) => {
  try {
    const { name, playersPerSide, city, location, description } = req.body;
    let services = req.body.services;

    //check on services
    if (typeof services === "string") {
      try {
        services = JSON.parse(services);
      } catch (err) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid services format",
        });
      }
    }

    //extract the files grouped by name from multer
    const backgroundImageFile = req.files?.backgroundImage?.[0];
    const additionalImageFiles = req.files?.images || [];

    //ensure background image is provided
    if (!backgroundImageFile) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide the background image",
      });
    }

    //extract Cloudinary URLs
    const backgroundImage = backgroundImageFile.path;
    const images = additionalImageFiles.map((file) => file.path);

    //check for duplicate pitch name
    const existingPitch = await Pitch.findOne({ name });
    if (existingPitch) {
      return res.status(400).json({
        status: "fail",
        message: "A pitch with this name already exists",
      });
    }

    //create and validate pitch
    const newPitch = new Pitch({
      name,
      backgroundImage,
      playersPerSide,
      city,
      location,
      description,
      services,
      images,
    });

    await newPitch.validate(); //let Mongoose do final checks
    await newPitch.save(); //save to MongoDB

    //send response
    res.status(201).json({
      status: "success",
      message: "Pitch created successfully",
      data: {
        pitch: newPitch,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((el) => el.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(" | "),
      });
    }

    res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};

//get all pitches
exports.getAllPitches = async (req, res) => {
  try {
    //optional search by name (case-insensitive)
    const nameQuery = req.query.name;
    const filter = nameQuery
      ? { name: { $regex: nameQuery, $options: "i" } }
      : {};

    //fitch pitches from db
    const pitches = await Pitch.find(filter);

    //respond with pitch list
    res.status(200).json({
      status: "success",
      results: pitches.length,
      data: {
        pitches,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve pitches. Please try again.",
    });
  }
};

//get pitch by id
exports.getPitchById = async (req, res) => {
  try {
    //get the pitch
    const pitchId = req.params.id;
    const pitch = await Pitch.findById(pitchId);

    if (!pitch) {
      return res.status(404).json({
        status: "fail",
        message: "Pitch not found",
      });
    }

    //response
    res.status(200).json({
      status: "success",
      data: {
        pitch,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve pitch. Please try again.",
    });
  }
};

//delete pitch
exports.deletePitch = async (req, res) => {
  try {
    const pitchId = req.params.id;

    //check if pitch exists
    const pitch = await Pitch.findById(pitchId);
    if (!pitch) {
      return res.status(404).json({
        status: "fail",
        message: "Pitch not found",
      });
    }

    //find all future reservations for this pitch
    const now = new Date();
    const reservations = await Reservation.find({
      pitch: pitch._id,
      startTime: { $gte: now },
    }).populate("currentPlayers", "firstName lastName email");

    //send email to each player in each reservation
    for (const reservation of reservations) {
      for (const player of reservation.currentPlayers) {
        const { subject, html } = pitchDeletedTemplate({
          firstName: player.firstName,
          lastName: player.lastName,
          reservationTitle: reservation.title,
          pitchName: pitch.name,
          reservationDate: reservation.startTime.toLocaleDateString(),
          startTime: reservation.startTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          endTime: reservation.endTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });

        await sendEmail({
          to: player.email,
          subject,
          html,
          text: `The pitch ${pitch.name} has been deleted. Your reservation "${reservation.title}" has been cancelled.`,
        });
      }

      //delete reservation
      await Reservation.findByIdAndDelete(reservation._id);
    }

    //delete the pitch
    await Pitch.findByIdAndDelete(pitchId);

    res.status(200).json({
      status: "success",
      message: "Pitch and all related reservations deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete pitch and reservations. Please try again.",
    });
  }
};
