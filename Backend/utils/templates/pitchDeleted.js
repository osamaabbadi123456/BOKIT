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
    <h2 style="color: #d63031;">Hello ${userName},</h2>
    <p>We regret to inform you that the pitch <strong>${pitchName}</strong> has been deleted, which affected your reservation:</p>
    <p><strong>Reservation:</strong> ${reservationTitle}</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li><strong>Date:</strong> ${reservationDate}</li>
      <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
    </ul>
    <p>This reservation has been cancelled automatically as a result.</p>
    <p>If you have any questions or need to rebook, feel free to contact our support.</p>
    <p style="margin-top: 20px;">— The BOKIT Team</p>
  `;

  return {
    subject: `Pitch "${pitchName}" Deleted`,
    html: baseLayout(content),
  };
};
