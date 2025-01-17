const nodemailer = require("nodemailer");
const { config } = require("../../config");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: config.email_service,
  auth: {
    user: config.email_from,
    pass: config.email_password,
  },
});

const sendMail = async (options, res) => {
  try {
    const mailOptions = {
      from: config.email_from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // send mail to the specified email address
    await transporter.sendMail(mailOptions);
  } catch (error) {
    return res.status(422).json({
      message: "Failed to send verification code",
      error: error.message,
    });
  }
};

module.exports = { sendMail };
