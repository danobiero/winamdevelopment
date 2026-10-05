'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';

/**
 * Fetch all shareholders with aggregated financial and application metrics for directory view
 */
export async function getShareholdersSummaryList() {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  // Parallel fetch: shareholders, investments, payments, redemptions, applications, payment methods
  const [shRes, invRes, payRes, redRes, appRes, pmRes] = await Promise.all([
    supabase
      .from('shareholders')
      .select('*')
      .order('id', { ascending: true }),
    supabase
      .from('investments')
      .select('id, shareholder_id, amount_invested, status, opportunity_id'),
    supabase
      .from('payments')
      .select('id, shareholder_id, amount, status, type'),
    supabase
      .from('redemptions')
      .select('id, shareholder_id, amount, status'),
    supabase
      .from('membership_applications')
      .select('id, shareholder_id, email, status, application_fee_paid'),
    supabase
      .from('shareholder_payment_methods')
      .select('id, shareholder_id, payment_type, account_name, account_handle'),
  ]);

  const shareholders = shRes.data || [];
  const investments = invRes.data || [];
  const payments = payRes.data || [];
  const redemptions = redRes.data || [];
  const applications = appRes.data || [];
  const paymentMethods = pmRes.data || [];

  // Index maps by shareholder_id
  const invMap = {};
  investments.forEach((i) => {
    if (!i.shareholder_id) return;
    if (!invMap[i.shareholder_id]) invMap[i.shareholder_id] = [];
    invMap[i.shareholder_id].push(i);
  });

  const payMap = {};
  payments.forEach((p) => {
    if (!p.shareholder_id) return;
    if (!payMap[p.shareholder_id]) payMap[p.shareholder_id] = [];
    payMap[p.shareholder_id].push(p);
  });

  const redMap = {};
  redemptions.forEach((r) => {
    if (!r.shareholder_id) return;
    if (!redMap[r.shareholder_id]) redMap[r.shareholder_id] = [];
    redMap[r.shareholder_id].push(r);
  });

  const appMap = {};
  applications.forEach((a) => {
    const key = a.shareholder_id;
    if (key) {
      if (!appMap[key]) appMap[key] = [];
      appMap[key].push(a);
    }
  });

  const pmMap = {};
  paymentMethods.forEach((pm) => {
    if (pm.shareholder_id) pmMap[pm.shareholder_id] = pm;
  });

  // Assemble summary objects
  return shareholders.map((sh) => {
    const userInvs = invMap[sh.id] || [];
    const userPays = payMap[sh.id] || [];
    const userReds = redMap[sh.id] || [];
    const userApps = appMap[sh.id] || (sh.email ? applications.filter((a) => a.email?.toLowerCase() === sh.email.toLowerCase()) : []);
    const userPm = pmMap[sh.id] || null;

    const totalInvested = userInvs.reduce(
      (sum, item) => sum + Number(item.amount_invested || 0),
      0
    );
    const activeInvsCount = userInvs.filter((i) => (i.status || '').toLowerCase() === 'active').length;

    const totalPaymentsAmount = userPays
      .filter((p) => (p.status || '').toLowerCase() === 'succeeded')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalRedeemedAmount = userReds
      .filter((r) => (r.status || '').toLowerCase() === 'succeeded')
      .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);

    // Identify if profile has null details
    const hasNullFields =
      !sh.telephone ||
      !sh.nationality ||
      sh.auth_user_id === null ||
      sh.updated_at === null ||
      sh.sharePercentage === null ||
      sh.sharePercentage === undefined;

    return {
      ...sh,
      stats: {
        investmentsCount: userInvs.length,
        activeInvestmentsCount: activeInvsCount,
        totalInvested,
        paymentsCount: userPays.length,
        totalPaymentsAmount,
        redemptionsCount: userReds.length,
        totalRedeemedAmount,
        applicationsCount: userApps.length,
        hasPaymentMethod: Boolean(userPm),
        payoutMethodType: userPm?.payment_type || null,
        hasNullFields,
      },
    };
  });
}

/**
 * Fetch 360-degree drill down for a specific shareholder
 */
export async function getShareholderDrillDown(shareholderId) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();
  const shId = Number(shareholderId);

  // 1. Fetch Profile
  const { data: shareholder, error: shErr } = await supabase
    .from('shareholders')
    .select('*')
    .eq('id', shId)
    .single();

  if (shErr || !shareholder) {
    throw new Error('Shareholder profile not found');
  }

  // 2. Fetch all related entities in parallel
  const [
    pmRes,
    appRes,
    invRes,
    payRes,
    redRes,
    rrRes,
    wfRes,
    supportRes,
    legacyRes,
  ] = await Promise.all([
    supabase
      .from('shareholder_payment_methods')
      .select('*')
      .eq('shareholder_id', shId)
      .maybeSingle(),
    shareholder.email
      ? supabase
          .from('membership_applications')
          .select('*')
          .or(`shareholder_id.eq.${shId},email.ilike.${shareholder.email}`)
          .order('created_at', { ascending: false })
      : supabase
          .from('membership_applications')
          .select('*')
          .eq('shareholder_id', shId)
          .order('created_at', { ascending: false }),
    supabase
      .from('investments')
      .select(`
        *,
        opportunities (
          id,
          name,
          type,
          status,
          total_value
        )
      `)
      .eq('shareholder_id', shId)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        ),
        fees (
          id,
          name,
          type
        )
      `)
      .eq('shareholder_id', shId)
      .order('created_at', { ascending: false }),
    supabase
      .from('redemptions')
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        )
      `)
      .eq('shareholder_id', shId)
      .order('created_at', { ascending: false }),
    supabase
      .from('redemption_requests')
      .select(`
        *,
        investments (
          id,
          opportunity_id,
          opportunities (
            id,
            name
          )
        )
      `)
      .eq('shareholder_id', shId)
      .order('created_at', { ascending: false }),
    supabase
      .from('member_withdrawal_forms')
      .select('*')
      .eq('shareholder_id', shId)
      .order('created_at', { ascending: false }),
    shareholder.email
      ? supabase
          .from('support')
          .select('*')
          .or(`shareholder_id.eq.${shId},email.ilike.${shareholder.email}`)
          .order('created_at', { ascending: false })
      : supabase
          .from('support')
          .select('*')
          .eq('shareholder_id', shId)
          .order('created_at', { ascending: false }),
    shareholder.email
      ? supabase
          .from('legacy_shareholders')
          .select('*')
          .or(`claimed_by_shareholder_id.eq.${shId},email.ilike.${shareholder.email}`)
          .maybeSingle()
      : supabase
          .from('legacy_shareholders')
          .select('*')
          .eq('claimed_by_shareholder_id', shId)
          .maybeSingle(),
  ]);

  return {
    shareholder,
    paymentMethod: pmRes.data || null,
    applications: appRes.data || [],
    investments: invRes.data || [],
    payments: payRes.data || [],
    redemptions: redRes.data || [],
    redemptionRequests: rrRes.data || [],
    withdrawalForms: wfRes.data || [],
    supportTickets: supportRes.data || [],
    legacyRecord: legacyRes.data || null,
  };
}
