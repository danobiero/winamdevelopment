import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { eachDayOfInterval } from 'date-fns';
import { supabase } from './supabase';

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

/////////////
// GET ADMIN
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

export async function getLessons() {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase

    .from('lessons')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching lessons:', error);
    throw new Error('lessons could not be loaded');
  }

  return data;
}

import { createSupabaseBuildClient } from './supabase-build';
import { da } from 'date-fns/locale';

// build-time use (generateStaticParams, etc.)
export async function getLessonsBuild() {
  const supabase = createSupabaseBuildClient();

  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, name, maxCapacity, regularPrice, discount, image, curriculum, category'
    )
    .order('name');

  if (error) {
    throw new Error('Lessons could not be loaded');
  }

  return data ?? [];
}

// Students are uniquely identified by their email address
export async function getStudent(email) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('⚠️ getStudent error:', error);
    throw error; // let signIn handle it
  }
  // No error here! We handle the possibility of no Student in the sign in callback
  return data;
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

export async function getBookings_bad(studentId) {
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
        name,
        image,
        category
      ),
      refunds (
        id,
        created_at,
        booking_id,
        refund_amount,
        reason,                 -- original request reason
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

export async function getBookings_working(studentId) {
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
        name,
        image,
        category
      ),
      refunds (
        id,
        created_at,
        booking_id,
        refund_amount,
        reason,
        status
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

// bookings.js
/**
 * Fetch fully booked dates for a lesson based on lesson.maxCapacity.
 * Returns an array of Date objects suitable for react-day-picker.
 */
export async function getBookedDatesByLessonId(lessonId, maxCapacity) {
  // Today in UTC
  let today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayUTC = today.toISOString(); // UTC string for Supabase query

  // Fetch all future/current bookings for this lesson
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('lessonId', lessonId)
    .gte('endDate', todayUTC); // Only bookings ending today or later

  if (error) {
    console.error(error);
    throw new Error('Bookings could not be loaded');
  }

  // Map each booking to individual dates with student count
  const dateStudentMap = {};

  bookings.forEach((booking) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);

    const dates = eachDayOfInterval({ start, end });

    dates.forEach((date) => {
      // Convert each date to UTC midnight for consistent comparison
      const utcDate = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      );
      const key = utcDate.toISOString(); // string key
      dateStudentMap[key] = (dateStudentMap[key] || 0) + booking.numStudents;
    });
  });

  // Return dates that reached maxCapacity
  const bookedDates = Object.entries(dateStudentMap)
    .filter(([_, studentCount]) => studentCount >= maxCapacity)
    .map(([dateStr]) => new Date(dateStr)); // back to Date object for calendar

  return bookedDates;
}

export async function getBookedCountsByLessonId(lessonId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayUTC = today.toISOString();

  // Fetch bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('startDate, endDate, numStudents')
    .eq('lessonId', lessonId)
    .gte('endDate', todayUTC);

  if (error) {
    console.error('Error fetching the number of bookings', error.message);
    throw new Error('Bookings could not be loaded');
  }

  // Aggregate by startDate
  const countsByStartDate = {};

  for (const b of bookings || []) {
    if (!b.startDate) continue;

    const dateKey = new Date(b.startDate).toISOString().split('T')[0];
    const num = Number(b.numStudents) || 0;
    countsByStartDate[dateKey] = (countsByStartDate[dateKey] || 0) + num;
  }

  return countsByStartDate;
}

export async function getBookedCountByLessonIdEdit(lessonId, excludeBookingId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayUTC = today.toISOString();

  // Build query
  let query = supabase
    .from('bookings')
    .select('id, startDate, numStudents')
    .eq('lessonId', lessonId)
    .gte('endDate', todayUTC);

  // Exclude the current booking being edited
  if (excludeBookingId) query = query.neq('id', excludeBookingId);

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Error loading booked counts:', error);
    throw new Error('Bookings could not be loaded');
  }

  // Aggregate number of booked students by startDate (YYYY-MM-DD)
  const countsByStartDate = {};
  bookings.forEach((b) => {
    if (!b.startDate) return;
    const dateKey = new Date(b.startDate).toISOString().split('T')[0];
    countsByStartDate[dateKey] =
      (countsByStartDate[dateKey] || 0) + (b.numStudents ?? 0);
  });

  return countsByStartDate;
}

/**
 * Returns remaining spots for a given lesson on a given startDate,
 * optionally excluding a bookingId (for editing)
 */
// ✅ Works correctly for timestampz columns
// app/_lib/data-service.js
// app/_lib/data-service.js
export async function getBookedCountForEdit(lessonId, startDate) {
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

//=================================================
// CREATE  STUDENT
//=================================================

export async function createStudent(newStudent) {
  const { data, error } = await supabase
    .from('students')
    .insert([newStudent])
    .select()
    .maybeSingle(); // return exactly 1 row
  if (error) {
    console.error('❌ Error creating student:', JSON.stringify(error, null, 2));
    throw new Error('Student could not be created');
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
