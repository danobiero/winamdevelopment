'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

//------------------------------------------------------
//GET BOOKING BY ID FOR BOOKING VIEW
//-----------------------------------------------------
export async function getBookingById(id) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      lessons(*),
      students(*),
      refunds(*)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const activeRefund =
    data.refunds?.find((r) => {
      const status = r.status?.toLowerCase().trim();
      return status && status !== 'completed';
    }) ?? null;

  return {
    ...data,
    activeRefund, // 👈 derived, reliable
    hasActiveRefund: Boolean(activeRefund),
  };
}


//DELETE BOOKING ACTION
export async function deleteBookingAction(formData) {
  const bookingId = Number(formData.get('bookingId'));

  const session = await auth();
  if (!session?.user?.adminId) {
    return {
      success: false,
      reason: 'UNAUTHORIZED',
      message: 'You are not authorized to perform this action.',
    };
  }

  const supabase = createAdminSupabaseClient();

  // 1️⃣ Verify booking exists + cancelled
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('cancelled')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchError || !booking) {
    return {
      success: false,
      reason: 'NOT_FOUND',
      message: 'Booking not found.',
    };
  }

  if (!booking.cancelled) {
    return {
      success: false,
      reason: 'NOT_CANCELLED',
      message: 'Only cancelled bookings can be deleted.',
    };
  }

  // 2️⃣ Attempt delete (FK-safe)
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (deleteError) {
    // FK constraint (refunds exist)
    if (deleteError.code === '23503') {
      return {
        success: false,
        reason: 'HAS_REFUNDS',
        message:
          'This booking cannot be deleted because it has an associated refund.',
      };
    }

    return {
      success: false,
      reason: 'DELETE_FAILED',
      message: 'Unable to delete booking. Please try again.',
    };
  }

  // 3️⃣ Success
  return {
    success: true,
    bookingId,
  };
}


//CHECK IF BOOKING HAS A REFUND
export async function bookingHasRefund(bookingId) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('refunds')
    .select('id', { count: 'exact' })
    .eq('booking_id', bookingId);

  if (error) throw new Error(error.message);

  return data.length > 0;
}

