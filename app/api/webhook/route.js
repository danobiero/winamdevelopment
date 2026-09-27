import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      ////////////////////////////////////////////////////////////
      // 🔥 GET PAYMENT INTENT + CHARGE (FOR RECEIPT URL)
      ////////////////////////////////////////////////////////////
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
        { expand: ['latest_charge'] }
      );

      const charge = paymentIntent.latest_charge;

      ////////////////////////////////////////////////////////////
      // 🔥 AMOUNT CONVERSION
      ////////////////////////////////////////////////////////////
      const amountUSD = Number((session.amount_total / 100).toFixed(2));

      ////////////////////////////////////////////////////////////
      // 🔥 PREPARE PAYMENT RECORD
      ////////////////////////////////////////////////////////////
      const paymentData = {
        shareholder_id: Number(metadata.shareholder_id),
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        stripe_customer_id: session.customer,
        amount: amountUSD,
        currency: session.currency?.toUpperCase(),
        status: 'succeeded',
        type: metadata.type || 'unknown',
        payment_method_type: paymentIntent.payment_method_types?.[0] || 'card',

        description:
          metadata.type === 'FEE'
            ? 'Membership Application Fee'
            : 'Investment Payment',

        metadata: metadata,

        // ✅ FIXED FIELD
        opportunity_id: Number(metadata.opportunity_id),

        // ✅ NEW FIELD (RECEIPT)
        receipt_url: charge?.receipt_url || null,
      };

      

      ////////////////////////////////////////////////////////////
      // 🔥 UPSERT (IDEMPOTENT)
      ////////////////////////////////////////////////////////////
      const { error: upsertError } = await supabase
        .from('payments')
        .upsert(paymentData, {
          onConflict: 'stripe_payment_intent_id',
        });

      if (upsertError) {
        throw new Error(`DB Upsert Error: ${upsertError.message}`);
      }

      
    } catch (err) {
      console.error('❌ Webhook processing failed:', err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
