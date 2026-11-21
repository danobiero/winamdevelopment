'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { revalidatePath } from 'next/cache';

const STORAGE_BUCKET = 'opportunity-documents';
const FALLBACK_LEDGER_PATH = 'system/dividend_declarations.json';

/**
 * Helper: Calculate pro-rata dividend allocations across active participating shareholders
 * with cent-level reconciliation so the sum of allocations equals declaredAmount exactly.
 */
function computeShareholderAllocations(participants = [], declaredAmount = 0) {
  const totalAmount = Number(Number(declaredAmount || 0).toFixed(2));
  if (!participants.length || totalAmount <= 0) return [];

  const totalInvested = participants.reduce(
    (sum, p) => sum + (Number(p.amount_invested) || 0),
    0
  );
  if (totalInvested <= 0) return [];

  const rows = participants.map((p) => {
    const invested = Number(p.amount_invested) || 0;
    const ratio = invested / totalInvested;
    const rawDividend = Number((ratio * totalAmount).toFixed(2));
    return {
      shareholder_id: Number(p.shareholder_id),
      fullName: p.fullName || 'Anonymous Shareholder',
      email: p.email || 'N/A',
      telephone: p.telephone || '',
      amount_invested: invested,
      ownership_percent: Number((ratio * 100).toFixed(2)),
      ownership_ratio: ratio,
      dividend_amount: rawDividend,
    };
  });

  // Reconcile any +/- $0.01 rounding discrepancy by distributing 1 cent per row
  const allocatedSum = Number(
    rows.reduce((sum, r) => sum + r.dividend_amount, 0).toFixed(2)
  );
  let remainingCents = Math.round((totalAmount - allocatedSum) * 100);
  let idx = 0;
  while (remainingCents !== 0 && rows.length > 0 && idx < rows.length * 4) {
    const targetIdx = idx % rows.length;
    const step = remainingCents > 0 ? 0.01 : -0.01;
    if (rows[targetIdx].dividend_amount + step >= 0) {
      rows[targetIdx].dividend_amount = Number(
        (rows[targetIdx].dividend_amount + step).toFixed(2)
      );
      remainingCents += remainingCents > 0 ? -1 : 1;
    }
    idx++;
  }

  return rows;
}

/**
 * Fallback JSON ledger reader/writer in Supabase Storage in case
 * `public.dividend_declarations` table has not yet been created in SQL Editor.
 */