//-------------------------------------------------------
//GET ALL BOOKINGS
//----------------------------------------------------------
export async function getBookings({ from, to }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      lessons(*),
      students(*),
      refunds(id, status)
    `
    )
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}



//CHECK BOOKINGS REFUND STATUS
export async function checkBookingRefundStatus(bookingId) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('refunds')
    .select('id')
    .eq('booking_id', bookingId)
    .limit(1);

  if (error) {
    throw new Error('Failed to check refund status');
  }

  return {
    hasRefund: data.length > 0,
    refundId: data[0]?.id ?? null,
  };
}




//UPDATE BOOKING FORM ACTION
export async function adminUpdateBooking({
  bookingId,
  numStudents,
  totalPrice,
  observations,
}) {
  // 1️⃣ Verify admin session
  const session = await auth();
  if (!session) throw new Error('Login first to update booking');
  if (!session?.user?.adminId)
    throw new Error('Unauthorized: admin access only.');

  const adminId = session.user.adminId;
  const supabase = createAdminSupabaseClient();

  // 2️⃣ Fetch current booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, numStudents, totalPrice, observations')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) throw new Error('Booking not found');

  // 3️⃣ Detect which fields actually changed
  const updatedFields = {};

  if (numStudents !== undefined && numStudents !== booking.numStudents)
    updatedFields.numStudents = numStudents;

  if (totalPrice !== undefined && totalPrice !== booking.totalPrice)
    updatedFields.totalPrice = totalPrice;

  if (observations !== undefined && observations !== booking.observations)
    updatedFields.observations = observations;

  if (Object.keys(updatedFields).length === 0)
    return { message: 'No changes detected' };

  // 4️⃣ Update booking record
  const { data: updatedBooking, error: updateError } = await supabase
    .from('bookings')
    .update({
      ...updatedFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) throw new Error('Booking could not be updated');

  // 5️⃣ Log change into booking_changes (admin override)
  const changedFields = {};

  if (updatedFields.numStudents !== undefined) {
    changedFields.numStudents = {
      old: booking.numStudents,
      new: numStudents,
    };
  }

  if (updatedFields.totalPrice !== undefined) {
    changedFields.totalPrice = {
      old: booking.totalPrice,
      new: totalPrice,
    };
  }

  if (updatedFields.observations !== undefined) {
    changedFields.observations = {
      old: booking.observations,
      new: observations,
    };
  }

  await supabase.from('booking_changes').insert({
    booking_id: bookingId,
    student_id: 1, // 🔥 Admin override
    admin_id: adminId,
    admin_override: true,
    change_type: 'admin_edit_booking',
    field_changed: changedFields,
    old_total_price: booking.totalPrice,
    new_total_price: totalPrice ?? booking.totalPrice,
    amount_difference:
      totalPrice !== undefined
        ? Number(totalPrice) - Number(booking.totalPrice)
        : 0,
    stripe_session_id: null,
  });

  // 6️⃣ Revalidate admin booking pages
  revalidatePath(`/admin/bookings`);
  revalidatePath(`/admin/bookings/${bookingId}`);

  return {
    success: true,
    booking: updatedBooking,
    message: 'Booking updated successfully.',
  };
}


//EDIT FORM ACTIONS
export async function getLesson(id) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Returns remaining spots for a given lesson on a given startDate,
 * optionally excluding a bookingId (for editing)
 */
// ✅ Works correctly for timestampz columns
// app/_lib/data-service.js
// app/_lib/data-service.js
export async function getBookedCountForEdit(lessonId, startDate) {
   const supabase = createAdminSupabaseClient();
  if (!lessonId || !startDate) throw new Error('Missing required parameters');

  // --- Extract only the YYYY-MM-DD part for comparison ---
  const dateKey = new Date(startDate).toISOString().split('T')[0];

  // --- Fetch all non-cancelled bookings for this lesson ---
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, numStudents, startDate, cancelled')
    .eq('lessonId', lessonId)
    .eq('cancelled', false);

  if (error) {
    console.error('❌ Error fetching bookings:', error.message);
    throw new Error('Could not load bookings for this lesson/date.');
  }

  // --- Filter locally by date (ignore time component) ---
  const sameDateBookings = bookings.filter((b) => {
    if (!b.startDate) return false;
    const bDate = new Date(b.startDate).toISOString().split('T')[0];
    return bDate === dateKey;
  });

  // --- Calculate total booked students for that date ---
  const totalBookedForDate = sameDateBookings.reduce(
    (sum, b) => sum + (b.numStudents ?? 0),
    0
  );

  // --- Fetch lesson capacity ---
  const { data: lessonData, error: lessonError } = await supabase
    .from('lessons')
    .select('maxCapacity')
    .eq('id', lessonId)
    .single();

  if (lessonError) {
    console.error('❌ Error fetching lesson capacity:', lessonError.message);
    throw new Error('Could not load lesson capacity.');
  }

  const capacity = lessonData?.maxCapacity ?? 0;
  const remainingSpots = Math.max(capacity - totalBookedForDate, 0);

  return { totalBookedForDate, capacity, remainingSpots };
}


//-------------------------------------------------------------------
//ADMIN CANCEL BOOKING
//------------------------------------------------------------------
export async function cancelBookingAdmin(formData) {
  // 1️⃣ AUTH
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized: Admin access required');
  }

  const supabase = createAdminSupabaseClient();
  const adminId = session.user.adminId;

  // 2️⃣ EXTRACT INPUTS (THIS WAS MISSING)
  const bookingId = Number(formData.get('bookingId'));
  const reason = formData.get('reason') || 'Cancelled by admin';

  if (!bookingId) {
    throw new Error('Invalid booking id');
  }

  // 3️⃣ LOAD BOOKING (AUTHORITATIVE)
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, studentId, cancelled')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    throw new Error('Booking not found');
  }

  if (booking.cancelled) {
    throw new Error('Booking already cancelled');
  }

  // 4️⃣ COMPUTE REFUNDABLE BALANCE FROM LEDGER
  const { data: refundableBalance, error: balErr } = await supabase.rpc(
    'get_booking_balance',
    {
      p_booking_id: bookingId,
    }
  );

  if (balErr) {
    throw new Error('Failed to compute booking balance');
  }

  // 5️⃣ CANCEL BOOKING (STATE CHANGE FIRST)
  const { error: cancelErr } = await supabase
    .from('bookings')
    .update({
      cancelled: true,
      observations: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('cancelled', false); // idempotent

  if (cancelErr) {
    throw new Error('Failed to cancel booking');
  }

  // 6️⃣ CREATE REFUND REQUEST IF MONEY EXISTS
  let refundId = null;

  if (refundableBalance > 0) {
    const { data: refund, error: refundErr } = await supabase
      .from('refunds')
      .insert({
        booking_id: bookingId,
        student_id: booking.studentId,
        refund_amount: refundableBalance,
        reason,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (refundErr) {
      throw new Error('Refund request creation failed');
    }

    refundId = refund.id;
  }

  // 7️⃣ AUDIT LOG (OPTIONAL BUT GOOD)
  await supabase.from('booking_changes').insert({
    booking_id: bookingId,
    student_id: booking.studentId,
    change_type: 'booking_cancelled_admin',
    admin_id: adminId,
    admin_override: true,
    notes: reason,
    created_at: new Date().toISOString(),
  });

  // 8️⃣ REVALIDATE UI
  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings?view=${bookingId}`);

  return {
    success: true,
    bookingId,
    refundId,
    message:
      refundableBalance > 0
        ? 'Booking cancelled and refund request created.'
        : 'Booking cancelled (no refundable balance).',
  };
}



//-------------------------------------------------------
//GET BOOKING LEDGER
//--------------------------------------------------------

export async function getBookingLedger(bookingId) {
  try {
    const session = await auth();
    if (!session?.user?.adminId) throw new Error('Unauthorized');

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase.rpc('get_booking_ledger', {
      p_booking_id: bookingId,
    });

    if (error) {
      console.error('Ledger RPC error:', error);
      throw new Error('Failed to load booking ledger');
    }

    return data ?? [];
  } catch (err) {
    console.error('getBookingLedger failed:', err);
    throw err;
  }
}
