import 'server-only';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"WINAM Support" <${process.env.GMAIL_USER}>`,
      replyTo: process.env.GMAIL_USER,
      to,
      subject,
      text, 
      html, 
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
}
