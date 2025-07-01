//modules
const Reservation = require("../models/reservationModel");
const Pitch = require("../models/pitchModel");
const User = require("../models/userModel");
const Badge = require("../models/badgeModel");
const sendEmail = require("../utils/email");
const reservationRemovedTemplate = require("../utils/templates/reservationRemoved");
const userKickedTemplate = require("../utils/templates/userKicked");
const userSuspendedTemplate = require("../utils/templates/userSuspended");
const waitlistAvailableTemplate = require("../utils/templates/waitlistAvailable");

//helper:assign badges to a user based on updated stats
const assignBadgesToUser = async (user) => {
  //list of all supported badge types
  const badgeTypes = [
    "matches",
    "goals",
    "assists",
    "mvp",
    "interceptions",
    "cleanSheets",
    "wins",
  ];

  for (const type of badgeTypes) {
    //fetch the badge config from DB by type (e.g., "goals", "matches")
    const badge = await Badge.findOne({ type });
    if (!badge) continue; //skip if no badge found for this stat

    const userStat = user.stats[type] || 0;

    //loop through each level of this badge
    for (const level of badge.levels) {
      //check if user already has this badge
      const userBadgeIndex = user.badges.findIndex(
        (b) => b.name === badge.name
      );

      if (userStat >= level.requiredValue) {
        if (userBadgeIndex === -1) {
          //add new badge if not present
          user.badges.push({
            name: badge.name,
            description: badge.description,
            level: level.level,
          });
        } else if (user.badges[userBadgeIndex].level < level.level) {
          //upgrade existing badge to a higher level
          user.badges[userBadgeIndex].level = level.level;
        }
      }
    }
  }
  //save updated user with new or upgraded badges
  await user.save();
};

//create a reservation
exports.createReservation = async (req, res) => {
  try {
    const { title, pitch, date, startTime, endTime, price, maxPlayers } =
      req.body;

    //combine date with time strings into full Date objects
    const start = new Date(`${date} ${startTime}`);
    const end = new Date(`${date} ${endTime}`);

    //validate that start and end are valid
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid startTime or endTime format",
      });
    }
    //ensuring there is five days left
    const now = new Date();
    const diffInMs = start - now;
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;

    if (diffInMs < fiveDaysInMs) {
      return res.status(400).json({
        status: "fail",
        message: "Reservation must be scheduled at least 5 days from now.",
      });
    }

    //validate max duration = 2 hours
    const durationInMs = end - start;
    const twoHours = 2 * 60 * 60 * 1000;
    if (durationInMs > twoHours) {
      return res.status(400).json({
        status: "fail",
        message: "Reservation duration cannot exceed 2 hours",
      });
    }

    //ensure pitch exists
    const pitchExists = await Pitch.findById(pitch);
    if (!pitchExists) {
      return res.status(404).json({
        status: "fail",
        message: "Pitch not found",
      });
    }

    //check for overlapping reservations on the same pitch
    const conflict = await Reservation.findOne({
      pitch: pitch,
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        status: "fail",
        message:
          "There is already another reservation for this pitch during that time.",
      });
    }

    //create reservation instance
    const newReservation = new Reservation({
      title,
      pitch,
      date: new Date(date),
      startTime: start,
      endTime: end,
      price,
      maxPlayers,
    });

    //let Mongoose validate the fields
    await newReservation.validate();

    //save to database
    await newReservation.save();

    //respond with success
    res.status(201).json({
      status: "success",
      message: "Reservation created successfully",
      data: {
        reservation: newReservation,
      },
    });
  } catch (err) {
    //handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((el) => el.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(" | "),
      });
    }

    res.status(500).json({
      status: "error",
      message: "Failed to create reservation",
    });
  }
};

//get all reservations
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate({
        path: "pitch",
        select: "name backgroundImage playersPerSide city location services",
      })
      .populate("currentPlayers", "firstName lastName profilePicture")
      .populate("waitList", "firstName lastName profilePicture");

    //format pitch playersPerSide as "5v5"
    const formatted = reservations.map((resv) => {
      const pitch = resv.pitch;
      const isAdmin = req.user && req.user.role === "admin";

      return {
        ...resv._doc,
        pitch: {
          ...pitch._doc,
          format: `${pitch.playersPerSide}v${pitch.playersPerSide}`,
        },
        waitList: isAdmin ? resv.waitList : [],
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
      message: "Failed to retrieve reservations",
    });
  }
};

//get reservation by id
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({
        path: "pitch",
        select: "name backgroundImage playersPerSide city location services",
      })
      .populate("currentPlayers", "firstName lastName profilePicture")
      .populate("waitList", "firstName lastName profilePicture");

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    //format pitch playersPerSide and hide waitList for non-admins
    const pitch = reservation.pitch;
    const isAdmin = req.user && req.user.role === "admin";

    const formatted = {
      ...reservation._doc,
      pitch: {
        ...pitch._doc,
        format: `${pitch.playersPerSide}v${pitch.playersPerSide}`,
      },
      waitList: isAdmin ? reservation.waitList : [],
    };

    res.status(200).json({
      status: "success",
      data: {
        reservation: formatted,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve reservation",
    });
  }
};

