'use server';

import { auth, signOut } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { sendEmail } from './email'; // your mailer

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/////////////////////////////////////////////////////
//UPDATE PROFILE
/////////////////////////////////////////////////////

export async function updateProfileAdmin(formData) {
  try {
    const session = await auth();

    if (!session?.user?.adminId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createAdminSupabaseClient();

    const fullName = formData.get('fullName')?.trim();
    const telephone = formData.get('telephone')?.trim();
    const email = formData.get('email')?.trim();

    // ===============================
    // VALIDATION
    // ===============================
    if (!fullName || !telephone || !email) {
      return { success: false, error: 'All fields are required' };
    }

    const phoneRegex = /^[0-9]{9,12}$/;
    if (!phoneRegex.test(telephone)) {
      return { success: false, error: 'Invalid Telephone Number' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid Email Format' };
    }

    // ===============================
    // DB UPDATE
    // ===============================
    const { error } = await supabase
      .from('admins')
      .update({
        fullName,
        telephone,
        email,
      })
      .eq('id', session.user.adminId);

    if (error) {
      return { success: false, error: 'Admin could not be updated' };
    }

    revalidatePath('/admin/profile');

    // IMPORTANT: DO NOT signOut here (breaks server action flow)

    return {
      success: true,
      signOut: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Unexpected server error',
    };
  }
}

export async function updateProfileAdmin_old(formData) {
  
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  if (!session) throw new Error('Login First to Update Profile');
  const fullName = formData.get('fullName');
  const telephone = formData.get('telephone');
  const email = formData.get('email');
  const regex = /^[0-9]{9,12}$/;

  if (!regex.test(telephone)) throw new Error('Invalid Telephone Number');
  const updateData = { fullName, telephone, email };

  const { data, error } = await supabase
    .from('admins')
    .update(updateData)
    .eq('id', session.user.adminId);

  if (error) {
    throw new Error('Admin could not be updated');
  }

  revalidatePath('/admin/profile');
  await signOut({
    redirectTo: '/admin-login',
    redirect: true,
  });
}

//--------------------------------------------------
// GET ADMIN
//--------------------------------------------------
export async function getAdmin(email) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, fullName, telephone')
    .eq('email', email)
    .single();
  return data;
}

//------------------------------------------------------
//SET ADMIN OTP
//------------------------------------------------------

export async function sendProfileOtp() {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Invalidate ALL previous unused OTPs
  await supabase
    .from('admin_profile_otps')
    .update({ used: true })
    .eq('admin_id', session.user.adminId)
    .eq('used', false);

  // 2️⃣ Generate new OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 3️⃣ Insert new OTP
  await supabase.from('admin_profile_otps').insert({
    admin_id: session.user.adminId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  // 4️⃣ Send email
  await sendEmail({
    to: session.user.email,
    subject: 'Profile Verification Code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

 
}

export async function verifyProfileOtp(code) {
  const session = await auth();
  
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();
  const normalized = String(code).trim();

  const { data: rows } = await supabase
    .from('admin_profile_otps')
    .select('*')
    .eq('admin_id', session.user.adminId)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!rows || rows.length === 0) {
    throw new Error('No active code found. Please request a new code.');
  }

  const otp = rows[0];

  if (new Date(otp.expires_at) < new Date()) {
    throw new Error('Code expired. Please request a new code.');
  }
  const inputHash = crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');

  if (inputHash !== otp.code_hash) {
    throw new Error('Invalid code.');
  }

  await supabase
    .from('admin_profile_otps')
    .update({ used: true })
    .eq('id', otp.id);

  return true;
}

