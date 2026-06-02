const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (options) => {
  try {
    const fromName = process.env.EMAIL_FROM_NAME || 'TourBooker';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@tourbooker.com';

    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Email sending failed to ${options.to}:`, error.message);
    // Silent fail to ensure we never crash the server loop during email transport
  }
};

module.exports = {
  transporter,
  sendEmail
};
