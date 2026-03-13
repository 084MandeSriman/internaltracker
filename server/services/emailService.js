import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Galacticos HR" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

export const sendSetPasswordEmail = async (email, name, token) => {
  const setPasswordUrl = `http://localhost:5173/set-password?token=${token}`;
  const subject = "Welcome to Galacticos HR - Set Your Password";
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome, ${name}!</h2>
      <p>An administrator has created an account for you on Galacticos HR.</p>
      <p>Please click the button below to set your password and access your account.</p>
      <a href="${setPasswordUrl}" style="display: inline-block; padding: 10px 20px; background-color: #14b8a6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Set Password</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser: <br/>${setPasswordUrl}</p>
    </div>
  `;
  await sendEmail(email, subject, html);
};