'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import { revalidatePath } from 'next/cache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getMembershipApplications({ from, to, searchApplicant }) {
  let query = supabase
    .from('membership_applications')
    .select('*')
    .eq('is_archived', false);

  if (searchApplicant) {
    query = query.or(`full_name.ilike.%${searchApplicant}%,email.ilike.%${searchApplicant}%`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data;
}

export async function getMembershipApplicationById(id) {
  const { data, error } = await supabase
    .from('membership_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveRejectionPolicies() {
  const { data, error } = await supabase
    .from('membership_rejection_policies')
    .select('id, code, title')
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (error) throw error;
  return data;
}

export async function processApplicationAction_old(applicationId, formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const status = formData.get('status'); // 'approved' or 'rejected'
  const decisionResult = formData.get('decision_result'); // The policy string

  const { error } = await supabase
    .from('membership_applications')
    .update({
      status: status,
      decision_result: decisionResult,
    })
    .eq('id', applicationId);

  if (error) throw error;

  revalidatePath('/admin/applications');
  return { success: true };
}

export async function processApplicationAction(applicationId, formData) {
  const session = await auth();
  const adminId = session?.user?.adminId;
  if (!adminId) throw new Error('Unauthorized');

  const newStatus = formData.get('status'); // 'approved' or 'rejected'
  const decisionResult = formData.get('decision_result');

  // 1. Get the current status so we can log it as 'previous_status'
  const { data: currentApp, error: fetchError } = await supabase
    .from('membership_applications')
    .select('status')
    .eq('id', applicationId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  // 2. Update the main application table (Current State)
  const { error: updateError } = await supabase
    .from('membership_applications')
    .update({
      status: newStatus,
      decision_result: decisionResult,
    })
    .eq('id', applicationId);

  if (updateError) throw new Error(updateError.message);

  // 3. Insert the history log (Audit Trail)
  const { error: logError } = await supabase
    .from('membership_application_events')
    .insert({
      application_id: applicationId,
      admin_id: adminId,
      previous_status: currentApp.status,
      new_status: newStatus,
      decision_result: decisionResult,
    });

  if (logError) {
    // Note: The main table updated, but the log failed.
    // In a strict production app, you might use a Postgres function (RPC) to wrap both in a strict transaction.
    console.error('Failed to write audit log:', logError);
  }

  revalidatePath('/admin/applications');
  return { success: true };
}

export async function getApplicationEvents(applicationId) {
  const { data, error } = await supabase
    .from('membership_application_events')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}