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
   GET ALL REDEMPTIONS (For Redemption Listing Page)
------------------------------------------------------------ */
export async function getRedemptions({ from, to, searchShareholder }) {
  const selectQuery = searchShareholder
    ? `
      *,
      shareholders!inner ( fullName ),
      investments (
        id,
        opportunities ( name )
      ),
      redemption_rejection_policies (*),
      member_withdrawal_forms ( id, status, part6_admin )
    `
    : `
      *,
      shareholders ( fullName ),
      investments (
        id,
        opportunities ( name )
      ),
      redemption_rejection_policies (*),
      member_withdrawal_forms ( id, status, part6_admin )
    `;

  let query = supabase
    .from('redemption_requests')
    .select(selectQuery);

  if (searchShareholder) {
    query = query.ilike('shareholders.fullName', `%${searchShareholder}%`);
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return data;
}

/* ---------------------------------------------------------
   GET REDEMPTION BY ID (for Redemption Modal View)
------------------------------------------------------------ */
export async function getRedemptionById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Fetch the redemption with related shareholder, investment (and its opportunity), and policy
  const { data: redemption, error: redErr } = await supabase
    .from('redemption_requests')
    .select(`
      *,
      shareholders(*),
      investments(
        *,
        opportunities(*)
      ),
      redemption_rejection_policies(*)
    `)
    .eq('id', id)
    .single();

  if (redErr) throw new Error(redErr.message);

  // 2️⃣ Fetch payments for the same shareholder
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .eq('shareholder_id', redemption.shareholder_id)
    .order('created_at', { ascending: false });

  if (payErr) throw new Error(payErr.message);

  // 3️⃣ Attach payments manually so the Stripe modal can read them
  redemption.payments = payments || [];

  // 4️⃣ Fetch redemptions processed for this specific request
  const { data: redemptionsList, error: redListErr } = await supabase
    .from('redemptions')
    .select('*')
    .eq('redemption_request_id', id)
    .order('created_at', { ascending: false });

  if (redListErr) {
    console.error('Error fetching redemptions list:', redListErr);
  } else {
    redemption.redemptions_list = redemptionsList || [];
  }

  // 5️⃣ Fetch shareholder registered payout method (CashApp, Zelle, Wire, Check, etc.)
  try {
    const { data: paymentMethod } = await supabase
      .from('shareholder_payment_methods')
      .select('*')
      .eq('shareholder_id', redemption.shareholder_id)
      .maybeSingle();

    redemption.payment_method = paymentMethod || null;
  } catch (pmErr) {
    console.warn('Could not load shareholder payment method:', pmErr);
    redemption.payment_method = null;
  }

  return redemption;
}

//--------------------------------------------------------------
// GET INVESTMENT LEDGER
//---------------------------------------------------------------

export async function getInvestmentLedger(investmentId) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    let baseEntries = [];
    try {
      const { data, error } = await supabase.rpc('get_investment_ledger', {
        p_investment_id: investmentId,
      });
      if (!error && Array.isArray(data)) {
        baseEntries = data;
      }
    } catch (e) {
      console.warn('RPC get_investment_ledger fallback to view:', e);
    }

    if (baseEntries.length === 0) {
      const { data: viewData } = await supabase
        .from('investment_ledger')
        .select('*')
        .eq('investment_id', investmentId)
        .order('transaction_date', { ascending: true });
      baseEntries = viewData || [];
    }

    // Also fetch any completed or approved redemptions for this investment
    const { data: redRequests } = await supabase
      .from('redemption_requests')
      .select('id, amount, already_redeemed_so_far, status, processed_at, created_at')
      .eq('investment_id', investmentId)
      .in('status', ['approved', 'completed']);

    const redReqIds = (redRequests || []).map((r) => r.id);
    let redemptionEntries = [];

    if (redReqIds.length > 0) {
      const { data: redPayouts } = await supabase
        .from('redemptions')
        .select('*')
        .in('redemption_request_id', redReqIds)
        .eq('status', 'succeeded');

      if (redPayouts && redPayouts.length > 0) {
        redemptionEntries = redPayouts.map((p) => ({
          entry_id: `RED-${p.id}`,
          transaction_date: p.created_at || p.updated_at,
          investment_id: investmentId,
          amount: -Math.abs(Number(p.amount || 0)),
          entry_type: 'redemption',
          status: 'succeeded',
          currency: p.currency || 'USD',
        }));
      }
    }

    // Merge payment entries and redemption entries without duplicates
    const combined = [...baseEntries];
    redemptionEntries.forEach((re) => {
      const exists = combined.some(
        (e) => e.entry_type === 'redemption' && (e.entry_id === re.entry_id || Math.abs(e.amount) === Math.abs(re.amount))
      );
      if (!exists) {
        combined.push(re);
      }
    });

    // Sort by transaction_date ascending and compute running balance
    combined.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
    let running = 0;
    const finalLedger = combined.map((entry) => {
      running += Number(entry.amount || 0);
      return {
        ...entry,
        running_balance: running,
      };
    });

    return finalLedger;
  } catch (err) {
    console.error('getInvestmentLedger failed:', err);
    throw err;
  }
}

