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
      .select('id, investment_id, shareholder_id, amount, status, already_redeemed_so_far, shareholders(id, fullName, email), investments(id, shareholder_id, opportunity_id, amount_invested, current_value)')
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
    const resolvedShareholderId =
      redemption.shareholder_id ||
      redemption.investments?.shareholder_id ||
      payment.shareholder_id ||
      null;

    const shareholderName =
      redemption.shareholders?.fullName ||
      'Shareholder';

    const { error: redemptionInsertErr } = await supabase
      .from('redemptions')
      .insert({
        shareholder_id: resolvedShareholderId,
        redemption_request_id: redemptionId,
        stripe_refund_id: stripeRefund.id,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        stripe_charge_id: chargeId,
        status: 'succeeded',
        amount: -redeemedDollars, // Store directly as negative value in the redemptions table
        currency: 'USD',
        description: `Redemption refund processed via Stripe for Request #${redemptionId} - ${shareholderName}`,
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

    // 🔟 UPDATE INVESTMENT AMOUNT_INVESTED, LEGACY ALLOCATIONS, AND OPPORTUNITY VALUATION
    await applyRedemptionToInvestmentAndLegacy({
      supabase,
      investmentId: redemption.investment_id,
      shareholderId: resolvedShareholderId,
      shareholderEmail: redemption.shareholders?.email || null,
      opportunityId: redemption.investments?.opportunity_id || null,
      redeemedDollars,
      adminId: session.user.adminId || null,
    });

    revalidatePath('/admin/redemptions');
    revalidatePath('/admin/investments');
    revalidatePath('/admin/legacy');
    revalidatePath('/admin/shareholders');
    revalidatePath('/account');
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
        shareholders (
          id,
          fullName,
          email
        ),
        investments (
          id,
          shareholder_id,
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

    // 5️⃣ UPDATE PAYMENT REDEEMED AMOUNT (Explicit paymentUuid or auto-matched payment for shareholder + opportunity)
    const resolvedShareholderId =
      redemption.shareholder_id ||
      redemption.investments?.shareholder_id ||
      null;
    const oppId = redemption.investments?.opportunity_id || null;

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
    } else if (resolvedShareholderId && oppId) {
      const { data: matchingPayments } = await supabase
        .from('payments')
        .select('id, amount, redeemed_amount, status, type')
        .eq('shareholder_id', resolvedShareholderId)
        .eq('opportunity_id', oppId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: true });

      let remainingToDebit = redeemedDollars;
      for (const pay of matchingPayments || []) {
        if (remainingToDebit <= 0) break;
        if ((pay.type || '').toLowerCase().includes('dividend')) continue;
        const avail = Math.max(0, Number(pay.amount || 0) - Number(pay.redeemed_amount || 0));
        if (avail <= 0) continue;
        const debit = Math.min(avail, remainingToDebit);
        await supabase
          .from('payments')
          .update({
            redeemed_amount: Number(pay.redeemed_amount || 0) + debit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pay.id);
        remainingToDebit -= debit;
      }
    }

    // 6️⃣ INSERT INTO REDEMPTIONS TABLE (Negative amount indicates outflow)
    const railUpper = payoutMethod.toUpperCase();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeRef = referenceNumber || `${railUpper}-${todayStr}-REQ${redemptionId}`;
    const shareholderName =
      redemption.shareholders?.fullName ||
      recipientName ||
      'Shareholder';

    const { error: redemptionInsertErr } = await supabase
      .from('redemptions')
      .insert({
        shareholder_id: resolvedShareholderId,
        redemption_request_id: redemptionId,
        // Synthetic identifiers to prevent NULLs and fit table expectations:
        stripe_refund_id: `MANUAL_REF_${railUpper}_REQ_${redemptionId}_${Date.now()}`,
        stripe_payment_intent_id: `offline_redemption_req_${redemptionId}_opp_${oppId || 'general'}`,
        stripe_charge_id: `offline_${payoutMethod.toLowerCase()}_payout`,
        status: 'succeeded',
        amount: -redeemedDollars,
        currency: 'USD',
        description: `Redemption payout via ${railUpper} (Ref: ${safeRef}) for Request #${redemptionId} - ${shareholderName}`,
        metadata: {
          payout_rail: payoutMethod,
          recipient_handle: recipientHandle,
          recipient_name: recipientName,
          reference_number: safeRef,
          original_payment_id: paymentUuid,
          admin_notes: adminNotes,
          is_manual: true,
          is_non_stripe: true,
          processed_by: session.user.adminId || session.user.email,
        },
        opportunity_id: oppId,
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

    // 8️⃣ UPDATE INVESTMENT AMOUNT_INVESTED, LEGACY ALLOCATIONS, AND OPPORTUNITY VALUATION
    await applyRedemptionToInvestmentAndLegacy({
      supabase,
      investmentId: redemption.investment_id,
      shareholderId: resolvedShareholderId,
      shareholderEmail: redemption.shareholders?.email || null,
      opportunityId: oppId,
      redeemedDollars,
      adminId: session.user.adminId || null,
    });

    revalidatePath('/admin/redemptions');
    revalidatePath('/admin/investments');
    revalidatePath('/admin/legacy');
    revalidatePath('/admin/shareholders');
    revalidatePath('/account');
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
   HELPER: REDUCE INVESTMENT AMOUNT, EXIT IF 0, SYNC LEGACY & VALUATION
------------------------------------------------------------ */
async function applyRedemptionToInvestmentAndLegacy({
  supabase,
  investmentId,
  shareholderId,
  shareholderEmail,
  opportunityId,
  redeemedDollars,
  adminId,
}) {
  const numericRedeemed = Math.max(0, Number(redeemedDollars || 0));
  if (numericRedeemed <= 0 && !investmentId) return;

  // Snapshot latest valuation BEFORE updating investments.amount_invested
  // (to detect whether the DB trigger trg_add_investment_to_opportunity_valuation already adjusted it)
  let valBefore = null;
  if (opportunityId) {
    const { data: vBefore } = await supabase
      .from('opportunity_valuations')
      .select('id, total_asset_value, valuation_date')
      .eq('opportunity_id', Number(opportunityId))
      .order('valuation_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    valBefore = vBefore || null;
  }

  let resolvedShId = shareholderId ? Number(shareholderId) : null;
  let resolvedOppId = opportunityId ? Number(opportunityId) : null;
  let newInvestedAmount = 0;

  // 1. Reduce investment amount_invested; if 0, mark status = 'exited' (not participating)
  if (investmentId) {
    const { data: inv } = await supabase
      .from('investments')
      .select('id, shareholder_id, opportunity_id, amount_invested, current_value, status')
      .eq('id', investmentId)
      .maybeSingle();

    if (inv) {
      if (!resolvedShId && inv.shareholder_id) resolvedShId = Number(inv.shareholder_id);
      if (!resolvedOppId && inv.opportunity_id) resolvedOppId = Number(inv.opportunity_id);

      const currentInvested = Number(inv.amount_invested || 0);
      newInvestedAmount = Math.max(0, currentInvested - numericRedeemed);

      const invUpdates = {
        amount_invested: newInvestedAmount,
        updated_at: new Date().toISOString(),
      };

      if (newInvestedAmount <= 0) {
        invUpdates.status = 'exited';
        invUpdates.current_value = 0;
        invUpdates.exited_at = new Date().toISOString();
      } else {
        invUpdates.status = 'active';
        invUpdates.exited_at = null;
        if (inv.current_value != null) {
          invUpdates.current_value = Math.max(0, Number(inv.current_value) - numericRedeemed);
        }
      }

      await supabase.from('investments').update(invUpdates).eq('id', inv.id);

      // If remaining investment is 0, remove from calendar_investments so shareholder is no longer a participant
      if (newInvestedAmount <= 0) {
        try {
          await supabase
            .from('calendar_investments')
            .delete()
            .eq('investment_id', inv.id);
        } catch (calErr) {
          console.warn('Notice removing exited investment from calendar_investments:', calErr?.message);
        }
      }
    }
  }

  // 2. Keep legacy_shareholders staging allocation in sync so Legacy Sync never re-activates an exited/reduced investment
  if ((resolvedShId || shareholderEmail) && resolvedOppId) {
    try {
      let legQuery = supabase.from('legacy_shareholders').select('*');
      if (resolvedShId && shareholderEmail) {
        legQuery = legQuery.or(
          `claimed_by_shareholder_id.eq.${resolvedShId},email.ilike.${shareholderEmail}`
        );
      } else if (resolvedShId) {
        legQuery = legQuery.eq('claimed_by_shareholder_id', resolvedShId);
      } else {
        legQuery = legQuery.ilike('email', shareholderEmail);
      }

      const { data: legacyRows } = await legQuery;

      for (const leg of legacyRows || []) {
        let allocations = [];
        let hasJsonInNotes = false;
        let cleanNotes = leg.notes || '';

        if (Array.isArray(leg.investments) && leg.investments.length > 0) {
          allocations = [...leg.investments];
        } else if (leg.notes && leg.notes.includes('[Allocations JSON]:')) {
          hasJsonInNotes = true;
          const parts = leg.notes.split('[Allocations JSON]:');
          cleanNotes = parts[0]?.trim() || '';
          try {
            const parsed = JSON.parse(parts[1]?.trim() || '[]');
            if (Array.isArray(parsed)) allocations = parsed;
          } catch (e) {
            console.warn('Could not parse legacy notes allocations JSON:', e);
          }
        } else if (leg.opportunity_id && Number(leg.amount_invested) > 0) {
          allocations = [
            {
              opportunity_id: Number(leg.opportunity_id),
              amount_invested: Number(leg.amount_invested),
              start_date: leg.start_date,
            },
          ];
        }

        if (allocations.length > 0) {
          const updatedAllocations = allocations
            .map((alloc) => {
              if (Number(alloc.opportunity_id) === Number(resolvedOppId)) {
                return {
                  ...alloc,
                  amount_invested: newInvestedAmount,
                };
              }
              return alloc;
            })
            .filter((alloc) => Number(alloc.amount_invested || 0) > 0);

          const newTotalLegacyInvested = updatedAllocations.reduce(
            (sum, a) => sum + Number(a.amount_invested || 0),
            0
          );
          const primaryAlloc = updatedAllocations[0] || null;

          const legacyUpdate = {
            amount_invested: newTotalLegacyInvested,
            opportunity_id: primaryAlloc ? Number(primaryAlloc.opportunity_id) : leg.opportunity_id,
            updated_at: new Date().toISOString(),
          };

          if (Array.isArray(leg.investments)) {
            legacyUpdate.investments = updatedAllocations;
          }
          if (hasJsonInNotes || !Array.isArray(leg.investments)) {
            legacyUpdate.notes = cleanNotes
              ? `${cleanNotes}\n[Allocations JSON]: ${JSON.stringify(updatedAllocations)}`
              : `[Allocations JSON]: ${JSON.stringify(updatedAllocations)}`;
          }

          const { error: legUpErr } = await supabase
            .from('legacy_shareholders')
            .update(legacyUpdate)
            .eq('id', leg.id);

          if (legUpErr && legUpErr.message?.includes('investments')) {
            delete legacyUpdate.investments;
            await supabase
              .from('legacy_shareholders')
              .update(legacyUpdate)
              .eq('id', leg.id);
          }
        }
      }
    } catch (legSyncErr) {
      console.warn('Notice syncing legacy_shareholders after redemption:', legSyncErr?.message);
    }
  }

  // 3. Adjust opportunity_valuations and opportunities.total_value ONLY if DB trigger did not already deduct it
  if (resolvedOppId && numericRedeemed > 0) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: latestValAfter } = await supabase
        .from('opportunity_valuations')
        .select('*')
        .eq('opportunity_id', Number(resolvedOppId))
        .order('valuation_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const triggerAlreadyAdjusted =
        valBefore &&
        latestValAfter &&
        Number(valBefore.total_asset_value || 0) - Number(latestValAfter.total_asset_value || 0) >=
          numericRedeemed - 0.01;

      if (!triggerAlreadyAdjusted) {
        if (latestValAfter) {
          const currentVal = Number(latestValAfter.total_asset_value || 0);
          const newTotalAssetValue = Math.max(0, currentVal - numericRedeemed);

          if (latestValAfter.valuation_date === today) {
            await supabase
              .from('opportunity_valuations')
              .update({ total_asset_value: newTotalAssetValue })
              .eq('id', latestValAfter.id);
          } else {
            await supabase
              .from('opportunity_valuations')
              .insert({
                opportunity_id: Number(resolvedOppId),
                total_asset_value: newTotalAssetValue,
                valuation_date: today,
                created_by_admin_id: adminId || null,
              });
          }
        } else {
          const { data: oppRecord } = await supabase
            .from('opportunities')
            .select('total_value')
            .eq('id', Number(resolvedOppId))
            .maybeSingle();

          const baseVal = oppRecord?.total_value ? Number(oppRecord.total_value) : 0;
          const newTotalAssetValue = Math.max(0, baseVal - numericRedeemed);
          await supabase
            .from('opportunity_valuations')
            .insert({
              opportunity_id: Number(resolvedOppId),
              total_asset_value: newTotalAssetValue,
              valuation_date: today,
              created_by_admin_id: adminId || null,
            });
        }

        const { data: opp } = await supabase
          .from('opportunities')
          .select('id, total_value')
          .eq('id', Number(resolvedOppId))
          .maybeSingle();

        if (opp && opp.total_value !== null && opp.total_value !== undefined) {
          const newOppTotal = Math.max(0, Number(opp.total_value || 0) - numericRedeemed);
          await supabase
            .from('opportunities')
            .update({ total_value: newOppTotal })
            .eq('id', Number(resolvedOppId));
        }
      }
    } catch (valErr) {
      console.error('Opportunity valuation adjustment failed:', valErr);
    }
  }
}

/* ---------------------------------------------------------
   BEGIN PROCESS REDEMPTION
------------------------------------------------------------ */

export async function processRedemptionAdmin(formData) {
  try {
    const session = await auth();
    const redemptionId = formData.get('redemptionId');
    const action = formData.get('action') || formData.get('status');
    const adminNotes = formData.get('admin_notes') || formData.get('rejectionNotes');

    // Grab the new policy ID (will be null if action === 'completed')
    const rejectionPolicyId = formData.get('rejectionPolicyId');

    if (!redemptionId || !action) throw new Error('Missing required fields');

    const supabase = createAdminSupabaseClient();

    const { data: existingRedemption, error: fetchErr } = await supabase
      .from('redemption_requests')
      .select(`
        *,
        shareholders ( id, fullName, email ),
        investments ( id, shareholder_id, opportunity_id, amount_invested, status )
      `)
      .eq('id', redemptionId)
      .maybeSingle();

    if (fetchErr || !existingRedemption) {
      throw new Error('Redemption request not found');
    }

    // Dynamically build the update payload
    const payload = {
      status: action,
      ...(adminNotes !== null && adminNotes !== undefined ? { admin_notes: adminNotes } : {}),
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const totalGoal = Number(existingRedemption.amount || 0);
    const alreadyRedeemed = Number(existingRedemption.already_redeemed_so_far || 0);
    const remainingToRedeem = Math.max(0, totalGoal - alreadyRedeemed);

    if (action === 'completed') {
      payload.already_redeemed_so_far = Math.max(totalGoal, alreadyRedeemed);
    }

    // If rejected, map the selected policy to the database record
    if (action === 'rejected') {
      if (!rejectionPolicyId) throw new Error('Rejection policy is required');
      payload.rejection_policy_id = rejectionPolicyId;
    }

    const { error } = await supabase
      .from('redemption_requests')
      .update(payload)
      .eq('id', redemptionId);

    if (error) throw new Error(error.message);

    if (action === 'completed' && existingRedemption.investment_id) {
      await applyRedemptionToInvestmentAndLegacy({
        supabase,
        investmentId: existingRedemption.investment_id,
        shareholderId: existingRedemption.shareholder_id || existingRedemption.investments?.shareholder_id,
        shareholderEmail: existingRedemption.shareholders?.email || null,
        opportunityId: existingRedemption.investments?.opportunity_id || null,
        redeemedDollars: remainingToRedeem,
        adminId: session?.user?.adminId || null,
      });
    } else if (action === 'rejected' && existingRedemption.investment_id) {
      // If redemption was rejected and the shareholder still has positive capital invested, ensure status is active
      const currentInvAmt = Number(existingRedemption.investments?.amount_invested || 0);
      if (currentInvAmt > 0) {
        await supabase
          .from('investments')
          .update({
            status: 'active',
            exited_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRedemption.investment_id);
      }
    }

    revalidatePath('/admin/redemptions');
    revalidatePath('/admin/investments');
    revalidatePath('/admin/legacy');
    revalidatePath('/account');
    revalidatePath('/account/investments');
    return { success: true };
  } catch (err) {
    console.error('processRedemptionAdmin error:', err);
    return { success: false, error: err.message };
  }
}

export { processRedemptionAdmin as updateRedemptionStatus };