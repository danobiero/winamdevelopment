export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // 1️⃣ Retrieve Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    });

    const paymentIntent = stripeSession.payment_intent;
    const charge = paymentIntent?.latest_charge;
    const metadata = stripeSession.metadata || {};

    const bookingId = metadata.booking_id || metadata.bookingId;
    const studentId = metadata.student_id || metadata.studentId;

    if (!bookingId || !studentId) {
      return NextResponse.json(
        { error: 'Missing bookingId or studentId in metadata' },
        { status: 400 }
      );
    }

    // 2️⃣ Check if pending payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    const paymentData = {
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: charge?.id || null,
      stripe_customer_id: stripeSession.customer,
      amount: paymentIntent.amount_received / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      payment_method_type: paymentIntent.payment_method_types?.[0] || 'card',
      receipt_url: charge?.receipt_url || null,
      description:
        stripeSession.description ||
        `Booking #${bookingId} for ${metadata.lesson_name || metadata.lessonName || 'Lesson'}`,
      updated_at: new Date().toISOString(),
    };

    if (existingPayment) {
      // ✅ Update existing record
      const { error: updateError } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('stripe_session_id', sessionId);
      if (updateError) throw updateError;
    } else {
      // 🆕 Insert fallback payment record
      await supabase.from('payments').insert([
        {
          student_id: studentId,
          booking_id: bookingId,
          stripe_session_id: sessionId,
          ...paymentData,
          metadata,
        },
      ]);
    }

    // 3️⃣ Handle NORMAL vs ADDITIONAL payment types
    if (metadata.type === 'additional_payment') {
      // 🟢 Additional Payment Flow
      const difference = Number(metadata.difference || 0);
      const oldTotal = Number(metadata.old_total_price || 0);
      const newTotal = Number(
        metadata.new_total_price || oldTotal + difference
      );
      const numStudents = Number(metadata.num_Students);
      const observations = String(metadata.reason);

      // Update booking totals
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          totalPrice: newTotal,
          numStudents: numStudents,
          observations: observations,
          status: 'paid',
          isPaid: true,
          bookingStatus: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('studentId', studentId);

      if (bookingUpdateError) throw bookingUpdateError;

      // Insert booking change log
      const { error: changeError } = await supabase
        .from('booking_changes')
        .insert([
          {
            booking_id: bookingId,
            student_id: studentId,
            change_type: 'additional_payment',
            field_changed: { totalPrice: { old: oldTotal, new: newTotal } },
            amount_difference: difference,
            old_total_price: oldTotal,
            new_total_price: newTotal,
            stripe_session_id: sessionId,
          },
        ]);

      if (changeError) throw changeError;

      `✅ Additional payment recorded for booking ${bookingId}`;
    } else {
      // 🟦 Normal Payment Flow
      await supabase
        .from('bookings')
        .update({
          status: 'paid',
          isPaid: true,
          bookingStatus: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
    }

    return NextResponse.json({
      message: '✅ Payment recorded successfully',
      bookingId,
      type: metadata.type || 'initial',
    });
  } catch (err) {
    console.error('❌ record-payment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
