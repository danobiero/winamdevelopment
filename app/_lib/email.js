// app/_lib/email.js
import 'server-only';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, text }) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject,
    text,
  });
}
