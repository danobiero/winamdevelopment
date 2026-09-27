import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  
  try {
    const data = await req.json();

    console.log(data)
    const {
      amount,
      opportunityName,
      opportunityId,
      userEmail,
      shareholderId, // Using the DB bigint ID
      type, // Usually 'INVESTMENT' or 'FEE'
    } = data;

    // 1. Validation
    if (!shareholderId || !opportunityId) {
      return NextResponse.json(
        { error: 'Missing Required IDs' },
        { status: 400 }
      );
    }

    // 2. Create the session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card',], 
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: opportunityName,
              description: `Investment Opportunity #${opportunityId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      // Redirect to your verify route or success page with the session_id
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account`,

      // 🔥 Metadata must match what your Webhook & Verify Route expect
      metadata: {
        type: type || 'INVESTMENT',
        shareholder_id: shareholderId.toString(),
        opportunity_id: opportunityId.toString(),
        email: userEmail,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('STRIPE SERVER ERROR:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
