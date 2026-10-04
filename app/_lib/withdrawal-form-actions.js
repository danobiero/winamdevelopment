'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { revalidatePath } from 'next/cache';

const USA_LAND_OPPORTUNITY_ID = 11;
const USA_LAND_OPPORTUNITY_NAME = 'USA Land Project';

/**
 * Initializes a Member Withdrawal Form when Admin begins redemption for USA Land Project
 */
export async function initializeWithdrawalFormForRedemption({
  redemptionRequestId,
  investmentId,
  shareholderId,
  opportunityId,
}) {
  const adminClient = createAdminSupabaseClient();

  // 1. Verify if this is the USA Land Project
  let isUsaLand = Number(opportunityId) === USA_LAND_OPPORTUNITY_ID;
  if (!isUsaLand && opportunityId) {
    const { data: opp } = await adminClient
      .from('opportunities')
      .select('name')
      .eq('id', opportunityId)
      .maybeSingle();
    if (opp?.name?.toLowerCase().includes('usa land')) {
      isUsaLand = true;
    }
  }

  if (!isUsaLand) {
    return null; // Not USA Land, standard redemption flow applies
  }

  // 2. Fetch withdrawing shareholder details
  const { data: withdrawingShareholder } = await adminClient
    .from('shareholders')
    .select('id, fullName, email')
    .eq('id', shareholderId)
    .single();

  // 3. Fetch all active participating shareholders in USA Land Project to determine live member count and pro-rata distribution ratio
  const targetOppId = opportunityId || USA_LAND_OPPORTUNITY_ID;
  const { data: allProjectInvs } = await adminClient
    .from('investments')
    .select('id, shareholder_id, amount_invested, current_value, status, shareholders(id, fullName, email)')
    .eq('opportunity_id', targetOppId)
    .neq('status', 'exited');

  // Build unique map of active participating members
  const activeMembersMap = new Map();
  (allProjectInvs || []).forEach((inv) => {
    if (inv.shareholders && !activeMembersMap.has(inv.shareholder_id)) {
      activeMembersMap.set(inv.shareholder_id, inv);
    }
  });

  // Calculate dynamic member count (including the withdrawing member)
  const currentShIdNum = Number(shareholderId);
  const totalMemberCount = Math.max(1, activeMembersMap.size || (withdrawingShareholder ? 1 : 8));

  // Build Part 5 Consenting Members (all other active participating co-investors)
  let consents = [];
  activeMembersMap.forEach((inv, sId) => {
    if (Number(sId) !== currentShIdNum && inv.shareholders) {
      consents.push({
        shareholder_id: inv.shareholders.id,
        member_name: inv.shareholders.fullName || 'Participating Member',
        email: inv.shareholders.email,
        has_consented: false,
        signature: '',
        signed_at: null,
      });
    }
  });

  // Fallback default participating members if none loaded from DB
  const defaultMemberNames = [
    'Carolyne Opondo',
    'Catherine Obura',
    'Daniel Obiero',
    'Doreen Oport',
    'George Odima',
    'Jephline Okoth',
    'Judith Awino',
    'Susan Odak',
  ];

  if (consents.length === 0) {
    consents = defaultMemberNames
      .filter((name) => !withdrawingShareholder?.fullName?.toLowerCase().includes(name.toLowerCase()))
      .map((name) => ({
        shareholder_id: null,
        member_name: name,
        has_consented: false,
        signature: '',
        signed_at: null,
      }));
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch investment valuation or amount
  let valuationDollars = 1000;
  if (investmentId) {
    const { data: inv } = await adminClient
      .from('investments')
      .select('amount_invested, current_value')
      .eq('id', investmentId)
      .maybeSingle();
    if (inv) {
      valuationDollars = Number(inv.current_value || inv.amount_invested || 1000);
    }
  }
  const valuationFormatted = `$${valuationDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate dynamic distribution ratio based on live participating member count
  const dynamicRatioPercent = Number((100 / totalMemberCount).toFixed(2));
  const dynamicProjectInterest = `${dynamicRatioPercent.toFixed(2)}% (1/${totalMemberCount} share)`;

  // 4. Insert or update member_withdrawal_forms
  const initialPage1 = {
    fullLegalName: withdrawingShareholder?.fullName || '',
    capitalContributed: valuationFormatted,
    projectInterest: dynamicProjectInterest,
    noticeDate: new Date().toISOString().split('T')[0],
    effectiveExitDate: '',
    reasonForWithdrawal: '',
    dispositionOption: 'option_b', // default company redemption
    optionA: { purchaserNames: '', agreedPrice: '' },
    optionB: { agreedRedemptionAmount: valuationFormatted },
    optionC: { transfereeName: '', transferPrice: '' },
    termsAcknowledged: false,
    memberSignature: '',
    printedName: withdrawingShareholder?.fullName || '',
    dateSigned: '',
    phoneEmail: withdrawingShareholder?.email || '',
    submittedAt: null,
  };

  const initialPart6 = {
    pmName: 'Jephline Okoth, Project Manager',
    pmSignature: '',
    pmSignedAt: null,
    officerName: 'Daniel Obiero / Authorized Officer, Winam Development Group, LLC',
    officerSignature: '',
    officerSignedAt: null,
    isCompleted: false,
  };

  try {
    const payload = {
      redemption_request_id: redemptionRequestId,
      investment_id: investmentId,
      shareholder_id: shareholderId,
      opportunity_id: opportunityId || USA_LAND_OPPORTUNITY_ID,
      status: 'pending_member_submission',
      expires_at: expiresAt,
      page1_data: initialPage1,
      consents: consents,
      part6_admin: initialPart6,
      updated_at: new Date().toISOString(),
    };

    const { data: existingForm } = await adminClient
      .from('member_withdrawal_forms')
      .select('id')
      .eq('redemption_request_id', redemptionRequestId)
      .maybeSingle();

    let newForm = null;
    if (existingForm) {
      const { data: updated, error: updateErr } = await adminClient
        .from('member_withdrawal_forms')
        .update(payload)
        .eq('id', existingForm.id)
        .select()
        .single();
      if (updateErr) console.warn('Could not update member_withdrawal_forms:', updateErr.message);
      newForm = updated;
    } else {
      const { data: inserted, error: insertErr } = await adminClient
        .from('member_withdrawal_forms')
        .insert(payload)
        .select()
        .single();
      if (insertErr) console.warn('Could not insert member_withdrawal_forms:', insertErr.message);
      newForm = inserted;
    }

    return newForm;
  } catch (err) {
    console.warn('initializeWithdrawalFormForRedemption error:', err);
    return null;
  }
}

/**
 * Retrieves active withdrawal forms relevant to a logged-in shareholder
 * (either as the withdrawing member or as a participating consenting member)
 */
export async function getActiveWithdrawalFormsForShareholder(shareholderId) {
  if (!shareholderId) return [];

  const adminClient = createAdminSupabaseClient();

  try {
    // 0. AUTO-HEAL: Check if any active USA Land Project redemption requests lack a withdrawal form
    try {
      const { data: pendingRequests } = await adminClient
        .from('redemption_requests')
        .select(`
          id,
          investment_id,
          shareholder_id,
          status,
          investments (
            opportunity_id,
            opportunities (
              name
            )
          )
        `)
        .eq('status', 'pending');

      for (const req of (pendingRequests || [])) {
        const oppName = req.investments?.opportunities?.name?.toLowerCase() || '';
        const oppId = Number(req.investments?.opportunity_id);
        const isLand = oppId === USA_LAND_OPPORTUNITY_ID || oppName.includes('usa land');

        if (isLand) {
          const { data: existingForm } = await adminClient
            .from('member_withdrawal_forms')
            .select('id')
            .eq('redemption_request_id', req.id)
            .maybeSingle();

          if (!existingForm) {
            await initializeWithdrawalFormForRedemption({
              redemptionRequestId: req.id,
              investmentId: req.investment_id,
              shareholderId: req.shareholder_id,
              opportunityId: oppId || USA_LAND_OPPORTUNITY_ID,
            });
          }
        }
      }
    } catch (autoHealErr) {
      console.warn('Auto-healing withdrawal forms notice:', autoHealErr.message);
    }

    // 1. Fetch current shareholder profile for fallback matching
    const { data: currentShareholder } = await adminClient
      .from('shareholders')
      .select('id, fullName, email')
      .eq('id', shareholderId)
      .maybeSingle();

    const currentEmail = currentShareholder?.email?.toLowerCase().trim() || '';
    const currentName = currentShareholder?.fullName?.toLowerCase().trim() || '';

    // Check if the current shareholder has an active participation in USA Land Project
    const { data: userInvestments } = await adminClient
      .from('investments')
      .select('id, opportunity_id, amount_invested, status, opportunities(name, type)')
      .eq('shareholder_id', shareholderId)
      .neq('status', 'exited');

    const participatesInLand = (userInvestments || []).some(
      (inv) =>
        Number(inv.opportunity_id) === USA_LAND_OPPORTUNITY_ID ||
        (inv.opportunities?.name || '').toLowerCase().includes('usa land')
    );

    // 2. Fetch active/pending member_withdrawal_forms
    const { data: forms, error } = await adminClient
      .from('member_withdrawal_forms')
      .select(`
        *,
        shareholders(id, fullName, email),
        investments(*),
        opportunities(name, type),
        redemption_requests(id, status, amount, already_redeemed_so_far)
      `)
      .order('created_at', { ascending: false });

    if (error || !forms) return [];

    const now = new Date();
    const relevantForms = [];

    for (const form of forms) {
      // 🛑 Exclude any withdrawal forms where redemption is completed, cancelled, or rejected
      const isRedemptionCompleted =
        form.status === 'completed' ||
        form.status === 'cancelled' ||
        form.status === 'rejected' ||
        form.redemption_requests?.status === 'completed' ||
        form.redemption_requests?.status === 'cancelled' ||
        form.redemption_requests?.status === 'rejected' ||
        (form.redemption_requests &&
          Number(form.redemption_requests.amount || 0) > 0 &&
          Number(form.redemption_requests.already_redeemed_so_far || 0) >= Number(form.redemption_requests.amount || 0));

      if (isRedemptionCompleted) continue;

      const isWithdrawer = Number(form.shareholder_id) === Number(shareholderId);
      let consents = Array.isArray(form.consents) ? [...form.consents] : [];
      let userConsent = consents.find((c) => {
        if (c.shareholder_id && Number(c.shareholder_id) === Number(shareholderId)) return true;
        if (currentEmail && c.email && c.email.toLowerCase().trim() === currentEmail) return true;
        if (currentName && c.member_name && c.member_name.toLowerCase().trim() === currentName) return true;
        return false;
      });

      // A shareholder is a participating member if they participate in USA Land or are listed in consents
      const isParticipant = !isWithdrawer && (participatesInLand || Boolean(userConsent));

      if (!isWithdrawer && !isParticipant) continue;

      // Auto-register participating member in consents if not present
      if (isParticipant && !userConsent && currentShareholder) {
        userConsent = {
          shareholder_id: currentShareholder.id,
          member_name: currentShareholder.fullName || 'Participating Member',
          email: currentShareholder.email || '',
          has_consented: false,
          signature: '',
          signed_at: null,
          is_admin_override: false,
        };
        consents.push(userConsent);
        await adminClient
          .from('member_withdrawal_forms')
          .update({
            consents,
            updated_at: new Date().toISOString(),
          })
          .eq('id', form.id);
        form.consents = consents;
      }

      const expiresAtDate = new Date(form.expires_at);
      const daysRemaining = Math.max(
        0,
        Math.ceil((expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const isExpired = now > expiresAtDate;

      let actionRequired = false;
      let role = '';

      if (isWithdrawer) {
        role = 'withdrawing_member';
        actionRequired = !form.page1_data?.submittedAt && !isExpired;
      } else if (isParticipant) {
        role = 'participating_member';
        actionRequired = !userConsent?.has_consented && !isExpired;
      }

      relevantForms.push({
        ...form,
        role,
        actionRequired,
        daysRemaining,
        isExpired,
        userConsent,
      });
    }

    return relevantForms;
  } catch (err) {
    console.error('getActiveWithdrawalFormsForShareholder error:', err);
    return [];
  }
}

/**
 * Get withdrawal form by redemption_request_id (Used by Admin & Modals)
 */
export async function getWithdrawalFormByRedemptionId(redemptionRequestId) {
  if (!redemptionRequestId) return null;

  const adminClient = createAdminSupabaseClient();

  try {
    const { data, error } = await adminClient
      .from('member_withdrawal_forms')
      .select(`
        *,
        shareholders(fullName, email),
        investments(*),
        opportunities(name)
      `)
      .eq('redemption_request_id', redemptionRequestId)
      .maybeSingle();

    if (error || !data) return null;

    const now = new Date();
    const expiresAtDate = new Date(data.expires_at);
    const daysRemaining = Math.max(
      0,
      Math.ceil((expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      ...data,
      daysRemaining,
      isExpired: now > expiresAtDate,
    };
  } catch (err) {
    console.error('getWithdrawalFormByRedemptionId error:', err);
    return null;
  }
}

/**
 * Withdrawing Member submits Page 1 of the form
 */
export async function submitWithdrawingMemberPage1(formData) {
  const session = await auth();
  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized: Log in as a shareholder.');
  }

  const shareholderId = session.user.shareholderId;
  const formId = formData.get('formId');
  if (!formId) throw new Error('Form ID is required');

  const adminClient = createAdminSupabaseClient();

  // 1. Fetch form
  const { data: form, error: fetchErr } = await adminClient
    .from('member_withdrawal_forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (fetchErr || !form) throw new Error('Withdrawal form record not found.');
  if (Number(form.shareholder_id) !== Number(shareholderId)) {
    throw new Error('Unauthorized: Only the withdrawing shareholder can submit Page 1.');
  }

  if (new Date() > new Date(form.expires_at)) {
    throw new Error('This withdrawal request has expired (30-day notice period elapsed).');
  }

  // 2. Extract inputs
  const fullLegalName = formData.get('fullLegalName')?.trim() || form.page1_data?.fullLegalName;
  const capitalContributed = formData.get('capitalContributed') || '$1,000.00';
  const projectInterest = formData.get('projectInterest') || '12.50% (1/8 share)';
  const noticeDate = formData.get('noticeDate') || new Date().toISOString().split('T')[0];
  const effectiveExitDate = formData.get('effectiveExitDate');
  const reasonForWithdrawal = formData.get('reasonForWithdrawal')?.trim();
  const dispositionOption = formData.get('dispositionOption') || 'option_b';
  const termsAcknowledged = formData.get('termsAcknowledged') === 'on' || formData.get('termsAcknowledged') === 'true';
  const memberSignature = formData.get('memberSignature')?.trim();
  const printedName = formData.get('printedName')?.trim() || fullLegalName;
  const phoneEmail = formData.get('phoneEmail')?.trim();

  if (!memberSignature) throw new Error('Member digital signature is required.');
  if (!termsAcknowledged) throw new Error('You must acknowledge the terms, settlement, and release.');

  const page1Data = {
    fullLegalName,
    capitalContributed,
    projectInterest,
    noticeDate,
    effectiveExitDate,
    reasonForWithdrawal,
    dispositionOption,
    optionA: {
      purchaserNames: formData.get('purchaserNames') || '',
      agreedPrice: formData.get('agreedPriceA') || '',
    },
    optionB: {
      agreedRedemptionAmount: form.page1_data?.optionB?.agreedRedemptionAmount || '$1,000.00',
    },
    optionC: {
      transfereeName: formData.get('transfereeName') || '',
      transferPrice: formData.get('transferPriceC') || '',
    },
    termsAcknowledged,
    memberSignature,
    printedName,
    dateSigned: new Date().toISOString(),
    phoneEmail,
    submittedAt: new Date().toISOString(),
  };

  // 3. Update form status to 'pending_consents'
  const { error: updateErr } = await adminClient
    .from('member_withdrawal_forms')
    .update({
      page1_data: page1Data,
      status: 'pending_consents',
      updated_at: new Date().toISOString(),
    })
    .eq('id', formId);

  if (updateErr) throw new Error('Failed to save Page 1: ' + updateErr.message);

  revalidatePath('/account');
  revalidatePath('/account/investments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/investments');

  return { success: true };
}

/**
 * Participating Member signs Part 5 Consent
 */
export async function submitParticipatingMemberConsent({ formId, signature }) {
  const session = await auth();
  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized: Log in as a shareholder.');
  }

  const shareholderId = session.user.shareholderId;
  if (!signature || signature.trim().length < 2) {
    throw new Error('Valid digital signature is required.');
  }

  const adminClient = createAdminSupabaseClient();

  const { data: form, error: fetchErr } = await adminClient
    .from('member_withdrawal_forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (fetchErr || !form) throw new Error('Withdrawal form record not found.');
  if (new Date() > new Date(form.expires_at)) {
    throw new Error('This withdrawal request has expired.');
  }

  const consents = Array.isArray(form.consents) ? [...form.consents] : [];
  const memberIdx = consents.findIndex(
    (c) => Number(c.shareholder_id) === Number(shareholderId)
  );

  if (memberIdx === -1) {
    throw new Error('You are not registered as a participating member for this project.');
  }

  const now = new Date();
  consents[memberIdx] = {
    ...consents[memberIdx],
    has_consented: true,
    signature: signature.trim(),
    signed_at: now.toISOString(),
    system_date: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };

  // Check if ALL participating members have consented
  const allConsented = consents.every((c) => c.has_consented);
  const nextStatus = allConsented ? 'pending_admin_approval' : 'pending_consents';

  const { error: updateErr } = await adminClient
    .from('member_withdrawal_forms')
    .update({
      consents: consents,
      status: nextStatus,
      updated_at: now.toISOString(),
    })
    .eq('id', formId);

  if (updateErr) throw new Error('Failed to record consent: ' + updateErr.message);

  revalidatePath('/account');
  revalidatePath('/account/investments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/investments');

  return { success: true, allConsented };
}

/**
 * Admin overrides and provides consent for a shareholder (or all remaining pending shareholders)
 * Documented explicitly as "Admin Override" to complete the process and unlock the flow
 */
export async function adminOverrideMemberConsent({
  formId,
  shareholderId,
  overrideAll = false,
  reason = '',
}) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const adminClient = createAdminSupabaseClient();

  const { data: form, error: fetchErr } = await adminClient
    .from('member_withdrawal_forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (fetchErr || !form) throw new Error('Withdrawal form record not found.');

  const consents = Array.isArray(form.consents) ? [...form.consents] : [];
  const now = new Date();
  const adminName = session.user.name || session.user.email || 'Administrator';

  let modifiedCount = 0;

  for (let i = 0; i < consents.length; i++) {
    const isTarget = overrideAll
      ? !consents[i].has_consented
      : Number(consents[i].shareholder_id) === Number(shareholderId) ||
        (consents[i].member_name && consents[i].member_name === shareholderId);

    if (isTarget) {
      consents[i] = {
        ...consents[i],
        has_consented: true,
        signature: 'Admin Override',
        signed_at: now.toISOString(),
        system_date: now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        is_admin_override: true,
        admin_override_by: adminName,
        admin_override_reason: reason || 'Admin Override - Process completed to unlock flow',
      };
      modifiedCount++;
    }
  }

  if (modifiedCount === 0) {
    throw new Error('No pending member matching the criteria was found to override.');
  }

  const allConsented = consents.every((c) => c.has_consented);
  const nextStatus = allConsented ? 'pending_admin_approval' : form.status;

  const { error: updateErr } = await adminClient
    .from('member_withdrawal_forms')
    .update({
      consents: consents,
      status: nextStatus,
      updated_at: now.toISOString(),
    })
    .eq('id', formId);

  if (updateErr) throw new Error('Failed to record Admin Override: ' + updateErr.message);

  revalidatePath('/account');
  revalidatePath('/account/investments');
  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/investments');

  return { success: true, allConsented, modifiedCount };
}

/**
 * Admin fills Part 6 (Company Administrative Approval)
 */
export async function submitAdminPart6Approval({
  formId,
  pmSignature,
  officerSignature,
}) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized: Admin access required.');
  }

  if (!pmSignature?.trim()) throw new Error('Project Manager signature is required.');
  if (!officerSignature?.trim()) throw new Error('Authorized Company Officer signature is required.');

  const adminClient = createAdminSupabaseClient();

  const now = new Date();
  const part6Admin = {
    pmName: 'Jephline Okoth, Project Manager',
    pmSignature: pmSignature.trim(),
    pmSignedAt: now.toISOString(),
    officerName: 'Daniel Obiero / Authorized Officer, Winam Development Group, LLC',
    officerSignature: officerSignature.trim(),
    officerSignedAt: now.toISOString(),
    isCompleted: true,
  };

  const { error } = await adminClient
    .from('member_withdrawal_forms')
    .update({
      part6_admin: part6Admin,
      status: 'approved',
      updated_at: now.toISOString(),
    })
    .eq('id', formId);

  if (error) throw new Error('Failed to record administrative approval: ' + error.message);

  revalidatePath('/admin/redemptions');
  revalidatePath('/admin/investments');
  revalidatePath('/account');
  revalidatePath('/account/investments');

  return { success: true };
}

/**
 * Checks whether Part 6 is completed for a redemption request
 */
export async function checkWithdrawalFormPart6Complete(redemptionRequestId) {
  if (!redemptionRequestId) return true;

  const adminClient = createAdminSupabaseClient();

  try {
    const { data: form, error } = await adminClient
      .from('member_withdrawal_forms')
      .select('id, part6_admin, status')
      .eq('redemption_request_id', redemptionRequestId)
      .maybeSingle();

    if (error || !form) {
      // If no withdrawal form is attached, this is a standard redemption
      return true;
    }

    return Boolean(form.part6_admin?.isCompleted);
  } catch (err) {
    console.error('checkWithdrawalFormPart6Complete error:', err);
    return false;
  }
}