/* ---------------------------------------------------------
   GET ACTIVE REDEMPTION REJECTION POLICIES
------------------------------------------------------------ */
export async function getActiveRedemptionRejectionPolicies() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('redemption_rejection_policies')
    .select('id, code, title, description, category')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) {
    console.error('Policy fetch error:', error);
    throw new Error('Failed to load redemption rejection policies');
  }

  return data;
}


/* ---------------------------------------------------------
   BEGIN STRIPE REFUND PROCESS
------------------------------------------------------------ */
export async function createStripeRedemptionAction(formData) {
  try {
    // 1️⃣ AUTH
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    // 2️⃣ INPUTS
    const redemptionId = Number(formData.get('redemptionId'));
    const paymentUuid = formData.get('paymentId');
    const chunkAmountDollars = Number(formData.get('redemptionAmount'));

    if (!redemptionId || !paymentUuid || chunkAmountDollars <= 0) {
      throw new Error('Invalid redemption request parameters');
    }

    // 3️⃣ LOAD REDEMPTION
    const { data: redemption, error: redErr } = await supabase
      .from('redemption_requests')
      .select('id, investment_id, shareholder_id, amount, status, already_redeemed_so_far, investments(opportunity_id, amount_invested, current_value)')
      .eq('id', redemptionId)
      .single();

    if (redErr || !redemption) throw new Error('Redemption record not found');

    const processedSoFar = Number(redemption.already_redeemed_so_far || 0);
    const totalGoal = Number(redemption.amount || 0);

    if (processedSoFar >= totalGoal || redemption.status === 'completed') {
      throw new Error('This redemption is already fully processed.');
    }

    const opportunityValue = Number(
      redemption.investments?.current_value != null && Number(redemption.investments.current_value) > 0
        ? redemption.investments.current_value
        : (redemption.investments?.amount_invested || totalGoal)
    );

    if (chunkAmountDollars > opportunityValue) {
      throw new Error(`Refund amount ($${chunkAmountDollars.toLocaleString()}) cannot exceed the shareholder value of the opportunity ($${opportunityValue.toLocaleString()}).`);
    }

    // 3.5️⃣ CHECK PART 6 WITHDRAWAL FORM REQUIREMENT (FOR USA LAND PROJECT)
    const { checkWithdrawalFormPart6Complete } = await import(
      '@/app/_lib/withdrawal-form-actions'
    );
    const isPart6Done = await checkWithdrawalFormPart6Complete(redemptionId);
    if (!isPart6Done) {
      throw new Error(
        'Redemption cannot be processed: Part 6 (Company Administrative Approval) must be completed before processing payout.'
      );
    }

    // 4️⃣ LOAD PAYMENT
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select(
        'id, amount, stripe_payment_intent_id, stripe_charge_id, redeemed_amount'
      )
      .eq('id', paymentUuid)
      .single();

    if (payErr || !payment || !payment.stripe_payment_intent_id) {
      throw new Error('Valid Stripe payment transaction not found.');
    }

    // 5️⃣ RESOLVE STRIPE CHARGE
    let chargeId = payment.stripe_charge_id;
    if (!chargeId) {
      const charges = await stripe.charges.list({
        payment_intent: payment.stripe_payment_intent_id,
        limit: 1,
      });
      if (!charges.data.length)
        throw new Error('No charge found for this intent.');
      chargeId = charges.data[0].id;
      await supabase
        .from('payments')
        .update({ stripe_charge_id: chargeId })
        .eq('id', payment.id);
    }

    // 6️⃣ ENFORCE STRIPE BALANCE
    const charge = await stripe.charges.retrieve(chargeId);
    const stripeRemainingCents = charge.amount - charge.amount_refunded;
    const requestedCents = Math.round(chunkAmountDollars * 100);
    const refundCents = Math.min(requestedCents, stripeRemainingCents);

    if (refundCents <= 0)
      throw new Error('Requested amount exceeds Stripe balance.');

    // 7️⃣ EXECUTE STRIPE REFUND
    const idempotencyKey = `redemption:${redemptionId}:payment:${paymentUuid}:amount:${refundCents}`;
    const stripeRefund = await stripe.refunds.create(
      {
        charge: chargeId,
        amount: refundCents,
        reason: 'requested_by_customer',
        metadata: { redemption_id: redemptionId, payment_id: paymentUuid },
      },
      { idempotencyKey }
    );

    // 8️⃣ UPDATE REDEMPTION PROGRESS
    const redeemedDollars = refundCents / 100;
    const newTotal = processedSoFar + redeemedDollars;
    const isFinished = newTotal >= totalGoal;

    const { error: updateErr } = await supabase
      .from('redemption_requests')
      .update({
        already_redeemed_so_far: newTotal,
        status: isFinished ? 'completed' : 'pending',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', redemptionId);

    if (updateErr)
      throw new Error('Stripe succeeded but database update failed.');

    if (isFinished) {
      await supabase
        .from('member_withdrawal_forms')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('redemption_request_id', redemptionId);
    }

    // 🆕 NEW: UPDATE PAYMENT RECORD
    // Increment the 'redeemed_amount' (or 'refunded_amount' based on your schema)
    // to track how much of this specific payment has been used.
    const { error: payUpdateErr } = await supabase
      .from('payments')
      .update({
        redeemed_amount: Number(payment.redeemed_amount || 0) + redeemedDollars,
      })
      .eq('id', paymentUuid);

    if (payUpdateErr)
      throw new Error('Stripe succeeded but payment tracking failed.');

    // 🆕 NEW: INSERT REFUND/REDEMPTION ENTRY INTO REDEMPTIONS TABLE
    const { error: redemptionInsertErr } = await supabase
      .from('redemptions')
      .insert({
        shareholder_id: redemption.shareholder_id,
        redemption_request_id: redemptionId,
        stripe_refund_id: stripeRefund.id,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        stripe_charge_id: chargeId,
        status: 'succeeded',
        amount: -redeemedDollars, // Store directly as negative value in the redemptions table
        currency: 'USD',
        description: `Redemption refund processed via Stripe for Request #${redemptionId}`,
        metadata: {
          original_payment_id: paymentUuid,
          stripe_event: 'charge.refunded',
        },
        opportunity_id: redemption.investments?.opportunity_id || null,
        updated_at: new Date().toISOString(),
      });

    if (redemptionInsertErr) {
      console.error('Failed to insert redemption entry:', redemptionInsertErr);
      throw new Error('Stripe succeeded but redemption logging failed.');
    }

    // 9️⃣ LEDGER ENTRY (Using updated naming)
    await supabase.from('investment_ledger_entries').insert({
      investment_id: redemption.investment_id,
      redemption_id: redemptionId,
      payment_id: paymentUuid,
      entry_type: 'redemption',
      amount: -redeemedDollars,
    });

    // 🔟 UPDATE INVESTMENT AMOUNT_INVESTED
    if (redemption.investment_id) {
      const { data: inv } = await supabase
        .from('investments')
        .select('id, amount_invested, status')
        .eq('id', redemption.investment_id)
        .maybeSingle();

      if (inv) {
        const currentInvested = Number(inv.amount_invested || 0);
        const newInvested = Math.max(0, currentInvested - redeemedDollars);
        const invUpdates = {
          amount_invested: newInvested,
          updated_at: new Date().toISOString(),
        };
        if (newInvested <= 0) {
          invUpdates.status = 'exited';
          invUpdates.current_value = 0;
          invUpdates.exited_at = new Date().toISOString();
        }
        await supabase.from('investments').update(invUpdates).eq('id', inv.id);
      }
    }

    // 1️⃣1️⃣ UPDATE OPPORTUNITY VALUATION AND TOTAL_VALUE
    const opportunityId = redemption.investments?.opportunity_id;
    if (opportunityId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: latestVal } = await supabase
          .from('opportunity_valuations')
          .select('*')
          .eq('opportunity_id', Number(opportunityId))
          .order('valuation_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestVal) {
          const currentVal = Number(latestVal.total_asset_value || 0);
          const newTotalAssetValue = Math.max(0, currentVal - redeemedDollars);

          if (latestVal.valuation_date === today) {
            const { error: valUpErr } = await supabase
              .from('opportunity_valuations')
              .update({
                total_asset_value: newTotalAssetValue,
              })
              .eq('id', latestVal.id);
            if (valUpErr) console.error('Error updating opportunity_valuations in Stripe redemption:', valUpErr);
          } else {
            const { error: valInsErr } = await supabase
              .from('opportunity_valuations')
              .insert({
                opportunity_id: Number(opportunityId),
                total_asset_value: newTotalAssetValue,
                valuation_date: today,
                created_by_admin_id: session.user.adminId || null,
              });
            if (valInsErr) console.error('Error inserting opportunity_valuations in Stripe redemption:', valInsErr);
          }
        } else {
          // If no opportunity_valuations record exists yet, baseline from opp.total_value
          const { data: oppRecord } = await supabase
            .from('opportunities')
            .select('total_value')
            .eq('id', Number(opportunityId))
            .maybeSingle();

          const baseVal = oppRecord?.total_value ? Number(oppRecord.total_value) : 0;
          const newTotalAssetValue = Math.max(0, baseVal - redeemedDollars);
          const { error: valInsErr } = await supabase
            .from('opportunity_valuations')
            .insert({
              opportunity_id: Number(opportunityId),
              total_asset_value: newTotalAssetValue,
              valuation_date: today,
              created_by_admin_id: session.user.adminId || null,
            });
          if (valInsErr) console.error('Error inserting baseline opportunity_valuations:', valInsErr);
        }

        // Also decrement opportunities.total_value if present
        const { data: opp } = await supabase
          .from('opportunities')
          .select('id, total_value')
          .eq('id', Number(opportunityId))
          .maybeSingle();

        if (opp && opp.total_value !== null && opp.total_value !== undefined) {
          const newOppTotal = Math.max(0, Number(opp.total_value || 0) - redeemedDollars);
          const { error: oppUpErr } = await supabase
            .from('opportunities')
            .update({ total_value: newOppTotal })
            .eq('id', Number(opportunityId));
          if (oppUpErr) console.error('Error updating opportunities total_value:', oppUpErr);
        }
      } catch (valErr) {
        console.error('Opportunity valuation adjustment failed in Stripe redemption:', valErr);
      }
    }

    revalidatePath('/admin/redemptions');
    revalidatePath('/account/investments');
    revalidatePath('/account/payment');
    revalidatePath('/admin/finance-reports/valuations');
    revalidatePath('/admin/transactions');

    return {
      success: true,
      redeemedAmount: redeemedDollars,
      isFullyDone: isFinished,
    };
  } catch (err) {
    console.error('CRITICAL REDEMPTION ERROR:', err.message);
    return { success: false, error: err.message };
  }
}

