'use server';

import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { sendEmail } from '../admin/profile/email';
import crypto from 'crypto';

export async function sendAdminOtp() {
  const supabase = createAdminSupabaseClient();

  // 1️⃣ Securely fetch the designated Admin Email from Environment
  const targetEmail = process.env.ADMIN_EMAIL;

  // 2️⃣ Verify this email actually exists in your new 'admins' table
  const { data: adminRecord, error: adminError } = await supabase
    .from('admins')
    .select('id, email')
    .eq('email', targetEmail)
    .single();

  if (adminError || !adminRecord) {
    console.error('Access Attempt: Email not found in admins table.');
    throw new Error('Access Denied: Unauthorized Identity.');
  }

  // 3️⃣ Invalidate old OTPs for this specific Admin ID
  await supabase
    .from('admin_login_otps')
    .update({ used: true })
    .eq('internal_id', adminRecord.id) // Using the UUID from your admins table
    .eq('used', false);

  // 4️⃣ Generate & Hash OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 10000).toISOString();

  // 5️⃣ Insert into the OTP table
  const { error: otpError } = await supabase.from('admin_login_otps').insert({
    internal_id: adminRecord.id,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (otpError) throw new Error('Security Gateway Timeout.');

  // 6️⃣ Dispatch Email
  await sendEmail({
    to: adminRecord.email,
    subject: 'PRAXIDA | Admin Access Code',
    text: `Your one-time access code is: ${code}. This code expires in 10 minutes.`,
  });

  return { success: true };
}

export async function verifyAdminOtp(code) {
  const supabase = createAdminSupabaseClient();
  const targetEmail = process.env.ADMIN_EMAIL; // The same email used in 'send'

  // 1️⃣ Get the Admin ID first (to match the internal_id in the OTP table)
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', targetEmail)
    .single();

  if (!admin) throw new Error('Security Error: Admin record missing.');

  // 2️⃣ Query the OTP table using that specific ID
  const { data: rows, error } = await supabase
    .from('admin_login_otps')
    .select('*')
    .eq('internal_id', admin.id) // Use the UUID from the DB, not the .env variable
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !rows?.length) {
    throw new Error('Invalid or expired code.');
  }

  const otp = rows[0];
  const inputHash = crypto
    .createHash('sha256')
    .update(String(code).trim())
    .digest('hex');

  if (inputHash !== otp.code_hash) {
    throw new Error('Invalid code.');
  }

  // 3️⃣ Success - Mark as used
  await supabase
    .from('admin_login_otps')
    .update({ used: true })
    .eq('id', otp.id);
  return true;
}