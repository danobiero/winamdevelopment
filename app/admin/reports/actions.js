'use server';

import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { auth } from '@/app/_lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Fetch all reports (documents linked to opportunities)
 */
export async function getAllReports() {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // Ensure opportunity-documents bucket is public
  try {
    await supabase.storage.updateBucket('opportunity-documents', { public: true });
  } catch (e) {
    // Ignore if already public or no permission
  }

  const { data, error } = await supabase
    .from('opportunity_documents')
    .select(`
      *,
      opportunities (
        id,
        name,
        type
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  // 1. Filter ONLY documents that are explicitly GENERAL or PROJECT reports
  // This excludes general opportunity documents (brochures, agreements, decks, etc.)
  const reportDocs = (data || []).filter((doc) => {
    const rawName = (doc.name || '').toLowerCase();
    const rawPath = (doc.storage_path || '').toLowerCase();
    const docType = (doc.document_type || doc.report_type || '').toLowerCase();

    return (
      rawName.includes('[general]') ||
      rawName.includes('[project]') ||
      rawPath.startsWith('reports/') ||
      docType === 'general' ||
      docType === 'project'
    );
  });

  // 2. Parse category (GENERAL vs PROJECT), calendar month, and generate secure signed URLs
  const reportsWithUrls = await Promise.all(
    reportDocs.map(async (doc) => {
      const rawName = doc.name || '';
      const rawPath = (doc.storage_path || '').toLowerCase();
      const docType = (doc.document_type || doc.report_type || '').toUpperCase();

      let category = 'GENERAL';

      // Determine category strictly by tag or explicit type
      if (docType === 'PROJECT' || rawName.toLowerCase().includes('[project]')) {
        category = 'PROJECT';
      } else if (docType === 'GENERAL' || rawName.toLowerCase().includes('[general]')) {
        category = 'GENERAL';
      } else if (
        doc.opportunities?.type?.toLowerCase()?.includes('core') ||
        doc.opportunities?.name?.toLowerCase()?.includes('core')
      ) {
        category = 'GENERAL';
      } else {
        category = 'PROJECT';
      }

      // Extract creation / meeting date
      let dateObj = new Date(doc.created_at || Date.now());
      const dateMatch = rawName.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
        }
      }
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      const year = dateObj.getFullYear();
      const monthIndex = dateObj.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const monthLabel = dateObj.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      // Generate signed URL (guarantees access even if bucket privacy changes)
      let viewUrl = doc.file_url;
      if (doc.storage_path) {
        try {
          const bucket = doc.storage_path.startsWith('minutes/')
            ? 'minutes'
            : 'opportunity-documents';
          const cleanPath = doc.storage_path.replace(/^minutes\//, '');

          const { data: signedData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(cleanPath, 86400); // 24 hours validity

          if (signedData?.signedUrl) {
            viewUrl = signedData.signedUrl;
          }
        } catch (signErr) {
          console.warn('Could not generate signed URL for:', doc.id, signErr);
        }
      }

      return {
        ...doc,
        category,
        meetingDate: dateObj.toISOString().split('T')[0],
        monthKey,
        monthLabel,
        viewUrl,
      };
    })
  );

  return reportsWithUrls;
}

/**
 * Upload and attach a new Report to an Opportunity
 */
export async function uploadReportAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    // Ensure opportunity-documents bucket is public
    try {
      await supabase.storage.updateBucket('opportunity-documents', { public: true });
    } catch (e) {}

    const opportunityId = formData.get('opportunityId');
    const reportType = formData.get('reportType') || 'General'; // 'General' or 'Project'
    const reportDate =
      formData.get('reportDate') || new Date().toISOString().split('T')[0];
    const notes = formData.get('notes')?.trim() || '';
    const file = formData.get('file');

    if (!opportunityId) return { error: 'Please select an Opportunity.' };
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: 'Please choose a document to upload.' };
    }

    // Fetch opportunity to get exact name for title
    const { data: opp, error: oppErr } = await supabase
      .from('opportunities')
      .select('id, name')
      .eq('id', Number(opportunityId))
      .single();

    if (oppErr || !opp) {
      return { error: 'Selected opportunity not found.' };
    }

    // Determine extension
    const originalExt = file.name.includes('.')
      ? '.' + file.name.split('.').pop()
      : '';

    // Standardized Title: [Type] Opportunity Name - Date
    const baseTitle = `[${reportType}] ${opp.name} - ${reportDate}${
      notes ? ` (${notes})` : ''
    }`;
    const reportName = `${baseTitle}${originalExt}`;

    const safeFileBase = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const storagePath = `reports/opportunity_${opportunityId}/${Date.now()}_${safeFileBase}`;

    // Upload to Supabase Storage 'opportunity-documents' bucket
    const { error: uploadErr } = await supabase.storage
      .from('opportunity-documents')
      .upload(storagePath, file, { upsert: false });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return { error: `Storage upload failed: ${uploadErr.message}` };
    }

    // Get public URL
    const { data: urlObj } = supabase.storage
      .from('opportunity-documents')
      .getPublicUrl(storagePath);

    // Also get signed URL for immediate preview
    const { data: signedData } = await supabase.storage
      .from('opportunity-documents')
      .createSignedUrl(storagePath, 86400);

    const activeViewUrl = signedData?.signedUrl || urlObj.publicUrl;

    // Insert database record
    const { data: inserted, error: insertErr } = await supabase
      .from('opportunity_documents')
      .insert({
        opportunity_id: Number(opportunityId),
        name: reportName,
        file_url: urlObj.publicUrl,
        storage_path: storagePath,
      })
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        )
      `)
      .single();

    if (insertErr) {
      console.error('Database insert error:', insertErr);
      return { error: `Database insert failed: ${insertErr.message}` };
    }

    revalidatePath('/admin/reports');
    revalidatePath('/admin/opportunities');

    return {
      success: true,
      report: {
        ...inserted,
        viewUrl: activeViewUrl,
      },
    };
  } catch (err) {
    console.error('uploadReportAction error:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Delete a report from database and Supabase storage
 */
export async function deleteReportAction(documentId, storagePath) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    if (storagePath) {
      const bucket = storagePath.startsWith('minutes/')
        ? 'minutes'
        : 'opportunity-documents';
      const cleanPath = storagePath.replace(/^minutes\//, '');

      await supabase.storage
        .from(bucket)
        .remove([cleanPath]);
    }

    const { error } = await supabase
      .from('opportunity_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/reports');
    return { success: true };
  } catch (err) {
    console.error('deleteReportAction error:', err);
    return { error: err.message || 'Failed to delete report.' };
  }
}

/**
 * Get Core Quarterly Financial Statements data
 */
export async function getCoreQuarterlyFinancials({ year = 2026, quarter = 'Q3', opportunityId } = {}) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();
    const selectedYear = Number(year) || new Date().getFullYear();

    // 1. Fetch Core Opportunity
    let coreOpp = null;
    if (opportunityId) {
      const { data: specificOpp } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', Number(opportunityId))
        .maybeSingle();
      coreOpp = specificOpp;
    }

    if (!coreOpp) {
      const { data: opps } = await supabase
        .from('opportunities')
        .select('*')
        .or('type.ilike.%core%,name.ilike.%core%');

      coreOpp = opps?.[0];
      if (!coreOpp) {
        const { data: fallback } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', 9)
          .maybeSingle();
        coreOpp = fallback;
      }
    }

    if (!coreOpp) {
      throw new Error('Core opportunity not found');
    }

    // 2. Fetch Settings for branding
    const { data: settingsList } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    const settings = settingsList?.[0] || {
      company_name: 'Winam Development Group',
      default_currency: 'USD',
    };

    // 3. Define Date Ranges
    let startDate, endDate, periodLabel;
    if (quarter === 'Q1') {
      startDate = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(selectedYear, 2, 31, 23, 59, 59, 999));
      periodLabel = `First Quarter (Q1) ${selectedYear} (Jan 1 - Mar 31)`;
    } else if (quarter === 'Q2') {
      startDate = new Date(Date.UTC(selectedYear, 3, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(selectedYear, 5, 30, 23, 59, 59, 999));
      periodLabel = `Second Quarter (Q2) ${selectedYear} (Apr 1 - Jun 30)`;
    } else if (quarter === 'Q3') {
      startDate = new Date(Date.UTC(selectedYear, 6, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(selectedYear, 8, 30, 23, 59, 59, 999));
      periodLabel = `Third Quarter (Q3) ${selectedYear} (Jul 1 - Sep 30)`;
    } else if (quarter === 'Q4') {
      startDate = new Date(Date.UTC(selectedYear, 9, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));
      periodLabel = `Fourth Quarter (Q4) ${selectedYear} (Oct 1 - Dec 31)`;
    } else {
      startDate = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));
      periodLabel = `Full Year (YTD) ${selectedYear}`;
    }

    // 4. Fetch Payments for Core Opportunity
    const { data: payments, error: payErr } = await supabase
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
      .eq('opportunity_id', coreOpp.id)
      .order('created_at', { ascending: false });

    if (payErr) console.error('Error fetching payments:', payErr);

    // 5. Fetch Investments for Core Opportunity
    const { data: investments, error: invErr } = await supabase
      .from('investments')
      .select(`
        *,
        shareholders (
          id,
          fullName,
          email,
          telephone
        )
      `)
      .eq('opportunity_id', coreOpp.id)
      .order('created_at', { ascending: false });

    if (invErr) console.error('Error fetching investments:', invErr);

    // 6. Fetch Redemptions
    let allRedemptions = [];
    try {
      const { data: redData, error: redErr } = await supabase
        .from('redemption_requests')
        .select(`
          *,
          investments (
            opportunity_id
          )
        `);

      if (!redErr && redData) {
        allRedemptions = redData.filter(
          (r) =>
            r.opportunity_id === coreOpp.id ||
            r.investments?.opportunity_id === coreOpp.id
        );
      }
    } catch (redErr) {
      console.warn('Error fetching redemptions:', redErr);
    }

    const allPayments = payments || [];
    const allInvestments = investments || [];

    // Filter payments into cumulative (up to end of quarter) and period (inside quarter)
    const cumulativePayments = allPayments.filter((p) => {
      const pDate = new Date(p.created_at);
      const isSuccess = ['succeeded', 'completed', 'paid', 'success'].includes(
        (p.status || '').toLowerCase()
      );
      return isSuccess && pDate <= endDate;
    });

    const periodPayments = allPayments.filter((p) => {
      const pDate = new Date(p.created_at);
      const isSuccess = ['succeeded', 'completed', 'paid', 'success'].includes(
        (p.status || '').toLowerCase()
      );
      return isSuccess && pDate >= startDate && pDate <= endDate;
    });

    // Payments prior to this quarter
    const priorPayments = allPayments.filter((p) => {
      const pDate = new Date(p.created_at);
      const isSuccess = ['succeeded', 'completed', 'paid', 'success'].includes(
        (p.status || '').toLowerCase()
      );
      return isSuccess && pDate < startDate;
    });

    // Financial Metrics Calculation
    const targetCapitalization = Number(coreOpp.total_value) || 1000000;
    const minimumInvestment = Number(coreOpp.minimum_investment) || 2000;

    const beginningCash = priorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const periodInflows = periodPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const cumulativeCapitalRaised = cumulativePayments.reduce(
      (s, p) => s + (Number(p.amount) || 0),
      0
    );

    // Categorize Inflows
    const cardInflows = periodPayments
      .filter((p) => (p.payment_method_type || '').toLowerCase() === 'card')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const legacyInflows = periodPayments
      .filter(
        (p) =>
          (p.payment_method_type || '').toLowerCase() === 'manual' ||
          (p.type || '').toLowerCase().includes('legacy')
      )
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const otherInflows = periodInflows - (cardInflows + legacyInflows);

    // Prior Redemptions (prior to quarter)
    const priorRedemptionsPaid = allRedemptions
      .filter((r) => {
        const rDate = new Date(r.created_at);
        return (
          ['completed', 'succeeded', 'paid'].includes((r.status || '').toLowerCase()) &&
          rDate < startDate
        );
      })
      .reduce((s, r) => s + (Number(r.amount_redeemed || r.amount) || 0), 0);

    // Period Redemptions (during quarter)
    const periodRedemptions = allRedemptions.filter((r) => {
      const rDate = new Date(r.created_at);
      return rDate >= startDate && rDate <= endDate;
    });

    const periodRedemptionsPaid = periodRedemptions
      .filter((r) =>
        ['completed', 'succeeded', 'paid'].includes((r.status || '').toLowerCase())
      )
      .reduce((s, r) => s + (Number(r.amount_redeemed || r.amount) || 0), 0);

    const cumulativeRedemptionsPaid = priorRedemptionsPaid + periodRedemptionsPaid;

    const pendingRedemptions = allRedemptions
      .filter((r) => (r.status || '').toLowerCase() === 'pending')
      .reduce((s, r) => s + (Number(r.amount_redeemed || r.amount) || 0), 0);

    // 7. Fetch Actual Operating Expenses from operating_expenses table
    let tableExpenses = [];
    let priorTableExpenses = [];
    try {
      const { data: expData, error: expErr } = await supabase
        .from('operating_expenses')
        .select('*')
        .or(`opportunity_id.eq.${coreOpp.id},opportunity_id.is.null`)
        .order('expense_date', { ascending: false });

      if (!expErr && expData) {
        tableExpenses = expData.filter((e) => {
          const eDate = new Date(e.expense_date);
          return eDate >= startDate && eDate <= endDate;
        });

        priorTableExpenses = expData.filter((e) => {
          const eDate = new Date(e.expense_date);
          return eDate < startDate;
        });
      }
    } catch (e) {
      console.warn('operating_expenses table not available yet, using calculation fallback:', e);
    }

    // Operating Expenses Calculation
    let expenseRows = [];
    let totalOperatingExpenses = 0;
    let priorExpensesPaid = 0;

    const cardTxCount = periodPayments.filter(
      (p) => (p.payment_method_type || '').toLowerCase() === 'card'
    ).length;
    let processingFees = 0;

    if (tableExpenses.length > 0) {
      // Use actual expenses recorded in operating_expenses table
      const expensesByCategory = {};
      tableExpenses.forEach((exp) => {
        const cat = exp.category || 'Other Operating';
        expensesByCategory[cat] =
          (expensesByCategory[cat] || 0) + (Number(exp.amount) || 0);
      });

      processingFees = expensesByCategory['Payment Gateway & Processing Fees'] || 0;

      expenseRows = Object.entries(expensesByCategory).map(([label, amount]) => ({
        label,
        amount: Number(amount.toFixed(2)),
      }));

      totalOperatingExpenses = tableExpenses.reduce(
        (s, e) => s + (Number(e.amount) || 0),
        0
      );

      priorExpensesPaid = priorTableExpenses.reduce(
        (s, e) => s + (Number(e.amount) || 0),
        0
      );
    } else {
      // Fallback: estimate standard payment processing (2.9% + $0.30 per card payment)
      processingFees =
        cardInflows > 0 ? Number((cardInflows * 0.029 + cardTxCount * 0.3).toFixed(2)) : 0;
      const managementFees = 0;

      expenseRows = [
        { label: 'Payment Gateway & Processing Fees', amount: processingFees },
        { label: 'Fund Operational Management Allocation', amount: managementFees },
      ];
      totalOperatingExpenses = processingFees + managementFees;
    }

    const cumulativeExpensesPaid = priorExpensesPaid + totalOperatingExpenses;

    // Net Income / Surplus
    const netOperatingIncome = periodInflows - totalOperatingExpenses;

    // 1. INCOME STATEMENT (Statement of Comprehensive Income / Operations)
    const incomeStatement = {
      title: 'Income Statement (Statement of Operations)',
      subtitle: `For the period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      revenues: [
        { label: 'Direct Member Card Subscriptions', amount: cardInflows },
        { label: 'Legacy Registered Capital Subscriptions', amount: legacyInflows },
        { label: 'Direct Wire / ACH Capital Contributions', amount: otherInflows },
      ],
      totalRevenues: periodInflows,
      expenses: expenseRows,
      totalExpenses: totalOperatingExpenses,
      netIncome: netOperatingIncome,
    };

    // 2. BALANCE SHEET (Statement of Financial Position)
    const cashAndEquivalents =
      cumulativeCapitalRaised - cumulativeRedemptionsPaid - cumulativeExpensesPaid;
    const portfolioInvestments = 0;
    const totalCurrentAssets = cashAndEquivalents;
    const totalAssets = totalCurrentAssets + portfolioInvestments;

    const currentLiabilities = [
      { label: 'Pending Shareholder Redemptions', amount: pendingRedemptions },
    ];
    const totalLiabilities = pendingRedemptions;

    // Equity: Contributed Capital + Retained Operating Surplus
    const endingContributedCapital =
      cumulativeCapitalRaised - cumulativeRedemptionsPaid;
    const retainedOperatingSurplus = totalAssets - totalLiabilities - endingContributedCapital;
    const totalShareholderEquity = endingContributedCapital + retainedOperatingSurplus;

    const balanceSheet = {
      title: 'Balance Sheet (Statement of Financial Position)',
      asOfDate: endDate.toISOString().split('T')[0],
      currentAssets: [
        { label: 'Cash & Cash Equivalents (Core Vault Account)', amount: cashAndEquivalents },
        { label: 'Subscriptions in Clearing / In-Transit', amount: 0 },
      ],
      totalCurrentAssets,
      nonCurrentAssets: [
        { label: 'Portfolio Capital Deployed in Ventures', amount: portfolioInvestments },
      ],
      totalNonCurrentAssets: portfolioInvestments,
      totalAssets,
      currentLiabilities,
      totalLiabilities,
      equity: [
        {
          label: 'Contributed Shareholder Capital (Common Equity Units)',
          amount: endingContributedCapital,
        },
        {
          label: 'Retained Operating Surplus / Reserves',
          amount: retainedOperatingSurplus,
        },
      ],
      totalShareholderEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalShareholderEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalShareholderEquity)) < 0.01,
    };

    // 3. STATEMENT OF CASH FLOWS
    // We adjust netOperatingIncome by subtracting periodInflows to avoid double-counting,
    // since Capital Contributions are classified as Financing Activities below.
    const operatingCashFlow = netOperatingIncome - periodInflows;
    const investingCashFlow = 0;
    const financingInflows = periodInflows;
    const financingOutflows = -periodRedemptionsPaid;
    const financingCashFlow = financingInflows + financingOutflows;
    const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;

    const cashFlow = {
      title: 'Statement of Cash Flows',
      subtitle: `For the period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      operatingActivities: [
        { label: 'Net Income / (Loss)', amount: netOperatingIncome },
        { label: 'Less: Contributions Classified as Financing', amount: -periodInflows },
      ],
      netOperatingCash: operatingCashFlow,
      investingActivities: [
        { label: 'Capital Deployed into Portfolio Ventures', amount: investingCashFlow },
      ],
      netInvestingCash: investingCashFlow,
      financingActivities: [
        { label: 'Capital Contributions Received from Shareholders', amount: financingInflows },
        { label: 'Shareholder Redemptions Paid', amount: financingOutflows },
      ],
      netFinancingCash: financingCashFlow,
      netCashChange,
      beginningCash,
      endingCash: beginningCash + netCashChange,
    };

    // 4. STATEMENT OF SHAREHOLDERS' EQUITY (Changes in Equity)
    const priorInflows = priorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const beginningContributedCapital = priorInflows - priorRedemptionsPaid;
    const beginningRetainedSurplus = 0;

    // Individual Shareholder Cap Table Schedule
    const shareholderMap = {};
    allPayments.forEach((p) => {
      const shId = p.shareholder_id || p.shareholders?.id || 'unknown';
      const amt = Number(p.amount) || 0;
      const pDate = new Date(p.created_at);
      const isSuccess = ['succeeded', 'completed', 'paid', 'success'].includes(
        (p.status || '').toLowerCase()
      );
      if (!isSuccess) return;

      if (!shareholderMap[shId]) {
        shareholderMap[shId] = {
          id: shId,
          name: p.shareholders?.fullName || 'Anonymous Investor',
          email: p.shareholders?.email || 'N/A',
          phone: p.shareholders?.telephone || 'N/A',
          beginningBalance: 0,
          periodContributions: 0,
          periodRedemptions: 0,
          endingBalance: 0,
          ownershipPercent: 0,
        };
      }

      if (pDate < startDate) {
        shareholderMap[shId].beginningBalance += amt;
      } else if (pDate >= startDate && pDate <= endDate) {
        shareholderMap[shId].periodContributions += amt;
      }
    });

    // Compute individual ending balances and ownership percentage
    Object.values(shareholderMap).forEach((sh) => {
      sh.endingBalance = sh.beginningBalance + sh.periodContributions - sh.periodRedemptions;
      sh.ownershipPercent =
        cumulativeCapitalRaised > 0
          ? Number(((sh.endingBalance / cumulativeCapitalRaised) * 100).toFixed(2))
          : 0;
    });

    const shareholderSchedule = Object.values(shareholderMap).sort(
      (a, b) => b.endingBalance - a.endingBalance
    );

    const shareholdersEquity = {
      title: "Statement of Shareholders' Equity",
      subtitle: `For the period ended ${endDate.toISOString().split('T')[0]}`,
      rollforward: {
        beginningContributedCapital,
        periodContributions: periodInflows,
        periodRedemptions: periodRedemptionsPaid,
        endingContributedCapital,
        beginningRetainedSurplus,
        periodNetIncome: netOperatingIncome,
        endingRetainedSurplus: retainedOperatingSurplus,
        totalBeginningEquity: beginningContributedCapital + beginningRetainedSurplus,
        totalEndingEquity: endingContributedCapital + retainedOperatingSurplus,
      },
      shareholderSchedule,
    };

    const fundingProgressPercent =
      targetCapitalization > 0
        ? Math.min(100, (cumulativeCapitalRaised / targetCapitalization) * 100)
        : 0;

    const uniqueShareholderIds = new Set(cumulativePayments.map((p) => p.shareholder_id));
    const activeShareholderCount = uniqueShareholderIds.size;

    // Period Transactions Ledger
    const periodTransactions = periodPayments.map((p) => ({
      id: p.id,
      date: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : 'N/A',
      shareholderName: p.shareholders?.fullName || 'Anonymous Investor',
      email: p.shareholders?.email || 'N/A',
      method: p.payment_method_type || p.type || 'Standard',
      reference: p.stripe_payment_intent_id || p.id.slice(0, 8),
      amount: Number(p.amount) || 0,
      currency: p.currency || 'USD',
      status: p.status || 'succeeded',
    }));

    return {
      success: true,
      data: {
        opportunity: {
          id: coreOpp.id,
          name: coreOpp.name,
          type: coreOpp.type,
          targetCapitalization,
          minimumInvestment,
        },
        settings: {
          company_name: settings.company_name || 'Winam Development Group',
          logo_url: settings.logo_url || '',
          default_currency: settings.default_currency || 'USD',
          statement_footer: settings.statement_footer || '',
          address_line1: settings.address_line1 || '',
          city: settings.city || '',
          state: settings.state || '',
        },
        period: {
          year: selectedYear,
          quarter,
          label: periodLabel,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        metrics: {
          targetCapitalization,
          cumulativeCapitalRaised,
          fundingProgressPercent,
          activeShareholderCount,
          beginningCash,
          periodInflows,
          periodRedemptionsPaid,
          endingCash: cashAndEquivalents,
          cardInflows,
          legacyInflows,
          otherInflows,
          processingFees,
          totalExpenses: totalOperatingExpenses,
          netOperatingIncome,
          transactionCount: periodPayments.length,
          totalLiabilities,
          totalShareholderEquity,
          totalAssets,
        },
        incomeStatement,
        balanceSheet,
        cashFlow,
        shareholdersEquity,
        periodTransactions,
        shareholderRegister: shareholderSchedule,
        actualExpenses: tableExpenses,
        isUsingTableExpenses: tableExpenses.length > 0,
      },
    };
  } catch (err) {
    console.error('getCoreQuarterlyFinancials error:', err);
    return { error: err.message || 'Failed to generate financial statements' };
  }
}

