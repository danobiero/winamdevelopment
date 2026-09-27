'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from './auth';
import { supabase } from './supabase';
import Stripe from 'stripe';
import { createAdminSupabaseClient } from './supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import { cleanPhoneNumber, isValidPhoneNumber } from '@/app/_lib/phone-utils';
import { handleServerError, sanitizeErrorMessage } from '@/app/_lib/error-handler';

//Initializing Stripe

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16', // always set the latest stable
});

//Creating supabase client server
function createSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**BEGIN CHECK BY PHONE NUMBER ***************************************/
export async function checkBookingByPhone(phone) {
  try {
    const session = await auth();
    if (!session?.user?.studentId) {
      throw new Error('User not logged in.');
    }

    const studentId = session.user.studentId;

    // 🧹 Clean input
    const phoneStr = String(phone).replace(/\s|-/g, '').trim();

    // 1️⃣ Fetch logged-in student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, telephone')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) throw new Error(studentError.message);

    // No phone on file
    if (!student || !student.telephone) {
      return {
        status: 'phone_not_found',
        message: 'No phone number registered for this student.',
      };
    }

    // Entered phone does not match
    if (student.telephone !== phoneStr) {
      return {
        status: 'phone_mismatch',
        message: 'Invalid phone number entered.',
      };
    }

    // 2️⃣ Fetch all bookings for lessons 1 or 2 (customize as needed)
    const { data: allBookings, error: allError } = await supabase
      .from('bookings')
      .select('id, status, bookingStatus, lessonId')
      .eq('studentId', studentId)
      .in('lessonId', [1, 2]);

    if (allError) throw new Error(allError.message);

    // No bookings at all
    if (!allBookings || allBookings.length === 0) {
      return {
        status: 'not_found',
        message: 'No lessons found for this student.',
      };
    }

    // Filter only fully paid and confirmed bookings
    const paidBookings = allBookings.filter(
      (b) => b.status === 'paid' && b.bookingStatus === true
    );

    // Bookings exist but none are paid
    if (paidBookings.length === 0) {
      const lastBooking = allBookings[allBookings.length - 1]; // get latest booking
      return {
        status: 'unpaid',
        message: 'Bookings found but none are paid. Please complete payment.',
        booking: lastBooking, // ✅ added so front-end can redirect
      };
    }

    // ✅ Paid booking found — return the first one
    return {
      status: 'paid',
      message: 'Paid booking verified.',
      booking: paidBookings[0],
    };
  } catch (error) {
    console.error('❌ checkBookingByPhone error:', error.message);
    return {
      status: 'error',
      message: error.message || 'An unexpected error occurred.',
    };
  }
}
/////////////////////////////////////////////////////////////
//UPDATE USER PROFILE
////////////////////////////////////////////////////////////
export async function updateProfile(prevState, formData) {
  const session = await auth();
  if (!session) return { error: true, message: 'You must be logged in.' };

  const fullName = formData.get('fullName')?.toString().trim();
  const nationality = formData.get('nationality')?.toString().trim();
  const telephoneRaw = formData.get('telephone')?.toString().trim();

  // Validate telephone
  const regex = /^[0-9]{9,12}$/;
  if (telephoneRaw && !regex.test(telephoneRaw)) {
    return {
      error: true,
      message: 'Invalid telephone number. Must be 9-12 digits.',
    };
  }

  const updateData = {
    fullName: fullName || null,
    nationality: nationality || null,
    // Note: If your DB column is 'text', keep it a string to avoid losing leading zeros.
    // If it's a number/bigint, Number() is fine.
    telephone: telephoneRaw || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('shareholders')
    .update(updateData)
    .eq('id', session.user.shareholderId);

  if (error) {
    console.error(error);
    return {
      error: true,
      message: 'Profile could not be updated in the database.',
    };
  }

  revalidatePath('/account/profile');

  // Return success state
  return { success: true, message: 'Profile updated successfully!' };
}

/////////////////////////////////////////////////////////////
// SAVE / UPDATE PAYMENT METHOD
/////////////////////////////////////////////////////////////
export async function savePaymentMethod(prevState, formData) {
  try {
    const session = await auth();
    let shareholderId = session?.user?.shareholderId;

    if (!shareholderId && session?.user?.email) {
      const { data: sh } = await supabase
        .from('shareholders')
        .select('id')
        .eq('email', session.user.email)
        .maybeSingle();
      shareholderId = sh?.id;
    }

    if (!shareholderId) {
      return { error: true, message: 'You must be logged in as a shareholder.' };
    }

    const paymentType = formData.get('paymentType')?.toString().trim().toLowerCase();
    const accountHandle = formData.get('accountHandle')?.toString().trim() || null;
    const accountNumber = formData.get('accountNumber')?.toString().trim() || null;
    const accountName = formData.get('accountName')?.toString().trim() || '';

    // Validation
    const validPaymentTypes = ['zelle', 'cashapp', 'check'];
    if (!paymentType || !validPaymentTypes.includes(paymentType)) {
      return { error: true, message: 'Please select a valid payment method (Zelle, CashApp, or Check).' };
    }

    if (!accountName) {
      return { error: true, message: 'Account name is required.' };
    }

    if (accountNumber && !/^\d+$/.test(accountNumber)) {
      return { error: true, message: 'Account number must contain only numeric digits.' };
    }

    const payload = {
      shareholder_id: Number(shareholderId),
      payment_type: paymentType,
      account_handle: accountHandle,
      account_number: accountNumber,
      account_name: accountName,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('shareholder_payment_methods')
      .upsert(payload, { onConflict: 'shareholder_id' });

    if (error) {
      const sanitized = handleServerError(error, 'savePaymentMethod', 'Unable to save payment information. Please verify your details.');
      return {
        error: true,
        message: sanitized.error,
        referenceId: sanitized.referenceId,
      };
    }

    revalidatePath('/account/payment');
    return {
      success: true,
      message: 'Payment information saved successfully!',
      timestamp: Date.now(),
    };
  } catch (err) {
    const sanitized = handleServerError(err, 'savePaymentMethod', 'An unexpected error occurred while saving payment information.');
    return {
      error: true,
      message: sanitized.error,
      referenceId: sanitized.referenceId,
      timestamp: Date.now(),
    };
  }
}

/////////////////////////////////////////////////////////////
// ADMIN: CREATE / UPDATE LEGACY SHAREHOLDER STAGING RECORD
/////////////////////////////////////////////////////////////
export async function createLegacyShareholder(prevState, formData) {
  const session = await auth();
  if (!session?.user?.adminId) {
    return { error: true, message: 'Unauthorized: Admin access required.' };
  }

  const fullName = formData.get('fullName')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const telephone = formData.get('telephone')?.toString().trim() || null;
  const nationality = formData.get('nationality')?.toString().trim() || null;

  // Process multiple allocated opportunities
  let allocations = [];
  const allocationsRaw = formData.get('allocations');
  if (allocationsRaw) {
    try {
      const parsed = JSON.parse(allocationsRaw);
      if (Array.isArray(parsed)) {
        allocations = parsed
          .filter((item) => item.opportunityId && String(item.opportunityId).trim() !== '')
          .map((item) => ({
            opportunity_id: Number(item.opportunityId),
            amount_invested: Number(item.amountInvested) || 0,
            start_date: item.startDate || new Date().toISOString().split('T')[0],
          }));
      }
    } catch (e) {
      console.warn('Could not parse allocations JSON:', e);
    }
  }

  // Fallback if submitted via single opportunity fields
  if (allocations.length === 0) {
    const singleOppId = formData.get('opportunityId')?.toString().trim();
    const singleAmount = Number(formData.get('amountInvested')) || 0;
    const singleStartDate = formData.get('startDate')?.toString().trim() || new Date().toISOString().split('T')[0];
    if (singleOppId) {
      allocations.push({
        opportunity_id: Number(singleOppId),
        amount_invested: singleAmount,
        start_date: singleStartDate,
      });
    }
  }

  const primaryAllocation = allocations[0] || null;
  const totalAmountInvested = allocations.reduce(
    (sum, item) => sum + (Number(item.amount_invested) || 0),
    0
  );

  const paymentType = formData.get('paymentType')?.toString().trim().toLowerCase() || 'none';
  const accountHandle = formData.get('accountHandle')?.toString().trim() || null;
  const accountNumber = formData.get('accountNumber')?.toString().trim() || null;
  const accountName = formData.get('accountName')?.toString().trim() || null;
  const notes = formData.get('notes')?.toString().trim() || null;

  if (!fullName || !email) {
    return { error: true, message: 'Full name and email are required.' };
  }

  const adminClient = createAdminSupabaseClient();

  // Resolve or pre-create the shareholder profile to obtain a valid shareholder_id for payments
  let shareholderId = null;
  const { data: existingShareholder } = await adminClient
    .from('shareholders')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (existingShareholder) {
    shareholderId = existingShareholder.id;
  } else {
    const { data: newShareholder, error: createShareholderErr } = await adminClient
      .from('shareholders')
      .insert({
        fullName,
        email,
        telephone,
        nationality,
        shareholderStatus: 'active',
        sharePercentage: 0,
        isDirector: false,
      })
      .select('id')
      .maybeSingle();

    if (newShareholder) {
      shareholderId = newShareholder.id;
    } else if (createShareholderErr) {
      console.warn('Notice creating placeholder shareholder:', createShareholderErr.message);
    }
  }

  const payload = {
    full_name: fullName,
    email: email,
    telephone: telephone,
    nationality: nationality,
    opportunity_id: primaryAllocation ? primaryAllocation.opportunity_id : null,
    amount_invested: totalAmountInvested,
    start_date: primaryAllocation ? primaryAllocation.start_date : new Date().toISOString().split('T')[0],
    investments: allocations,
    payment_type: paymentType,
    account_handle: accountHandle,
    account_number: accountNumber,
    account_name: accountName,
    notes: notes,
    created_by_admin_id: session.user.adminId,
    ...(shareholderId ? { claimed_by_shareholder_id: shareholderId } : {}),
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await adminClient
    .from('legacy_shareholders')
    .upsert(payload, { onConflict: 'email' })
    .select()
    .single();

  // Graceful fallback if 'investments' column does not exist yet in Supabase table
  if (error && (error.message?.includes('investments') || error.code === 'PGRST204')) {
    console.warn("Column 'investments' not present yet in legacy_shareholders table. Storing allocations in notes fallback and retrying upsert.");
    const fallbackPayload = { ...payload };
    delete fallbackPayload.investments;
    fallbackPayload.notes = payload.notes
      ? `${payload.notes}\n[Allocations JSON]: ${JSON.stringify(allocations)}`
      : `[Allocations JSON]: ${JSON.stringify(allocations)}`;

    const retryRes = await adminClient
      .from('legacy_shareholders')
      .upsert(fallbackPayload, { onConflict: 'email' })
      .select()
      .single();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error) {
    console.error('Error saving legacy shareholder:', error);
    return {
      error: true,
      message: error.message || 'Could not save legacy shareholder record.',
    };
  }

  // Update PAYMENTS table for each allocation to reflect payment
  if (shareholderId && allocations.length > 0 && data?.id) {
    for (const alloc of allocations) {
      const oppId = Number(alloc.opportunity_id);
      const amount = Number(alloc.amount_invested) || 0;
      if (!oppId || amount <= 0) continue;

      const syntheticPaymentId = `legacy_${data.id}_opp_${oppId}`;

      const paymentRecord = {
        shareholder_id: shareholderId,
        opportunity_id: oppId,
        amount: amount,
        currency: 'USD',
        status: 'succeeded',
        type: 'legacy_investment',
        payment_method_type: paymentType !== 'none' ? paymentType : 'manual',
        description: `Legacy investment for Opportunity #${oppId} (${fullName})`,
        stripe_payment_intent_id: syntheticPaymentId,
        metadata: {
          source: 'legacy_staging',
          legacy_shareholder_id: data.id,
          admin_id: session.user.adminId,
          account_handle: accountHandle,
          account_name: accountName,
          account_number: accountNumber,
          notes: notes,
        },
        created_at: alloc.start_date
          ? new Date(alloc.start_date).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: payError } = await adminClient
        .from('payments')
        .upsert(paymentRecord, { onConflict: 'stripe_payment_intent_id' });

      if (payError) {
        console.warn(`Could not sync payment for legacy opportunity #${oppId}:`, payError.message);
      }

      // Keep live investments table in sync for this shareholder
      if (shareholderId) {
        try {
          const { data: existingInv } = await adminClient
            .from('investments')
            .select('id')
            .eq('shareholder_id', shareholderId)
            .eq('opportunity_id', oppId)
            .maybeSingle();

          if (existingInv) {
            await adminClient
              .from('investments')
              .update({
                amount_invested: amount,
                total_committed: amount,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingInv.id);
          } else {
            await adminClient
              .from('investments')
              .insert({
                shareholder_id: shareholderId,
                opportunity_id: oppId,
                amount_invested: amount,
                total_committed: amount,
                status: 'active',
                start_date: alloc.start_date || new Date().toISOString().split('T')[0],
                notes: 'Updated/added via Admin Legacy Console',
              });
          }
        } catch (invErr) {
          console.warn(`Could not sync live investment for opportunity #${oppId}:`, invErr?.message);
        }
      }
    }
  }

  revalidatePath('/admin/legacy');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/investments');
  const countStr = allocations.length > 0
    ? ` with ${allocations.length} allocated ${allocations.length === 1 ? 'opportunity' : 'opportunities'}`
    : '';
  return { success: true, message: `Legacy shareholder record for ${fullName}${countStr} and payments saved successfully.` };
}

/////////////////////////////////////////////////////////////
// ADMIN: DELETE LEGACY SHAREHOLDER STAGING RECORD
/////////////////////////////////////////////////////////////
export async function deleteLegacyShareholder(id) {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const adminClient = createAdminSupabaseClient();

  // Clean up any synthetic payments linked to this legacy record
  try {
    await adminClient
      .from('payments')
      .delete()
      .like('stripe_payment_intent_id', `legacy_${id}_opp_%`);
  } catch (err) {
    console.warn('Notice cleaning up legacy payments:', err?.message);
  }

  const { error } = await adminClient
    .from('legacy_shareholders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting legacy shareholder:', error);
    throw new Error(error.message || 'Could not delete legacy record.');
  }

  revalidatePath('/admin/legacy');
  revalidatePath('/admin/payments');
  return { success: true };
}

/////////////////////////////////////////////////////////////
// ADMIN: SYNC MISSING LEGACY INVESTMENTS
/////////////////////////////////////////////////////////////
export async function syncMissingLegacyInvestments() {
  const session = await auth();
  if (!session?.user?.adminId) {
    return { error: true, message: 'Unauthorized: Admin access required.' };
  }

  const adminClient = createAdminSupabaseClient();

  try {
    const { data: legacy, error: legErr } = await adminClient
      .from('legacy_shareholders')
      .select('*');
    if (legErr) throw legErr;

    const { data: payments, error: payErr } = await adminClient
      .from('payments')
      .select('*');
    if (payErr) throw payErr;

    const { data: shareholders, error: shErr } = await adminClient
      .from('shareholders')
      .select('*');
    if (shErr) throw shErr;

    const { data: existingInvs, error: invErr } = await adminClient
      .from('investments')
      .select('*');
    if (invErr) throw invErr;

    let syncedCount = 0;

    for (const leg of (legacy || [])) {
      const sh = (shareholders || []).find(
        (s) =>
          s.id === leg.claimed_by_shareholder_id ||
          s.email?.toLowerCase() === leg.email?.toLowerCase()
      );
      if (!sh) continue;

      let allocations = [];
      if (Array.isArray(leg.investments) && leg.investments.length > 0) {
        allocations = leg.investments;
      } else if (leg.notes && leg.notes.includes('[Allocations JSON]:')) {
        try {
          const jsonStr = leg.notes.split('[Allocations JSON]:')[1]?.trim();
          allocations = JSON.parse(jsonStr);
        } catch (e) {
          console.warn(`Could not parse JSON for legacy ${leg.id}:`, e.message);
        }
      } else if (leg.opportunity_id && leg.amount_invested > 0) {
        allocations = [
          {
            opportunity_id: leg.opportunity_id,
            amount_invested: leg.amount_invested,
            start_date: leg.start_date,
          },
        ];
      }

      // Also check payments for this shareholder
      const legPayments = (payments || []).filter(
        (p) =>
          p.shareholder_id === sh.id &&
          (p.type === 'legacy_investment' ||
            p.stripe_payment_intent_id?.startsWith(`legacy_${leg.id}_`)) &&
          p.status === 'succeeded'
      );

      if (allocations.length === 0 && legPayments.length > 0) {
        allocations = legPayments.map((p) => ({
          opportunity_id: p.opportunity_id,
          amount_invested: p.amount,
          start_date: p.created_at
            ? p.created_at.split('T')[0]
            : new Date().toISOString().split('T')[0],
        }));
      }

      const cleanNotes = leg.notes
        ? leg.notes.replace(/\[Allocations JSON\]:[\s\S]*$/, '').trim()
        : '';

      for (const alloc of allocations) {
        const oppId = Number(alloc.opportunity_id);
        const amount = Number(alloc.amount_invested);
        const startDate =
          alloc.start_date ||
          (leg.start_date
            ? String(leg.start_date).split('T')[0]
            : new Date().toISOString().split('T')[0]);

        if (!oppId || amount <= 0) continue;

        const existing = (existingInvs || []).find(
          (i) => i.shareholder_id === sh.id && Number(i.opportunity_id) === oppId
        );

        if (!existing) {
          const { error: insertErr } = await adminClient.from('investments').insert({
            shareholder_id: sh.id,
            opportunity_id: oppId,
            amount_invested: amount,
            total_committed: amount,
            status: 'active',
            start_date: startDate,
            notes: cleanNotes || 'Transitioned from legacy records',
          });

          if (!insertErr) {
            syncedCount++;
          } else {
            console.error(`Failed to insert investment for shareholder ${sh.id} opp ${oppId}:`, insertErr);
          }
        } else if (Number(existing.amount_invested) !== amount) {
          const { error: updateErr } = await adminClient
            .from('investments')
            .update({
              amount_invested: amount,
              total_committed: amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!updateErr) syncedCount++;
        }
      }
    }

    revalidatePath('/admin/legacy');
    revalidatePath('/admin/investments');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/reports');

    return {
      success: true,
      count: syncedCount,
      message:
        syncedCount > 0
          ? `Successfully synchronized ${syncedCount} legacy investment${syncedCount === 1 ? '' : 's'} into the investments table.`
          : 'All legacy investments are already up to date in the investments table.',
    };
  } catch (err) {
    console.error('Error syncing legacy investments:', err);
    return {
      error: true,
      message: err.message || 'Failed to sync legacy investments.',
    };
  }
}




export async function updateProfileAdmin(formData) {
  const session = await auth();

  if (!session) throw new Error('Login First to Update Profile');
  const fullName = formData.get('fullName');
  const telephone = formData.get('telephone');
  const email = formData.get('email');
  const regex = /^[0-9]{9,12}$/;

  if (!regex.test(telephone)) throw new Error('Invalid Telephone Number');
  const updateData = { fullName, telephone };

  const { data, error } = await supabase
    .from('admins')
    .update(updateData)
    .eq('id', session.user.adminId);

  if (error) {
    throw new Error('Admin could not be updated');
  }

  revalidatePath('/admin/profile');
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error('Login First to Reserve Lesson');
  // 2. Identify Admin/Staff by absence of studentId
  // If studentId is missing, they are likely an Admin and shouldn't book
  if (!session.user?.studentId) {
    console.warn(`User ${session.user?.email} attempted to create a booking.`);
    throw new Error('Please use a student account to create a lesson.');
  }

  const studentId = session.user.studentId;
  const newBooking = {
    ...bookingData,
    studentId: session.user.studentId,
    numStudents: Number(formData.get('numStudents')),
    observations: formData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.totalPrice,
    lessonPrice: bookingData.lessonPrice,
    isPaid: false,
    hasExtra: false,
    status: 'pending',
    balance: Number(formData.get('balance')),
  };

  // const newBookingData = await insertBooking(newBooking);
  const { data: insertedBooking, error } = await supabase
    .from('bookings')
    .insert([newBooking])
    .select()
    .single();

  if (error) {
    throw new Error('Booking not created', error.message);
  }

  // ✅ Log the user action in booking_actions table

  await supabase.from('booking_actions').insert({
    student_id: studentId,
    booking_id: insertedBooking.id,
    action: 'created',
  });

  await revalidatePath(`/lessons/${bookingData.lessonId}`);
  redirect(`/account/reservations/${insertedBooking.id}`);
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error('Login First to Delete Lesson');
  if (!session?.user?.studentId) {
    throw new Error('Invalid session: no student ID found');
  }

  const studentId = session.user.studentId;

  // ✅ Verify booking belongs to the current student
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, studentId')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) throw new Error('Booking not found');
  if (booking.studentId !== studentId) throw new Error('Access Denied');

  // ✅ Log action before deletion
  const { error: logError } = await supabase.from('booking_actions').insert({
    student_id: studentId, // ✅ consistent with your schema
    booking_id: bookingId,
    action: 'deleted',
  });

  if (logError) {
    console.error('Booking action log failed:', logError.message);
    // Not fatal — continue with deletion
  }

  // ✅ Delete the booking
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) {
    console.error('Booking deletion failed:', error.message);
    throw new Error('Booking not deleted');
  }

  // ✅ Revalidate the reservations page cache
  revalidatePath('/account/reservations');

  return { success: true, deletedId: bookingId };
}

//Update bookings starts
export async function updateBooking({
  bookingId,
  numStudents,
  totalPrice,
  observations,
}) {
  const session = await auth();
  if (!session) throw new Error('Login first to update booking');
  if (!session?.user?.studentId)
    throw new Error('Invalid session: no student ID found');

  const studentId = session.user.studentId;

  // Fetch current booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, studentId, numStudents, totalPrice, observations')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) throw new Error('Booking not found');
  if (booking.studentId !== studentId) throw new Error('Access denied');

  // Update only if something changed
  const updatedFields = {};
  if (numStudents !== booking.numStudents)
    updatedFields.numStudents = numStudents;
  if (totalPrice !== booking.totalPrice) updatedFields.totalPrice = totalPrice;
  if (observations !== undefined) updatedFields.observations = observations;

  if (Object.keys(updatedFields).length === 0)
    return { message: 'No changes detected' };

  const { data, error: updateError } = await supabase
    .from('bookings')
    .update({ ...updatedFields, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) throw new Error('Booking could not be updated');

  // ✅ Log the user action in booking_actions table

  await supabase.from('booking_actions').insert({
    student_id: studentId,
    booking_id: bookingId,
    action: 'edited',
  });

  revalidatePath(`/account/reservations`);
  redirect('/account/reservations');

  return { success: true, booking: data };
}

//Update bookings end

//Download from datatabase starts

export async function getDownloadUrl(filePath) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from('workbooks')
    .createSignedUrl(filePath, 60); // valid for 60s

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
//Download ends

//Payment Actions starts..$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// 💳 Payment Actions$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// Payment Actions starts
export async function createCheckoutSession(bookingId) {
  // 1️⃣ Verify user session
  const session = await auth();
  if (!session) throw new Error('Login first to continue.');
  if (!session?.user?.studentId)
    throw new Error('Invalid session: missing student ID.');

  const studentId = session.user.studentId;

  // 2️⃣ Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id,totalPrice,status,lessonId,studentId')
    .eq('id', bookingId)
    .single();
  if (bookingError || !booking) throw new Error('Booking not found.');

  // 3️⃣ Fetch lesson name
  const { data: lesson } = await supabase
    .from('lessons')
    .select('name')
    .eq('id', booking.lessonId)
    .single();
  const lessonName = lesson?.name || 'Unnamed Lesson';

  // 4️⃣ Convert to cents for Stripe but store in dollars
  const priceCents = Math.round(Number(booking.totalPrice) * 100);
  const priceDollars = Number(booking.totalPrice);
  if (priceCents <= 0) throw new Error('Invalid booking price.');

  // 5️⃣ Create Stripe Checkout Session
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lessonName,
              description: `Booking #${bookingId} for ${lessonName}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      // ✅ include session_id so it’s available in the success page URL
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        bookingId,
        studentId: booking.studentId,
        lessonId: booking.lessonId,
        lessonName,
      },
    });
  } catch (err) {
    console.error('❌ Stripe session creation failed:', err);
    throw new Error('Stripe session creation failed.');
  }

  // 6️⃣ Store pending payment in Supabase
  try {
    await supabase.from('payments').insert({
      student_id: booking.studentId,
      booking_id: bookingId,
      stripe_session_id: stripeSession.id,
      status: 'pending',
      amount: priceDollars, // ✅ store in dollars
      currency: 'usd',
      description: `Booking #${bookingId} for ${lessonName}`,
      metadata: {
        bookingId,
        lessonName,
        lessonId: booking.lessonId,
        studentId: booking.studentId,
      },
    });
  } catch (err) {
    console.error('⚠️ Failed to insert pending payment:', err);
  }

  // 7️⃣ Return Checkout URL
  return { url: stripeSession.url };
}

// Aditional Payment begins $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// ✅ Additional Payment Checkout (Fixed)
// Additional Payment Checkout

export async function additionalPayment({
  bookingId,
  difference,
  oldTotal,
  newTotal,
  newStudents,
  reason,
}) {
  // 1️⃣ Verify user session
  const session = await auth();
  if (!session) throw new Error('Login first to continue.');

  if (!session?.user?.studentId)
    throw new Error('Invalid session: missing student ID.');

  // 2️⃣ Validate difference
  const diffAmount = Number(difference);
  if (isNaN(diffAmount) || diffAmount <= 0)
    throw new Error('Invalid additional payment amount.');

  // 3️⃣ Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id,totalPrice,status,lessonId,studentId')
    .eq('id', bookingId)
    .single();
  if (bookingError || !booking) throw new Error('Booking not found.');

  // 4️⃣ Fetch lesson name
  const { data: lesson } = await supabase
    .from('lessons')
    .select('name')
    .eq('id', booking.lessonId)
    .single();
  const lessonName = lesson?.name || 'Unnamed Lesson';

  // 5️⃣ Convert difference to cents
  const priceCents = Math.round(diffAmount * 100);
  const priceDollars = diffAmount;
  if (priceCents <= 0) throw new Error('Invalid payment amount.');

  // 6️⃣ Create Stripe Checkout Session
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Additional Payment - ${lessonName}`,
              description: `Booking #${bookingId} (${reason})`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        type: 'additional_payment',
        booking_id: String(bookingId),
        student_id: String(booking.studentId),
        lesson_id: String(booking.lessonId),
        lesson_name: lessonName,
        reason: String(reason),
        num_Students: String(newStudents),
        difference: String(priceDollars),
        old_total_price: String(oldTotal ?? 0),
        new_total_price: String(newTotal ?? oldTotal + priceDollars),
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  } catch (err) {
    console.error('❌ Stripe additional payment session creation failed:', err);
    throw new Error('Stripe session creation failed.');
  }

  // 7️⃣ Log pending payment
  try {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existing) {
      await supabase.from('payments').insert({
        student_id: booking.studentId,
        booking_id: bookingId,
        stripe_session_id: stripeSession.id,
        stripe_event: 'checkout.session.created',
        status: 'pending',
        amount: priceDollars,
        currency: 'usd',
        type: 'additional',
        description: `Additional payment for Booking #${bookingId} (${reason})`,
        metadata: {
          bookingId,
          lessonName,
          lessonId: booking.lessonId,
          studentId: booking.studentId,
          reason,
        },
      });
    }
  } catch (err) {
    console.error('⚠️ Failed to insert additional payment record:', err);
  }

  // 8️⃣ Return session URL and ID
  return { url: stripeSession.url, id: stripeSession.id };
}

