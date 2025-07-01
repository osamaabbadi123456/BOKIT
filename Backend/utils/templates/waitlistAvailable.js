const baseLayout = require("./baseLayout");

module.exports = ({
  firstName,
  lastName,
  title,
  pitchName,
  date,
  startTime,
  endTime,
}) => {
  const userName = `${firstName} ${lastName}`;

  const content = `
    <h2 style="color: #0984e3;">Hello ${userName},</h2>
    <p>Good news! A spot has become <strong>available</strong> in a reservation you’re waitlisted for.</p>
    <p><strong>Reservation:</strong> ${title}</p>
    <ul>
      <li><strong>Pitch:</strong> ${pitchName}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
    </ul>
    <p>Hurry up and join before someone else grabs the spot!</p>
    <p style="margin-top: 20px;">— The BOKIT Team</p>
  `;

  return {
    subject: "A Spot Just Opened Up",
    html: baseLayout(content),
  };
};
