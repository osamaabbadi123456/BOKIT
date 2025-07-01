//modules
const nodemailer = require("nodemailer");

//create transporter using Gmail SMTP and environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, //SMTP host, e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT, //port: 587 for TLS
  secure: true, //true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USERNAME, //your Gmail address
    pass: process.env.EMAIL_PASSWORD, //app password from Google
  },
});

//reusable function to send emails
const sendEmail = async (options) => {
  //email options
  const mailOptions = {
    from: process.env.EMAIL_FROM, //from name and email
    to: options.to, //receiver email
    subject: options.subject, //email subject
    text: options.text, //plain text content
    html: options.html, //optional: HTML content
  };

  //send email
  await transporter.sendMail(mailOptions);
};

//export the function for use in other files
module.exports = sendEmail;