//join reservation (player)
exports.joinReservation = async (req, res) => {
  try {
    const userId = req.user._id;

    //fetch the reservation
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    //check if the user is suspended
    if (req.user.suspendedUntil && req.user.suspendedUntil > Date.now()) {
      return res.status(403).json({
        status: "fail",
        message: `You are suspended until ${new Date(
          req.user.suspendedUntil
        ).toLocaleString()}`,
      });
    }

    //check reservation is upcoming and within 3 days
    const now = new Date();
    const daysDiff = (reservation.startTime - now) / (1000 * 60 * 60 * 24);
    if (now > reservation.startTime || daysDiff > 3) {
      return res.status(400).json({
        status: "fail",
        message:
          "You can only join reservations that are upcoming and within 3 days",
      });
    }

    //check if already joined
    if (reservation.currentPlayers.includes(userId)) {
      return res.status(400).json({
        status: "fail",
        message: "You have already joined this reservation",
      });
    }

    //check for time conflicts in other reservations
    const conflict = await Reservation.findOne({
      currentPlayers: userId,
      _id: { $ne: reservation._id },
      startTime: { $lt: reservation.endTime },
      endTime: { $gt: reservation.startTime },
    });

    if (conflict) {
      return res.status(400).json({
        status: "fail",
        message: "You have another reservation that overlaps with this one",
      });
    }

    //add to currentPlayers if space is available, else to waitList
    if (reservation.currentPlayers.length < reservation.maxPlayers) {
      reservation.currentPlayers.push(userId);
      await reservation.save();
      return res.status(200).json({
        status: "success",
        message: "You have joined the reservation",
      });
    } else {
      if (!reservation.waitList.includes(userId)) {
        reservation.waitList.push(userId);
        await reservation.save();
        return res.status(200).json({
          status: "success",
          message: "Reservation is full, you have been added to the waitlist",
        });
      } else {
        return res.status(400).json({
          status: "fail",
          message: "You are already in the waitlist",
        });
      }
    }
  } catch (err) {
    console.error("Error in joinReservation:", err); //for validation
    res.status(500).json({
      status: "error",
      message: "Failed to join reservation",
    });
  }
};

//cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const userId = req.user._id;
    const reservation = await Reservation.findById(req.params.id)
      .populate("pitch")
      .populate("currentPlayers", "_id firstName lastName email");

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    //check if user is in currentPlayers
    const index = reservation.currentPlayers.findIndex(
      (player) => player._id.toString() === userId.toString()
    );
    if (index === -1) {
      return res.status(400).json({
        status: "fail",
        message: "You are not part of this reservation",
      });
    }

    //check if >6 hours remain
    const now = new Date();
    const diffMs = reservation.startTime - now;
    if (diffMs < 6 * 60 * 60 * 1000) {
      return res.status(400).json({
        status: "fail",
        message: "You can't cancel less than 6 hours before start time",
      });
    }

    //remove user from currentPlayers
    reservation.currentPlayers.splice(index, 1);
    await reservation.save();

    //notify waitlist if a slot is now available
    if (
      reservation.waitList.length > 0 &&
      reservation.currentPlayers.length < reservation.maxPlayers
    ) {
      const waitlistedUsers = await User.find({
        _id: { $in: reservation.waitList },
      });

      for (const waitUser of waitlistedUsers) {
        const { subject, html } = waitlistAvailableTemplate({
          firstName: waitUser.firstName,
          lastName: waitUser.lastName,
          title: reservation.title,
          pitchName: reservation.pitch.name,
          date: reservation.startTime.toLocaleDateString(),
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
          to: waitUser.email,
          subject,
          html,
          text: `A spot is now available in reservation "${reservation.title}" at ${reservation.pitch.name}.`,
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Reservation cancelled successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to cancel reservation",
    });
  }
};

//cancel waitlist
exports.removeFromWaitlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    const index = reservation.waitList.indexOf(userId);
    if (index === -1) {
      return res.status(400).json({
        status: "fail",
        message: "You are not in the waitlist",
      });
    }

    reservation.waitList.splice(index, 1);
    await reservation.save();

    res.status(200).json({
      status: "success",
      message: "You have been removed from the waitlist",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to remove from waitlist",
    });
  }
};

//delete reservation
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("currentPlayers", "firstName lastName email")
      .populate("pitch");

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    //only allow deletion if the reservation is still upcoming
    const now = new Date();
    if (now >= new Date(reservation.startTime)) {
      return res.status(400).json({
        status: "fail",
        message: "You can only delete reservations that are upcoming",
      });
    }

    //send email to all players
    for (const player of reservation.currentPlayers) {
      const { subject, html } = reservationRemovedTemplate({
        firstName: player.firstName,
        lastName: player.lastName,
        reservationTitle: reservation.title,
        pitchName: reservation.pitch.name,
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
        text: `Your reservation at ${reservation.pitch.name} was cancelled.`,
      });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Reservation deleted",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete reservation",
    });
  }
};

