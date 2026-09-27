'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { revalidatePath } from 'next/cache';

// Get a single payment
export async function getPaymentById(id) {
  const session = await auth();

  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      created_at,
      updated_at,
      amount,
      currency,
      status,
      type,
      payment_method_type,
      description,
      receipt_url,
      stripe_payment_intent_id,
      stripe_session_id,
      stripe_charge_id,
      stripe_customer_id,
      metadata,
      opportunity_id,
      shareholder_id,

      shareholders (
        id,
        fullName,
        email,
        telephone,
        nationality,
        countryFlag,
        shareholderStatus,
        sharePercentage,
        isDirector,
        auth_user_id
      ),

      opportunities (
        id,
        name,
        description,
        image_url,
        type,
        status,
        minimum_investment,
        total_value,
        expected_return,
        duration_months,
        is_featured,
        analysis
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPaymentById_old(id) {
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
export async function getPayments_old({ from, to }) {
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

// Get all payments
export async function getPayments({ from, to, searchShareholder, filterOpportunity, startDate, endDate }) {
  const supabase = createAdminSupabaseClient();

  const selectQuery = searchShareholder
    ? `
      id,
      created_at,
      updated_at,
      amount,
      currency,
      status,
      type,
      payment_method_type,
      description,
      receipt_url,
      stripe_payment_intent_id,
      stripe_session_id,
      stripe_charge_id,
      stripe_customer_id,
      metadata,
      opportunity_id,
      shareholder_id,
      shareholders!inner (
        id,
        fullName,
        email,
        telephone,
        shareholderStatus,
        sharePercentage,
        isDirector
      ),
      opportunities (
        id,
        name,
        type,
        status,
        minimum_investment,
        expected_return,
        duration_months,
        is_featured
      )
    `
    : `
      id,
      created_at,
      updated_at,
      amount,
      currency,
      status,
      type,
      payment_method_type,
      description,
      receipt_url,
      stripe_payment_intent_id,
      stripe_session_id,
      stripe_charge_id,
      stripe_customer_id,
      metadata,
      opportunity_id,
      shareholder_id,
      shareholders (
        id,
        fullName,
        email,
        telephone,
        shareholderStatus,
        sharePercentage,
        isDirector
      ),
      opportunities (
        id,
        name,
        type,
        status,
        minimum_investment,
        expected_return,
        duration_months,
        is_featured
      )
    `;

  let query = supabase
    .from('payments')
    .select(selectQuery);

  if (filterOpportunity) {
    query = query.eq('opportunity_id', filterOpportunity);
  }

  if (searchShareholder) {
    query = query.ilike('shareholders.fullName', `%${searchShareholder}%`);
  }

  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00Z`);
  }

  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59Z`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return data;
}

// ============================================================
// PAYMENT MODE SETTINGS ACTIONS (Stripe vs Zelle/Cash App)
// ============================================================
export async function getPaymentModeAction() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('settings')
      .select('payment_mode')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data || !data.payment_mode) {
      return 'manual';
    }
    return data.payment_mode; // 'stripe' or 'manual'
  } catch (err) {
    console.error('getPaymentModeAction error:', err);
    return 'manual';
  }
}

export async function updatePaymentModeAction(mode) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  if (!['stripe', 'manual'].includes(mode)) {
    throw new Error('Invalid payment mode');
  }

  const supabase = createAdminSupabaseClient();

  // Try updating the existing settings row directly to avoid triggering NOT NULL constraint on unsupplied columns
  const { data: updatedRows, error: updateError } = await supabase
    .from('settings')
    .update({ payment_mode: mode, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('id');

  if (updateError) {
    console.error('Failed to update payment mode:', updateError.message);
    throw new Error(`Failed to update payment mode: ${updateError.message}`);
  }

  // Fallback: If no row with id = 1 was found, check if another settings row exists or insert
  if (!updatedRows || updatedRows.length === 0) {
    const { data: firstRow } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstRow?.id) {
      const { error: fallbackError } = await supabase
        .from('settings')
        .update({ payment_mode: mode, updated_at: new Date().toISOString() })
        .eq('id', firstRow.id);

      if (fallbackError) {
        console.error('Failed to update payment mode:', fallbackError.message);
        throw new Error(`Failed to update payment mode: ${fallbackError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('settings')
        .insert({ id: 1, payment_mode: mode, company_name: 'Winam Development Group' });

      if (insertError) {
        console.error('Failed to update payment mode:', insertError.message);
        throw new Error(`Failed to update payment mode: ${insertError.message}`);
      }
    }
  }

  revalidatePath('/admin/payments');
  revalidatePath('/opportunities', 'layout');
  revalidatePath('/opportunities');
  revalidatePath('/account/portfolio');
  return { ok: true, mode };
}

// ============================================================
// CONFIRM MANUAL PAYMENT (Zelle, CashApp, Check, etc.)
// ============================================================
export async function confirmManualPaymentAction(paymentId, { reference = '', note = '' } = {}) {
  const session = await auth();

  if (!session?.user?.adminId) {
    return { error: true, message: 'Unauthorized. Admin credentials required.' };
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch current payment details
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select(`
      *,
      shareholders ( id, fullName, email ),
      opportunities ( id, name, type, minimum_investment )
    `)
    .eq('id', paymentId)
    .maybeSingle();

  if (fetchErr || !payment) {
    console.error('Error fetching payment for confirmation:', fetchErr);
    return { error: true, message: 'Payment record not found.' };
  }

  const currentStatus = (payment.status || '').toLowerCase().trim();
  if (['succeeded', 'paid', 'success', 'completed'].includes(currentStatus)) {
    return { error: true, message: 'This payment has already been confirmed.' };
  }

  const amountUSD = Number(payment.amount || 0);
  const shareholderId = payment.shareholder_id ? Number(payment.shareholder_id) : null;
  const oppId = payment.opportunity_id ? Number(payment.opportunity_id) : null;
  const paymentMethod = (payment.payment_method_type || 'manual').toLowerCase();
  const currentMeta = payment.metadata || {};

  // 2. Update Payment Status to 'succeeded'
  const updatedMeta = {
    ...currentMeta,
    confirmed_by_admin: session.user.adminId,
    confirmed_at: new Date().toISOString(),
    admin_confirmation_note: note || 'Confirmed by admin',
    reference_number: reference || currentMeta.reference_number || null,
    manual_payment_confirmed: true,
  };

  const { error: payUpdateErr } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
      metadata: updatedMeta,
    })
    .eq('id', paymentId);

  if (payUpdateErr) {
    console.error('Failed to update payment status:', payUpdateErr);
    return { error: true, message: `Failed to update payment status: ${payUpdateErr.message}` };
  }

  // 3. Update Investor Records
  let investmentUpdated = false;

  // Case A: Investment allocation (has opportunity_id and shareholder_id)
  if (shareholderId && oppId) {
    // Check if an existing investment record exists for this shareholder + opportunity
    const { data: existingInv, error: invFetchErr } = await supabase
      .from('investments')
      .select('*')
      .eq('shareholder_id', shareholderId)
      .eq('opportunity_id', oppId)
      .maybeSingle();

    let targetInvestmentId = null;

    if (existingInv) {
      // Increment existing investment
      const newInvested = Number(existingInv.amount_invested || 0) + amountUSD;
      const newCommitted = Math.max(Number(existingInv.total_committed || 0), newInvested);

      const { error: invUpdateErr } = await supabase
        .from('investments')
        .update({
          amount_invested: newInvested,
          total_committed: newCommitted,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInv.id);

      if (invUpdateErr) {
        console.error('Error updating existing investment:', invUpdateErr);
      } else {
        investmentUpdated = true;
        targetInvestmentId = existingInv.id;
      }
    } else {
      // Insert new investment record
      const oppName = payment.opportunities?.name || `Opportunity #${oppId}`;
      const { data: newInv, error: invInsertErr } = await supabase
        .from('investments')
        .insert({
          shareholder_id: shareholderId,
          opportunity_id: oppId,
          amount_invested: amountUSD,
          total_committed: amountUSD,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          notes: `Investment in ${oppName} confirmed via ${paymentMethod.toUpperCase()}${reference ? ` (Ref: ${reference})` : ''}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle();

      if (invInsertErr) {
        console.error('Error inserting new investment:', invInsertErr);
      } else {
        investmentUpdated = true;
        targetInvestmentId = newInv?.id;
      }
    }

    // Safely associate investment with calendar events for this opportunity
    if (targetInvestmentId) {
      try {
        const { data: cals } = await supabase
          .from('calendar')
          .select('id')
          .eq('opportunity_id', oppId);

        if (cals && cals.length > 0) {
          for (const cal of cals) {
            await supabase
              .from('calendar_investments')
              .upsert(
                { calendar_id: cal.id, investment_id: targetInvestmentId },
                { onConflict: 'calendar_id,investment_id' }
              );
          }
        }
      } catch (_) {
        // Triggers or existing constraints may handle this automatically
      }
    }

    // Also check if opportunity is Core portfolio
    const oppType = payment.opportunities?.type?.toLowerCase();
    const isCore = oppType === 'core' || currentMeta.is_core === 'true' || currentMeta.is_core === true;
    const shareholderEmail = payment.shareholders?.email || currentMeta.email;

    if (isCore && shareholderEmail) {
      const { data: memberApp } = await supabase
        .from('membership_applications')
        .select('*')
        .eq('email', shareholderEmail)
        .eq('is_archived', false)
        .maybeSingle();

      if (memberApp) {
        const newFunding = Number(memberApp.current_shareholding_value || 0) + amountUSD;
        await supabase
          .from('membership_applications')
          .update({
            current_shareholding_value: newFunding,
            status: newFunding >= 2000 ? 'completed' : memberApp.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memberApp.id);
      }
    }

    // 4. Update Opportunity Valuation: Add the new investment amount to total_asset_value
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: latestVal } = await supabase
        .from('opportunity_valuations')
        .select('*')
        .eq('opportunity_id', oppId)
        .order('valuation_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let newTotalAssetValue = amountUSD;

      if (latestVal) {
        newTotalAssetValue = Number(latestVal.total_asset_value || 0) + amountUSD;
        if (latestVal.valuation_date === today) {
          await supabase
            .from('opportunity_valuations')
            .update({
              total_asset_value: newTotalAssetValue,
              created_at: new Date().toISOString(),
            })
            .eq('id', latestVal.id);
        } else {
          await supabase
            .from('opportunity_valuations')
            .insert({
              opportunity_id: oppId,
              total_asset_value: newTotalAssetValue,
              valuation_date: today,
              created_by_admin_id: session.user.adminId,
            });
        }
      } else {
        await supabase
          .from('opportunity_valuations')
          .insert({
            opportunity_id: oppId,
            total_asset_value: amountUSD,
            valuation_date: today,
            created_by_admin_id: session.user.adminId,
          });
      }

      // Also update opportunities.total_value if column exists
      const { data: oppRow } = await supabase
        .from('opportunities')
        .select('total_value')
        .eq('id', oppId)
        .maybeSingle();

      if (oppRow) {
        await supabase
          .from('opportunities')
          .update({
            total_value: Number(oppRow.total_value || 0) + amountUSD,
          })
          .eq('id', oppId);
      }
    } catch (valErr) {
      console.warn('Could not increment opportunity total_asset_value:', valErr.message);
    }
  }

  // Case B: Application Fee payment
  if (payment.type === 'FEE') {
    const email = payment.shareholders?.email || currentMeta.email;
    if (email) {
      await supabase
        .from('membership_applications')
        .update({
          application_fee_paid: true,
          status: 'reviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);
    }
  }

  // 4. Revalidate all paths
  revalidatePath('/admin/payments');
  revalidatePath('/admin/investments');
  revalidatePath('/admin/finance-reports');
  revalidatePath('/admin/finance-reports/valuations');
  revalidatePath('/admin/reports');
  revalidatePath('/account/investments');
  revalidatePath('/account/portfolio');
  revalidatePath('/account');
  revalidatePath('/membership');

  return {
    success: true,
    message: `Payment confirmed successfully. Investor records ${investmentUpdated ? 'updated' : 'processed'}.`,
  };
}

// ============================================================
// FAIL / DECLINE UNRECONCILED MANUAL PAYMENT
// ============================================================
export async function failManualPaymentAction(paymentId, { reason = '' } = {}) {
  const session = await auth();

  if (!session?.user?.adminId) {
    return { error: true, message: 'Unauthorized. Admin credentials required.' };
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch current payment details
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select(`
      *,
      shareholders ( id, fullName, email ),
      opportunities ( id, name, type )
    `)
    .eq('id', paymentId)
    .maybeSingle();

  if (fetchErr || !payment) {
    return { error: true, message: 'Payment record not found.' };
  }

  const currentStatus = (payment.status || '').toLowerCase().trim();
  if (['succeeded', 'paid', 'success', 'completed'].includes(currentStatus)) {
    return {
      error: true,
      message: 'This payment has already been marked as succeeded and cannot be marked as failed.',
    };
  }

  const currentMeta = payment.metadata || {};
  const failureReason = reason.trim() || 'Payment could not be reconciled by administrator.';

  const updatedMeta = {
    ...currentMeta,
    failed_by_admin: session.user.adminId,
    failed_at: new Date().toISOString(),
    failure_reason: failureReason,
    reconciliation_status: 'unreconciled_failed',
  };

  // 2. Update payment status to 'failed'
  const { error: payUpdateErr } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
      metadata: updatedMeta,
    })
    .eq('id', paymentId);

  if (payUpdateErr) {
    console.error('Failed to update payment status to failed:', payUpdateErr);
    return { error: true, message: `Failed to update payment status: ${payUpdateErr.message}` };
  }

  // 3. Revalidate paths
  revalidatePath('/admin/payments');
  revalidatePath('/admin/investments');
  revalidatePath('/admin/finance-reports');
  revalidatePath('/admin/reports');
  revalidatePath('/account/investments');
  revalidatePath('/account/portfolio');
  revalidatePath('/account');

  return {
    success: true,
    message: `Payment marked as failed. Reason recorded: "${failureReason}". The shareholder will see this in their payment statements.`,
  };
}
