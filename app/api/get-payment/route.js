export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client (service role key required for server-side writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking_id' },
        { status: 400 }
      );
    }

    // Query payments table by booking_id
    const { data: payment, error } = await supabase
      .from('payments')
      .select(
        'id, booking_id, student_id, amount, currency, status, description'
      )
      .eq('booking_id', bookingId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (err) {
    console.error('❌ get-payment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