//kick player
exports.kickPlayer = async (req, res) => {
  try {
    const { userId, reason, suspensionDays } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate("pitch")
      .populate("currentPlayers", "firstName lastName email");

    if (!reservation) {
      return res.status(404).json({
        status: "fail",
        message: "Reservation not found",
      });
    }

    //only allow kicking if reservation hasn't started yet
    if (new Date() >= reservation.startTime) {
      return res.status(400).json({
        status: "fail",
        message: "You can only kick players from upcoming reservations",
      });
    }

    //remove player from currentPlayers
    const index = reservation.currentPlayers.findIndex(
      (player) => player._id.toString() === userId
    );
    if (index === -1) {
      return res.status(400).json({
        status: "fail",
        message: "Player is not part of this reservation",
      });
    }

    const player = reservation.currentPlayers[index];
    reservation.currentPlayers.splice(index, 1);
    await reservation.save();

    //suspend user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }
    user.suspendedUntil = new Date(
      Date.now() + suspensionDays * 24 * 60 * 60 * 1000
    );
    user.suspensionReason = reason;
    await user.save();

    //send kick email
    const { subject, html } = userKickedTemplate({
      firstName: player.firstName,
      lastName: player.lastName,
      title: reservation.title,
      pitchName: reservation.pitch.name,
      date: reservation.startTime.toLocaleDateString(),
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
      suspensionReason: reason,
      suspendedUntil: user.suspendedUntil.toLocaleDateString(),
    });

    await sendEmail({
      to: player.email,
      subject,
      html,
      text: `You have been removed from reservation "${reservation.title}" at ${
        reservation.pitch.name
      }. Reason: ${reason}. Suspended until ${user.suspendedUntil.toLocaleDateString()}`,
    });

    //notify waitlist if slot is now available
    if (
      reservation.waitList.length > 0 &&
      reservation.currentPlayers.length < reservation.maxPlayers
    ) {
      const waitlistedUsers = await User.find({
        _id: { $in: reservation.waitList },
      });

      for (const waitUser of waitlistedUsers) {
        const { subject, html } = waitlistAvailableTemplate({
          firstName: waitUser.firstName,
          lastName: waitUser.lastName,
          title: reservation.title,
          pitchName: reservation.pitch.name,
          date: reservation.startTime.toLocaleDateString(),
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
          to: waitUser.email,
          subject,
          html,
          text: `A spot is now available in reservation "${reservation.title}" at ${reservation.pitch.name}.`,
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Player was kicked and suspended",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to kick player",
    });
  }
};

//add summary
exports.addSummary = async (req, res) => {
  try {
    const { mvp, players, absentees } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res
        .status(404)
        .json({ status: "fail", message: "Reservation not found" });
    }

    //reservation must be completed
    if (new Date() < reservation.endTime) {
      return res.status(400).json({
        status: "fail",
        message: "You can only add a summary to a completed reservation",
      });
    }

    //update stats for each player
    for (const playerStat of players) {
      //check if player was in the reservation's currentPlayers
      if (!reservation.currentPlayers.includes(playerStat.userId)) {
        continue; //skip unauthorized player stat entry
      }

      const user = await User.findById(playerStat.userId);
      if (!user) continue;

      if (playerStat.played) user.stats.matches += 1;
      if (playerStat.won) user.stats.wins += 1;
      if (playerStat.goals) user.stats.goals += playerStat.goals;
      if (playerStat.assists) user.stats.assists += playerStat.assists;
      if (playerStat.interceptions)
        user.stats.interceptions += playerStat.interceptions;
      if (playerStat.cleanSheet) user.stats.cleanSheets += 1;
      if (playerStat.userId === mvp) user.stats.mvp += 1;

      await user.save();
      await assignBadgesToUser(user);
    }

    //suspend absentees
    for (const absentee of absentees) {
      if (!reservation.currentPlayers.includes(absentee.userId)) {
        continue;
      }

      const user = await User.findById(absentee.userId);
      if (!user) continue;

      user.suspendedUntil = new Date(
        Date.now() + absentee.suspensionDays * 24 * 60 * 60 * 1000
      );
      user.suspensionReason = absentee.reason;

      await user.save();

      const { subject, html } = userSuspendedTemplate({
        firstName: user.firstName,
        lastName: user.lastName,
        suspensionReason: user.suspensionReason,
        suspendedUntil: user.suspendedUntil.toLocaleDateString(),
      });

      await sendEmail({
        to: user.email,
        subject,
        html,
        text: `You have been suspended from BOKIT. Reason: ${
          user.suspensionReason
        }. Until: ${user.suspendedUntil.toLocaleDateString()}`,
      });
    }

    //delete the reservation
    await Reservation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Summary added, stats updated, reservation deleted",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to add summary",
    });
  }
};
