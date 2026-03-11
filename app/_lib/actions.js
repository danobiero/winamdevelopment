'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from './auth';
import { supabase } from './supabase';
import Stripe from 'stripe';
import { createAdminSupabaseClient } from './supabase-admin';

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

export async function updateProfile(formData) {
  const session = await auth();
  if (!session) throw new Error('Login First to Update Profile');
  const nationalID = formData.get('nationality');
  const [nationality, countryFlag] = formData.get('nationality').split('%');
  const fullName = formData.get('fullName');
  const telephone = formData.get('telephone');
  const regex = /^[0-9]{9,12}$/;

  if (!regex.test(telephone)) throw new Error('Invalid Telephone Number');
  const updateData = { nationality, telephone, countryFlag, fullName };

  const { data, error } = await supabase
    .from('students')
    .update(updateData)
    .eq('id', session.user.studentId);

  if (error) {
    throw new Error('Student could not be updated');
  }

  revalidatePath('/account/profile');
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

//ADMIN EDIT ADDITIONAL PAYMENT
//ADMIN EDIT ADDITIONAL PAYMENT
export async function additionalPaymentAdmin({
  bookingId,
  difference,
  oldTotal,
  newTotal,
  newStudents,
  reason,
}) {
  // 1️⃣ Verify session
  const session = await auth();
  if (!session) throw new Error('Login first to continue.');

  if (!session?.user?.adminId)
    throw new Error('Unauthorized: admin access only.');

  const forcedStudentId = 1;

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

  // 5️⃣ Difference → cents
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
              name: `Admin Additional Payment - ${lessonName}`,
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
        type: 'additional_payment_admin',
        booking_id: String(bookingId),
        student_id: String(forcedStudentId),
        lesson_id: String(booking.lessonId),
        lesson_name: lessonName,
        reason: String(reason),
        num_Students: String(newStudents),
        difference: String(priceDollars),
        old_total_price: String(oldTotal ?? 0),
        new_total_price: String(newTotal ?? oldTotal + priceDollars),
        admin_id: String(session.user.adminId),
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  } catch (err) {
    console.error('❌ Stripe additional payment ADMIN failed:', err);
    throw new Error('Stripe session creation failed.');
  }

  // 7️⃣ Update BOOKING (numStudents, totalPrice, observations)
  try {
    const updateData = {
      numStudents: Number(newStudents),
      totalPrice: Number(newTotal),
      observations: reason,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Failed to update booking:', updateError);
      throw new Error('Booking update failed.');
    }
  } catch (err) {
    console.error('❌ Admin booking update error:', err);
    throw new Error('Booking update failed.');
  }

  // 8️⃣ Insert pending payment record
  try {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existing) {
      await supabase.from('payments').insert({
        student_id: forcedStudentId,
        booking_id: bookingId,
        stripe_session_id: stripeSession.id,
        stripe_event: 'checkout.session.created (admin override)',
        status: 'pending',
        amount: priceDollars,
        currency: 'usd',
        type: 'additional_admin',
        description: `Admin additional payment for Booking #${bookingId} (${reason})`,
        metadata: {
          bookingId,
          lessonName,
          lessonId: booking.lessonId,
          studentId: forcedStudentId,
          reason,
          adminOverride: true,
          adminId: session.user.adminId,
        },
      });
    }
  } catch (err) {
    console.error('⚠️ Failed to insert ADMIN additional payment:', err);
  }

  // 9️⃣ Return checkout link
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
    redirectTo: '/account',
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
//STUDEND TICKETING SYSTEM
//==============================================

export async function createSupportTicket(formData) {
  const session = await auth();
  
  if (!session) throw new Error('You must be logged in');

  const ticketData = {
    subject: formData.get('subject'),
    priority: formData.get('priority'),
    message: formData.get('message'),
    // Mapping session data to your SQL columns
    student_id: session.user.studentId, 
    name: session.user.name,
    email: session.user.email,
    status: 'open',
    source: 'portal',
  };

  const { error } = await supabase
    .from('support')
    .insert([ticketData]);

  if (error) throw new Error(error.message);

  revalidatePath('/account/support');
  redirect('/account/support');
}