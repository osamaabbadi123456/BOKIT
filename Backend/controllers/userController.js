//modules
const User = require("../models/userModel");
const Reservation = require("../models/reservationModel");

//get my profile
exports.getMyProfile = async (req, res) => {
  try {
    //get the logged-in user's full data from the DB
    const user = await User.findById(req.user._id).select(
      "-password -__v -suspensionReason" //exclude fields
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch profile. Please try again.",
    });
  }
};

//edit profile
exports.updateMyProfile = async (req, res) => {
  try {
    const updates = {};

    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "age",
      "preferredPosition",
      "bio",
    ];

    //get updated fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    //if profile picture is uploaded
    if (req.file && req.file.path) {
      updates.profilePicture = req.file.path;
    }

    //update
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -__v -role -suspensionReason");

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to update profile. Please try again.",
    });
  }
};

//delete my account
exports.deleteMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    //remove user from currentPlayers and waitList in reservations
    await Reservation.updateMany(
      {},
      {
        $pull: {
          currentPlayers: userId,
          waitList: userId,
        },
      }
    );

    //delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      status: "success",
      message: "Account deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete account. Please try again.",
    });
  }
};

//show another
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const requester = req.user || null;

    const user = await User.findById(userId).select(
      "-password -__v -suspensionReason"
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    //if the requester is a player and not viewing themselves or guest, hide private fields
    const isGuest = !requester;
    const isDifferentPlayer =
      requester &&
      requester.role === "player" &&
      !user._id.equals(requester._id);

    if (isGuest || isDifferentPlayer) {
      user.email = undefined;
      user.phone = undefined;
      user.suspendedUntil = undefined;
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user profile",
    });
  }
};

//get my bookings
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const reservations = await Reservation.find({
      currentPlayers: userId,
    })
      .populate({
        path: "pitch",
        select: "name backgroundImage playersPerSide city location services",
      })
      .populate("currentPlayers", "firstName lastName profilePicture")
      .populate("waitList", "firstName lastName profilePicture");

    //format pitch and exclude waitList
    const formatted = reservations.map((resv) => {
      const pitch = resv.pitch;

      return {
        ...resv._doc, //access the object
        pitch: {
          ...pitch._doc,
          format: `${pitch.playersPerSide}v${pitch.playersPerSide}`,
        },
        waitList: [], //always hidden for players
      };
    });

    res.status(200).json({
      status: "success",
      results: formatted.length,
      data: {
        reservations: formatted,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve your bookings",
    });
  }
};