async function readFallbackDeclarations(supabase) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(FALLBACK_LEDGER_PATH);

    if (error || !data) return [];
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function writeFallbackDeclarations(supabase, declarations) {
  try {
    try {
      await supabase.storage.updateBucket(STORAGE_BUCKET, { public: true });
    } catch (e) {
      try {
        await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
      } catch (e2) {}
    }

    const payload = JSON.stringify(declarations, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(FALLBACK_LEDGER_PATH, blob, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.error('Error writing fallback dividend ledger:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('writeFallbackDeclarations exception:', err);
    return false;
  }
}

/**
 * Load all raw dividend declarations from `public.dividend_declarations`
 * or fallback storage ledger.
 */
async function loadRawDeclarations(supabase) {
  const { data, error } = await supabase
    .from('dividend_declarations')
    .select('*')
    .order('fiscal_year', { ascending: false })
    .order('created_at', { ascending: false });

  if (!error && Array.isArray(data)) {
    const fallback = await readFallbackDeclarations(supabase);
    if (fallback.length === 0) return { declarations: data, usingTable: true };

    // Merge any fallback items that aren't in the table yet
    const existingKeys = new Set(
      data.map((d) => `${d.opportunity_id}_${d.fiscal_year}`)
    );
    const merged = [...data];
    for (const item of fallback) {
      const key = `${item.opportunity_id}_${item.fiscal_year}`;
      if (!existingKeys.has(key)) {
        merged.push(item);
      }
    }
    return { declarations: merged, usingTable: true };
  }

  const fallback = await readFallbackDeclarations(supabase);
  return { declarations: fallback, usingTable: false };
}

/**
 * Fetch complete data for `/admin/dividends`:
 * - Opportunities with live valuations, total active invested capital, positive surplus, and active participating shareholders
 * - All declared dividends enriched with shareholder payout status (Paid vs Unpaid)
 */
export async function getDividendsDashboardData() {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const supabase = createAdminSupabaseClient();

  const [
    { data: oppsData },
    { data: valuationsData },
    { data: investmentsData },
    { data: paymentMethodsData },
    { data: dividendPaymentsData },
    rawDeclResult,
  ] = await Promise.all([
    supabase
      .from('opportunities')
      .select('*')
      .neq('id', 999)
      .order('name', { ascending: true }),
    supabase
      .from('opportunity_valuations')
      .select('*')
      .order('valuation_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('investments')
      .select(`
        id,
        shareholder_id,
        opportunity_id,
        amount_invested,
        total_committed,
        status,
        start_date,
        shareholders (
          id,
          fullName,
          email,
          telephone
        )
      `)
      .eq('status', 'active')
      .gt('amount_invested', 0),
    supabase.from('shareholder_payment_methods').select('*'),
    supabase
      .from('payments')
      .select(`
        *,
        shareholders (
          id,
          fullName,
          email,
          telephone
        )
      `)
      .eq('type', 'dividend')
      .order('created_at', { ascending: false }),
    loadRawDeclarations(supabase),
  ]);

  // 1. Map shareholder payment methods by shareholder_id
  const paymentMethodsMap = {};
  (paymentMethodsData || []).forEach((pm) => {
    paymentMethodsMap[Number(pm.shareholder_id)] = pm;
  });

  // 2. Map latest valuation per opportunity_id
  const latestValuationByOpp = {};
  (valuationsData || []).forEach((v) => {
    const oppId = Number(v.opportunity_id);
    if (!latestValuationByOpp[oppId]) {
      latestValuationByOpp[oppId] = v;
    }
  });

  // 3. Group active participating shareholders by opportunity_id
  // Aggregate if a shareholder has multiple active rows in the same opportunity
  const participantsByOpp = {};
  const totalInvestedByOpp = {};

  (investmentsData || []).forEach((inv) => {
    const oppId = Number(inv.opportunity_id);
    const shId = Number(inv.shareholder_id);
    const amt = Number(inv.amount_invested) || 0;
    if (!oppId || !shId || amt <= 0) return;

    totalInvestedByOpp[oppId] = (totalInvestedByOpp[oppId] || 0) + amt;

    if (!participantsByOpp[oppId]) {
      participantsByOpp[oppId] = new Map();
    }

    const oppMap = participantsByOpp[oppId];
    if (oppMap.has(shId)) {
      const existing = oppMap.get(shId);
      existing.amount_invested = Number(
        (existing.amount_invested + amt).toFixed(2)
      );
    } else {
      oppMap.set(shId, {
        shareholder_id: shId,
        fullName: inv.shareholders?.fullName || `Shareholder #${shId}`,
        email: inv.shareholders?.email || 'N/A',
        telephone: inv.shareholders?.telephone || '',
        amount_invested: Number(amt.toFixed(2)),
        payment_method: paymentMethodsMap[shId] || null,
      });
    }
  });

  // 4. Build enriched Opportunities array with Positive Surplus calculation
  const opportunities = (oppsData || []).map((opp) => {
    const oppId = Number(opp.id);
    const totalInvested = Number((totalInvestedByOpp[oppId] || 0).toFixed(2));
    const latestVal = latestValuationByOpp[oppId];
    const currentNav = latestVal
      ? Number(Number(latestVal.total_asset_value || 0).toFixed(2))
      : totalInvested;
    const netSurplus = Number((currentNav - totalInvested).toFixed(2));
    const isPositive = netSurplus > 0 && totalInvested > 0;
    const returnPercent =
      totalInvested > 0
        ? Number(((netSurplus / totalInvested) * 100).toFixed(2))
        : 0;

    const rawParticipants = participantsByOpp[oppId]
      ? Array.from(participantsByOpp[oppId].values()).sort(
          (a, b) => b.amount_invested - a.amount_invested
        )
      : [];

    const participants = rawParticipants.map((p) => ({
      ...p,
      ownership_ratio: totalInvested > 0 ? p.amount_invested / totalInvested : 0,
      ownership_percent:
        totalInvested > 0
          ? Number(((p.amount_invested / totalInvested) * 100).toFixed(2))
          : 0,
    }));

    return {
      id: oppId,
      name: opp.name,
      type: opp.type || 'Equity',
      status: opp.status || 'active',
      total_invested: totalInvested,
      current_nav: currentNav,
      net_surplus: netSurplus,
      is_positive: isPositive,
      return_percent: returnPercent,
      latest_valuation_date: latestVal?.valuation_date || null,
      participant_count: participants.length,
      participants,
    };
  });

  const oppMapById = new Map(opportunities.map((o) => [Number(o.id), o]));

  // 5. Filter successful dividend payments
  const successfulDividendPayments = (dividendPaymentsData || []).filter((p) =>
    ['succeeded', 'paid', 'completed', 'success'].includes(
      (p.status || '').toLowerCase()
    )
  );

  // 6. Enrich each Dividend Declaration with Shareholder Allocations & Paid/Unpaid status
  const enrichedDeclarations = (rawDeclResult.declarations || [])
    .map((decl) => {
      const oppId = Number(decl.opportunity_id);
      const opp = oppMapById.get(oppId);
      const declaredAmount = Number(Number(decl.declared_amount || 0).toFixed(2));
      const fiscalYear = Number(decl.fiscal_year);

      // Base allocations from frozen snapshot if present, otherwise compute from active participants
      let baseAllocations =
        Array.isArray(decl.allocations_snapshot) &&
        decl.allocations_snapshot.length > 0
          ? decl.allocations_snapshot
          : computeShareholderAllocations(opp?.participants || [], declaredAmount);

      // Match each shareholder allocation against recorded dividend payments
      const shareholdersSchedule = baseAllocations.map((alloc) => {
        const shId = Number(alloc.shareholder_id);
        const livePm = paymentMethodsMap[shId] || null;

        // Match payment by declaration ID or by (opportunity_id + fiscal_year + shareholder_id)
        const matchingPayment = successfulDividendPayments.find((p) => {
          if (Number(p.shareholder_id) !== shId) return false;
          const meta = p.metadata || {};
          if (
            meta.dividend_declaration_id &&
            String(meta.dividend_declaration_id) === String(decl.id)
          ) {
            return true;
          }
          if (
            Number(p.opportunity_id) === oppId &&
            meta.fiscal_year &&
            Number(meta.fiscal_year) === fiscalYear
          ) {
            return true;
          }
          return false;
        });

        const isPaid = Boolean(matchingPayment);
        const paidAmount = matchingPayment
          ? Number(Number(matchingPayment.amount || 0).toFixed(2))
          : 0;

        return {
          ...alloc,
          shareholder_id: shId,
          dividend_amount: Number(Number(alloc.dividend_amount || 0).toFixed(2)),
          payment_method: livePm,
          is_paid: isPaid,
          paid_amount: paidAmount,
          paid_at: matchingPayment?.created_at || null,
          payment_id: matchingPayment?.id || null,
          payment_reference:
            matchingPayment?.stripe_payment_intent_id ||
            matchingPayment?.metadata?.reference ||
            null,
          payout_rail:
            matchingPayment?.payment_method_type ||
            livePm?.payment_type ||
            'wire',
        };
      });

      const totalShareholders = shareholdersSchedule.length;
      const paidCount = shareholdersSchedule.filter((s) => s.is_paid).length;
      const unpaidCount = totalShareholders - paidCount;
      const totalDisbursed = Number(
        shareholdersSchedule
          .filter((s) => s.is_paid)
          .reduce((sum, s) => sum + (s.paid_amount || s.dividend_amount), 0)
          .toFixed(2)
      );
      const totalRemaining = Math.max(
        0,
        Number((declaredAmount - totalDisbursed).toFixed(2))
      );

      let effectiveStatus = decl.status || 'pending_approval';
      if (effectiveStatus !== 'pending_approval') {
        if (totalShareholders > 0 && paidCount === totalShareholders) {
          effectiveStatus = 'completed';
        } else if (paidCount > 0) {
          effectiveStatus = 'partially_paid';
        } else {
          effectiveStatus = 'approved';
        }
      }

      return {
        ...decl,
        opportunity_id: oppId,
        opportunity_name: opp?.name || decl.opportunity_name || `Opportunity #${oppId}`,
        opportunity_type: opp?.type || decl.opportunity_type || 'Equity',
        fiscal_year: fiscalYear,
        declared_amount: declaredAmount,
        status: effectiveStatus,
        total_shareholders: totalShareholders,
        paid_count: paidCount,
        unpaid_count: unpaidCount,
        total_disbursed: totalDisbursed,
        total_remaining: totalRemaining,
        shareholders_schedule: shareholdersSchedule,
      };
    })
    .sort(
      (a, b) =>
        b.fiscal_year - a.fiscal_year ||
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

  return {
    opportunities,
    declarations: enrichedDeclarations,
  };
}

/**
 * Declare an annual dividend for a positive investment opportunity.
 * Enforces:
 * 1. Only positive investment opportunities (Current NAV > Active Invested Capital).
 * 2. Strict cap: declared_amount <= positive valuation surplus (Current NAV - Active Invested Capital).
 * 3. Once per opportunity per fiscal year.
 */
export async function declareDividendAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) {
      return { error: 'Unauthorized: Admin session required.' };
    }

    const opportunityId = Number(formData.get('opportunity_id'));
    const fiscalYear = Number(
      formData.get('fiscal_year') || new Date().getFullYear()
    );
    const declaredAmount = Number(
      parseFloat(formData.get('declared_amount')).toFixed(2)
    );
    const approveImmediately =
      formData.get('approve_immediately') === 'true' ||
      formData.get('approve_immediately') === 'on';
    const notes = formData.get('notes')?.trim() || '';

    if (!opportunityId || isNaN(opportunityId)) {
      return { error: 'Please select an investment opportunity.' };
    }
    if (!fiscalYear || isNaN(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
      return { error: 'Please select a valid fiscal year.' };
    }
    if (!declaredAmount || isNaN(declaredAmount) || declaredAmount <= 0) {
      return { error: 'Please enter a valid dividend amount greater than $0.00.' };
    }

    // Fetch current dashboard state to validate opportunity eligibility & existing declarations
    const { opportunities, declarations } = await getDividendsDashboardData();
    const targetOpp = opportunities.find((o) => Number(o.id) === opportunityId);

    if (!targetOpp) {
      return { error: 'Selected investment opportunity was not found.' };
    }

    // Rule 1: Must be a positive investment opportunity
    if (!targetOpp.is_positive || targetOpp.net_surplus <= 0) {
      return {
        error: `"${targetOpp.name}" does not have a positive valuation surplus (Current NAV: $${targetOpp.current_nav.toLocaleString()} vs. Invested: $${targetOpp.total_invested.toLocaleString()}). Dividends can only be declared from positive investment opportunities.`,
      };
    }

    if (targetOpp.participant_count === 0) {
      return {
        error: `"${targetOpp.name}" has no active participating shareholders.`,
      };
    }

    // Rule 2: Once per opportunity per fiscal year
    const duplicate = declarations.find(
      (d) =>
        Number(d.opportunity_id) === opportunityId &&
        Number(d.fiscal_year) === fiscalYear
    );
    if (duplicate) {
      return {
        error: `A dividend for "${targetOpp.name}" has already been declared for fiscal year ${fiscalYear}. Dividends can only be declared once per year per opportunity.`,
      };
    }

    // Rule 3: Strictly capped at the opportunity's positive surplus
    if (declaredAmount > targetOpp.net_surplus + 0.001) {
      return {
        error: `Declared dividend ($${declaredAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}) exceeds "${targetOpp.name}"'s positive surplus cap of $${targetOpp.net_surplus.toLocaleString(
          'en-US',
          { minimumFractionDigits: 2 }
        )}.`,
      };
    }

    // Compute pro-rata allocations snapshot for all participating shareholders
    const allocationsSnapshot = computeShareholderAllocations(
      targetOpp.participants,
      declaredAmount
    );

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const adminIdentifier =
      session.user.email || session.user.name || String(session.user.adminId);

    const recordPayload = {
      opportunity_id: opportunityId,
      fiscal_year: fiscalYear,
      declared_amount: declaredAmount,
      opportunity_nav_at_declaration: targetOpp.current_nav,
      total_invested_at_declaration: targetOpp.total_invested,
      net_surplus_at_declaration: targetOpp.net_surplus,
      status: approveImmediately ? 'approved' : 'pending_approval',
      declaration_date: todayStr,
      approved_at: approveImmediately ? nowIso : null,
      approved_by: approveImmediately ? adminIdentifier : null,
      created_by: adminIdentifier,
      notes,
      allocations_snapshot: allocationsSnapshot,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const supabase = createAdminSupabaseClient();

    // Try inserting into `public.dividend_declarations` table first
    const { data: insertedRow, error: tableErr } = await supabase
      .from('dividend_declarations')
      .insert(recordPayload)
      .select('*')
      .single();

    let savedRecord = insertedRow;

    if (tableErr) {
      if (tableErr.message?.includes('unique_dividend_per_opportunity_year')) {
        return {
          error: `A dividend for "${targetOpp.name}" has already been declared for ${fiscalYear}.`,
        };
      }

      // Table not created yet -> save to resilient storage ledger
      const existingFallback = await readFallbackDeclarations(supabase);
      const nextId =
        existingFallback.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0) +
        1;
      savedRecord = {
        id: nextId,
        ...recordPayload,
        opportunity_name: targetOpp.name,
        opportunity_type: targetOpp.type,
      };
      existingFallback.push(savedRecord);
      const ok = await writeFallbackDeclarations(supabase, existingFallback);
      if (!ok) {
        return {
          error: `Could not save dividend declaration: ${tableErr.message}`,
        };
      }
    }

    revalidatePath('/admin/dividends');
    return {
      success: true,
      declaration: savedRecord,
      message: approveImmediately
        ? `${fiscalYear} dividend of $${declaredAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
          })} for ${targetOpp.name} declared and approved.`
        : `${fiscalYear} dividend of $${declaredAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
          })} for ${targetOpp.name} declared and awaiting approval.`,
    };
  } catch (err) {
    console.error('declareDividendAction error:', err);
    return { error: err.message || 'Failed to declare dividend.' };
  }
}

/**
 * Approve a pending dividend declaration so payouts can begin.
 */
export async function approveDividendDeclarationAction(declarationId) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) {
      return { error: 'Unauthorized: Admin session required.' };
    }

    const supabase = createAdminSupabaseClient();
    const nowIso = new Date().toISOString();
    const adminIdentifier =
      session.user.email || session.user.name || String(session.user.adminId);

    // Attempt update in `public.dividend_declarations`
    const { data: updatedRow, error: tableErr } = await supabase
      .from('dividend_declarations')
      .update({
        status: 'approved',
        approved_at: nowIso,
        approved_by: adminIdentifier,
        updated_at: nowIso,
      })
      .eq('id', Number(declarationId))
      .select('*')
      .maybeSingle();

    if (tableErr || !updatedRow) {
      // Update in fallback JSON ledger
      const existingFallback = await readFallbackDeclarations(supabase);
      const idx = existingFallback.findIndex(
        (d) => String(d.id) === String(declarationId)
      );
      if (idx === -1) {
        return { error: 'Dividend declaration not found.' };
      }
      existingFallback[idx] = {
        ...existingFallback[idx],
        status: 'approved',
        approved_at: nowIso,
        approved_by: adminIdentifier,
        updated_at: nowIso,
      };
      await writeFallbackDeclarations(supabase, existingFallback);
    }

    revalidatePath('/admin/dividends');
    return {
      success: true,
      message: 'Dividend declaration approved. Shareholder payouts are now unlocked.',
    };
  } catch (err) {
    console.error('approveDividendDeclarationAction error:', err);
    return { error: err.message || 'Failed to approve dividend declaration.' };
  }
}

