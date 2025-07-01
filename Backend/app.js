//modules
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const pitchRouter = require("./routes/pitchRouter");
const reservationRouter = require("./routes/reservationRouter");
const leaderboardRouter = require("./routes/leaderboardRouter");
require("./utils/leaderboardCron"); //to run the cron job

//initializing the express app
const app = express();

//middlewares
app.use(morgan("dev")); //logging
app.use(express.json()); //parse JSON request bodies
app.use(cors({ origin: "http://localhost:8080" })); //allow requests from frontend

//routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/pitches", pitchRouter);
app.use("/reservations", reservationRouter);
app.use("/leaderboards", leaderboardRouter);

//exporting the app
module.exports = app;