//=========================================================
// ******** Request refund server action begins **********
//=========================================================
export async function requestRefund({
  bookingId,
  refundAmount,
  reason,
  numStudents,
  newTotal,
}) {
  const session = await auth();
  if (!session) throw new Error('Login First to request refund');
  if (!session?.user?.studentId)
    throw new Error('Invalid session: no student ID found');

  const studentId = session.user.studentId;

  // --- 1️⃣ Fetch the current booking ---
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('id, totalPrice, numStudents')
    .eq('id', bookingId)
    .single();

  if (bookingError || !bookingData) {
    throw new Error('Booking not found');
  }

  const oldTotal = Number(bookingData.totalPrice || 0);
  const oldStudents = Number(bookingData.numStudents || 0);

  // --- 2️⃣ Normalize incoming values ---
  const safeRefundAmount = Number(refundAmount || 0);
  const safeNumStudents = Number(numStudents ?? oldStudents);
  const safeNewTotal = Number(newTotal ?? oldTotal);

  if (!Number.isFinite(safeRefundAmount) || safeRefundAmount <= 0) {
    throw new Error('Invalid refund amount');
  }

  // --- 3️⃣ Resolve payment_id (LATEST refundable payment for booking) ---
  const { data: payments, error: paymentErr } = await supabase
    .from('payments')
    .select('id, refunded, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (paymentErr || !payments?.length) {
    throw new Error('No payments found for this booking');
  }

  const targetPayment = payments.find((p) => p.refunded !== true);

  if (!targetPayment) {
    throw new Error(
      'All payments for this booking have already been fully refunded'
    );
  }

  // --- 4️⃣ Insert refund request (PENDING, payment-scoped) ---
  const { data: refundData, error: refundError } = await supabase
    .from('refunds')
    .insert({
      booking_id: bookingId,
      student_id: studentId,
      payment_id: targetPayment.id, // ✅ REQUIRED WITH NEW SCHEMA
      refund_amount: safeRefundAmount,
      reason: reason || null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (refundError || !refundData) {
    throw new Error('Refund request could not be submitted');
  }

  // --- 5️⃣ Log booking change ---
  await supabase.from('booking_changes').insert({
    booking_id: bookingId,
    student_id: studentId,
    change_type:
      safeNumStudents === 0 && safeNewTotal === 0
        ? 'lesson_cancelled'
        : 'refund_requested',
    field_changed: {
      num_students: {
        old: oldStudents,
        new: safeNumStudents,
      },
    },
    amount_difference: -Math.abs(safeRefundAmount),
    old_total_price: oldTotal,
    new_total_price: safeNewTotal,
    stripe_session_id: null,
  });

  // --- 6️⃣ Determine cancellation state ---
  const isCancelled = safeNumStudents === 0 && safeNewTotal === 0;

  // --- 7️⃣ Update bookings table ---
  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({
      numStudents: safeNumStudents,
      observations: reason,
      totalPrice: safeNewTotal,
      cancelled: isCancelled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (bookingUpdateError) {
    throw new Error('Booking update failed');
  }

  // --- 8️⃣ UI refresh ---
  revalidatePath(`/account/reservations/${bookingId}`);
  revalidatePath(`/account/reservations`);

  return {
    success: true,
    message: isCancelled
      ? 'Lesson cancelled successfully and refund request submitted.'
      : 'Refund request submitted successfully.',
    refundId: refundData.id,
    paymentId: targetPayment.id,
    redirectUrl: '/account/reservations',
  };
}

//===================================================
//REQUEST REFUNG
//===================================================
export async function requestRefundAdmin({
  bookingId,
  refundAmount,
  reason,
  numStudents,
  newTotal,
}) {
  // 1️⃣ Verify admin session
  const session = await auth();
  if (!session) throw new Error('Login First to request refund');

  if (!session?.user?.adminId)
    throw new Error('Unauthorized: Admin access required');

  const adminId = session.user.adminId;

  // 🔥 Admin override — studentId always = 1
  const forcedStudentId = 1;

  // 2️⃣ Fetch booking
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('id, totalPrice, numStudents')
    .eq('id', bookingId)
    .single();

  if (bookingError || !bookingData) throw new Error('Booking not found');

  const oldTotal = Number(bookingData.totalPrice);
  const oldStudents = Number(bookingData.numStudents);

  // 3️⃣ Normalize inputs
  const safeRefundAmount = Number(refundAmount || 0);
  const safeNumStudents = Number(numStudents ?? oldStudents);
  const safeNewTotal = Number(newTotal ?? oldTotal);

  // 4️⃣ Insert refund request
  const { data: refundData, error: refundError } = await supabase
    .from('refunds')
    .insert({
      booking_id: bookingId,
      student_id: forcedStudentId, // 🔥 override
      refund_amount: safeRefundAmount,
      reason: reason || null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (refundError) throw new Error('Refund request could not be submitted');

  // 5️⃣ Insert booking change log
  await supabase.from('booking_changes').insert({
    booking_id: bookingId,
    student_id: forcedStudentId,
    change_type:
      safeNumStudents === 0 && safeNewTotal === 0
        ? 'lesson_cancelled_admin'
        : 'refund_requested_admin',

    field_changed: {
      num_students: {
        old: oldStudents,
        new: safeNumStudents,
      },
    },

    amount_difference: -Math.abs(safeRefundAmount),
    old_total_price: oldTotal,
    new_total_price: safeNewTotal,
    stripe_session_id: null,
    admin_override: true,
    admin_id: adminId,
  });

  // 6️⃣ Determine if this is a cancellation
  const isCancelled = safeNumStudents === 0 && safeNewTotal === 0;

  // 7️⃣ Update booking record
  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({
      numStudents: safeNumStudents,
      observations: reason || null,
      totalPrice: safeNewTotal,
      cancelled: isCancelled,
    })
    .eq('id', bookingId);

  if (bookingUpdateError) throw new Error('Booking update failed');

  // 8️⃣ Revalidate admin pages
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/admin/bookings`);

  return {
    success: true,
    refundId: refundData?.id,
    redirectUrl: '/admin/bookings',
    message: isCancelled
      ? 'Lesson cancelled and admin refund request submitted.'
      : 'Admin refund request submitted successfully.',
  };
}

//DOWNLOAD MATERIALS FROM MATERIALS TABLE
export async function getLessonFilePath(lessonId) {
  const { data, error } = await supabase
    .from('lesson_materials')
    .select('storage_path')
    .eq('lesson_id', lessonId)
    .limit(1)
    .single();

  if (error || !data) {
    return {
      status: 'not_found',
      message: 'No material found for this lesson.',
    };
  }

  return {
    status: 'ok',
    storagePath: data.storage_path,
  };
}

//SIGN IN ACTIONS
export async function signInAction() {
  await signIn('google', {
    redirectTo: '/welcome',
  });
}

// 🧩 Admin login
export async function adminSignInAction() {
  await signIn('google', {
    redirectTo: '/admin',
  });
}

export async function signOutAction() {
  await signOut({
    redirectTo: '/',
  });
}

//GET STUDENTS CALENDAR EVENTS
export async function getStudentCalendar(studentId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      startDate,
      endDate,
      category,
      calendar_bookings (
        calendar (
          id,
          date,
          start_time,
          end_time,
          meet_link
        )
      )
    `
    )
    .eq('studentId', studentId);

  if (error) throw new Error(error.message);

  // If no bookings → no events
  if (!data || data.length === 0) return {};

  // Flatten events into { 'YYYY-MM-DD': [events] }
  const eventsByDate = {};

  data.forEach((booking) => {
    booking.calendar_bookings.forEach((cb) => {
      const evt = cb.calendar;

      if (!evt) return;

      const dateKey = evt.date;

      if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];

      eventsByDate[dateKey].push({
        ...evt,
        bookingId: booking.id,
        category: booking.category,
        startDate: booking.startDate,
        endDate: booking.endDate,
      });
    });
  });

  return eventsByDate;
}

//GET SERVER CLIENT TO GET CALENDAR EVENTS FOR THE STUDENTS
//GET CALENDAR EVENTS FOR A SINGLE LESSON (SERVER ACTION)
export async function getLessonCalendar(bookingId) {
  // 1️⃣ Fetch calendar_bookings mappings
  const { data: mappings, error: mErr } = await supabase
    .from('calendar_bookings')
    .select('calendar_id')
    .eq('booking_id', bookingId);

  if (mErr) throw new Error(mErr.message);
  if (!mappings || mappings.length === 0) return {};

  const calendarIds = mappings.map((m) => m.calendar_id);

  // 2️⃣ Fetch actual events
  const { data: events, error: eErr } = await supabase
    .from('calendar')
    .select('id, start_time, end_time, meet_link')
    .in('id', calendarIds);

  if (eErr) throw new Error(eErr.message);

  // 3️⃣ Build eventsByDate { "yyyy-MM-dd": [events] }
  const eventsByDate = {};

  events.forEach((evt) => {
    if (!evt.start_time) return;

    // Convert timestamp → yyyy-MM-dd
    const dateKey = evt.start_time.split('T')[0];

    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];

    eventsByDate[dateKey].push({
      id: evt.id,
      start_time: evt.start_time,
      end_time: evt.end_time,
      meet_link: evt.meet_link,
    });
  });

  return eventsByDate;
}

export async function emailSignInAction(formData) {
  const supabase = createClient();

  const email = formData.get('email');
  const password = formData.get('password');

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/login?error=Invalid credentials');
  }

  redirect('/lessons');
}

//======================================================================
//SUBMIT SUPPORT FORM
//======================================================================

export async function submitSupportAction_student(formData) {
  const session = await auth();
  const supabase = createAdminSupabaseClient();

  const subject = formData.get('subject')?.toString().trim();
  const message = formData.get('message')?.toString().trim();
  const name = formData.get('name')?.toString().trim() || null;
  const email = formData.get('email')?.toString().trim() || null;

  if (!subject || !message) {
    throw new Error('Missing required fields');
  }

  const insertData = {
    subject,
    message,
    status: 'open',
    source: 'public',
    student_id: null,
    name: null,
    email: null,
  };

  // Logged-in student
  if (session?.user?.studentId) {
    insertData.student_id = session.user.studentId;
    insertData.name = session.user.name;
    insertData.email = session.user.email;
    insertData.source = 'student';
  } else {
    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    insertData.name = name;
    insertData.email = email;
  }

  const { error } = await supabase.from('support').insert(insertData);

  if (error) {
    console.error('SUPPORT INSERT ERROR:', error);
    throw new Error('Failed to submit support request');
  }

  // ✅ Server-side redirect (cleanest solution)
  if (session?.user?.studentId) {
    redirect('/support/thank-you');
  } else {
    redirect('/support/thank-you');
  }
}

//========================================================
//GET STUDENT SUPPORT MESSAGES
//========================================================
export async function getStudentSupportTickets() {
  const session = await auth();

  if (!session?.user?.studentId) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('support')
    .select('*')
    .eq('student_id', session.user.studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

//------------------------------------------------------
// GET STUDENT THREAD
//------------------------------------------------------
export async function getStudentSupportThread(supportId) {
  const session = await auth();

  if (!session?.user?.studentId) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('support_messages')
    .select(
      `
    *,
    support!inner(student_id)
  `
    )
    .eq('support_id', supportId)
    .eq('support.student_id', session.user.studentId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data || [];
}

//------------------------------------------------------
// STUDENT REPLY
//------------------------------------------------------

export async function replyAsStudent({ supportId, message }) {
  const session = await auth();

  if (!session?.user?.studentId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.from('support_messages').insert([
    {
      support_id: supportId,
      sender_type: 'student',
      sender_student_id: session.user.studentId, // ✅ REQUIRED
      sender_id: null,
      message,
    },
  ]);

  if (error) {
    console.error(error);
    throw error;
  }

  await supabase
    .from('support')
    .update({ status: 'in_progress' })
    .eq('id', supportId);

  // refresh student support page
  revalidatePath('/account/support');
}

//==============================================
// GET SHAREHOLDER SUPPORT TICKET
//==============================================
export async function getShareholderSupportTickets() {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('support')
    .select('*')
    .eq('shareholder_id', session.user.shareholderId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

//==============================================
// GET SHAREHOLDER SUPPORT THREAD
//==============================================

export async function getShareholderSupportThread(supportId) {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('support_messages')
    .select(
      `
      *,
      support!inner(shareholder_id)
    `
    )
    .eq('support_id', supportId)
    .eq('support.shareholder_id', session.user.shareholderId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data || [];
}

//==============================================
// SHAREHOLDER REPLY
//==============================================
export async function replyAsShareholder({ supportId, message }) {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized');
  }

  const shareholderId = session.user.shareholderId;

  //--------------------------------------------------
  // 1. INSERT MESSAGE
  //--------------------------------------------------
  const { error } = await supabase.from('support_messages').insert([
    {
      support_id: supportId,
      sender_type: 'shareholder',
      sender_shareholder_id: shareholderId,
      sender_id: null,
      message,
    },
  ]);

  if (error) {
    console.error(error);
    throw error;
  }

  //--------------------------------------------------
  // 2. UPDATE STATUS (SMART LOGIC)
  //--------------------------------------------------
  await supabase
    .from('support')
    .update({ status: 'in_progress' })
    .eq('id', supportId);

  //--------------------------------------------------
  // 3. REFRESH UI
  //--------------------------------------------------
  revalidatePath('/account/support');
}

//==============================================
// SHAREHOLDER SUPPORT SYSTEM
//==============================================

export async function createSupportTicket(formData) {
  const session = await auth();

  if (!session) throw new Error('You must be logged in');

  const shareholderId = session.user.shareholderId;

  const subject = formData.get('subject');
  const priority = formData.get('priority') || 'normal';
  const message = formData.get('message');
  const source = formData.get('source') || 'dashboard';

  if (!subject || !message) {
    throw new Error('Missing required fields');
  }

  //--------------------------------------------------
  // 1. CREATE SUPPORT TICKET
  //--------------------------------------------------
  const { data: ticket, error: ticketError } = await supabase
    .from('support')
    .insert({
      shareholder_id: shareholderId,
      subject,
      message, // optional (kept for quick preview)
      priority,
      source,
      status: 'open',
    })
    .select()
    .single();

  if (ticketError) {
    console.error(ticketError.message);
    throw new Error('Ticket could not be created');
  }

  //--------------------------------------------------
  // 2. CREATE FIRST MESSAGE (CRITICAL)
  //--------------------------------------------------
  const { error: messageError } = await supabase
    .from('support_messages')
    .insert({
      support_id: ticket.id,
      message,
      sender_type: 'shareholder',
      sender_shareholder_id: shareholderId,
    });

  if (messageError) {
    console.error(messageError.message);
    throw new Error('Message could not be created');
  }

  //--------------------------------------------------
  // 3. REFRESH UI
  //--------------------------------------------------
  revalidatePath('/account/support');
  redirect('/account/support');
}

//======================================================================
// SUBMIT SUPPORT FORM (PUBLIC + SHAREHOLDER)
//======================================================================

export async function submitSupportAction(formData) {
  const session = await auth();
  const supabase = createAdminSupabaseClient();

  const subject = formData.get('subject')?.toString().trim();
  const message = formData.get('message')?.toString().trim();
  const name = formData.get('name')?.toString().trim() || null;
  const email = formData.get('email')?.toString().trim() || null;

  if (!subject || !message) {
    throw new Error('Missing required fields');
  }

  //--------------------------------------------------
  // BASE INSERT DATA
  //--------------------------------------------------
  const insertData = {
    subject,
    message,
    status: 'open',
    source: 'public',
    shareholder_id: null,
    name: null,
    email: null,
  };

  //--------------------------------------------------
  // LOGGED-IN SHAREHOLDER
  //--------------------------------------------------
  if (session?.user?.shareholderId) {
    insertData.shareholder_id = session.user.shareholderId;
    insertData.name = session.user.name;
    insertData.email = session.user.email;
    insertData.source = 'shareholder';
  } else {
    //--------------------------------------------------
    // PUBLIC USER
    //--------------------------------------------------
    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    insertData.name = name;
    insertData.email = email;
  }

  //--------------------------------------------------
  // 1. CREATE SUPPORT TICKET
  //--------------------------------------------------
  const { data: ticket, error } = await supabase
    .from('support')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('SUPPORT INSERT ERROR:', error);
    throw new Error('Failed to submit support request');
  }

  //--------------------------------------------------
  // 2. CREATE FIRST MESSAGE (CRITICAL)
  //--------------------------------------------------
  await supabase.from('support_messages').insert({
    support_id: ticket.id,
    message,
    sender_type: session?.user?.shareholderId ? 'shareholder' : 'system', // public users
    sender_shareholder_id: session?.user?.shareholderId || null,
    sender_id: null,
  });

  //--------------------------------------------------
  // 3. REDIRECT
  //--------------------------------------------------
  redirect('/support/thank-you');
}

////////////////////////////////////////////////////////////////////////
//PAY FOR MEMBERSHIP APPLICATION
///////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// CREATE MEMBERSHIP APPLICATION
////////////////////////////////////////////////////////
export async function createMembershipApplication(formData) {
  const session = await auth();

  if (!session) throw new Error('You must be logged in to apply');

  // 🔒 Verify and clean phone number securely on the server
  const rawPhone = formData.get('phone');
  if (!isValidPhoneNumber(rawPhone)) {
    throw new Error('A valid 10-digit telephone number is required.');
  }
  const cleanPhone = cleanPhoneNumber(rawPhone);

  // 🔒 Prevent duplicate applications (ignore archived ones)
  const { data: existing } = await supabase
    .from('membership_applications')
    .select('id')
    .eq('email', session.user.email)
    .eq('is_archived', false) // <-- ADD THIS LINE
    .maybeSingle();

  if (existing) {
    throw new Error('You already have an active application.');
  }
  // 🔍 Find shareholder
  const { data: shareholder, error: shareholderError } = await supabase
    .from('shareholders')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (shareholderError || !shareholder) {
    throw new Error('Shareholder profile not found.');
  }

  const newApplication = {
    user_id: session.user.id,
    shareholder_id: session.user.shareholderId,
    full_name: formData.get('fullName'),
    email: session.user.email,
    phone: cleanPhone, // Saved cleanly without dashes/parentheses
    primary_interest: formData.get('interest'),
    experience_description: formData.get('experience'),
    has_agreed_to_shareholding: formData.get('agreeShareholding') === 'on',
    has_agreed_to_operating_agreement: formData.get('agreeOA') === 'on',
    status: 'applied',
  };

  const { error } = await supabase
    .from('membership_applications')
    .insert([newApplication]);

  if (error) throw new Error(error.message);

  revalidatePath('/membership');
}

////////////////////////////////////////////////////////
// COMPLETE PAYMENT → MOVE TO REVIEW
////////////////////////////////////////////////////////
export async function completeFeePayment(email) {
  const { error } = await supabase
    .from('membership_applications')
    .update({
      status: 'pending_review',
      application_fee_paid: true,
    })
    .eq('email', email);

  if (error) throw new Error(error.message);

  revalidatePath('/membership');
}

////////////////////////////////////////////////////////
// ADMIN: APPROVE
////////////////////////////////////////////////////////
export async function approveMembership(id) {
  const { error } = await supabase
    .from('membership_applications')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/membership');
}

////////////////////////////////////////////////////////
// ADMIN: REJECT
////////////////////////////////////////////////////////
export async function rejectMembership(id) {
  const { error } = await supabase
    .from('membership_applications')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/membership');
}

////////////////////////////////////////////////////////
// ACTIVATE MEMBER (after agreement)
////////////////////////////////////////////////////////
export async function activateMembership(id) {
  const { error } = await supabase
    .from('membership_applications')
    .update({ status: 'active' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/membership');
}

////////////////////////////////////////////////////////
// UPDATE FUNDING
////////////////////////////////////////////////////////
export async function updateShareholding(id, amount) {
  const { data, error } = await supabase
    .from('membership_applications')
    .select('current_shareholding_value')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const newTotal = Number(data.current_shareholding_value) + Number(amount);

  const { error: updateError } = await supabase
    .from('membership_applications')
    .update({
      current_shareholding_value: newTotal,
      status: newTotal >= 2000 ? 'completed' : 'active',
    })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/membership');
}

// ADMIN ACTION
export async function decideMembership(id, decision) {
  const { error } = await supabase
    .from('membership_applications')
    .update({
      status: 'decision_made',
      decision_result: decision, // 'approved' or 'rejected'
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

//////////////////////////////////////////////////////////
// USER ACKNOWLEDGES REJECTION (ARCHIVES RECORD)
/////////////////////////////////////////////////////////
export async function acknowledgeDecision(id) {
  const { error } = await supabase
    .from('membership_applications')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('status', 'rejected'); // Safety check

  if (error) throw new Error(error.message);

  revalidatePath('/membership');
}

/////////////////////////////////////////////////////////////
// SIGN OPERATING AGREEMENT
////////////////////////////////////////////////////////////
export async function signOperatingAgreement(id, signatureName) {
  // 1. Fetch the application to see if a shareholder_id exists
  const { data: application, error: fetchError } = await supabase
    .from('membership_applications')
    .select('shareholder_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const timestamp = new Date().toISOString();

  // 2. Update the membership_applications table with the new name
  const { error: appError } = await supabase
    .from('membership_applications')
    .update({
      full_name: signatureName,
      operating_agreement_signed: true,
      agreement_signed_at: timestamp,
      status: 'active',
    })
    .eq('id', id);

  if (appError) throw new Error(appError.message);

  // 3. If a shareholder profile already exists, update the name and updated_at
  if (application?.shareholder_id) {
    const { error: shareholderError } = await supabase
      .from('shareholders')
      .update({
        fullName: signatureName,
        updated_at: timestamp, // 👈 Explicitly setting the updated_at column
      })
      .eq('id', application.shareholder_id);

    if (shareholderError) throw new Error(shareholderError.message);
  }

  revalidatePath('/membership');
}

///////////////////////////////////////////////////////
//CONTRIBUTING
//////////////////////////////////////////////////////
export async function contributeFunds(id, amount) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('membership_applications')
    .select('current_shareholding_value')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const newTotal = Number(data.current_shareholding_value) + Number(amount);

  const { error: updateError } = await supabase
    .from('membership_applications')
    .update({
      current_shareholding_value: newTotal,
      status: newTotal >= 2000 ? 'completed' : 'active',
    })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/membership');
}

////////////////////////////////////////////////////////////////////////
//CLIENT WITHDRAW INVESTMENTS
////////////////////////////////////////////////////////////////////////

export async function withdrawInvestment(id) {
  if (!id) throw new Error('Invalid investment ID');

  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized');
  }

  // 🔒 Ensure user can only modify THEIR investment
  const { error } = await supabase
    .from('investments')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .eq('shareholder_id', session.user.shareholderId);

  if (error) throw new Error(error.message);

  revalidatePath('/account/investments');
}

/**
 * -------------------------------------------------------------
 * REQUEST REDEMPTION ACTION
 * -------------------------------------------------------------
 * Performs a "transactional" update:
 * 1. Creates the redemption record
 * 2. Updates the investment status to 'withdrawal_pending'
 */
export async function requestRedemption(investmentId, reason) {
  const session = await auth();

  // 1. Auth & Guard
  if (!session?.user?.shareholderId) {
    throw new Error('You must be logged in to request a withdrawal.');
  }

  const shareholderId = session.user.shareholderId;

  // 2. Fetch current investment to get the amount (Security Check)
  // This ensures the user isn't spoofing the amount from the client
  const { data: investment, error: fetchError } = await supabase
    .from('investments')
    .select('amount_invested, status')
    .eq('id', investmentId)
    .eq('shareholder_id', shareholderId)
    .single();

  if (fetchError || !investment) {
    throw new Error('Investment not found or unauthorized.');
  }

  if (investment.status === 'active') {
    throw new Error(
      'Active investments require manual admin override for withdrawal.'
    );
  }

  // 3. Perform the Database Updates
  // We use a single object for the RPC or sequential awaits
  // (In Supabase/PostgREST, we can use an RPC for a true transaction)

  // A. Create Redemption Request
  const { error: insertError } = await supabase
    .from('redemption_requests')
    .insert([
      {
        shareholder_id: shareholderId,
        investment_id: investmentId,
        amount: investment.amount_invested, // Pulling actual value from DB
        reason_code: reason,
        status: 'pending',
      },
    ]);

  if (insertError) {
    console.error('Insert Error:', insertError);
    throw new Error('Failed to create redemption record.');
  }

  // B. Update Parent Investment Status
  const { error: updateError } = await supabase
    .from('investments')
    .update({ status: 'withdrawal_pending' })
    .eq('id', investmentId);

  if (updateError) {
    console.error('Update Error:', updateError);
    throw new Error('Failed to update investment status.');
  }

  // 4. Revalidate & Refresh UI
  revalidatePath('/portfolio');
  return { success: true };
}

////////////////////////////////////////////////////////////
// GET INVESTMENT VALUATIONS
////////////////////////////////////////////////////////////
export async function getInvestmentValuations(investmentId) {
  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient
    .from('investment_valuations')
    .select('valuation_date, current_value')
    .eq('investment_id', investmentId)
    .order('valuation_date', { ascending: true });

  if (error) {
    console.error('Supabase Error:', error.message);
    throw new Error('Valuations could not be loaded');
  }

  return (data || []).map(v => ({ valuation_date: v.valuation_date, value: v.current_value }));
}

////////////////////////////////////////////////////////////
// GET INVESTOR CALENDAR (WITH INVESTMENT NAME)
////////////////////////////////////////////////////////////
export async function getInvestorCalendar(shareholderId) {
  const supabase = createAdminSupabaseClient();

  /**
   * -----------------------------------------------------
   * STEP 1: GET ALL OPPORTUNITIES & SHAREHOLDER INVESTMENTS
   * -----------------------------------------------------
   */
  const { data: allOpps } = await supabase
    .from('opportunities')
    .select('id, name');

  const opportunityNameById = {};
  (allOpps || []).forEach((opp) => {
    opportunityNameById[opp.id] = opp.name;
  });

  let investments = [];
  if (shareholderId) {
    const { data: invData, error: invError } = await supabase
      .from('investments')
      .select(
        `
        id,
        opportunity_id,
        opportunities (
          id,
          name
        )
      `
      )
      .eq('shareholder_id', shareholderId);

    if (!invError && invData) {
      investments = invData;
    }
  }

  /**
   * -----------------------------------------------------
   * BUILD MAPS & MATCHING ARRAYS
   * -----------------------------------------------------
   */
  const investmentIds = investments.map((i) => i.id).filter(Boolean);
  const opportunityIds = investments.map((i) => i.opportunity_id).filter(Boolean);

  const opportunityToInvestmentMap = {};
  const investmentIdToNameMap = {};
  const opportunityNames = [];

  investments.forEach((inv) => {
    const oppName = inv.opportunities?.name;
    if (inv.opportunity_id) {
      opportunityToInvestmentMap[inv.opportunity_id] = inv.id;
    }
    investmentIdToNameMap[inv.id] = oppName || `Investment #${inv.id}`;

    if (oppName) {
      const nameLower = oppName.toLowerCase().trim();
      if (nameLower && !opportunityNames.some((o) => o.nameLower === nameLower)) {
        opportunityNames.push({
          id: inv.opportunity_id,
          invId: inv.id,
          name: oppName,
          nameLower,
        });
      }
    }
  });

  /**
   * -----------------------------------------------------
   * STEP 2: GET CALENDAR LINKS FROM calendar_investments
   * -----------------------------------------------------
   */
  const calIdToInvestmentIdMap = {};

  if (investmentIds.length > 0) {
    const { data: calendarLinks } = await supabase
      .from('calendar_investments')
      .select('calendar_id, investment_id')
      .in('investment_id', investmentIds);

    (calendarLinks || []).forEach((link) => {
      calIdToInvestmentIdMap[link.calendar_id] = link.investment_id;
    });
  }

  /**
   * -----------------------------------------------------
   * STEP 3: FETCH ALL SCHEDULED EVENTS FROM THE calendar TABLE
   * (Matches Admin Calendar Data Stream)
   * -----------------------------------------------------
   */
  const { data: events, error: calError } = await supabase
    .from('calendar')
    .select(
      `
      id,
      title,
      description,
      start_time,
      end_time,
      meet_link,
      session_key,
      source_event_id,
      calendar_events:source_event_id (
        opportunity_id,
        status
      )
    `
    )
    .order('start_time', { ascending: true });

  if (calError) {
    console.error('Error loading calendar events:', calError.message);
    return {};
  }

  /**
   * -----------------------------------------------------
   * STEP 4: COMPREHENSIVE MATCHING & AUTOMATIC JUNCTION PERSISTENCE
   * -----------------------------------------------------
   */
  const eventsByDate = {};
  const linksToPersist = [];

  (events || []).forEach((event) => {
    if (!event.start_time) return;

    const rawEvent = Array.isArray(event.calendar_events)
      ? event.calendar_events[0]
      : event.calendar_events;

    const eventOppId = rawEvent?.opportunity_id;

    let matchedInvId = null;

    // Check 1: Direct link in calendar_investments
    if (calIdToInvestmentIdMap[event.id]) {
      matchedInvId = calIdToInvestmentIdMap[event.id];
    }
    // Check 2: Opportunity ID match (direct column or source_event_id relation)
    else if (eventOppId && opportunityToInvestmentMap[eventOppId]) {
      matchedInvId = opportunityToInvestmentMap[eventOppId];
    }
    // Check 3: Title matching against shareholder's opportunity names (e.g. "Core Portfolio")
    else if (event.title) {
      const titleLower = event.title.toLowerCase();
      const matchedOpp = opportunityNames.find((opp) => titleLower.includes(opp.nameLower));
      if (matchedOpp) {
        matchedInvId = matchedOpp.invId;
      }
    }

    // Auto-queue for database junction mapping if matched to a specific holding
    if (matchedInvId && !calIdToInvestmentIdMap[event.id]) {
      linksToPersist.push({
        calendar_id: event.id,
        investment_id: matchedInvId,
      });
    }

    // Format dateKey using local time (YYYY-MM-DD) to align with calendar grid local date keys
    const d = new Date(event.start_time);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayNum}`;

    const investmentName = matchedInvId
      ? investmentIdToNameMap[matchedInvId]
      : eventOppId && opportunityNameById[eventOppId]
      ? opportunityNameById[eventOppId]
      : event.title || 'Shareholder Briefing';

    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }

    eventsByDate[dateKey].push({
      id: event.id,
      title: event.title || 'Shareholder Event',
      time: d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      meetLink: event.meet_link,
      endTime: event.end_time,
      start_time: event.start_time,
      description: event.description,
      investmentId: matchedInvId || eventOppId || event.id,
      investmentName,
    });
  });

  // Auto-update calendar_investments table asynchronously in Supabase
  if (linksToPersist.length > 0) {
    supabase
      .from('calendar_investments')
      .upsert(linksToPersist, { onConflict: 'calendar_id,investment_id' })
      .then(({ error }) => {
        if (error) console.error('Auto-persist calendar_investments error:', error.message);
      });
  }

  return eventsByDate;
}

////////////////////////////////////////////////////////////
// SUBMIT INVESTMENT REQUEST
////////////////////////////////////////////////////////////

/**
 * -------------------------------------------------------------
 * SUBMIT INVESTMENT REQUEST
 * -------------------------------------------------------------
 * Validates capacity and initiates a Stripe Checkout Session
 */
export async function submitInvestmentRequest({ opportunityId, amount }) {
  try {
    /**
     * 1. AUTH & SESSION CHECK
     */
    const session = await auth();
    const shareholderId = session?.user?.shareholderId;
    const email = session?.user?.email;

    if (!shareholderId || !email) {
      return { ok: false, message: 'Unauthorized. Please log in.' };
    }

    /**
     * 2. VALIDATE AMOUNT
     */
    const value = Number(amount);
    if (!value || value <= 0) {
      return { ok: false, message: 'Invalid investment amount.' };
    }

    /**
     * 3. GET OPPORTUNITY DATA
     */
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select(
        `
        id,
        name,
        minimum_investment,
        total_value
      `
      )
      .eq('id', opportunityId)
      .maybeSingle();

    if (oppError || !opportunity) {
      console.error('Fetch Error:', oppError?.message);
      return { ok: false, message: 'Investment opportunity not found.' };
    }

    /**
     * 4. THRESHOLD VALIDATION
     */
    const min = Number(opportunity.minimum_investment || 0);
    const MAX_LIMIT = 10000;

    if (value < min) {
      return {
        ok: false,
        message: `Minimum investment is $${min.toLocaleString()}`,
      };
    }

    if (value > MAX_LIMIT) {
      return {
        ok: false,
        message: `Maximum investment is $${MAX_LIMIT.toLocaleString()}`,
      };
    }

    /**
     * 5. CAPACITY CHECK (LIVE DATABASE LOOKUP)
     */
    const { data: allInvestments, error: totalError } = await supabase
      .from('investments')
      .select('total_committed, status')
      .eq('opportunity_id', opportunityId)
      .in('status', ['pending', 'active']);

    if (totalError) {
      console.error('Capacity Check Error:', totalError.message);
      return { ok: false, message: 'Could not verify funding capacity.' };
    }

    const committedTotal = (allInvestments || []).reduce(
      (sum, row) => sum + Number(row.total_committed || 0),
      0
    );

    const totalValue = Number(opportunity.total_value || 0);
    const remainingCapacity = totalValue - committedTotal;

    if (value > remainingCapacity) {
      return {
        ok: false,
        message: `Capacity exceeded. Only $${Math.max(remainingCapacity, 0).toLocaleString()} remaining.`,
      };
    }

    /**
     * 5b. CHECK ACTIVE PAYMENT GATEWAY MODE (Stripe vs Zelle/Cash App)
     */
    const { data: settingsData } = await supabase
      .from('settings')
      .select('payment_mode')
      .eq('id', 1)
      .maybeSingle();

    const paymentMode = settingsData?.payment_mode || 'manual';

    if (paymentMode === 'manual') {
      return {
        ok: true,
        mode: 'manual',
        remainingCapacity: remainingCapacity - value,
      };
    }

    /**
     * 6. CALL CHECKOUT SESSION (Local Function) - STRIPE MODE
     */
    const checkoutSession = await createCheckoutSessionForInvestment(
      opportunityId,
      value,
      email,
      shareholderId
    );

    if (!checkoutSession?.url) {
      throw new Error('Stripe failed to return a checkout URL.');
    }

    /**
     * 7. CACHE REVALIDATION
     */
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath('/account/portfolio');
    revalidatePath('/opportunities');

    /**
     * 8. SUCCESS RESPONSE
     */
    return {
      ok: true,
      mode: 'stripe',
      message: 'Redirecting to secure checkout...',
      url: checkoutSession.url, // Client-side uses: window.location.assign(url)
      remainingCapacity: remainingCapacity - value,
    };
  } catch (error) {
    console.error('Investment Submission Error:', error.message);
    return {
      ok: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * GET PAYMENT MODE (stripe vs manual)
 */
export async function getPaymentMode() {
  noStore();
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('payment_mode')
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.payment_mode) {
      return 'manual';
    }
    return data.payment_mode;
  } catch {
    return 'manual';
  }
}

/**
 * SUBMIT MANUAL INVESTMENT NOTICE (Zelle / Cash App)
 */
export async function submitManualInvestmentNotice({
  opportunityId,
  amount,
  paymentMethod = 'zelle_cashapp',
  memoNote = '',
}) {
  try {
    const session = await auth();
    const shareholderId = session?.user?.shareholderId;
    if (!shareholderId) {
      return { ok: false, message: 'Unauthorized. Please log in.' };
    }

    const { data: opp } = await supabase
      .from('opportunities')
      .select('id, name, minimum_investment')
      .eq('id', opportunityId)
      .maybeSingle();

    const oppName = opp?.name || `Opportunity #${opportunityId}`;
    const min = Number(opp?.minimum_investment || 0);
    const MAX_LIMIT = 10000;
    const numAmount = Number(amount);

    if (numAmount < min) {
      return {
        ok: false,
        message: `Minimum investment is $${min.toLocaleString()}`,
      };
    }

    if (numAmount > MAX_LIMIT) {
      return {
        ok: false,
        message: `Maximum investment is $${MAX_LIMIT.toLocaleString()}`,
      };
    }

    const { data: paymentRecord, error: payError } = await supabase
      .from('payments')
      .insert({
        shareholder_id: Number(shareholderId),
        amount: Number(amount),
        currency: 'USD',
        status: 'pending',
        type: 'INVESTMENT',
        payment_method_type: paymentMethod,
        description: `Investment in ${oppName} via ${
          paymentMethod === 'cashapp'
            ? 'Cash App ($Winam)'
            : paymentMethod === 'zelle'
              ? 'Zelle'
              : 'Zelle / Cash App'
        }`,
        opportunity_id: Number(opportunityId),
        metadata: {
          memo: memoNote,
          mode: 'manual',
          opportunity_name: oppName,
          payee: 'Winam Development Group',
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .maybeSingle();

    if (payError) {
      console.warn('Payment notice insert warning:', payError.message);
    }

    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath('/admin/payments');
    revalidatePath('/account/portfolio');

    return {
      ok: true,
      message:
        'Payment notice submitted successfully. Admin will review and verify your transfer.',
      paymentId: paymentRecord?.id || null,
    };
  } catch (err) {
    console.error('submitManualInvestmentNotice error:', err);
    return {
      ok: false,
      message: err.message || 'Failed to submit payment notice.',
    };
  }
}

/**
 * DATABASE LOOKUP: Find the current Core Opportunity record
 */
export async function getCoreOpportunity() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, name, status, minimum_investment') // Added minimum_investment
    .eq('type', 'core')
    .single();

  if (error || !data) {
    console.error('Error fetching core opportunity:', error);
    return null;
  }
  return data;
}

// Add this to your existing actions.js
export async function createCheckoutSessionInvestments(
  opportunityId,
  amount,
  email,
  shareholderId
) {
  try {
    // 1. Fetch the Investment Opportunity details (e.g., Core Portfolio)
    const { data: opportunity, error: dbError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (dbError || !opportunity) {
      throw new Error('Investment opportunity not found.');
    }

    // 2. Create the Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: (opportunity.currency || 'usd').toLowerCase(),
            product_data: {
              name: `Investment: ${opportunity.title}`,
              description: `Shareholding contribution for FLOW-NET.`,
            },
            unit_amount: Math.round(amount * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      // Redirect back to membership page with success state
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/membership?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/membership?canceled=true`,
      metadata: {
        type: 'INVESTMENT',
        opportunity_id: opportunity.id,
        email: email,
        shareholder_id: shareholderId,
      },
    });

    return { url: session.url };
  } catch (err) {
    console.error('Stripe Error:', err.message);
    throw new Error(err.message);
  }
}

/////////////////////////////////////////////////////////////////////
// Generic Payment Process: Works for Core or Branch investments
//////////////////////////////////////////////////////////////////////
export async function createInvestmentSession(opportunityId, amount) {
  // 1. VERIFY SESSION
  const session = await auth();
  if (!session?.user) throw new Error('Authentication required.');

  // 2. VALIDATE MEMBERSHIP & CURRENT PROGRESS
  const { data: membership, error: membershipError } = await supabase
    .from('membership_applications')
    .select('*')
    .eq('email', session.user.email)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error('User is not registered as a member.');
  }

  // 3. FETCH OPPORTUNITY
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, name, type')
    .eq('id', opportunityId)
    .single();

  if (oppError || !opportunity) throw new Error('Opportunity not found.');

  // 4. VALIDATE AMOUNT & CORE LIMITS
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) throw new Error('Invalid amount.');

  const isCore = opportunity.type === 'core';

  // Logic: If it's Core, ensure they haven't already finished Step 6
  if (isCore && membership.status === 'completed') {
    throw new Error('Core shareholding requirement already met.');
  }

  const priceCents = Math.round(numericAmount * 100);

  try {
    // 5. CREATE STRIPE SESSION
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: isCore
                ? `Core Contribution: ${opportunity.name}`
                : opportunity.name,
              description: isCore
                ? `Funding toward your $2,000 minimum shareholding.`
                : `Investment in ${opportunity.name}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      // Redirect back to the membership roadmap so they see Step 6 or 7 update
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/membership?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/membership`,

      metadata: {
        userId: String(session.user.id),
        shareholder_id: String(membership.shareholder_id),
        opportunityId: String(opportunity.id),
        type: isCore ? 'core' : 'branch',
        membershipId: String(membership.id), // Added for easier webhook processing
      },
    });

    return { url: stripeSession.url };
  } catch (err) {
    console.error('Stripe Error:', err);
    throw new Error('Could not initiate payment.');
  }
}

////////////////////////////////////////////////////////////
// GET APPLICATION FEE
////////////////////////////////////////////////////////////
export async function getApplicationFee() {
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .eq('type', 'AF') //Type AF=Application FEE
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error(error.message);
    throw new Error('Fee could not be loaded');
  }

  if (!data) {
    throw new Error('Application fee not configured');
  }

  return data;
}

////////////////////////////////////////////////////////////
// CREATE STRIPE SESSION FOR FEE
////////////////////////////////////////////////////////////

export async function createCheckoutSessionForFee(feeId, email, shareholderId) {
  try {
    // 1. Fetch fee from DB
    const { data: fee, error: dbError } = await supabase
      .from('fees')
      .select('*')
      .eq('id', feeId)
      .single();

    if (dbError || !fee) {
      console.error('Database Error fetching fee:', dbError);
      throw new Error('Could not find the requested fee details.');
    }

    // 2. Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: fee.currency.toLowerCase(),
            product_data: {
              name: fee.name,
              description: fee.description,
            },
            unit_amount: Math.round(fee.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/membership?canceled=true`,
      metadata: {
        type: 'FEE',
        fee_id: fee.id,
        email: email,
        shareholder_id: shareholderId,
        opportunity_id: '999',
      },
    });

    // Return the URL for the client-side redirect
    return { url: session.url };
  } catch (err) {
    // Log the actual error for your server logs
    console.error('Stripe Checkout Error:', err.message);

    // Throw a user-friendly error that the Client Component can catch
    throw new Error(
      err.message || 'An unexpected error occurred during checkout.'
    );
  }
}

//////////////////////////////////////////////////////////////////////////
//CHECK OUT SESSION FOR INVESTMENTS
/////////////////////////////////////////////////////////////////////////

export async function createCheckoutSessionForInvestment(
  opportunityId,
  amount,
  email,
  shareholderId
) {
  try {
    // 1. Fetch investment opportunity details
    const { data: opportunity, error: dbError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (dbError || !opportunity) {
      console.error('Database Error fetching opportunity:', dbError);
      throw new Error('Could not find the requested investment details.');
    }

    // 2. Identify if this is a Core portfolio investment
    const isCore = opportunity.type === 'core';

    // 3. Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd', // Usually standard for investments, or use opportunity.currency
            product_data: {
              name: isCore
                ? `Core Portfolio: ${opportunity.name}`
                : opportunity.name,
              description: isCore
                ? `Contribution toward your $2,000 minimum shareholding.`
                : `Investment in ${opportunity.name}`,
            },
            unit_amount: Math.round(Number(amount) * 100), // Convert decimal to cents
          },
          quantity: 1,
        },
      ],
      // Point back to the membership/roadmap page
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/membership?canceled=true`,

      metadata: {
        type: 'INVESTMENT', // Distinguishes from 'FEE' in record-payment route
        opportunity_id: String(opportunity.id),
        shareholder_id: String(shareholderId),
        email: email,
        is_core: true, // Used to trigger the Step 7 completion logic
      },
    });

    return { url: session.url };
  } catch (err) {
    console.error('Stripe Investment Checkout Error:', err.message);
    throw new Error(
      err.message || 'An unexpected error occurred during investment checkout.'
    );
  }
}

/////////////////////////////////////////////////////////////////////////////////////////
//FETCH INVESTMENT PER SHAREHOLDER
////////////////////////////////////////////////////////////////////////////////////////
export async function getCoreInvestmentProgress(shareholderId) {
  noStore();
  try {
    // 1. Fetch the Core Opportunity (This matches your JSON: ID 9, type 'core')
    const { data: coreOpp, error: oppError } = await supabase
      .from('opportunities')
      .select('id, minimum_investment')
      .eq('type', 'core')
      .single();

    if (oppError || !coreOpp) {
      console.error('Core Opportunity not found:', oppError);
      return null;
    }

    // 2. Fetch the user's specific progress from the investments table
    const { data: investment, error: invError } = await supabase
      .from('investments')
      .select('amount_invested')
      .eq('shareholder_id', shareholderId)
      .eq('opportunity_id', coreOpp.id)
      .maybeSingle();

    // 3. Return the combined object to the FundingStep component
    return {
      id: coreOpp.id, // This will be 9
      goal: Number(coreOpp.minimum_investment), // This will be 2000
      current: Number(investment?.amount_invested || 0),
    };
  } catch (err) {
    console.error('Action Error:', err);
    return null;
  }
}

////////////////////////////////////////////////////////////////////////
// LEDGER STATEMENT
///////////////////////////////////////////////////////////////////////

// app/_lib/actions.js

export async function getInvestorLedger(shareholderId) {
  const session = await auth();

  const email = session?.user?.email;

  if (!shareholderId || !email) {
    return { ok: false, message: 'Unauthorized. Please log in.' };
  }

  const { data, error } = await supabase
    .from('investor_ledger')
    .select('*')
    .eq('shareholder_id', shareholderId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Ledger fetch failed:', error.message);
    throw new Error('Ledger could not be loaded');
  }

  return data;
}

/////////////////////////////////////////////////////////////////
//GET INVESTOR STATEMENT FOR SPECIFIC OPPORTUNITY
////////////////////////////////////////////////////////////////

export async function getInvestorPayments(opportunityId) {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized');
  }

  const shareholderId = session.user.shareholderId;
  const { data, error } = await supabase
    .from('user_ledger_view')
    .select('*')
    .eq('shareholder_id', shareholderId)
    .eq('opportunity_id', opportunityId)
    .eq('status', 'success')
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error('Payments could not be loaded');
  }

  return data;
}

/////////////////////////////////////////////////////////////////
//GET CURRENT INVESTOR INFORMATION
////////////////////////////////////////////////////////////////

export async function getCurrentInvestorInfo() {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('shareholders')
    .select('fullName, email')
    .eq('id', session.user.shareholderId)
    .single();

  if (error) {
    console.error(error.message);
    throw new Error('Investor info could not be loaded');
  }

  return data;
}

////////////////////////////////////////////////////////////////////
//GET COMPANY INFORMATION
///////////////////////////////////////////////////////////////////

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error(error.message);
    throw new Error('Settings could not be loaded');
  }

  return data;
}

// ADMIN EDIT ADDITIONAL PAYMENT (REVISED FOR INVESTMENTS WITH NOTES COLUMN)
export async function additionalPaymentAdmin({
  investmentId,
  difference,
  oldTotal,
  newTotal,
  reason,
}) {
  // 1️⃣ Verify session
  const session = await auth();
  if (!session) throw new Error('Login first to continue.');

  if (!session?.user?.adminId)
    throw new Error('Unauthorized: admin access only.');

  // 2️⃣ Validate difference
  const diffAmount = Number(difference);
  if (isNaN(diffAmount) || diffAmount <= 0)
    throw new Error('Invalid additional payment amount.');

  // 3️⃣ Fetch investment record using shareholder_id
  const { data: investment, error: investmentError } = await supabase
    .from('investments')
    .select('id, amount_invested, status, opportunity_id, shareholder_id')
    .eq('id', investmentId)
    .single();

  if (investmentError || !investment)
    throw new Error('Investment record not found.');

  // 4️⃣ Fetch linked opportunity details
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('name')
    .eq('id', investment.opportunity_id)
    .single();

  const opportunityName = opportunity?.name || 'Unnamed Opportunity';

  // 5️⃣ Transform values to numeric cents
  const priceCents = Math.round(diffAmount * 100);
  const priceDollars = diffAmount;
  if (priceCents <= 0) throw new Error('Invalid payment amount.');

  // 6️⃣ Create Stripe Checkout Session
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Additional Capital Allocation - ${opportunityName}`,
              description: `Investment Pool #${investmentId} (${reason})`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&investmentId=${investmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        type: 'additional_payment_investment_admin',
        investment_id: String(investmentId),
        shareholder_id: String(investment.shareholder_id),
        opportunity_id: String(investment.opportunity_id),
        opportunity_name: opportunityName,
        reason: String(reason),
        difference: String(priceDollars),
        old_total_principal: String(oldTotal ?? 0),
        new_total_principal: String(newTotal ?? oldTotal + priceDollars),
        admin_id: String(session.user.adminId),
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  } catch (err) {
    console.error('❌ Stripe additional payment ADMIN failed:', err);
    throw new Error('Stripe session creation failed.');
  }

  // 7️⃣ Update the INVESTMENTS row (NOW INCLUDING NOTES COLUMN)
  try {
    const updateData = {
      amount_invested: Number(newTotal),
      notes: reason, // RESTORED: Successfully logs reason to your new database column
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', investmentId);

    if (updateError) {
      console.error('❌ Failed to update investment entity:', updateError);
      throw new Error('Investment ledger record update failed.');
    }
  } catch (err) {
    console.error('❌ Admin investment adjustment validation error:', err);
    throw new Error('Investment record update failed.');
  }

  // 8️⃣ Insert pending payment tracking entry
  try {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('investment_id', investmentId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existing) {
      await supabase.from('payments').insert({
        shareholder_id: investment.shareholder_id,
        investment_id: investmentId,
        stripe_session_id: stripeSession.id,
        stripe_event: 'checkout.session.created (admin capital override)',
        status: 'pending',
        amount: priceDollars,
        currency: 'usd',
        type: 'additional_capital_admin',
        description: `Admin allocation increase for Investment #${investmentId} (${reason})`,
        metadata: {
          investmentId,
          opportunityName,
          opportunity_id: investment.opportunity_id,
          shareholder_id: investment.shareholder_id,
          reason,
          adminOverride: true,
          adminId: session.user.adminId,
        },
      });
    }
  } catch (err) {
    console.error(
      '⚠️ Failed to append pending entry to payment history table:',
      err
    );
  }

  return { url: stripeSession.url, id: stripeSession.id };
}

//===================================================
// REQUEST REDEMPTION ADMIN (SYNCHRONIZED WITH CUSTOM SCHEMAS)
//===================================================
export async function requestRedemptionAdmin({
  investmentId,
  redemptionAmount,
  reason,
  newTotal,
}) {
  // 1️⃣ Verify admin session
  const session = await auth();
  if (!session) throw new Error('Login first to request redemption.');

  if (!session?.user?.adminId)
    throw new Error('Unauthorized: Admin access required.');

  const adminId = session.user.adminId;

  // 2️⃣ Fetch existing investment record to track metrics
  const { data: investmentData, error: investmentError } = await supabase
    .from('investments')
    .select('id, amount_invested, shareholder_id, opportunity_id, status')
    .eq('id', investmentId)
    .single();

  if (investmentError || !investmentData)
    throw new Error('Investment record not found.');

  const oldTotal = Number(investmentData.amount_invested || 0);
  const shareholderId = investmentData.shareholder_id;

  // 3️⃣ Normalize numerical data inputs
  const safeRedemptionAmount = Number(redemptionAmount || 0);
  const safeNewTotal = Number(newTotal ?? oldTotal);

  // 4️⃣ Insert into public.redemption_requests
  const { data: redemptionData, error: redemptionError } = await supabase
    .from('redemption_requests')
    .insert({
      investment_id: investmentId,
      shareholder_id: shareholderId,
      amount: safeRedemptionAmount, // numeric(19, 4)
      currency: 'USD',
      status: 'pending', // matching your redemption_status enum default
      admin_notes: reason || null, // saved into your custom text field
      reason_code: 'ADMIN_MANUAL_ADJ', // clean tracking flag for accountability
      page_code: 'REDEMPTION_MGMT',
      action_code: 'REQ_PROCESS',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (redemptionError) {
    console.error('❌ Redemption Table Insert Error:', redemptionError);
    throw new Error('Redemption request could not be submitted.');
  }

  // 5️⃣ Insert structural audit entry into public.investment_changes
  const { error: changeLogError } = await supabase
    .from('investment_changes')
    .insert({
      investment_id: investmentId,
      admin_id: adminId, // UUID parameter checked
      change_type:
        safeNewTotal === 0
          ? 'investment_exited_admin'
          : 'redemption_requested_admin',

      // JSONB snapshot format matching your structural constraints
      field_changed: {
        principal_allocation: {
          old: oldTotal,
          new: safeNewTotal,
        },
      },
      amount_difference: -Math.abs(safeRedemptionAmount), // tracking negative drop delta
    });

  if (changeLogError) {
    console.error('⚠️ Audit Ledger Entry Error:', changeLogError);
    // Non-blocking: code keeps running so the transaction state doesn't lock up if the log alone drops
  }

  // 6️⃣ Determine if this marks a total exit from the asset pool
  const shouldExit = safeNewTotal === 0;
  const adjustedStatus = shouldExit ? 'exited' : investmentData.status;

  // 7️⃣ Update main investment table record
  const { error: investmentUpdateError } = await supabase
    .from('investments')
    .update({
      amount_invested: safeNewTotal,
      notes: reason || null,
      status: adjustedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', investmentId);

  if (investmentUpdateError) {
    console.error('❌ Investment Table Update Error:', investmentUpdateError);
    throw new Error('Investment record update failed.');
  }

  // 8️⃣ Revalidate asset administration cache paths
  revalidatePath(`/admin/investments/${investmentId}`);
  revalidatePath(`/admin/investments`);

  return {
    success: true,
    redemptionId: redemptionData?.id,
    redirectUrl: '/admin/investments',
    message: shouldExit
      ? 'Asset allocation fully exited and admin redemption request registered.'
      : 'Admin redemption request submitted successfully.',
  };
}

//===================================================
// REQUEST PAYMENT LEDGER FOR INVESTOR
//===================================================

export async function getLedgerStatements(opportunityId) {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    console.warn('getLedgerStatements: Unauthorized or missing shareholderId.');
    return [];
  }

  const shareholderId = Number(session.user.shareholderId);
  const oppId = Number(opportunityId);
  const adminClient = createAdminSupabaseClient();

  try {
    // 1. Fetch payments directly to include all statuses (succeeded, failed, pending)
    const { data: payments, error: payError } = await adminClient
      .from('payments')
      .select('*')
      .eq('shareholder_id', shareholderId)
      .eq('opportunity_id', oppId)
      .order('created_at', { ascending: false });

    if (!payError && payments && payments.length > 0) {
      return payments.map((p) => {
        const meta = p.metadata || {};
        const method = (p.payment_method_type || meta.mode || 'manual').toUpperCase();
        const reason =
          meta.failure_reason ||
          meta.admin_reconciliation_note ||
          (p.status === 'failed' ? 'Payment could not be reconciled by administrator' : null);

        return {
          transaction_id: String(p.id),
          transaction_date: p.created_at,
          line_item_name:
            p.description ||
            (p.type === 'FEE'
              ? 'Membership Application Fee'
              : 'Investment in Opportunity #' + p.opportunity_id),
          ledger_category: method,
          amount: Number(p.amount || 0),
          currency: p.currency || 'USD',
          status: (p.status || 'pending').toLowerCase(),
          receipt_url: p.receipt_url,
          failure_reason: reason,
          metadata: meta,
        };
      });
    }

    // 2. Fallback to user_ledger_view if payments query returned no rows
    const { data: viewData, error: viewError } = await supabase
      .from('user_ledger_view')
      .select('*')
      .eq('opportunity_id', oppId)
      .eq('shareholder_id', shareholderId)
      .order('transaction_date', { ascending: false });

    if (!viewError && viewData) {
      return viewData;
    }

    return [];
  } catch (err) {
    console.error('Error fetching statements:', err.message);
    return [];
  }
}
export async function createOpportunityValuation(prevState, formData) {
  const session = await auth();
  if (!session?.user?.adminId) return { error: true, message: 'Unauthorized' };
  const opportunityId = formData.get('opportunityId');
  const totalAssetValue = formData.get('totalAssetValue');
  const valuationDate = formData.get('valuationDate') || new Date().toISOString().split('T')[0];
  if (!opportunityId || !totalAssetValue) return { error: true, message: 'Required fields missing' };
  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient.from('opportunity_valuations').insert({
    opportunity_id: Number(opportunityId),
    total_asset_value: Number(totalAssetValue),
    valuation_date: valuationDate,
    created_by_admin_id: session.user.adminId
  });
  if (error) return { error: true, message: error.message };
  revalidatePath('/admin/finance-reports/valuations');
  return { success: true, message: 'Valuation saved!' };
}

/**
 * Fetch complete shareholder transaction ledger (investments, subscriptions, fees, and dividend payouts)
 */
export async function getShareholderTransactionsLedgerAction() {
  const session = await auth();

  if (!session?.user?.shareholderId) {
    console.warn('getShareholderTransactionsLedgerAction: Unauthorized or missing shareholderId.');
    return [];
  }

  const shareholderId = Number(session.user.shareholderId);
  const adminClient = createAdminSupabaseClient();

  try {
    const { data: payments, error: payError } = await adminClient
      .from('payments')
      .select(`
        *,
        opportunities (
          id,
          name,
          type
        )
      `)
      .eq('shareholder_id', shareholderId)
      .order('created_at', { ascending: false });

    if (payError) {
      console.error('getShareholderTransactionsLedgerAction error:', payError);
      return [];
    }

    return (payments || []).map((p) => {
      const meta = p.metadata || {};
      const method = (p.payment_method_type || meta.mode || meta.payment_method || 'manual').toUpperCase();
      const isDividend = p.type === 'dividend' || p.type === 'dividend_payout' || meta.is_dividend === true;
      const isFee = p.type === 'fee' || p.type === 'FEE';

      let lineItem = p.description;
      if (!lineItem) {
        if (isDividend) {
          lineItem = `Dividend Payout - ${p.opportunities?.name || `Opportunity #${p.opportunity_id}`}`;
        } else if (isFee) {
          lineItem = 'Membership Application Fee';
        } else {
          lineItem = `Investment in ${p.opportunities?.name || `Opportunity #${p.opportunity_id}`}`;
        }
      }

      return {
        transaction_id: String(p.id),
        transaction_date: p.created_at,
        line_item_name: lineItem,
        opportunity_name: p.opportunities?.name || 'General Portfolio',
        opportunity_type: p.opportunities?.type || 'Equity',
        type: isDividend ? 'dividend' : isFee ? 'fee' : 'investment',
        is_dividend: isDividend,
        ledger_category: method,
        amount: Number(p.amount || 0),
        currency: p.currency || 'USD',
        status: (p.status || 'pending').toLowerCase(),
        receipt_url: p.receipt_url,
        reference: meta.reference || p.stripe_payment_intent_id || '—',
        payout_details: isDividend ? {
          account_name: meta.account_name,
          account_number: meta.account_number,
          account_handle: meta.account_handle,
          payout_rail: meta.payout_rail || method,
        } : null,
        metadata: meta,
      };
    });
  } catch (err) {
    console.error('getShareholderTransactionsLedgerAction exception:', err);
    return [];
  }
}

