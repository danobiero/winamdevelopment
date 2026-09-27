import { createAdminSupabaseClient } from './supabase-admin';
import { eachDayOfInterval } from 'date-fns';
import { supabase } from './supabase';
import { auth } from './auth';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

import { createSupabaseBuildClient } from './supabase-build';
import { da } from 'date-fns/locale';

//=================================================
// GET ADMINISTRATOR (WITH PROFILE DATA)
//================================= ================

export async function getAdmin(email) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, fullName, telephone')
    .eq('email', email)
    .single();
  return data;
}

export async function getLesson(id) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // For testing
  // await new Promise((res) => setTimeout(res, 1000));

  if (error) {
    console.error(error);
    notFound();
  }

  return data;
}

export async function getLessonPrice(id) {
  const { data, error } = await supabase

    .from('lessons')
    .select('regularPrice, discount')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
  }

  return data;
}
/////////////////////////////////////////////////////////
//GET OPPORTUNITIES
////////////////////////////////////////////////////////

export async function getOpportunities() {
  try {
    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return data;
  } catch (adminErr) {
    console.warn('createAdminSupabaseClient getOpportunities fallback:', adminErr.message);
  }

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }

  return data || [];
}

//////////////////////////////////////////////////////////////
//GET A SINGLE OPPORTUNITY
/////////////////////////////////////////////////////////////

export async function getOpportunityById(id) {
  if (!id || id === 'undefined') notFound();

  const opportunityId = Number(id);

  if (Number.isNaN(opportunityId)) notFound();

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .maybeSingle();

  if (error) {
    console.error(error);
    notFound();
  }

  return data;
}


//////////////////////////////////////////////////////////
// GET USER MEMBERSHIP STATUS
//////////////////////////////////////////////////////////

export async function getMemberStatusByEmail(email) {
  const { data, error } = await supabase
    .from('membership_applications')
    .select('*')
    .eq('email', email)
    .eq('is_archived', false) 
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  // Attach the computed business logic to the returned record
  data.isFullyCompleted = 
    data.status === 'completed' 

  return data;
}

//////////////////////////////////////////////////////////
//GET USER MEMBERSHIP STATUS
//////////////////////////////////////////////////////////

export async function getMemberStatusByEmail_old(email) {
  const { data, error } = await supabase
    .from('membership_applications')
    .select('*')
    .eq('email', email)
    .eq('is_archived', false) 
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

//=================================================
// GET SHAREHOLDER (BY EMAIL)
//=================================================
export async function getShareholder(email) {
  const { data, error } = await supabase
    .from('shareholders')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('⚠️ getShareholder error:', error.message);
    throw new Error('Could not retrieve shareholder data');
  }

  if (!data) return null;

  // Return clean, consistent object
  return data;
}
//////////////////////////////////////////////////////////////////
//GET USER PROFILE
/////////////////////////////////////////////////////////////////

export async function getUserProfile() {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized: No session found');
  }

  const { data, error } = await supabase
    .from('shareholders')
    .select('*')
    .eq('id', session.user.shareholderId)
    .maybeSingle();

  if (error) {
    console.error('⚠️ get user_profile error:', error);
    throw new Error('User profile could not be loaded');
  }

  if (!data) {
    notFound();
  }

  return data;
}

