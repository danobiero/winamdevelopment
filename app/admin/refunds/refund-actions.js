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

/* ---------------------------------------------------------
   GET REFUND BY ID (for Refund Modal View)
------------------------------------------------------------ */

export async function getRefundById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Fetch the refund with related student + booking
  const { data: refund, error: refundErr } = await supabase
    .from('refunds')
    .select(
      `
      *,
      students(*),
      bookings(*)
    `
    )
    .eq('id', id)
    .single();

  if (refundErr) throw new Error(refundErr.message);

  // 2️⃣ Fetch ALL payments for the same booking
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', refund.booking_id)
    .order('created_at', { ascending: false });

  if (payErr) throw new Error(payErr.message);

  // 3️⃣ Attach payments manually
  refund.payments = payments || [];

  return refund;
}

/* ---------------------------------------------------------
   GET ALL REFUNDS (For Refunds Listing Page)
------------------------------------------------------------ */
export async function getRefunds({ from, to }) {
  const { data, error } = await supabase
    .from('refunds')
    .select(
      `
      *,
      students ( fullName )
      `
    )
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return data;
}

/* ---------------------------------------------------------
   CHECK IF A BOOKING ALREADY HAS A REFUND
------------------------------------------------------------ */
export async function bookingHasRefund(bookingId) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('refunds')
    .select('id', { count: 'exact' })
    .eq('booking_id', bookingId);

  if (error) throw new Error(error.message);

  return data.length > 0;
}



/* ---------------------------------------------------------
   DELETE REFUND (ONLY if rejected)
------------------------------------------------------------ */
export async function deleteRefundAction(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const refundId = Number(formData.get('refundId'));

  // Check status first
  const { data: refund } = await supabase
    .from('refunds')
    .select('status')
    .eq('id', refundId)
    .maybeSingle();

  if (refund?.status !== 'rejected') {
    throw new Error('Only rejected refunds can be deleted.');
  }

  const { error } = await supabase.from('refunds').delete().eq('id', refundId);

  if (error) throw new Error(error.message);

  redirect(`/admin/refunds?deleted=${refundId}`);
}

