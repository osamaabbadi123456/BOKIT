const baseLayout = require("./baseLayout");

module.exports = ({
  firstName,
  lastName,
  title,
  pitchName,
  date,
  startTime,
  endTime,
  suspensionReason,
  suspendedUntil,
}) => {
  const userName = `${firstName} ${lastName}`;

  const content = `
    <h2 style="color: #e17055;">Hello ${userName},</h2>
    <p>You have been <strong>removed</strong> from the following reservation:</p>
    <p><strong>Reservation:</strong> ${title}</p>
    <ul>
      <li><strong>Pitch:</strong> ${pitchName}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
    </ul>
    <p><strong>Reason for Suspension:</strong> ${suspensionReason}</p>
    <p><strong>Suspended Until:</strong> ${suspendedUntil}</p>
    <p>If you believe this was a mistake, you may contact our support team for clarification or appeal.</p>
    <p style="margin-top: 20px;">— The BOKIT Team</p>
  `;

  return {
    subject: "Suspension Notice - Kicked from Reservation",
    html: baseLayout(content),
  };
};