/**
 * Record an individual shareholder's dividend payout for an approved dividend declaration.
 * - Prevents duplicate payouts for the same shareholder & dividend declaration
 * - Inserts a `type = 'dividend'` record into `public.payments` with `metadata.dividend_declaration_id`
 * - Reduces the opportunity's valuation in `public.opportunity_valuations`
 * - Updates declaration status (`partially_paid` / `completed`)
 */
export async function recordDeclaredDividendPayoutAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) {
      return { error: 'Unauthorized: Admin session required.' };
    }

    const supabase = createAdminSupabaseClient();

    const declarationId = formData.get('declaration_id');
    const opportunityId = Number(formData.get('opportunity_id'));
    const shareholderId = Number(formData.get('shareholder_id'));
    const fiscalYear = Number(
      formData.get('fiscal_year') || new Date().getFullYear()
    );
    const amountStr = formData.get('amount');
    const paymentDateStr =
      formData.get('payment_date') || new Date().toISOString().split('T')[0];
    const payoutRail =
      formData.get('payout_rail') || formData.get('payment_method') || 'wire';
    const reference =
      formData.get('reference')?.trim() ||
      `div_${fiscalYear}_opp${opportunityId}_sh${shareholderId}_${Date.now()}`;
    const description = formData.get('description')?.trim() || '';
    const notes = formData.get('notes')?.trim() || '';
    const accountName = formData.get('account_name')?.trim() || '';
    const accountNumber = formData.get('account_number')?.trim() || '';
    const accountHandle = formData.get('account_handle')?.trim() || '';
    const ownershipPercent = Number(formData.get('ownership_percent') || 0);
    const investedAmount = Number(formData.get('invested_amount') || 0);

    if (!declarationId) {
      return { error: 'Missing dividend declaration reference.' };
    }
    if (!opportunityId || !shareholderId) {
      return { error: 'Missing opportunity or shareholder identifier.' };
    }

    const numAmount = Number(parseFloat(amountStr).toFixed(2));
    if (isNaN(numAmount) || numAmount <= 0) {
      return { error: 'Dividend payout amount must be greater than $0.00.' };
    }

    // 1. Check that the declaration is approved and this shareholder has not already been paid
    const { declarations } = await getDividendsDashboardData();
    const targetDecl = declarations.find(
      (d) => String(d.id) === String(declarationId)
    );

    if (!targetDecl) {
      return { error: 'Dividend declaration not found.' };
    }
    if (targetDecl.status === 'pending_approval') {
      return {
        error:
          'This dividend declaration must be approved before shareholder payouts can be recorded.',
      };
    }

    const shEntry = (targetDecl.shareholders_schedule || []).find(
      (s) => Number(s.shareholder_id) === shareholderId
    );
    if (shEntry?.is_paid) {
      return {
        error: `${shEntry.fullName} has already been paid for the ${fiscalYear} ${targetDecl.opportunity_name} dividend.`,
      };
    }

    const finalDescription =
      description ||
      `${fiscalYear} Annual Dividend Payout - ${targetDecl.opportunity_name}`;

    const createdAt = paymentDateStr
      ? new Date(`${paymentDateStr}T12:00:00Z`).toISOString()
      : new Date().toISOString();

    // 2. Insert dividend payout into `public.payments`
    const { data: newPayment, error: payErr } = await supabase
      .from('payments')
      .insert({
        opportunity_id: opportunityId,
        shareholder_id: shareholderId,
        amount: numAmount,
        currency: 'USD',
        status: 'succeeded',
        type: 'dividend',
        payment_method_type: payoutRail.toLowerCase(),
        description: finalDescription,
        stripe_payment_intent_id: reference,
        created_at: createdAt,
        metadata: {
          is_dividend: true,
          dividend_declaration_id: String(declarationId),
          fiscal_year: fiscalYear,
          ownership_percent: ownershipPercent,
          invested_amount: investedAmount,
          reference,
          notes,
          payment_method: payoutRail,
          payout_rail: payoutRail,
          account_name: accountName,
          account_number: accountNumber,
          account_handle: accountHandle,
          recorded_by: session.user.email || session.user.adminId,
        },
      })
      .select(`
        *,
        shareholders (
          id,
          fullName,
          email,
          telephone
        ),
        opportunities (
          id,
          name,
          type
        )
      `)
      .single();

    if (payErr) {
      console.error('Insert declared dividend payment error:', payErr);
      return { error: `Could not record dividend payout: ${payErr.message}` };
    }

    // 3. Reduce the Opportunity Asset Value in `opportunity_valuations`
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: latestVal } = await supabase
        .from('opportunity_valuations')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('valuation_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestVal) {
        const currentVal = Number(latestVal.total_asset_value || 0);
        const newTotalAssetValue = Math.max(
          0,
          Number((currentVal - numAmount).toFixed(2))
        );

        if (latestVal.valuation_date === today) {
          await supabase
            .from('opportunity_valuations')
            .update({
              total_asset_value: newTotalAssetValue,
              created_at: new Date().toISOString(),
            })
            .eq('id', latestVal.id);
        } else {
          await supabase.from('opportunity_valuations').insert({
            opportunity_id: opportunityId,
            total_asset_value: newTotalAssetValue,
            valuation_date: today,
            created_by_admin_id: session.user.adminId,
          });
        }

        // Also keep opportunities.total_value in sync with the reduced NAV
        await supabase
          .from('opportunities')
          .update({ total_value: newTotalAssetValue })
          .eq('id', opportunityId);
      }
    } catch (valErr) {
      console.warn('Opportunity valuation reduction note:', valErr);
    }

    // 4. Update declaration status (`partially_paid` or `completed`)
    const newPaidCount = (targetDecl.paid_count || 0) + 1;
    const nextStatus =
      newPaidCount >= (targetDecl.total_shareholders || 1)
        ? 'completed'
        : 'partially_paid';

    const { error: updErr } = await supabase
      .from('dividend_declarations')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', Number(declarationId));

    if (updErr) {
      const existingFallback = await readFallbackDeclarations(supabase);
      const idx = existingFallback.findIndex(
        (d) => String(d.id) === String(declarationId)
      );
      if (idx !== -1) {
        existingFallback[idx].status = nextStatus;
        existingFallback[idx].updated_at = new Date().toISOString();
        await writeFallbackDeclarations(supabase, existingFallback);
      }
    }

    revalidatePath('/admin/dividends');
    revalidatePath('/admin/transactions');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/finance-reports/valuations');
    revalidatePath('/account/payment');
    revalidatePath('/account/investments');

    return {
      success: true,
      payment: newPayment,
      message: `Dividend payout of $${numAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })} recorded for ${shEntry?.fullName || `Shareholder #${shareholderId}`}.`,
    };
  } catch (err) {
    console.error('recordDeclaredDividendPayoutAction error:', err);
    return { error: err.message || 'Failed to record dividend payout.' };
  }
}
