//modules
const cron = require("node-cron");
const updateLeaderboard = require("./updateLeaderboards");

//schedule the job to run once a day (min hour day month day of week)
cron.schedule("25 4 * * *", async () => {
  console.log("Running daily leaderboard update...");
  await updateLeaderboard();
});
