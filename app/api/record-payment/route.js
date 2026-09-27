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

    // 1. FETCH STRIPE SESSION (Expanded for receipt info)
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    });

    const paymentIntent = stripeSession.payment_intent;
    const charge = paymentIntent?.latest_charge;
    const metadata = stripeSession.metadata || {};

    // 2. VERIFY PAYMENT STATUS
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not confirmed' },
        { status: 400 }
      );
    }

    // 3. MAP METADATA
    const shareholderId = metadata.shareholder_id;

    // Safely parse IDs based on what was passed in metadata
    const oppId = metadata.opportunity_id
      ? Number(metadata.opportunity_id)
      : null;
    const feeId = metadata.fee_id ? Number(metadata.fee_id) : null;

    if (!shareholderId) {
      return NextResponse.json(
        { error: 'Missing shareholder_id in metadata' },
        { status: 400 }
      );
    }

    // 4. CONVERT CENTS TO USD
    const amountUSD = Number((stripeSession.amount_total / 100).toFixed(2));

    // 5. UPSERT PAYMENT
    const { data, error } = await supabase
      .from('payments')
      .upsert(
        {
          shareholder_id: Number(shareholderId),
          stripe_payment_intent_id: paymentIntent.id,
          stripe_session_id: sessionId,
          stripe_charge_id: charge?.id || null,
          stripe_customer_id: stripeSession.customer,
          amount: amountUSD,
          currency: stripeSession.currency.toUpperCase(),
          status: 'succeeded', // Consistent with Webhook 'succeeded'
          type: metadata.type || 'unknown',
          payment_method_type:
            paymentIntent.payment_method_types?.[0] || 'card',
          receipt_url: charge?.receipt_url || null,
          description:
            metadata.type === 'FEE'
              ? 'Membership Application Fee'
              : `Investment in Opportunity #${oppId}`,
          metadata: metadata,
          opportunity_id: oppId,
          fee_id: feeId, // <-- NEW ADDITION
        },
        { onConflict: 'stripe_payment_intent_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`Payment Upsert Error: ${error.message}`);

    // 6. SYNC BUSINESS LOGIC

    if (metadata.type === 'FEE') {
      const email = metadata.email;

      if (email) {
        // Perform the update directly here to ensure Service Role bypasses RLS
        const { error: updateError } = await supabase
          .from('membership_applications')
          .update({
            status: 'reviewing',
            application_fee_paid: true,
          })
          .eq('email', email);

        if (updateError)
          throw new Error(`Membership Update Error: ${updateError.message}`);
      }
    } else if (metadata.type === 'INVESTMENT') {
      if (!oppId) {
        throw new Error('Missing opportunity_id for INVESTMENT transaction.');
      }

      const sId = Number(shareholderId);
      const isCore = metadata.is_core === 'true';

      const { error: rpcError } = await supabase.rpc(
        'upsert_investment_increment',
        {
          p_shareholder_id: sId,
          p_opportunity_id: oppId,
          p_amount_invested: amountUSD,
          p_is_core: isCore,
        }
      );

      if (rpcError) {
        throw new Error(`Investment Update Failed: ${rpcError.message}`);
      }
    }

    return NextResponse.json({
      message: '✅ Payment verified and recorded',
      payment: data,
    });
  } catch (err) {
    console.error('❌ Verification Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