//=================================================
// GET SHAREHOLDER PAYMENT METHOD
//=================================================
export async function getShareholderPaymentMethod(shareholderId) {
  try {
    const { data, error } = await supabase
      .from('shareholder_payment_methods')
      .select('*')
      .eq('shareholder_id', shareholderId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ getShareholderPaymentMethod note:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error fetching shareholder payment method:', err);
    return null;
  }
}

//=================================================
// GET LEGACY SHAREHOLDERS (ADMIN)
//=================================================
export async function getLegacyShareholders() {
  try {
    let client = supabase;
    try {
      client = createAdminSupabaseClient();
    } catch (e) {}

    const { data, error } = await client
      .from('legacy_shareholders')
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        ),
        shareholders (
          id,
          fullName,
          email,
          investments (
            id,
            opportunity_id,
            amount_invested,
            start_date,
            opportunities (
              id,
              name,
              type
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ getLegacyShareholders notice:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching legacy shareholders:', err);
    return [];
  }
}

//=================================================
// SYNC LEGACY SHAREHOLDER ON SIGN-IN
// When an unclaimed legacy shareholder signs in for the first time,
// auto-populate their portfolio, membership, and payout preferences.
//=================================================
export async function syncLegacyShareholderOnSignIn(shareholderId, email) {
  try {
    if (!shareholderId || !email) return null;

    // 1. Check if an unclaimed legacy record exists for this email
    const { data: legacy, error: legacyErr } = await supabase
      .from('legacy_shareholders')
      .select('*')
      .ilike('email', email)
      .eq('is_claimed', false)
      .maybeSingle();

    if (legacyErr || !legacy) {
      return null; // Not a legacy shareholder or already claimed
    }

    console.log(`[Legacy Sync] Found unclaimed record for ${email}. Migrating to live tables...`);

    // 2. Update the shareholder profile if legacy contains phone or nationality
    const profileUpdates = {};
    if (legacy.telephone) profileUpdates.telephone = legacy.telephone;
    if (legacy.nationality) profileUpdates.nationality = legacy.nationality;
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      await supabase
        .from('shareholders')
        .update(profileUpdates)
        .eq('id', shareholderId);
    }

    // 3. Auto-populate Membership Application (Completed status so they bypass application fee)
    const { data: existingApp } = await supabase
      .from('membership_applications')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!existingApp) {
      await supabase.from('membership_applications').insert({
        full_name: legacy.full_name,
        email: legacy.email,
        phone: legacy.telephone || '',
        shareholder_id: shareholderId,
        status: 'completed',
        application_fee_paid: true,
        has_agreed_to_shareholding: true,
        has_agreed_to_operating_agreement: true,
        operating_agreement_signed: true,
        agreement_signed_at: new Date().toISOString(),
        primary_interest: 'Legacy Shareholder Portfolio',
        experience_description: 'Pre-existing shareholder transitioned from legacy records.',
      });
    }

    // 4. Auto-populate Investment Portfolio (supports multiple investments)
    let investmentList = [];
    if (Array.isArray(legacy.investments) && legacy.investments.length > 0) {
      investmentList = legacy.investments;
    } else if (legacy.notes && legacy.notes.includes('[Allocations JSON]:')) {
      try {
        const jsonStr = legacy.notes.split('[Allocations JSON]:')[1]?.trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) investmentList = parsed;
      } catch (e) {
        console.warn('Could not parse allocations from notes fallback:', e);
      }
    }

    if (investmentList.length === 0 && legacy.opportunity_id && legacy.amount_invested > 0) {
      investmentList = [
        {
          opportunity_id: legacy.opportunity_id,
          amount_invested: legacy.amount_invested,
          start_date: legacy.start_date,
        },
      ];
    }

    const cleanNotes = legacy.notes
      ? legacy.notes.replace(/\[Allocations JSON\]:[\s\S]*$/, '').trim()
      : 'Transitioned from legacy records';

    for (const inv of investmentList) {
      const oppId = Number(inv.opportunity_id);
      const amount = Number(inv.amount_invested);
      if (!oppId || amount <= 0) continue;

      const { data: existingInv } = await supabase
        .from('investments')
        .select('id')
        .eq('shareholder_id', shareholderId)
        .eq('opportunity_id', oppId)
        .maybeSingle();

      if (!existingInv) {
        await supabase.from('investments').insert({
          shareholder_id: shareholderId,
          opportunity_id: oppId,
          amount_invested: amount,
          total_committed: amount,
          status: 'active',
          start_date: inv.start_date || new Date().toISOString().split('T')[0],
          notes: cleanNotes || 'Transitioned from legacy records',
        });
      }

      // 4b. Ensure payment entry exists in payments table
      const syntheticPaymentId = `legacy_${legacy.id}_opp_${oppId}`;
      await supabase.from('payments').upsert(
        {
          shareholder_id: shareholderId,
          opportunity_id: oppId,
          amount: amount,
          currency: 'USD',
          status: 'succeeded',
          type: 'legacy_investment',
          payment_method_type:
            legacy.payment_type && legacy.payment_type !== 'none'
              ? legacy.payment_type
              : 'manual',
          description: `Legacy investment for Opportunity #${oppId} (${legacy.full_name})`,
          stripe_payment_intent_id: syntheticPaymentId,
          metadata: {
            source: 'legacy_sync_on_signin',
            legacy_shareholder_id: legacy.id,
            account_handle: legacy.account_handle,
            account_name: legacy.account_name,
            account_number: legacy.account_number,
          },
          created_at: inv.start_date
            ? new Date(inv.start_date).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_payment_intent_id' }
      );
    }

    // 5. Auto-populate Payout Method (if payout preference was entered)
    if (legacy.payment_type && legacy.payment_type !== 'none') {
      await supabase
        .from('shareholder_payment_methods')
        .upsert(
          {
            shareholder_id: shareholderId,
            payment_type: legacy.payment_type,
            account_handle: legacy.account_handle || null,
            account_number: legacy.account_number || null,
            account_name: legacy.account_name || legacy.full_name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'shareholder_id' }
        );
    }

    // 6. Mark Legacy Record as Claimed & Link to Shareholder ID
    await supabase
      .from('legacy_shareholders')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by_shareholder_id: shareholderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', legacy.id);

    console.log(`[Legacy Sync] Successfully synced legacy record ID ${legacy.id} to shareholder #${shareholderId}.`);
    return legacy;
  } catch (err) {
    console.error('⚠️ [Legacy Sync] Error syncing legacy shareholder:', err);
    return null;
  }
}



export async function getBooking(id) {
  const { data, error, count } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    throw new Error(error.message, 'Booking could not get loaded');
  }

  return data;
}

