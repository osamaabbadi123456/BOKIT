const baseLayout = require("./baseLayout");

module.exports = ({
  firstName,
  lastName,
  reservationTitle,
  pitchName,
  reservationDate,
  startTime,
  endTime,
}) => {
  const userName = `${firstName} ${lastName}`;

  const content = `
    <h2 style="color: #00B894;">Hello ${userName},</h2>
    <p>Your reservation <strong>${reservationTitle}</strong> has been <strong>cancelled</strong>.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li><strong>Pitch:</strong> ${pitchName}</li>
      <li><strong>Date:</strong> ${reservationDate}</li>
      <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
    </ul>
    <p>We’re sorry for the inconvenience. Please contact support if needed.</p>
    <p style="margin-top: 20px;">— The BOKIT Team</p>
  `;

  return {
    subject: "Reservation Cancelled",
    html: baseLayout(content),
  };
};
