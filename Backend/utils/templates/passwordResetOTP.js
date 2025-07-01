const baseLayout = require("./baseLayout");

module.exports = ({ firstName, lastName, otp }) => {
  const userName = `${firstName} ${lastName}`;

  const content = `
    <h2 style="color: #0984e3;">Hello ${userName},</h2>
    <p>You requested to reset your BOKIT password.</p>
    <p>Use the following OTP to verify your identity:</p>
    <div style="font-size: 24px; font-weight: bold; background: #f1f2f6; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0;">
      ${otp}
    </div>
    <p>This code is valid for <strong>1 minute</strong>.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p style="margin-top: 20px;">— The BOKIT Team</p>
  `;

  return {
    subject: "Password Reset Code",
    html: baseLayout(content),
  };
};
