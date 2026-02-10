'use server';

import { createServerSupabaseClient } from '@/app/_lib/supabase-server';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { auth } from '@/app/_lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getLessons() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('lessons').select('*');
  if (error) throw new Error(error.message);
  return data;
}

export async function createLesson(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createServerSupabaseClient();

  const newLesson = {
    name: formData.get('name'),
    maxCapacity: Number(formData.get('maxCapacity')),
    regularPrice: Number(formData.get('regularPrice')),
    discount: Number(formData.get('discount')),
    description: formData.get('description'),
    image: formData.get('image'),
    category: Number(formData.get('category')),
  };

  const { data, error } = await supabase
    .from('lessons')
    .insert([newLesson])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // ⬅️ THIS IS THE PART THAT TRIGGERS THE TOAST
  redirect(`/admin/lessons?created=${data.id}`);
}

//GET LESSON BY LESSON ID
// GET LESSON WITH MATERIALS BY LESSON ID
export async function getLessonById(id) {
  const supabase = createServerSupabaseClient();
  const numericId = Number(id);

  // 1️⃣ Fetch lesson
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', numericId)
    .maybeSingle();

  if (lessonErr) throw new Error(lessonErr.message);
  if (!lesson) return null;

  // 2️⃣ Fetch materials
  const { data: materials, error: materialErr } = await supabase
    .from('lesson_materials')
    .select('*')
    .eq('lesson_id', numericId)
    .order('created_at', { ascending: false });

  if (materialErr) throw new Error(materialErr.message);

  // 3️⃣ Return both
  return {
    lesson,
    materials: materials || [],
  };
}

export async function updateLesson(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  // ✅ FIX — Define email before using it
  const email = session.user.email;

  const supabase = createAdminSupabaseClient();

  const id = Number(formData.get('id')); // Extract ID from form

  const updated = {
    name: formData.get('name'),
    maxCapacity: Number(formData.get('maxCapacity')),
    regularPrice: Number(formData.get('regularPrice')),
    discount: Number(formData.get('discount')),
    description: formData.get('description'),
    image: formData.get('image'),
    curriculum: formData.get('curriculum'),
    category: Number(formData.get('category')),
  };

  const { data, error } = await supabase
    .from('lessons')
    .update(updated)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  return { success: true };
}

//---------------------------------------------------------
//DELETE LESSON
//-----------------------------------------------------------

export async function deleteLessonAction(lessonId) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  // 1️⃣ CHECK BOOKINGS FIRST
  // We do this to catch the most likely conflict before it hits the DB
  const { hasBookings } = await checkLessonHasBookings(lessonId);

  if (hasBookings) {
    throw new Error(
      'This lesson has active bookings. Please cancel or complete all bookings before deleting the lesson.'
    );
  }

  // 2️⃣ SAFE TO DELETE
  const supabase = createAdminSupabaseClient();

  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    // If Supabase returns an error object, handle it specifically
    if (error) {
      if (error.code === '23503') {
        // PostgreSQL code for foreign key violation
        throw new Error(
          'This lesson is linked to other records and cannot be deleted right now.'
        );
      }
      throw new Error('Could not delete the lesson. Please try again later.');
    }
  } catch (err) {
    // This catches both the throw above and any unexpected network/server errors
    throw new Error(
      err.message ||
        'An unexpected error occurred while trying to delete the lesson.'
    );
  }

  // 3️⃣ REDIRECT ON SUCCESS
  redirect(`/admin/lessons?deleted=${lessonId}`);
}
export async function deleteLessonAction_old(lessonId) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  // 1️⃣ CHECK BOOKINGS FIRST
  const { hasBookings } = await checkLessonHasBookings(lessonId);

  if (hasBookings) {
    throw new Error('This lesson has active bookings and cannot be deleted.');
  }

  // 2️⃣ SAFE TO DELETE
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);

  if (error) throw new Error(error.message);

  redirect(`/admin/lessons?deleted=${lessonId}`);
}

