import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    await db
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', bookingId);

    console.log(`✅ Payment confirmed for booking ${bookingId}`);
  }

  return NextResponse.json({ received: true });
}
