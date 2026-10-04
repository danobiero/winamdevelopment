'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { revalidatePath } from 'next/cache';

//-------------------------------------------------------
// GET ALL INVESTMENTS
//-------------------------------------------------------
export async function getInvestments({ from, to, searchShareholder, filterOpportunity }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // If searching by shareholder nested field, PostgREST requires 'shareholders!inner(*)'
  const selectQuery = searchShareholder
    ? `
      *,
      opportunities(*),
      shareholders!inner(*),
      redemption_requests(id, status)
    `
    : `
      *,
      opportunities(*),
      shareholders(*),
      redemption_requests(id, status)
    `;

  let query = supabase
    .from('investments')
    .select(selectQuery);

  if (filterOpportunity) {
    query = query.eq('opportunity_id', filterOpportunity);
  }

  if (searchShareholder) {
    query = query.ilike('shareholders.fullName', `%${searchShareholder}%`);
  }

  const { data, error } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

//------------------------------------------------------
// GET INVESTMENT BY ID FOR INVESTMENT VIEW
//-----------------------------------------------------
export async function getInvestmentById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('investments')
    .select(
      `
      *,
      opportunities(*),
      shareholders(*),
      redemption_requests(*)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  // Find if there is an active (pending) redemption request
  const activeRedemption =
    data.redemption_requests?.find((r) => {
      const status = r.status?.toLowerCase().trim();
      return status === 'pending'; // Checks for pending redemptions
    }) ?? null;

  // Fetch all other investments for this shareholder
  let otherInvestments = [];
  if (data.shareholder_id) {
    const { data: others } = await supabase
      .from('investments')
      .select(`
        id,
        opportunity_id,
        amount_invested,
        total_committed,
        status,
        start_date,
        end_date,
        created_at,
        opportunities(id, name, type)
      `)
      .eq('shareholder_id', data.shareholder_id)
      .neq('id', data.id)
      .order('created_at', { ascending: false });

    otherInvestments = others || [];
  }

  return {
    ...data,
    activeRedemption, // 👈 derived, reliable
    hasActiveRedemption: Boolean(activeRedemption),
    otherInvestments,
  };
}

//-------------------------------------------------------
// GET INVESTMENT LEDGER
//--------------------------------------------------------

export async function getInvestmentLedger(investmentId) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    // Query the SQL View
    const { data: viewData, error } = await supabase
      .from('investment_ledger')
      .select('*')
      .eq('investment_id', investmentId)
      .order('transaction_date', { ascending: true });

    if (error) {
      console.error('Ledger query error:', error);
      throw new Error('Failed to load investment ledger');
    }

    const baseEntries = viewData || [];

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

    // Merge payment entries from view and redemption entries without duplicates
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
   GET REDEMPTION BY ID (for Redemption Process Modal)
------------------------------------------------------------ */

export async function getRedemptionById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // Fetch the redemption request with related shareholder, investment, and policy data
  const { data: redemption, error } = await supabase
    .from('redemption_requests')
    .select(`
      *,
      shareholders(*),
      investments(*),
      redemption_rejection_policies(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  return redemption;
}

export async function adminUpdateInvestment({
  investmentId,
  amount_invested,
  status,
}) {
  // 1️⃣ Verify admin session
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized: admin access only.');
  }

  const adminId = session.user.adminId;
  const supabase = createAdminSupabaseClient();

  // 2️⃣ Fetch current investment
  const { data: investment, error: invError } = await supabase
    .from('investments')
    .select('id, amount_invested, status')
    .eq('id', investmentId)
    .single();

  if (invError || !investment) throw new Error('Investment record not found');

  // 3️⃣ Detect changes
  const updatedFields = {};
  if (
    amount_invested !== undefined &&
    amount_invested !== investment.amount_invested
  )
    updatedFields.amount_invested = amount_invested;

  if (status !== undefined && status !== investment.status)
    updatedFields.status = status;

  if (Object.keys(updatedFields).length === 0)
    return { message: 'No changes detected' };

  // 4️⃣ Update investment record
  const { data: updatedInvestment, error: updateError } = await supabase
    .from('investments')
    .update({
      ...updatedFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', investmentId)
    .select()
    .single();

  if (updateError) throw new Error('Investment could not be updated');

  // 5️⃣ Log change into investment_changes
  const changedFields = {};
  if (updatedFields.amount_invested !== undefined) {
    changedFields.amount_invested = {
      old: investment.amount_invested,
      new: amount_invested,
    };
  }
  if (updatedFields.status !== undefined) {
    changedFields.status = { old: investment.status, new: status };
  }

  await supabase.from('investment_changes').insert({
    investment_id: investmentId,
    admin_id: adminId,
    change_type: 'admin_edit_investment',
    field_changed: changedFields,
    amount_difference: updatedFields.amount_invested
      ? Number(amount_invested) - Number(investment.amount_invested)
      : 0,
  });

  // 6️⃣ Revalidate
  revalidatePath(`/admin/investments`);
  revalidatePath(`/admin/investments/${investmentId}`);

  return {
    success: true,
    investment: updatedInvestment,
    message: 'Investment updated successfully.',
  };
}


/* ---------------------------------------------------------
   GET OPPORTUNITY BY ID
------------------------------------------------------------ */

export async function getOpportunity(id) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}


/**
 * Fetches aggregate context for an opportunity (e.g., total committed funds)
 */
export async function getInvestmentContext(opportunityId) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('investments')
    .select('total_committed')
    .eq('opportunity_id', opportunityId);

  if (error) throw new Error('Failed to load investment context.');

  const totalCommitted = data.reduce((sum, inv) => sum + Number(inv.total_committed || 0), 0);
  
  return { totalCommitted };
}

export async function beginRedemptionAdmin(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const investmentId = formData.get('investmentId');
  if (!investmentId) throw new Error('Investment ID is required');

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Fetch current investment to get shareholder_id, opportunity_id, amount_invested, status, and opportunity info
  const { data: investment, error: fetchError } = await supabase
    .from('investments')
    .select(`
      shareholder_id,
      opportunity_id,
      amount_invested,
      status,
      opportunities(id, name, type)
    `)
    .eq('id', investmentId)
    .single();

  if (fetchError || !investment) {
    console.error('Error fetching investment:', fetchError);
    throw new Error('Failed to fetch investment details');
  }

  // 1.2️⃣ Idempotency / Double-submit Guard: Check if investment already exited or in redemption
  const currentStatus = (investment.status || '').toLowerCase().trim();
  if (currentStatus === 'exited' || currentStatus === 'redemption') {
    console.warn(`beginRedemptionAdmin: Blocked duplicate attempt. Investment #${investmentId} is already '${currentStatus}'.`);
    throw new Error('Redemption has already been initiated for this investment.');
  }

  // 1.3️⃣ Idempotency Guard: Check if an active/pending redemption request already exists for this investment
  const { data: existingPendingRequests } = await supabase
    .from('redemption_requests')
    .select('id, status')
    .eq('investment_id', investmentId)
    .in('status', ['pending', 'approved', 'processing']);

  if (existingPendingRequests && existingPendingRequests.length > 0) {
    console.warn(
      `beginRedemptionAdmin: Blocked duplicate attempt. An active redemption request (#${existingPendingRequests[0].id}) already exists for investment #${investmentId}.`
    );
    throw new Error(
      `A redemption request is already pending or being processed for this investment (Request #${existingPendingRequests[0].id}).`
    );
  }

  // 1.5️⃣ Server guard: If Opportunity type is 'core', disallow redemption if shareholder participates in other opportunity types
  const oppType = (investment.opportunities?.type || '').toLowerCase().trim();
  if (oppType === 'core') {
    const { data: otherInvs } = await supabase
      .from('investments')
      .select('id, opportunity_id, amount_invested, status, opportunities(name, type)')
      .eq('shareholder_id', investment.shareholder_id)
      .neq('id', investmentId)
      .neq('status', 'exited');

    const activeOtherInvs = (otherInvs || []).filter((inv) => {
      const t = (inv.opportunities?.type || '').toLowerCase().trim();
      return t !== 'core' && t !== 'fees' && Number(inv.amount_invested || 0) > 0;
    });

    if (activeOtherInvs.length > 0) {
      const names = activeOtherInvs
        .map((i) => i.opportunities?.name || `Opportunity #${i.opportunity_id}`)
        .join(', ');
      throw new Error(
        `Redemption not allowed: Shareholder participates in other opportunity types (${names}).`
      );
    }
  }

  // 2️⃣ Insert new pending request into redemption_requests
  const { data: redemption, error: redemptionError } = await supabase
    .from('redemption_requests')
    .insert({
      investment_id: investmentId,
      shareholder_id: investment.shareholder_id,
      amount: investment.amount_invested,
      currency: 'USD',
      status: 'pending',
      reason_code: 'ADMIN_BEGIN_REDEMPTION',
      admin_notes: 'Redemption process initiated by Administrator',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (redemptionError || !redemption) {
    console.error('Error inserting redemption request:', redemptionError);
    throw new Error('Failed to create redemption request record');
  }

  // 2.5️⃣ Initialize Member Withdrawal Form if Opportunity is USA Land Project
  try {
    const { initializeWithdrawalFormForRedemption } = await import(
      '@/app/_lib/withdrawal-form-actions'
    );
    await initializeWithdrawalFormForRedemption({
      redemptionRequestId: redemption.id,
      investmentId: investmentId,
      shareholderId: investment.shareholder_id,
      opportunityId: investment.opportunity_id,
    });
  } catch (wfErr) {
    console.warn('Withdrawal form initialization warning:', wfErr.message);
  }

  // 3️⃣ Update investment status to 'exited' and record exited_at
  const { error: updateError } = await supabase
    .from('investments')
    .update({
      status: 'exited',
      exited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', investmentId);

  if (updateError) {
    console.error('Error updating investment status:', updateError);
    throw new Error('Failed to update investment status');
  }

  revalidatePath('/admin/investments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/account');
  revalidatePath('/account/investments');
}