const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT, // 587 (TLS) or 465 (SSL)
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 */
const sendOtpEmail = async (to, otp) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🔐 FreelanceHub Password Reset</h2>
      <p>You requested to reset your password. Use the OTP below:</p>
      <h1 style="background-color: #f3f4f6; padding: 15px 30px; border-radius: 8px; display: inline-block;">
        ${otp}
      </h1>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p style="font-size: 12px; color: gray;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || `"FreelanceHub" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your FreelanceHub OTP",
      html: htmlContent,
    });

    console.log(`✅ OTP email sent to ${to} | Message ID: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
    throw err;
  }
};

module.exports = sendOtpEmail;