// RESET A SINGLE REFUND BACK TO PENDING
export async function resetRefundStatus(formData) {
  const refundId = Number(formData.get('refundId'));

  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('refunds')
    .update({
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/refunds');
  revalidatePath(`/admin/refunds/${refundId}`);

  return { success: true };
}

//----------------------------------------------------
//BEGIN STRIPE REFUND SERVER
//----------------------------------------------------
export async function createStripeRefundAction(formData) {
  try {
    // 1️⃣ AUTH
    const session = await auth();
    if (!session?.user?.adminId) {
      throw new Error('Unauthorized');
    }

    const supabase = createAdminSupabaseClient();

    // 2️⃣ INPUTS
    const refundId = Number(formData.get('refundId'));
    const paymentUuid = formData.get('paymentId');
    const chunkAmountDollars = Number(formData.get('refundAmount'));

    if (!refundId || !paymentUuid || chunkAmountDollars <= 0) {
      throw new Error('Invalid refund request parameters');
    }

    // 3️⃣ LOAD REFUND (AUTHORITATIVE INTENT)
    const { data: refund, error: refundErr } = await supabase
      .from('refunds')
      .select('id, booking_id, refund_amount, amount_refunded_so_far, status')
      .eq('id', refundId)
      .single();

    if (refundErr || !refund) {
      throw new Error('Refund record not found');
    }

    const processedSoFar = Number(refund.amount_refunded_so_far || 0);
    const totalGoal = Number(refund.refund_amount || 0);

    if (processedSoFar >= totalGoal || refund.status === 'completed') {
      throw new Error('This refund is already fully processed.');
    }

    // 4️⃣ LOAD PAYMENT
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('id, amount, stripe_payment_intent_id, stripe_charge_id, refunded_amount')
      .eq('id', paymentUuid)
      .single();

    if (payErr || !payment) {
      throw new Error(`Payment transaction not found for ID: ${paymentUuid}`);
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error(
        'This payment was not processed via Stripe (missing PaymentIntent).'
      );
    }

    // 5️⃣ RESOLVE STRIPE CHARGE (SOURCE OF TRUTH)
    let chargeId = payment.stripe_charge_id;

    if (!chargeId) {
      const charges = await stripe.charges.list({
        payment_intent: payment.stripe_payment_intent_id,
        limit: 1,
      });

      if (!charges.data.length) {
        throw new Error('No charge found for this payment intent.');
      }

      chargeId = charges.data[0].id;

      // Persist for future refunds
      await supabase
        .from('payments')
        .update({ stripe_charge_id: chargeId })
        .eq('id', payment.id);
    }

    // 6️⃣ ENFORCE STRIPE REFUNDABLE BALANCE
    const charge = await stripe.charges.retrieve(chargeId);

    const stripeRemainingCents = charge.amount - charge.amount_refunded;

    if (stripeRemainingCents <= 0) {
      throw new Error('No refundable balance remaining on this Stripe charge.');
    }

    const requestedCents = Math.round(chunkAmountDollars * 100);

    const refundCents = Math.min(requestedCents, stripeRemainingCents);

    if (refundCents <= 0) {
      throw new Error('Requested refund exceeds Stripe refundable balance.');
    }

    // 7️⃣ IDEMPOTENCY KEY (REQUEST FINGERPRINT)
    const idempotencyKey =
      `refund:${refundId}` +
      `:payment:${paymentUuid}` +
      `:amount:${refundCents}`;

    // 8️⃣ STRIPE REFUND
    const stripeRefund = await stripe.refunds.create(
      {
        charge: chargeId,
        amount: refundCents,
        reason: 'requested_by_customer',
        metadata: {
          refund_id: refundId,
          payment_id: paymentUuid,
          amount_cents: refundCents,
        },
      },
      { idempotencyKey }
    );

    // 9️⃣ UPDATE REFUND PROGRESS
    const refundedDollars = refundCents / 100;
    const newTotal = processedSoFar + refundedDollars;
    const isFinished = newTotal >= totalGoal;

    const { error: updateErr } = await supabase
      .from('refunds')
      .update({
        amount_refunded_so_far: newTotal,
        status: isFinished ? 'completed' : 'pending',
        stripe_refund_id: stripeRefund.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (updateErr) {
      throw new Error('Stripe succeeded but database update failed.');
    }

    // 🔟 LEDGER ENTRY (ACCOUNTING SOURCE OF TRUTH)
    await supabase.from('financial_ledger').insert({
      booking_id: refund.booking_id,
      refund_id: refundId,
      payment_id: paymentUuid,
      entry_type: 'refund',
      amount: -refundedDollars,
    });

    return {
      success: true,
      refundedAmount: refundedDollars,
      isFullyDone: isFinished,
      stripeRefundId: stripeRefund.id,
    };
  } catch (err) {
    console.error('CRITICAL REFUND ERROR:', err.message);
    return { success: false, error: err.message };
  }
}


export async function createStripeRefundAction_good_2(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    // 1. INPUTS
    const refundId = Number(formData.get('refundId'));
    const paymentId = formData.get('paymentId');
    const executionAmount = Number(formData.get('refundAmount')); // This is the chunk (e.g., 5000)

    if (!refundId || !paymentId || executionAmount <= 0) {
      throw new Error('Invalid refund request parameters');
    }

    // 2. LOAD REFUND & EXISTING PROGRESS
    // Added 'refund_amount' (total goal) and 'amount_refunded_so_far' (progress)
    const { data: refund } = await supabase
      .from('refunds')
      .select('id, booking_id, refund_amount, amount_refunded_so_far, status')
      .eq('id', refundId)
      .single();

    if (!refund || refund.status === 'completed') {
      throw new Error(
        'Refund record is either missing or already fully completed'
      );
    }

    // 3. LEDGER BALANCE CHECK (Authoritative)
    const { data: bookingBalance } = await supabase.rpc('get_booking_balance', {
      p_booking_id: refund.booking_id,
    });

    if (executionAmount > bookingBalance) {
      throw new Error(
        `Insufficient booking balance: ${FormatCurrency(bookingBalance)}`
      );
    }

    // 4. LOAD PAYMENT SOURCE
    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount, refunded_amount, stripe_payment_intent_id')
      .eq('id', paymentId)
      .single();

    const maxAvailableOnPayment =
      payment.amount - (payment.refunded_amount || 0);
    if (executionAmount > maxAvailableOnPayment) {
      throw new Error(
        'Requested amount exceeds what is left on this Stripe transaction'
      );
    }

    // 5. EXECUTE STRIPE REFUND
    // Idempotency key uses paymentId to allow multiple refunds on ONE refund record across DIFFERENT payments
    const stripeRefund = await stripe.refunds.create(
      {
        amount: Math.round(executionAmount * 100),
        payment_intent: payment.stripe_payment_intent_id,
        metadata: { refund_record_id: refundId },
      },
      {
        idempotencyKey: `refund-rec-${refundId}-pay-${paymentId}`,
      }
    );

    // 6. UPDATE DB (TRANSACTIONAL LOGIC)
    const newTotalRefunded =
      (refund.amount_refunded_so_far || 0) + executionAmount;
    const isFullyDone = newTotalRefunded >= refund.refund_amount;

    // Use a Supabase Transaction or separate updates
    // Update the Payment Record (to track capacity)
    await supabase
      .from('payments')
      .update({
        refunded_amount: (payment.refunded_amount || 0) + executionAmount,
      })
      .eq('id', paymentId);

    // Update the Refund Record
    const { error: updateErr } = await supabase
      .from('refunds')
      .update({
        amount_refunded_so_far: newTotalRefunded,
        status: isFullyDone ? 'completed' : 'pending',
        // Store multiple IDs in an array or a log table if needed
        stripe_refund_id: stripeRefund.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (updateErr)
      throw new Error('Stripe succeeded but Database update failed');

    return {
      success: true,
      refundId,
      stripeRefundId: stripeRefund.id,
      isFullyDone,
    };
  } catch (err) {
    console.error('Refund Error:', err);
    return { success: false, error: err.message };
  }
}

export async function createStripeRefundAction_old_good(formData) {
  try {
    // 1️⃣ AUTH
    const session = await auth();
    if (!session?.user?.adminId) {
      throw new Error('Unauthorized');
    }

    const supabase = createAdminSupabaseClient();

    // 2️⃣ INPUTS
    const refundId = Number(formData.get('refundId'));
    const paymentId = formData.get('paymentId');
    const refundAmount = Number(formData.get('refundAmount'));

    if (!refundId || !paymentId || refundAmount <= 0) {
      throw new Error('Invalid refund request');
    }

    // 3️⃣ LOAD REFUND (AUTHORITATIVE)
    const { data: refund } = await supabase
      .from('refunds')
      .select('id, booking_id, student_id, status, stripe_refund_id')
      .eq('id', refundId)
      .single();

    if (!refund) {
      throw new Error('Refund not found');
    }

    // 🔒 IDEMPOTENCY
    if (refund.stripe_refund_id) {
      throw new Error('Refund already completed');
    }

    // 🔒 STATUS GUARD
    if (refund.status !== 'pending') {
      throw new Error(`Refund not executable (status=${refund.status})`);
    }

    // 4️⃣ LEDGER GUARD (AUTHORITATIVE)
    const { data: bookingBalance, error: balErr } = await supabase.rpc(
      'get_booking_balance',
      { p_booking_id: refund.booking_id }
    );

    if (balErr) {
      throw new Error('Failed to compute booking balance');
    }

    if (refundAmount > bookingBalance) {
      throw new Error(
        `Refund exceeds remaining booking balance (${bookingBalance})`
      );
    }

    // 5️⃣ PAYMENT SOURCE GUARD
    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount, stripe_charge_id, stripe_payment_intent_id')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      throw new Error('Payment not found');
    }

    const refundableOnPayment = payment.amount - (payment.refunded_amount || 0);

    if (refundAmount > refundableOnPayment) {
      throw new Error(
        'Refund exceeds remaining refundable amount on selected payment'
      );
    }


    // ==========================
    // 🔒 ALL GUARDED — SAFE TO EXECUTE
    // ==========================

    // 6️⃣ STRIPE REFUND
    const stripeRefund = await stripe.refunds.create(
      {
        amount: refundAmount * 100,
        payment_intent: payment.stripe_payment_intent_id,
      },
      {
        idempotencyKey: `refund-${refund.id}`,
      }
    );

    // 7️⃣ FINALIZE (FIRST DURABLE STATE CHANGE)
    await supabase
      .from('refunds')
      .update({
        status: 'completed',
        stripe_refund_id: stripeRefund.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .eq('status', 'pending'); // 🔒 prevents race condition

    return {
      success: true,
      refundId,
      stripeRefundId: stripeRefund.id,
    };
  } catch (err) {
    console.error('Refund execution blocked:', err);
    return {
      success: false,
      error: err.message ?? 'Refund failed',
    };
  }
}




//--------------------------------------------------------------
//GET BOOKING LEDGER
//---------------------------------------------------------------

export async function getBookingLedger(bookingId) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase.rpc('get_booking_ledger', {
      p_booking_id: bookingId,
    });

    if (error) {
      console.error('Ledger RPC error:', error);
      throw new Error('Failed to load booking ledger');
    }

    return data ?? [];
  } catch (err) {
    console.error('getBookingLedger failed:', err);
    throw err;
  }
}

export async function getActiveRefundRejectionPolicies() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('refund_rejection_policies')
    .select('id, code, title, description, category')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw new Error('Failed to load rejection policies');
  return data;
}

/* ---------------------------------------------------------
   UPDATE REFUND STATUS (approve / reject)
------------------------------------------------------------ */
/* ---------------------------------------------------------
   UPDATE REFUND STATUS (reject only)
------------------------------------------------------------ */
export async function updateRefundStatus(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const refundId = Number(formData.get('refundId'));
  const status = formData.get('status');
  const rejectionPolicyId = formData.get('rejectionPolicyId') || null;
  const rejectionNotes = formData.get('rejectionNotes') || null;

  if (!refundId || !status) {
    throw new Error('Missing required data');
  }

  // 🔒 ONLY ALLOW REJECTION HERE
  if (status !== 'rejected') {
    throw new Error(
      'Approval does not persist status. Use refund modal to execute.'
    );
  }

  if (!rejectionPolicyId) {
    throw new Error('Rejection policy required');
  }

  await supabase
    .from('refunds')
    .update({
      status: 'rejected',
      rejection_policy_id: rejectionPolicyId,
      rejection_notes: rejectionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundId)
    .eq('status', 'pending'); // 🔒 prevents race conditions

  redirect(`/admin/refunds?updated=${refundId}`);
}


export async function updateRefundStatus_old_xz(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const refundId = Number(formData.get('refundId'));
  const newStatus = formData.get('status');

  // Optional rejection fields
  const rejectionPolicyId = formData.get('rejectionPolicyId') || null;
  const rejectionNotes = formData.get('rejectionNotes') || null;

  if (!refundId || !newStatus) {
    throw new Error('Missing required refund update information.');
  }

  // 🔒 HARD GUARD: rejection requires a policy
  if (newStatus === 'rejected' && !rejectionPolicyId) {
    throw new Error('Rejection policy is required.');
  }

  // 🔒 Prevent illegal transitions (safety)
  const { data: existing, error: loadErr } = await supabase
    .from('refunds')
    .select('status')
    .eq('id', refundId)
    .single();

  if (loadErr || !existing) {
    throw new Error('Refund not found.');
  }

  if (existing.status === 'completed') {
    throw new Error('Completed refunds cannot be modified.');
  }

  // Build update payload
  const updatePayload = {
    status: newStatus,
    updated_at: new Date().toISOString(),

    // Only store rejection metadata if rejected
    rejection_policy_id:
      newStatus === 'rejected' ? rejectionPolicyId : null,
    rejection_notes:
      newStatus === 'rejected' ? rejectionNotes : null,
  };

  const { error } = await supabase
    .from('refunds')
    .update(updatePayload)
    .eq('id', refundId);

  if (error) throw new Error(error.message);

  // ✅ NO SIDE-EFFECT REDIRECTS (unchanged)
  redirect(`/admin/refunds?updated=${refundId}`);
}

//-------------------------------------------------------
//REFUND ALLOCATION
//--------------------------------------------------------
export async function buildRefundAllocationAction({ bookingId, refundAmount }) {
  const supabase = createAdminSupabaseClient();

  // 1️⃣ Load payments (oldest first)
  const { data: payments, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      amount,
      stripe_payment_intent_id,
      stripe_charge_id
    `
    )
    .eq('booking_id', bookingId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: true });

  if (error) throw new Error('Failed to load payments');

  let remaining = refundAmount;
  const allocations = [];

  for (const p of payments) {
    if (remaining <= 0) break;

    const refundable = Number(p.amount);
    if (refundable <= 0) continue;

    const applied = Math.min(refundable, remaining);

    allocations.push({
      paymentId: p.id,
      stripe_payment_intent_id: p.stripe_payment_intent_id,
      stripe_charge_id: p.stripe_charge_id,
      amount: applied,
    });

    remaining -= applied;
  }

  if (remaining > 0) {
    throw new Error('Unable to fully allocate refund');
  }

  return allocations;
}


export async function executeRefundWithAllocations({ refundId, allocations }) {
  const supabase = createAdminSupabaseClient();

  for (const alloc of allocations) {
    await stripe.refunds.create(
      {
        amount: alloc.amount * 100,
        payment_intent: alloc.stripe_payment_intent_id,
      },
      {
        idempotencyKey: `refund-${refundId}-${alloc.paymentId}`,
      }
    );
  }

  // ✅ Only finalize AFTER all Stripe refunds succeed
  await supabase
    .from('refunds')
    .update({
      status: 'completed',
      stripe_refund_id:
        allocations.length === 1 ? allocations[0].paymentId : 'MULTI',
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundId);

  return { success: true };
}
