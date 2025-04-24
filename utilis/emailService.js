const nodemailer = require('nodemailer');

const sendEmail = async (toEmail, subject, text) => {
  // Create a transporter using Mailtrap's SMTP settings from .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,  // Mailtrap's SMTP server
    port: process.env.SMTP_PORT,  // Mailtrap's port (2525)
    auth: {
      user: process.env.SMTP_USER,    // Mailtrap's username
      pass: process.env.SMTP_PASSWORD, // Mailtrap's password
    },
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, // Sender details
    to: toEmail,   // Receiver's email
    subject: subject,  // Email subject
    text: text,    // Email body text
  };

  try {
    await transporter.sendMail(mailOptions);  // Send the email
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
