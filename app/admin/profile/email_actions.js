'use server';

import crypto from 'crypto';
import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { sendEmail } from './email';

export async function sendProfileOtp() {
  const session = await auth();

  if (!session?.user?.adminId || !session?.user?.email) {
    throw new Error('Unauthorized or missing email');
  }

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 2️⃣ Hash it for security
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 3️⃣ Store OTP in DB
  const { error } = await supabase.from('admin_profile_otps').insert({
    admin_id: session.user.adminId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (error) throw new Error('Failed to store verification code');

  // 4️⃣ Define the Content
  const subject = 'WINAM Profile Verification Code';
  const textContent = `Your WINAM verification code is: ${code}. This code expires in 10 minutes.`;

  // Cleaned HTML with more robust CSS for Gmail/Outlook
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table role="presentation" width="100%" style="max-width:500px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;" cellspacing="0" cellpadding="32">
              <tr>
                <td>
                  <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="margin:0;font-size:28px;color:#0f172a;">WINAM</h1>
                    <p style="margin:4px 0 0;color:#475569;font-size:14px;">Practical Financial Foundation</p>
                  </div>
                  
                  <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Profile Verification Code</h2>
                  <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">Use the code below to update your profile. It expires in 10 minutes.</p>
                  
                  <div style="margin:24px 0;text-align:center;">
                    <div style="display:inline-block;background:#eff6ff;color:#1e3a8a;font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 24px;border-radius:12px;border:1px solid #bfdbfe;">
                      ${code}
                    </div>
                  </div>
                  
                  <p style="margin:24px 0 0;color:#64748b;font-size:13px;text-align:center;border-top:1px solid #e5e7eb;padding-top:24px;">
                    Sent by WINAM
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();

  // 5️⃣ Send the email
  return await sendEmail({
    to: session.user.email,
    subject: subject,
    text: textContent,
    html: htmlContent,
  });
}

export async function sendProfileOtp_old_1() {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 2️⃣ Hash it
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  // 3️⃣ Set expiration (10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 4️⃣ Store OTP in DB
  await supabase.from('admin_profile_otps').insert({
    admin_id: session.user.adminId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  // 5️⃣ Send branded email
  await sendEmail({
    to: session.user.email,
    subject: 'WINAM Profile Verification Code',
    text: `WINAM Profile Verification

Your verification code is: ${code}

This code expires in 10 minutes.

If you did not request this code, secure your account immediately.

WINAM
Practical Financial Foundation`,
    html: `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="margin:0;font-size:28px;color:#0f172a;">WINAM</h1>
              <p style="margin:8px 0 0;color:#475569;font-size:14px;">
                Practical Financial Foundation
              </p>
            </div>

            <h2 style="margin:0 0 12px;color:#0f172a;font-size:22px;">
              Profile Verification Code
            </h2>

            <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
              Use the verification code below to continue updating your profile.
            </p>

            <div style="margin:24px 0;text-align:center;">
              <div style="display:inline-block;background:#eff6ff;color:#1e3a8a;
                          font-size:32px;font-weight:700;letter-spacing:8px;
                          padding:16px 24px;border-radius:12px;border:1px solid #bfdbfe;">
                ${code}
              </div>
            </div>

            <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
              This code expires in <strong>10 minutes</strong>.
            </p>

            <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
              If you did not request this code, you can safely ignore this email.
            </p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

            <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
              Sent by WINAM
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendProfileOtp_old() {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 2️⃣ Hash it
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  // 3️⃣ Set expiration (10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 4️⃣ Store OTP in DB
  await supabase.from('admin_profile_otps').insert({
    admin_id: session.user.adminId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  // 5️⃣ SEND EMAIL  ← THIS IS WHERE IT GOES
  await sendEmail({
    to: session.user.email,
    subject: 'Profile Verification Code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });
}
