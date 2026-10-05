'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Perform a comprehensive database foreign key integrity audit across all primary entities,
 * including payments, redemptions, investments, applications, and legacy_shareholders.
 */
export async function getDatabaseIntegrityReport() {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  // Fetch all related entities in parallel
  const [
    shRes,
    oppRes,
    payRes,
    redRes,
    invRes,
    rrRes,
    appRes,
    pmRes,
    legacyRes,
  ] = await Promise.all([
    supabase.from('shareholders').select('id, fullName, email').order('id', { ascending: true }),
    supabase.from('opportunities').select('id, name, type').order('id', { ascending: true }),
    supabase
      .from('payments')
      .select('id, shareholder_id, opportunity_id, amount, status, type, payment_method_type, description, metadata, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('redemptions')
      .select('id, shareholder_id, opportunity_id, redemption_request_id, stripe_refund_id, amount, status, description, metadata, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('investments')
      .select('id, shareholder_id, opportunity_id, amount_invested, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('redemption_requests')
      .select('id, shareholder_id, investment_id, amount, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('membership_applications')
      .select('id, shareholder_id, email, full_name, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('shareholder_payment_methods')
      .select('id, shareholder_id, payment_type, account_name, account_handle, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('legacy_shareholders')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  const shareholders = shRes.data || [];
  const opportunities = oppRes.data || [];
  const payments = payRes.data || [];
  const redemptions = redRes.data || [];
  const investments = invRes.data || [];
  const redemptionRequests = rrRes.data || [];
  const applications = appRes.data || [];
  const legacyShareholders = legacyRes.data || [];

  const shIdSet = new Set(shareholders.map((s) => s.id));
  const oppIdSet = new Set(opportunities.map((o) => o.id));
  const invIdSet = new Set(investments.map((i) => i.id));

  // 1. Audit Payments
  const orphanedPayments = payments
    .filter((p) => !p.shareholder_id || !shIdSet.has(p.shareholder_id))
    .map((p) => ({
      table: 'payments',
      id: p.id,
      amount: p.amount,
      type: p.type || 'PAYMENT',
      payment_method_type: p.payment_method_type,
      status: p.status,
      description: p.description,
      opportunity_id: p.opportunity_id,
      has_invalid_opp: Boolean(p.opportunity_id && !oppIdSet.has(p.opportunity_id)),
      metadata: p.metadata,
      created_at: p.created_at,
      reason: !p.shareholder_id
        ? 'Missing shareholder_id (NULL)'
        : `Invalid shareholder_id (#${p.shareholder_id} does not exist)`,
    }));

  // 2. Audit Redemptions
  const orphanedRedemptions = redemptions
    .filter((r) => !r.shareholder_id || !shIdSet.has(r.shareholder_id))
    .map((r) => ({
      table: 'redemptions',
      id: r.id,
      amount: r.amount,
      type: 'REDEMPTION',
      payment_method_type: r.metadata?.payout_rail || 'manual',
      status: r.status,
      description: r.description,
      opportunity_id: r.opportunity_id,
      has_invalid_opp: Boolean(r.opportunity_id && !oppIdSet.has(r.opportunity_id)),
      metadata: r.metadata,
      created_at: r.created_at,
      reason: !r.shareholder_id
        ? 'Missing shareholder_id (NULL)'
        : `Invalid shareholder_id (#${r.shareholder_id} does not exist)`,
    }));

  // 3. Audit Investments
  const orphanedInvestments = investments
    .filter((i) => !i.shareholder_id || !shIdSet.has(i.shareholder_id) || (i.opportunity_id && !oppIdSet.has(i.opportunity_id)))
    .map((i) => ({
      table: 'investments',
      id: i.id,
      amount: i.amount_invested,
      type: 'INVESTMENT',
      status: i.status,
      opportunity_id: i.opportunity_id,
      has_invalid_opp: Boolean(i.opportunity_id && !oppIdSet.has(i.opportunity_id)),
      created_at: i.created_at,
      reason: !i.shareholder_id
        ? 'Missing shareholder_id'
        : !shIdSet.has(i.shareholder_id)
        ? `Invalid shareholder_id (#${i.shareholder_id})`
        : `Invalid opportunity_id (#${i.opportunity_id})`,
    }));

  // 4. Audit Redemption Requests
  const orphanedRedemptionRequests = redemptionRequests
    .filter((rr) => !rr.shareholder_id || !shIdSet.has(rr.shareholder_id) || (rr.investment_id && !invIdSet.has(rr.investment_id)))
    .map((rr) => ({
      table: 'redemption_requests',
      id: rr.id,
      amount: rr.amount,
      type: 'REQUEST',
      status: rr.status,
      created_at: rr.created_at,
      reason: !rr.shareholder_id ? 'Missing shareholder_id' : 'Invalid foreign key reference',
    }));

  // 5. Audit Applications
  const orphanedApplications = applications
    .filter((a) => a.shareholder_id && !shIdSet.has(a.shareholder_id))
    .map((a) => ({
      table: 'membership_applications',
      id: a.id,
      email: a.email,
      name: a.full_name,
      type: 'APPLICATION',
      status: a.status,
      created_at: a.created_at,
      reason: `shareholder_id #${a.shareholder_id} does not exist in shareholders table`,
    }));

  // 6. Audit Legacy Shareholders (Unlinked or Ghost Claimed)
  const orphanedLegacyShareholders = legacyShareholders
    .filter((l) => {
      const isGhostClaimed = l.is_claimed && (!l.claimed_by_shareholder_id || !shIdSet.has(l.claimed_by_shareholder_id));
      const hasDanglingClaim = l.claimed_by_shareholder_id && !shIdSet.has(l.claimed_by_shareholder_id);
      const hasInvalidOpp = l.opportunity_id && !oppIdSet.has(l.opportunity_id);
      return isGhostClaimed || hasDanglingClaim || hasInvalidOpp;
    })
    .map((l) => {
      let reason = 'Unmatched legacy record';
      if (l.is_claimed && !l.claimed_by_shareholder_id) {
        reason = 'Ghost Claimed: Marked as claimed, but linked shareholder was deleted from shareholders table';
      } else if (l.claimed_by_shareholder_id && !shIdSet.has(l.claimed_by_shareholder_id)) {
        reason = `Broken Link: Claimed by shareholder #${l.claimed_by_shareholder_id} which no longer exists`;
      } else if (l.opportunity_id && !oppIdSet.has(l.opportunity_id)) {
        reason = `Invalid Opportunity: Points to opportunity #${l.opportunity_id} which does not exist`;
      }

      return {
        table: 'legacy_shareholders',
        id: l.id,
        amount: l.amount_invested,
        type: 'LEGACY_STAGING',
        status: l.is_claimed ? 'ghost_claimed' : 'unclaimed',
        description: `Staged record for ${l.full_name} (${l.email})`,
        metadata: {
          full_name: l.full_name,
          email: l.email,
          telephone: l.telephone,
          notes: l.notes,
          claimed_by_shareholder_id: l.claimed_by_shareholder_id,
          is_claimed: l.is_claimed,
        },
        created_at: l.created_at,
        reason,
        canReset: l.is_claimed,
      };
    });

  // Calculate high-level metrics
  const totalAuditRecords =
    payments.length +
    redemptions.length +
    investments.length +
    redemptionRequests.length +
    applications.length +
    legacyShareholders.length;

  const totalOrphans =
    orphanedPayments.length +
    orphanedRedemptions.length +
    orphanedInvestments.length +
    orphanedRedemptionRequests.length +
    orphanedApplications.length +
    orphanedLegacyShareholders.length;

  const healthyRecords = totalAuditRecords - totalOrphans;
  const integrityScore =
    totalAuditRecords > 0
      ? Math.round((healthyRecords / totalAuditRecords) * 1000) / 10
      : 100;

  return {
    metrics: {
      integrityScore,
      totalAuditRecords,
      healthyRecords,
      totalOrphans,
      shareholdersCount: shareholders.length,
      opportunitiesCount: opportunities.length,
      legacyCount: legacyShareholders.length,
    },
    tables: {
      payments: {
        total: payments.length,
        orphans: orphanedPayments.length,
        items: orphanedPayments,
      },
      redemptions: {
        total: redemptions.length,
        orphans: orphanedRedemptions.length,
        items: orphanedRedemptions,
      },
      investments: {
        total: investments.length,
        orphans: orphanedInvestments.length,
        items: orphanedInvestments,
      },
      redemptionRequests: {
        total: redemptionRequests.length,
        orphans: orphanedRedemptionRequests.length,
        items: orphanedRedemptionRequests,
      },
      applications: {
        total: applications.length,
        orphans: orphanedApplications.length,
        items: orphanedApplications,
      },
      legacyShareholders: {
        total: legacyShareholders.length,
        orphans: orphanedLegacyShareholders.length,
        items: orphanedLegacyShareholders,
      },
    },
    shareholdersList: shareholders.map((s) => ({
      id: s.id,
      name: s.fullName,
      email: s.email,
    })),
  };
}

/**
 * Purge a single orphaned test or invalid record
 */
export async function purgeOrphanedRecord({ table, id }) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const allowedTables = [
    'payments',
    'redemptions',
    'investments',
    'redemption_requests',
    'legacy_shareholders',
  ];
  if (!allowedTables.includes(table)) {
    throw new Error(`Deletion not permitted on table: ${table}`);
  }

  const supabase = createAdminSupabaseClient();

  // If purging a legacy shareholder, clean up any synthetic payment records too
  if (table === 'legacy_shareholders') {
    try {
      await supabase
        .from('payments')
        .delete()
        .like('stripe_payment_intent_id', `legacy_${id}_opp_%`);
    } catch (err) {
      console.warn('Notice cleaning up legacy synthetic payments:', err?.message);
    }
  }

  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) {
    console.error(`Failed to delete record ${id} from ${table}:`, error);
    throw new Error(`Purge failed: ${error.message}`);
  }

  revalidatePath('/admin/system/database');
  revalidatePath('/admin/legacy');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/shareholders');

  return { success: true, message: `Successfully purged record #${id} from ${table}.` };
}

/**
 * Reset a ghost claimed legacy record to Awaiting Sign-In status
 */
export async function resetLegacyRecordStatus(id) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('legacy_shareholders')
    .update({
      is_claimed: false,
      claimed_at: null,
      claimed_by_shareholder_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to reset legacy shareholder status:', error);
    throw new Error(`Reset failed: ${error.message}`);
  }

  revalidatePath('/admin/system/database');
  revalidatePath('/admin/legacy');

  return {
    success: true,
    message: `Legacy record #${id} reset to "Awaiting Sign-In" status.`,
  };
}

/**
 * Reassign an orphaned record to a valid shareholder
 */
export async function reassignOrphanedRecord({ table, id, shareholderId, opportunityId }) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const allowedTables = [
    'payments',
    'redemptions',
    'investments',
    'redemption_requests',
    'membership_applications',
    'legacy_shareholders',
  ];
  if (!allowedTables.includes(table)) {
    throw new Error(`Update not permitted on table: ${table}`);
  }

  const supabase = createAdminSupabaseClient();
  const shId = Number(shareholderId);

  // Verify shareholder exists
  const { data: sh, error: shErr } = await supabase
    .from('shareholders')
    .select('id, fullName')
    .eq('id', shId)
    .single();

  if (shErr || !sh) {
    throw new Error('Selected shareholder does not exist.');
  }

  let updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (table === 'legacy_shareholders') {
    updatePayload.claimed_by_shareholder_id = shId;
    updatePayload.is_claimed = true;
    updatePayload.claimed_at = new Date().toISOString();
  } else {
    updatePayload.shareholder_id = shId;
    if (opportunityId !== undefined && opportunityId !== null && opportunityId !== '') {
      updatePayload.opportunity_id = Number(opportunityId);
    }
  }

  const { error } = await supabase.from(table).update(updatePayload).eq('id', id);

  if (error) {
    console.error(`Failed to reassign record ${id} in ${table}:`, error);
    throw new Error(`Reassignment failed: ${error.message}`);
  }

  revalidatePath('/admin/system/database');
  revalidatePath('/admin/legacy');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/shareholders');

  return {
    success: true,
    message: `Record #${id} successfully reconciled and linked to Shareholder #${shId} (${sh.fullName}).`,
  };
}

/**
 * Bulk purge orphaned records from a table
 */
export async function bulkPurgeOrphans({ table, ids }) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('No records specified for purge.');
  }

  const allowedTables = [
    'payments',
    'redemptions',
    'investments',
    'redemption_requests',
    'legacy_shareholders',
  ];
  if (!allowedTables.includes(table)) {
    throw new Error(`Bulk deletion not permitted on table: ${table}`);
  }

  const supabase = createAdminSupabaseClient();

  if (table === 'legacy_shareholders') {
    for (const legacyId of ids) {
      try {
        await supabase
          .from('payments')
          .delete()
          .like('stripe_payment_intent_id', `legacy_${legacyId}_opp_%`);
      } catch (err) {
        console.warn('Notice cleaning up legacy payments:', err?.message);
      }
    }
  }

  const { error } = await supabase.from(table).delete().in('id', ids);

  if (error) {
    console.error(`Bulk purge failed on ${table}:`, error);
    throw new Error(`Bulk purge failed: ${error.message}`);
  }

  revalidatePath('/admin/system/database');
  revalidatePath('/admin/legacy');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/shareholders');

  return {
    success: true,
    message: `Successfully purged ${ids.length} orphaned records from ${table}.`,
  };
}