export async function getBookings(studentId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      studentId,
      startDate,
      endDate,
      numNights,
      totalPrice,
      numStudents,
      status,
      created_at,
      cancelled,
      lessons (
        id,
        name,
        image,
        category,
        lesson_materials (
        file_url,
        name)
      ),
      refunds (
        id,
        created_at,
        booking_id,
        refund_amount,
        reason,
        status,
        rejection_notes,
        rejection_policy_id (
          title
        )
      )
    `
    )
    .eq('studentId', studentId)
    .order('startDate');

  if (error) {
    console.error(error);
    throw new Error('Bookings could not get loaded');
  }

  return data;
}

////////////////////////////////////////////////////////////
//GET INVESTOR INVESTMENTS
///////////////////////////////////////////////////////////
export async function getInvestments(shareholderId) {
  // Get today's date in YYYY-MM-DD format (UTC)
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('investments')
    .select(
      `
      id,
      shareholder_id,
      opportunity_id,
      amount_invested,
      total_committed,
      status,
      start_date,
      end_date,
      created_at,
      updated_at,
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
        is_featured
      )
    `
    )
    .eq('shareholder_id', shareholderId)
    
    .in('status', ['active', 'pending'])
    // 2. Filter for investments that haven't ended yet
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('start_date');

  if (error) {
    console.error("Database Error Detail:", error.message);
    //throw new Error('Investments could not be loaded');
    if (error) {
      throw new Error(
        `${error.message} | ${error.details || ''} | ${error.hint || ''}`
      );
    }
  }

  return data;
}

export async function getAllInvestments(shareholderId) {
  const { data, error } = await supabase
    .from('investments')
    .select(
      `
      id,
      shareholder_id,
      opportunity_id,
      amount_invested,
      total_committed,
      status,
      start_date,
      end_date,
      created_at,
      updated_at,
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
        is_featured
      ),
      redemption_requests (
        id,
        amount,
        status,
        already_redeemed_so_far,
        reason_code,
        admin_notes,
        created_at,
        updated_at
      )
    `
    )
    .eq('shareholder_id', shareholderId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error("Database Error Detail:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function getShareholderDocuments(shareholderId) {
  const { data: investments, error: invError } = await supabase
    .from('investments')
    .select('opportunity_id')
    .eq('shareholder_id', shareholderId);

  if (invError) {
    console.error('Error fetching shareholder investments:', invError);
    return [];
  }

  const opportunityIds = (investments || []).map((inv) => inv.opportunity_id);

  if (opportunityIds.length === 0) {
    return [];
  }

  const { data: documents, error: docError } = await supabase
    .from('opportunity_documents')
    .select(`
      *,
      opportunities (
        id,
        name
      )
    `)
    .in('opportunity_id', opportunityIds)
    .order('created_at', { ascending: false });

  if (docError) {
    console.error('Error fetching opportunity documents:', docError);
    return [];
  }

  return documents;
}




export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').single();

  if (error) {
    console.error(error);
    throw new Error('Settings could not be loaded');
  }

  return data;
}

//Getting countries from data folder

export async function getCountries() {
  const filePath = path.join(process.cwd(), 'data', 'countries.json');

  try {
    // ⬅️ 1. Check if countries.json already exists
    const file = await fs.readFile(filePath, 'utf8');
    return JSON.parse(file);
  } catch {}

  // ⬅️ 2. Fetch from the API (only ONCE)
  try {
    const res = await fetch(
      'https://restcountries.com/v2/all?fields=name,flag'
    );

    if (!res.ok) {
      throw new Error('Failed to fetch countries');
    }

    const countries = await res.json();

    // ⬅️ 3. Save to local file
    await fs.writeFile(filePath, JSON.stringify(countries, null, 2), 'utf8');

    return countries;
  } catch (err) {
    throw new Error('Could not fetch countries');
  }
}


////////////////////////////////////////////////////////////
//CREATE SHAREHOLDER
///////////////////////////////////////////////////////////
//=================================================
// CREATE USER PROFILE (SHAREHOLDER)
//=================================================

export async function createUserProfile(newProfile) {
  // newProfile should contain: { id, full_name, email, avatar_url, role: 'shareholder' }
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([newProfile])
    .select()
    .maybeSingle();

  if (error) {
    console.error(
      '❌ Error creating user profile:',
      JSON.stringify(error, null, 2)
    );

    // Check for unique constraint violations (e.g., profile already exists)
    if (error.code === '23505') {
      throw new Error('A profile for this user already exists.');
    }

    throw new Error('User profile could not be established');
  }

  return data;
}

////////////////////////////////////////////////////////////
//CREATE A SHAREHOLDER
///////////////////////////////////////////////////////////
export async function createShareholder(newShareholder) {
  const { data, error } = await supabase
    .from('shareholders')
    .insert([
      {
        fullName: newShareholder.fullName,
        email: newShareholder.email,
        telephone: newShareholder.telephone ?? null,
        nationality: newShareholder.nationality ?? null,
        shareholderStatus: 'active',
        sharePercentage: 0,
        isDirector: false,
        auth_user_id: newShareholder.auth_user_id ?? null,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Error creating shareholder:', error);

    if (error.code === '23505') {
      throw new Error('Shareholder already exists.');
    }

    throw new Error('Shareholder could not be created');
  }

  return data;
}

export async function insertBooking(newBooking) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([newBooking])
    // So that the newly created object gets returned!
    .select()
    .maybeSingle();

  if (error) {
    console.error(error);
    throw new Error('Booking could not be created', error, message);
  }

  return data;
}

/////////////
// UPDATE

// The updatedFields is an object which should ONLY contain the updated data
export async function updateStudent(id, updatedFields) {
  const { data, error } = await supabase
    .from('students')
    .update(updatedFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error('Student could not be updated');
  }
  return data;
}

export async function updateBooking(id, updatedFields) {
  const { data, error } = await supabase
    .from('bookings')
    .update(updatedFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error('Booking could not be updated');
  }
  return data;
}

/////////////
// DELETE

export async function deleteBooking(id) {
  const { data, error } = await supabase.from('bookings').delete().eq('id', id);

  if (error) {
    console.error(error);
    throw new Error('Booking could not be deleted');
  }
  return data;
}

export async function uploadPdf(file) {
  const { data, error } = await supabase.storage
    .from('workbooks_pdfs')
    .upload(`docs/${file.name}`, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function getOpportunityValuations() {
  const adminClient = createAdminSupabaseClient();
  const [{ data: valuations, error: valErr }, { data: opps, error: oppErr }] = await Promise.all([
    adminClient.from('opportunity_valuations').select('*').order('valuation_date', { ascending: false }),
    adminClient.from('opportunities').select('id, name')
  ]);

  if (valErr) {
    console.error('Error fetching valuations:', valErr);
    return [];
  }

  const oppMap = new Map((opps || []).map(o => [o.id, o.name]));
  return (valuations || []).map(v => ({
    ...v,
    opportunities: {
      name: oppMap.get(v.opportunity_id) || 'Unknown Opportunity'
    }
  }));
}
