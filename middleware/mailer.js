const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendEmail = (from, subject, to, html, cb) => {
  const mailOptions = {
    from,
    to,
    subject,
    html,
  };

  transport.sendMail(mailOptions, (err, info) => {
    if (err) cb(err, null);
    else cb(null, info);
  });
};

module.exports = sendEmail;
