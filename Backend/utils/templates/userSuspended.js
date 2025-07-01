const baseLayout = require("./baseLayout");

module.exports = ({
  firstName,
  lastName,
  suspensionReason,
  suspendedUntil,
}) => {
  const userName = `${firstName} ${lastName}`;

  const content = `
    <h2 style="color: #d63031;">Hello ${userName},</h2>
    <p>We wanted to let you know that your account has been <strong>suspended</strong>.</p>
    <p><strong>Reason:</strong> ${suspensionReason}</p>
    <p><strong>Suspended Until:</strong> ${suspendedUntil}</p>
    <p>Please review our platform policies. If you believe this was a mistake, feel free to contact support.</p>
    <p style="margin-top: 20px;">— The BOKIT Team</p>
  `;

  return {
    subject: "Account Suspension Notice",
    html: baseLayout(content),
  };
};
