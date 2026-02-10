'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';

// Get a single payment
export async function getPaymentById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      *,
      students ( fullName, email ),
      bookings ( id, startDate, endDate, totalPrice )
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Get all payments
export async function getPayments({ from, to }) {
   const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      *,
      students (
        fullName
      )
      `
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return data;
}

export async function getPayments_old() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      *,
      students ( fullName ),
      bookings ( id )
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