/* ---------------------------------------------------------
   BEGIN MANUAL / NON-STRIPE REDEMPTION PROCESS
   (Handles CashApp, Zelle, Bank Wire, Paper Check, Legacy Shareholders)
------------------------------------------------------------ */
export async function processManualRedemptionAction(formData) {
  try {
    // 1️⃣ AUTH
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    // 2️⃣ INPUTS
    const redemptionId = Number(formData.get('redemptionId'));
    const payoutMethod = (formData.get('payoutMethod') || 'manual').trim().toLowerCase();
    const recipientHandle = (formData.get('recipientHandle') || '').trim();
    const recipientName = (formData.get('recipientName') || '').trim();
    const referenceNumber = (formData.get('referenceNumber') || '').trim();
    const chunkAmountDollars = Number(formData.get('redemptionAmount'));
    const paymentUuid = formData.get('paymentId') || null;
    const adminNotes = (formData.get('adminNotes') || '').trim();

    if (!redemptionId || chunkAmountDollars <= 0) {
      throw new Error('Invalid redemption parameters or amount.');
    }

    // 3️⃣ LOAD REDEMPTION REQUEST
    const { data: redemption, error: redErr } = await supabase
      .from('redemption_requests')
      .select(`
        id,
        investment_id,
        shareholder_id,
        amount,
        status,
        already_redeemed_so_far,
        admin_notes,
        investments (
          id,
          opportunity_id,
          amount_invested,
          current_value
        )
      `)
      .eq('id', redemptionId)
      .single();

    if (redErr || !redemption) throw new Error('Redemption record not found.');

    const processedSoFar = Number(redemption.already_redeemed_so_far || 0);
    const totalGoal = Number(redemption.amount || 0);

    if (processedSoFar >= totalGoal || redemption.status === 'completed') {
      throw new Error('This redemption request is already fully processed.');
    }

    const opportunityValue = Number(
      redemption.investments?.current_value != null && Number(redemption.investments.current_value) > 0
        ? redemption.investments.current_value
        : (redemption.investments?.amount_invested || totalGoal)
    );

    if (chunkAmountDollars > opportunityValue) {
      throw new Error(
        `Payout amount ($${chunkAmountDollars.toLocaleString()}) cannot exceed the shareholder value of the opportunity ($${opportunityValue.toLocaleString()}).`
      );
    }

    // 3.5️⃣ CHECK PART 6 WITHDRAWAL FORM REQUIREMENT (FOR USA LAND PROJECT)
    const { checkWithdrawalFormPart6Complete } = await import(
      '@/app/_lib/withdrawal-form-actions'
    );
    const isPart6Done = await checkWithdrawalFormPart6Complete(redemptionId);
    if (!isPart6Done) {
      throw new Error(
        'Redemption cannot be processed: Part 6 (Company Administrative Approval) must be completed before processing payout.'
      );
    }

    const remainingGoal = Math.max(0, totalGoal - processedSoFar);
    const redeemedDollars = Math.min(chunkAmountDollars, remainingGoal);

    if (redeemedDollars <= 0) {
      throw new Error('Redemption amount must be greater than zero.');
    }

    // 4️⃣ UPDATE REDEMPTION PROGRESS & STATUS
    const newTotal = processedSoFar + redeemedDollars;
    const isFinished = newTotal >= totalGoal;

    const payoutNote = `[${payoutMethod.toUpperCase()}] Paid $${redeemedDollars.toLocaleString()} on ${new Date().toLocaleDateString()}${
      referenceNumber ? ` (Ref: ${referenceNumber})` : ''
    }${recipientHandle ? ` to ${recipientHandle}` : ''}${
      adminNotes ? ` - Notes: ${adminNotes}` : ''
    }`;

    const combinedNotes = redemption.admin_notes
      ? `${redemption.admin_notes}\n${payoutNote}`
      : payoutNote;

    const { error: updateErr } = await supabase
      .from('redemption_requests')
      .update({
        already_redeemed_so_far: newTotal,
        status: isFinished ? 'completed' : 'approved',
        admin_notes: combinedNotes,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', redemptionId);

    if (updateErr) {
      throw new Error(`Database update failed: ${updateErr.message}`);
    }

    if (isFinished) {
      await supabase
        .from('member_withdrawal_forms')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('redemption_request_id', redemptionId);
    }

    // 5️⃣ IF OPTIONAL PAYMENT RECORD SPECIFIED, UPDATE ITS REDEEMED AMOUNT
    if (paymentUuid) {
      const { data: payRecord } = await supabase
        .from('payments')
        .select('id, redeemed_amount')
        .eq('id', paymentUuid)
        .maybeSingle();

      if (payRecord) {
        await supabase
          .from('payments')
          .update({
            redeemed_amount: Number(payRecord.redeemed_amount || 0) + redeemedDollars,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentUuid);
      }
    }

    // 6️⃣ INSERT INTO REDEMPTIONS TABLE (Negative amount indicates outflow)
    const { error: redemptionInsertErr } = await supabase
      .from('redemptions')
      .insert({
        shareholder_id: redemption.shareholder_id,
        redemption_request_id: redemptionId,
        status: 'succeeded',
        amount: -redeemedDollars,
        currency: 'USD',
        description: `Redemption payout via ${payoutMethod.toUpperCase()}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
        metadata: {
          payout_rail: payoutMethod,
          recipient_handle: recipientHandle,
          recipient_name: recipientName,
          reference_number: referenceNumber,
          original_payment_id: paymentUuid,
          admin_notes: adminNotes,
          is_manual: true,
          is_non_stripe: true,
          processed_by: session.user.adminId || session.user.email,
        },
        opportunity_id: redemption.investments?.opportunity_id || null,
        updated_at: new Date().toISOString(),
      });

    if (redemptionInsertErr) {
      console.error('Failed to insert redemption entry:', redemptionInsertErr);
    }

    // 7️⃣ INSERT INTO INVESTMENT LEDGER ENTRIES
    const ledgerEntry = {
      investment_id: redemption.investment_id,
      redemption_id: redemptionId,
      payment_id: paymentUuid || null,
      entry_type: 'redemption',
      amount: -redeemedDollars,
    };
    const { error: ledgerErr } = await supabase
      .from('investment_ledger_entries')
      .insert(ledgerEntry);

    if (ledgerErr) {
      console.warn('Note: investment_ledger_entries insert error:', ledgerErr);
    }

    // 8️⃣ UPDATE INVESTMENT AMOUNT_INVESTED
    if (redemption.investment_id) {
      const { data: inv } = await supabase
        .from('investments')
        .select('id, amount_invested, status')
        .eq('id', redemption.investment_id)
        .maybeSingle();

      if (inv) {
        const currentInvested = Number(inv.amount_invested || 0);
        const newInvested = Math.max(0, currentInvested - redeemedDollars);
        const invUpdates = {
          amount_invested: newInvested,
          updated_at: new Date().toISOString(),
        };
        if (newInvested <= 0) {
          invUpdates.status = 'exited';
          invUpdates.current_value = 0;
          invUpdates.exited_at = new Date().toISOString();
        }
        await supabase.from('investments').update(invUpdates).eq('id', inv.id);
      }
    }

    // 9️⃣ UPDATE OPPORTUNITY VALUATION AND TOTAL_VALUE
    const opportunityId = redemption.investments?.opportunity_id;
    if (opportunityId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: latestVal } = await supabase
          .from('opportunity_valuations')
          .select('*')
          .eq('opportunity_id', Number(opportunityId))
          .order('valuation_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestVal) {
          const currentVal = Number(latestVal.total_asset_value || 0);
          const newTotalAssetValue = Math.max(0, currentVal - redeemedDollars);

          if (latestVal.valuation_date === today) {
            const { error: valUpErr } = await supabase
              .from('opportunity_valuations')
              .update({
                total_asset_value: newTotalAssetValue,
              })
              .eq('id', latestVal.id);
            if (valUpErr) console.error('Error updating opportunity_valuations in manual redemption:', valUpErr);
          } else {
            const { error: valInsErr } = await supabase
              .from('opportunity_valuations')
              .insert({
                opportunity_id: Number(opportunityId),
                total_asset_value: newTotalAssetValue,
                valuation_date: today,
                created_by_admin_id: session.user.adminId || null,
              });
            if (valInsErr) console.error('Error inserting opportunity_valuations in manual redemption:', valInsErr);
          }
        } else {
          // If no opportunity_valuations record exists yet, baseline from opp.total_value
          const { data: oppRecord } = await supabase
            .from('opportunities')
            .select('total_value')
            .eq('id', Number(opportunityId))
            .maybeSingle();

          const baseVal = oppRecord?.total_value ? Number(oppRecord.total_value) : 0;
          const newTotalAssetValue = Math.max(0, baseVal - redeemedDollars);
          const { error: valInsErr } = await supabase
            .from('opportunity_valuations')
            .insert({
              opportunity_id: Number(opportunityId),
              total_asset_value: newTotalAssetValue,
              valuation_date: today,
              created_by_admin_id: session.user.adminId || null,
            });
          if (valInsErr) console.error('Error inserting baseline opportunity_valuations in manual redemption:', valInsErr);
        }

        // Also decrement opportunities.total_value if present
        const { data: opp } = await supabase
          .from('opportunities')
          .select('id, total_value')
          .eq('id', Number(opportunityId))
          .maybeSingle();

        if (opp && opp.total_value !== null && opp.total_value !== undefined) {
          const newOppTotal = Math.max(0, Number(opp.total_value || 0) - redeemedDollars);
          const { error: oppUpErr } = await supabase
            .from('opportunities')
            .update({ total_value: newOppTotal })
            .eq('id', Number(opportunityId));
          if (oppUpErr) console.error('Error updating opportunities total_value in manual redemption:', oppUpErr);
        }
      } catch (valErr) {
        console.error('Opportunity valuation adjustment failed in manual redemption:', valErr);
      }
    }

    revalidatePath('/admin/redemptions');
    revalidatePath('/account/investments');
    revalidatePath('/account/payment');
    revalidatePath('/admin/finance-reports/valuations');
    revalidatePath('/admin/transactions');

    return {
      success: true,
      redeemedAmount: redeemedDollars,
      isFullyDone: isFinished,
      payoutMethod,
      referenceNumber,
    };
  } catch (err) {
    console.error('CRITICAL MANUAL REDEMPTION ERROR:', err.message);
    return { success: false, error: err.message };
  }
}

/* ---------------------------------------------------------
   BEGIN PROCESS REDEMPTION
------------------------------------------------------------ */

export async function processRedemptionAdmin(formData) {
  try {
    const redemptionId = formData.get('redemptionId');
    const action = formData.get('action') || formData.get('status');
    const adminNotes = formData.get('admin_notes');

    // Grab the new policy ID (will be null if action === 'completed')
    const rejectionPolicyId = formData.get('rejectionPolicyId');

    if (!redemptionId || !action) throw new Error('Missing required fields');

    const supabase = createAdminSupabaseClient();

    // Dynamically build the update payload
    const payload = {
      status: action,
      admin_notes: adminNotes,
      processed_at: new Date().toISOString(),
    };

    // If rejected, map the selected policy to the database record
    if (action === 'rejected') {
      if (!rejectionPolicyId) throw new Error('Rejection policy is required');

      // Assumes your redemption_requests table has this column:
      payload.rejection_policy_id = rejectionPolicyId;
    }

    const { error } = await supabase
      .from('redemption_requests')
      .update(payload)
      .eq('id', redemptionId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/redemptions');
    return { success: true };
  } catch (err) {
    console.error('processRedemptionAdmin error:', err);
    return { success: false, error: err.message };
  }
}

export { processRedemptionAdmin as updateRedemptionStatus };