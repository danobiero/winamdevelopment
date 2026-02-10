'use server';

import crypto from 'crypto';
import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { sendEmail } from './email';

export async function sendProfileOtp() {
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
