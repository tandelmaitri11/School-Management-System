const nodemailer = require("nodemailer");

const getMailer = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const transporter = getMailer();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
    to,
    subject,
    html,
    text,
    attachments,
  });
};

module.exports = { sendEmail };
