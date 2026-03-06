'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { revalidatePath } from 'next/cache';

//------------------------------------------------------
// GET OPEN SUPPORT COUNT (for navigation badge)
//------------------------------------------------------
export async function getOpenSupportCount() {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { count, error } = await supabase
    .from('support')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  if (error) {
    console.error('Support count error:', error);
    return 0;
  }

  return count || 0;
}

//------------------------------------------------------
// GET ALL SUPPORT TICKETS (Admin Inbox)
//------------------------------------------------------

//------------------------------------------------------
// GET SUPPORT TICKETS WITH FILTER + PAGINATION
//------------------------------------------------------
export async function getSupportTickets({ status, page = 1 }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const limit = 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('support')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    tickets: data || [],
    total: count || 0,
    page,
    pageCount: Math.ceil((count || 0) / limit),
  };
}

export async function getSupportTickets_old() {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('support')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

//------------------------------------------------------
// GET SINGLE SUPPORT TICKET WITH MESSAGES
//------------------------------------------------------
export async function getSupportById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data: ticket, error } = await supabase
    .from('support')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('support_id', id)
    .order('created_at', { ascending: true });

  return { ticket, messages };
}

//------------------------------------------------------
// ADMIN REPLY TO TICKET
//------------------------------------------------------
export async function replyToSupportTicket({ supportId, message }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  if (!supportId || isNaN(Number(supportId))) {
    throw new Error('Invalid support ID');
  }

  if (!message || message.trim().length < 2) {
    throw new Error('Message too short');
  }

  const supabase = createAdminSupabaseClient();

  const { data: existing } = await supabase
    .from('support')
    .select('id')
    .eq('id', supportId)
    .single();

  if (!existing) throw new Error('Ticket not found');

  const { error } = await supabase.from('support_messages').insert([
    {
      support_id: supportId,
      sender_type: 'admin',
      sender_id: session.user.adminId,
      message,
    },
  ]);

  if (error) throw error;

  await supabase
    .from('support')
    .update({ status: 'in_progress' })
    .eq('id', supportId);

  revalidatePath('/admin/support');
  revalidatePath(`/admin/support/${supportId}`);
}

//------------------------------------------------------
// UPDATE SUPPORT STATUS
//------------------------------------------------------
export async function updateSupportStatus({ supportId, status }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('support')
    .update({ status })
    .eq('id', supportId);

  if (error) throw error;

  revalidatePath('/admin/support');
}

//------------------------------------------------------
// GET FULL SUPPORT THREAD
//------------------------------------------------------
export async function getSupportThread(supportId) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data: ticket, error: ticketError } = await supabase
    .from('support')
    .select('*')
    .eq('id', supportId)
    .single();

  if (ticketError) throw ticketError;

  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('*')
    .eq('support_id', supportId)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  return { ticket, messages };
}