/**
 * Save / Archive Generated Quarterly Statement to Opportunity Documents & Supabase Storage
 */
export async function saveQuarterlyFinancialStatementReportAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();
    const opportunityId = formData.get('opportunityId');
    const quarter = formData.get('quarter') || 'Q3';
    const year = formData.get('year') || '2026';
    const statementType = formData.get('statementType') || 'ALL';
    const customTitle = formData.get('title');
    const file = formData.get('file');

    if (!opportunityId) return { error: 'Missing opportunity ID' };
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: 'Missing statement document file.' };
    }

    let defaultPrefix = 'Core Quarterly Financial Statement';
    if (statementType === 'INCOME_STATEMENT') {
      defaultPrefix = 'Core Income Statement';
    } else if (statementType === 'BALANCE_SHEET') {
      defaultPrefix = 'Core Balance Sheet';
    } else if (statementType === 'CASH_FLOW') {
      defaultPrefix = 'Core Statement of Cash Flows';
    } else if (statementType === 'SHAREHOLDERS_EQUITY') {
      defaultPrefix = 'Core Statement of Shareholders Equity';
    }

    const title = customTitle || `[General] ${defaultPrefix} - ${year} ${quarter}.pdf`;
    const safeBase = defaultPrefix.replace(/\s+/g, '_');
    const safeFilename = `${safeBase}_${year}_${quarter}_${Date.now()}.pdf`;
    const storagePath = `reports/opportunity_${opportunityId}/${safeFilename}`;

    // Upload to Supabase storage 'opportunity-documents'
    const { error: uploadErr } = await supabase.storage
      .from('opportunity-documents')
      .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });

    if (uploadErr) {
      console.error('Upload statement error:', uploadErr);
      return { error: `Upload failed: ${uploadErr.message}` };
    }

    const { data: urlObj } = supabase.storage
      .from('opportunity-documents')
      .getPublicUrl(storagePath);

    const { data: signedData } = await supabase.storage
      .from('opportunity-documents')
      .createSignedUrl(storagePath, 86400);

    const activeViewUrl = signedData?.signedUrl || urlObj.publicUrl;

    const { data: inserted, error: insertErr } = await supabase
      .from('opportunity_documents')
      .insert({
        opportunity_id: Number(opportunityId),
        name: title,
        file_url: urlObj.publicUrl,
        storage_path: storagePath,
      })
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        )
      `)
      .single();

    if (insertErr) {
      console.error('Insert statement record error:', insertErr);
      if (insertErr.message?.includes('unique_document_per_opportunity')) {
        return { error: 'This quarterly statement has already been archived for this period. Please delete the existing report first if you wish to replace it.' };
      }
      return { error: `Database insert failed: ${insertErr.message}` };
    }

    revalidatePath('/admin/reports');

    return {
      success: true,
      report: {
        ...inserted,
        viewUrl: activeViewUrl,
      },
    };
  } catch (err) {
    console.error('saveQuarterlyFinancialStatementReportAction error:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Add a new Operating Expense to operating_expenses table
 */
export async function addOperatingExpenseAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    const expenseDate =
      formData.get('expense_date') || new Date().toISOString().split('T')[0];
    const category = formData.get('category') || 'Other Operating';
    const description = formData.get('description')?.trim();
    const amount = parseFloat(formData.get('amount'));
    const vendor = formData.get('vendor')?.trim() || null;
    const opportunityId = formData.get('opportunity_id') || 9;
    const paymentMethod = formData.get('payment_method') || 'Card';

    if (!description) return { error: 'Description is required.' };
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Please enter a valid positive expense amount.' };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('operating_expenses')
      .insert({
        expense_date: expenseDate,
        category,
        description,
        amount,
        vendor,
        opportunity_id: Number(opportunityId),
        payment_method: paymentMethod,
        created_by: session.user.email || session.user.adminId,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Insert operating expense error:', insertErr);
      return {
        error: `Could not record expense: ${insertErr.message}. Make sure operating_expenses table exists in Supabase.`,
      };
    }

    revalidatePath('/admin/reports');
    return { success: true, expense: inserted };
  } catch (err) {
    console.error('addOperatingExpenseAction error:', err);
    return { error: err.message || 'Failed to add operating expense.' };
  }
}

/**
 * Delete an Operating Expense
 */
export async function deleteOperatingExpenseAction(expenseId) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    const { error: delErr } = await supabase
      .from('operating_expenses')
      .delete()
      .eq('id', expenseId);

    if (delErr) throw new Error(delErr.message);

    revalidatePath('/admin/reports');
    return { success: true };
  } catch (err) {
    console.error('deleteOperatingExpenseAction error:', err);
    return { error: err.message || 'Failed to delete operating expense.' };
  }
}

/**
 * Update an existing Operating Expense
 */
export async function updateOperatingExpenseAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    const id = formData.get('id');
    const expenseDate =
      formData.get('expense_date') || new Date().toISOString().split('T')[0];
    const category = formData.get('category') || 'Other Operating';
    const description = formData.get('description')?.trim();
    const amount = parseFloat(formData.get('amount'));
    const vendor = formData.get('vendor')?.trim() || null;
    const opportunityId = formData.get('opportunity_id');
    const paymentMethod = formData.get('payment_method') || 'Card';

    if (!id) return { error: 'Missing expense ID.' };
    if (!description) return { error: 'Description is required.' };
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Please enter a valid positive expense amount.' };
    }

    const { data: updated, error: updateErr } = await supabase
      .from('operating_expenses')
      .update({
        expense_date: expenseDate,
        category,
        description,
        amount,
        vendor,
        opportunity_id: opportunityId ? Number(opportunityId) : null,
        payment_method: paymentMethod,
      })
      .eq('id', id)
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        )
      `)
      .single();

    if (updateErr) {
      console.error('Update operating expense error:', updateErr);
      return { error: `Failed to update expense: ${updateErr.message}` };
    }

    revalidatePath('/admin/finance-reports');
    revalidatePath('/admin/reports');
    return { success: true, expense: updated };
  } catch (err) {
    console.error('updateOperatingExpenseAction error:', err);
    return { error: err.message || 'Failed to update operating expense.' };
  }
}