// Check if a lesson has active bookings
export async function checkLessonHasBookings(lessonId) {
  const supabase = createAdminSupabaseClient(); // or anon client if you use RLS

  const { data, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact' })
    .eq('lessonId', lessonId)
    .eq('cancelled', false); // adjust based on your schema

  if (error) throw new Error(error.message);

  return {
    hasBookings: data.length > 0,
    count: data.length,
  };
}

//UPLOAD MATERIALS FOR A LESSON

export async function uploadLessonMaterial(formData) {
  try {
    const supabase = createAdminSupabaseClient();

    const lessonId = formData.get('lessonId');
    const file = formData.get('file');

    if (!lessonId || !file) return { error: 'Missing lesson or file.' };

    const cleanName = file.name.replace(/\s+/g, '_');

    // STEP 1 — CHECK FOR DUPLICATE IN DATABASE
    const { data: existing } = await supabase
      .from('lesson_materials')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('name', cleanName)
      .maybeSingle();

    if (existing) {
      return {
        error: `A material named "${cleanName}" already exists for this lesson.`,
      };
    }

    const storagePath = `lesson_${lessonId}/${Date.now()}_${cleanName}`;

    // STEP 2 — UPLOAD FILE (no upsert)
    const { error: uploadErr } = await supabase.storage
      .from('workbooks')
      .upload(storagePath, file, { upsert: false });

    if (uploadErr) return { error: uploadErr.message };

    // STEP 3 — GET PUBLIC URL
    const { data: urlObj } = supabase.storage
      .from('workbooks')
      .getPublicUrl(storagePath);

    // STEP 4 — INSERT INTO DB
    const { data: inserted, error: insertErr } = await supabase
      .from('lesson_materials')
      .insert({
        lesson_id: lessonId,
        name: cleanName,
        file_url: urlObj.publicUrl,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (insertErr) return { error: insertErr.message };

    return { success: true, material: inserted };
  } catch (err) {
    return { error: err.message };
  }
}

//GET LESSON MATERIAL
export async function getLessonMaterials(lessonId) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('lesson_materials')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  return data || [];
}

//-----------------------------------------------------------------------------
//DELETE LESSON MATERIAL
//-----------------------------------------------------------------------------

export async function deleteLessonMaterial(materialId, storagePath) {
  try {
    const supabase = createAdminSupabaseClient();

    // Delete from storage
    await supabase.storage.from('workbooks').remove([storagePath]);

    // Delete DB row
    await supabase.from('lesson_materials').delete().eq('id', materialId);

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

//-----------------------------------------------------------------------------
//FETCH ALL IMAGES FROM THE BUCKET
// GET ALL IMAGES FROM THE "lesson-images" BUCKET
//-----------------------------------------------------------------------------

export async function getLessonImages() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.storage
    .from('lesson-images')
    .list('', { limit: 100 });

  if (error) {
    console.error('Error fetching images:', error.message);
    return [];
  }

  return data.map((file) => ({
    name: file.name,
    url: supabase.storage.from('lesson-images').getPublicUrl(file.name).data
      .publicUrl,
  }));
}

//-----------------------------------------------------------------------------
//DEACTIVATE A LESSON
//------------------------------------------------------------------------------
export async function toggleLessonStatusAction(lessonId, currentCategory) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  // Guard: Only allow toggling between 0 and 1
  if (currentCategory !== 0 && currentCategory !== 1) {
    throw new Error('This action is only available for standard lessons.');
  }

  const supabase = createAdminSupabaseClient();

  // Toggle: 1 becomes 0, 0 becomes 1
  const newCategory = currentCategory === 1 ? 0 : 1;
  const statusLabel = newCategory === 1 ? 'activated' : 'deactivated';

  try {
    const { error } = await supabase
      .from('lessons')
      .update({ category: newCategory })
      .eq('id', lessonId);

    if (error) throw new Error(error.message);
  } catch (err) {
    throw new Error(`Failed to ${statusLabel} lesson: ${err.message}`);
  }

  // Use revalidatePath if you want to stay on the page, or redirect
  redirect(`/admin/lessons?status=${statusLabel}`);
}

//------------------------------------------------------------------------------
//FETCH AND UPLOAD AND DELETE IMAGES
//------------------------------------------------------------------------------

// FETCH ALL IMAGES FROM BUCKET ROOT
export async function getAllLessonImages() {
  const supabase = createAdminSupabaseClient();

  // Empty string '' refers to the root of the bucket
  const { data, error } = await supabase.storage
    .from('lesson-images')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) return { error: error.message };

  // Filter out any folders (Supabase returns folders with metadata too)
  const images = data
    .filter((file) => file.id !== null)
    .map((file) => ({
      name: file.name,
      url: supabase.storage.from('lesson-images').getPublicUrl(file.name).data
        .publicUrl,
    }));

  return { data: images };
}

// UPLOAD DIRECTLY TO IMAGE CONTAINER
export async function uploadStandaloneImage(formData) {
  const supabase = createAdminSupabaseClient();
  const file = formData.get('file');
  if (!file) return { error: 'No file provided' };

  // 1. Sanitize the original name (replace spaces/special chars with underscores)
  const cleanName = file.name
    .replace(/\s+/g, '_') // Replace spaces with _
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove symbols that break URLs
    .toLowerCase(); // Keep it lowercase for consistency

  // 2. Check if file already exists to avoid accidental overwrites
  const { data: existingFiles } = await supabase.storage
    .from('lesson-images')
    .list('', { search: cleanName });

  const fileExists = existingFiles?.some((f) => f.name === cleanName);

  // 3. If exists, we'll append a tiny timestamp so it's still recognizable but unique
  const finalName = fileExists ? `${Date.now()}_${cleanName}` : cleanName;

  const { error } = await supabase.storage
    .from('lesson-images')
    .upload(finalName, file);

  if (error) return { error: error.message };

  revalidatePath('/admin/lessons/upload');
  return { success: true };
}

export async function uploadStandaloneImage_old(formData) {
  const supabase = createAdminSupabaseClient();
  const file = formData.get('file');
  if (!file) return { error: 'No file provided' };

  const fileExt = file.name.split('.').pop();
  // Unique filename to prevent overwriting
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('lesson-images')
    .upload(fileName, file);

  if (error) return { error: error.message };

  revalidatePath('/admin/lessons/upload');
  return { success: true };
}

// DELETE FROM ROOT
export async function deleteLibraryImage(fileName) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.storage
    .from('lesson-images')
    .remove([fileName]);

  if (error) return { error: error.message };

  revalidatePath('/admin/lessons/upload');
  return { success: true };
}