/**
 * Fetch all operating expenses across opportunities
 */
export async function getAllOperatingExpenses({ opportunityId } = {}) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return [];

    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from('operating_expenses')
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        )
      `)
      .order('expense_date', { ascending: false });

    if (opportunityId && opportunityId !== 'ALL') {
      query = query.eq('opportunity_id', Number(opportunityId));
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching operating expenses:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getAllOperatingExpenses error:', err);
    return [];
  }
}

/**
 * Fetch active shareholders list for payments and admin forms
 */
export async function getShareholdersList() {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return [];

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('shareholders')
      .select('id, fullName, email, telephone')
      .order('fullName', { ascending: true });

    if (error) {
      console.error('Error fetching shareholders list:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('getShareholdersList exception:', e);
    return [];
  }
}

/**
 * Record a Payment / Capital Subscription linked to Opportunity and Shareholder
 */
export async function recordPaymentAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    const opportunityId = formData.get('opportunity_id');
    const shareholderId = formData.get('shareholder_id');
    const amountStr = formData.get('amount');
    const paymentDateStr =
      formData.get('payment_date') || new Date().toISOString().split('T')[0];
    const paymentMethod = formData.get('payment_method') || 'Card';
    const paymentType = formData.get('type') || 'capital_subscription';
    const status = formData.get('status') || 'succeeded';
    const reference =
      formData.get('reference')?.trim() || `admin_rec_${Date.now()}`;
    const description = formData.get('description')?.trim() || '';
    const notes = formData.get('notes')?.trim() || '';

    if (!opportunityId) {
      return { error: 'Please select an opportunity.' };
    }
    if (!shareholderId) {
      return { error: 'Please select a shareholder / investor.' };
    }

    const numAmount = parseFloat(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { error: 'Please enter a valid payment amount greater than 0.' };
    }

    // Lookup opportunity name for standard description
    const { data: opp } = await supabase
      .from('opportunities')
      .select('id, name')
      .eq('id', Number(opportunityId))
      .maybeSingle();

    const finalDescription =
      description ||
      `Capital contribution for ${opp?.name || `Opportunity #${opportunityId}`}`;

    const createdAt = paymentDateStr
      ? new Date(`${paymentDateStr}T12:00:00Z`).toISOString()
      : new Date().toISOString();

    // Insert payment record
    const { data: newPayment, error: payErr } = await supabase
      .from('payments')
      .insert({
        opportunity_id: Number(opportunityId),
        shareholder_id: Number(shareholderId),
        amount: numAmount,
        currency: 'USD',
        status,
        type: paymentType,
        payment_method_type: paymentMethod.toLowerCase(),
        description: finalDescription,
        stripe_payment_intent_id: reference,
        created_at: createdAt,
        metadata: {
          reference,
          notes,
          payment_method: paymentMethod,
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
      console.error('Insert payment error:', payErr);
      return { error: `Could not record payment: ${payErr.message}` };
    }

    // Synchronize into investments table if status is successful/paid
    if (
      ['succeeded', 'paid', 'completed', 'success'].includes(
        status.toLowerCase()
      )
    ) {
      try {
        const { data: existingInv } = await supabase
          .from('investments')
          .select('id, amount_invested, total_committed')
          .eq('shareholder_id', Number(shareholderId))
          .eq('opportunity_id', Number(opportunityId))
          .maybeSingle();

        if (!existingInv) {
          await supabase.from('investments').insert({
            shareholder_id: Number(shareholderId),
            opportunity_id: Number(opportunityId),
            amount_invested: numAmount,
            total_committed: numAmount,
            status: 'active',
            start_date: paymentDateStr,
            notes: notes || `Payment recorded by admin (${reference})`,
          });
        } else {
          await supabase
            .from('investments')
            .update({
              amount_invested:
                (Number(existingInv.amount_invested) || 0) + numAmount,
              total_committed:
                (Number(existingInv.total_committed) || 0) + numAmount,
            })
            .eq('id', existingInv.id);
        }
      } catch (invErr) {
        console.warn('Could not synchronize investment portfolio record:', invErr);
      }
    }

    revalidatePath('/admin/finance-reports');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/investments');
    revalidatePath('/admin/reports');

    return { success: true, payment: newPayment };
  } catch (err) {
    console.error('recordPaymentAction error:', err);
    return { error: err.message || 'Failed to record payment.' };
  }
}

/**
 * Fetch shareholders with their saved payment methods for payout recording
 */
export async function getShareholdersWithPaymentMethods() {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return [];

    const supabase = createAdminSupabaseClient();

    // 1. Fetch all active shareholders
    const { data: shList, error: shErr } = await supabase
      .from('shareholders')
      .select('id, fullName, email, telephone')
      .order('fullName', { ascending: true });

    if (shErr) {
      console.error('Error fetching shareholders:', shErr);
      return [];
    }

    // 2. Fetch payment methods
    const { data: methods, error: mErr } = await supabase
      .from('shareholder_payment_methods')
      .select('*');

    if (mErr) {
      console.warn('Note: Could not query shareholder_payment_methods directly:', mErr.message);
    }

    const methodsMap = {};
    (methods || []).forEach((m) => {
      methodsMap[m.shareholder_id] = m;
    });

    return (shList || []).map((sh) => ({
      ...sh,
      payment_method: methodsMap[sh.id] || null,
    }));
  } catch (err) {
    console.error('getShareholdersWithPaymentMethods error:', err);
    return [];
  }
}

/**
 * Fetch opportunities alongside their latest valuation / asset value
 */
export async function getOpportunitiesWithValuations() {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return [];

    const supabase = createAdminSupabaseClient();

    const { data: opps, error: oppErr } = await supabase
      .from('opportunities')
      .select('*')
      .order('name', { ascending: true });

    if (oppErr) {
      console.error('Error fetching opportunities:', oppErr);
      return [];
    }

    const { data: vals } = await supabase
      .from('opportunity_valuations')
      .select('*')
      .order('valuation_date', { ascending: false })
      .order('created_at', { ascending: false });

    const valMap = {};
    (vals || []).forEach((v) => {
      if (!valMap[v.opportunity_id]) {
        valMap[v.opportunity_id] = v;
      }
    });

    return (opps || []).map((opp) => ({
      ...opp,
      current_asset_value:
        valMap[opp.id]?.total_asset_value ?? opp.total_value ?? 0,
      latest_valuation_date: valMap[opp.id]?.valuation_date ?? null,
    }));
  } catch (err) {
    console.error('getOpportunitiesWithValuations error:', err);
    return [];
  }
}

/**
 * Record a Dividend Payout to a shareholder
 * Uses shareholder's registered payment info, records in payments ledger as dividend,
 * and reduces the opportunity's total_asset_value in opportunity_valuations and opportunities.
 */
export async function recordDividendPayoutAction(formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) return { error: 'Unauthorized' };

    const supabase = createAdminSupabaseClient();

    const opportunityId = formData.get('opportunity_id');
    const shareholderId = formData.get('shareholder_id');
    const amountStr = formData.get('amount');
    const paymentDateStr =
      formData.get('payment_date') || new Date().toISOString().split('T')[0];
    const payoutRail = formData.get('payout_rail') || formData.get('payment_method') || 'wire';
    const reference =
      formData.get('reference')?.trim() || `div_${Date.now()}`;
    const description = formData.get('description')?.trim() || '';
    const notes = formData.get('notes')?.trim() || '';
    const accountName = formData.get('account_name')?.trim() || '';
    const accountNumber = formData.get('account_number')?.trim() || '';
    const accountHandle = formData.get('account_handle')?.trim() || '';

    if (!opportunityId) {
      return { error: 'Please select an opportunity for the dividend payout.' };
    }
    if (!shareholderId) {
      return { error: 'Please select a recipient shareholder.' };
    }

    const numAmount = parseFloat(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { error: 'Please enter a valid dividend amount greater than 0.' };
    }

    // Lookup opportunity
    const { data: opp } = await supabase
      .from('opportunities')
      .select('id, name, total_value')
      .eq('id', Number(opportunityId))
      .maybeSingle();

    const finalDescription =
      description ||
      `Dividend Payout for ${opp?.name || `Opportunity #${opportunityId}`}`;

    const createdAt = paymentDateStr
      ? new Date(`${paymentDateStr}T12:00:00Z`).toISOString()
      : new Date().toISOString();

    // 1. Insert dividend payout into payments ledger
    const { data: newPayment, error: payErr } = await supabase
      .from('payments')
      .insert({
        opportunity_id: Number(opportunityId),
        shareholder_id: Number(shareholderId),
        amount: numAmount,
        currency: 'USD',
        status: 'succeeded',
        type: 'dividend',
        payment_method_type: payoutRail.toLowerCase(),
        description: finalDescription,
        stripe_payment_intent_id: reference,
        created_at: createdAt,
        metadata: {
          reference,
          notes,
          payment_method: payoutRail,
          payout_rail: payoutRail,
          account_name: accountName,
          account_number: accountNumber,
          account_handle: accountHandle,
          is_dividend: true,
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
      console.error('Insert dividend payment error:', payErr);
      return { error: `Could not record dividend payment: ${payErr.message}` };
    }

    // 2. Reduce the Opportunity Asset Value in opportunity_valuations
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
        const newTotalAssetValue = Math.max(0, currentVal - numAmount);

        if (latestVal.valuation_date === today) {
          await supabase
            .from('opportunity_valuations')
            .update({
              total_asset_value: newTotalAssetValue,
              created_at: new Date().toISOString(),
              notes: latestVal.notes
                ? `${latestVal.notes} | Dividend payout of $${numAmount.toLocaleString()} to shareholder #${shareholderId}`
                : `Dividend payout of $${numAmount.toLocaleString()} to shareholder #${shareholderId}`,
            })
            .eq('id', latestVal.id);
        } else {
          await supabase
            .from('opportunity_valuations')
            .insert({
              opportunity_id: Number(opportunityId),
              total_asset_value: newTotalAssetValue,
              valuation_date: today,
              created_by_admin_id: session.user.adminId,
              notes: `Reduced by dividend payout of $${numAmount.toLocaleString()} to shareholder #${shareholderId}`,
            });
        }
      }

      // 3. Also reduce total_value in opportunities if present
      if (opp && opp.total_value !== null && opp.total_value !== undefined) {
        const newOppTotal = Math.max(0, Number(opp.total_value || 0) - numAmount);
        await supabase
          .from('opportunities')
          .update({ total_value: newOppTotal })
          .eq('id', Number(opportunityId));
      }
    } catch (valErr) {
      console.warn('Note: Opportunity valuation reduction warning:', valErr);
    }

    revalidatePath('/admin/transactions');
    revalidatePath('/admin/finance-reports/valuations');
    revalidatePath('/admin/payments');
    revalidatePath('/account/payment');
    revalidatePath('/account/investments');

    return { success: true, payment: newPayment };
  } catch (err) {
    console.error('recordDividendPayoutAction error:', err);
    return { error: err.message || 'Failed to record dividend payout.' };
  }
}



