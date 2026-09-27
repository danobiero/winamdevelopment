'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '@/app/_lib/auth';
import { supabase } from '@/app/_lib/supabase';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';

//Creating supabase client server
function createSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function getOptionsByCategory() {
  const { data: categories } = await supabase.from('categories').select('*');

  const { data: options } = await supabase.from('options').select('*');

  return categories.map((cat) => ({
    ...cat,
    options: options.filter((o) => o.category_id === cat.id),
  }));
}

export async function getPropertyScore(propertyId) {
  const { data, error } = await supabase
    .from('property_values')
    .select(
      `
      option_id,
      options ( weight )
    `
    )
    .eq('property_id', propertyId);

  if (error) throw new Error(error.message);

  const total = data.reduce((sum, row) => {
    return sum + Number(row.options?.weight || 0);
  }, 0);

  return total;
}

export async function getPropertyDashboard() {
  const { data, error } = await supabase.from('properties').select(`
      id,
      name,
      property_values (
        category_id,
        option_id,
        categories ( name ),
        options ( name, weight )
      )
    `);

  if (error) throw new Error(error.message);

  // 🔥 Transform into usable UI structure
  return data.map((p) => {
    let totalScore = 0;

    const breakdown = p.property_values.map((pv) => {
      const weight = pv.options?.weight || 0;
      totalScore += weight;

      return {
        category: pv.categories?.name,
        option: pv.options?.name,
        weight,
      };
    });

    return {
      id: p.id,
      name: p.name,
      totalScore,
      breakdown,
    };
  });
}

// app/_lib/actions.js

export async function createCategory(name) {
  const { error } = await supabase.from('categories').insert([{ name }]);

  if (error) throw new Error(error.message);
}

////////////////////////////////////////////////////////////
// CREATE PROPERTY
////////////////////////////////////////////////////////////
export async function createProperty(name) {
  const { data, error } = await supabase
    .from('properties')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('❌ Create property failed:', error);
    throw new Error(error.message);
  }

  return data;
}

////////////////////////////////////////////////////////////
// SAVE SELECTIONS (FIXED)
////////////////////////////////////////////////////////////
export async function savePropertySelections(propertyId, formData) {
  const selections = [];

  ////////////////////////////////////////////////////////////
  // BUILD SELECTIONS
  ////////////////////////////////////////////////////////////
  for (const [key] of formData.entries()) {
    if (!key.startsWith('category-')) continue;

    const categoryId = Number(key.replace('category-', ''));
    const values = formData.getAll(key);

    for (const v of values) {
      if (!v) continue;

      selections.push({
        property_id: propertyId,
        category_id: categoryId,
        option_id: Number(v),
      });
    }
  }

  if (selections.length === 0) {
    throw new Error('No selections were provided.');
  }

  ////////////////////////////////////////////////////////////
  // SAVE DATA (NO FALSE ERRORS)
  ////////////////////////////////////////////////////////////
  try {
    // 🔥 DELETE OLD (prevents duplicates)
    const { error: deleteError } = await supabase
      .from('property_selections')
      .delete()
      .eq('property_id', propertyId);

    if (deleteError) throw deleteError;

    // 🔥 INSERT NEW
    const { error: insertError } = await supabase
      .from('property_selections')
      .insert(selections);

    if (insertError) throw insertError;
  } catch (err) {
    console.error('❌ Save selections failed:', err);

    // 🚨 ONLY THROW REAL ERROR
    throw new Error(err.message || 'Failed to save selections.');
  }

  ////////////////////////////////////////////////////////////
  // ✅ REVALIDATE (OUTSIDE TRY)
  ////////////////////////////////////////////////////////////
  revalidatePath('/landAnalysis');
}

export async function createProperty_old1(name) {
  const { data, error } = await supabase
    .from('properties')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function savePropertySelections_old_3(propertyId, formData) {
  const selections = [];

  for (const [key] of formData.entries()) {
    if (!key.startsWith('category-')) continue;

    const categoryId = Number(key.replace('category-', ''));
    const values = formData.getAll(key);

    for (const v of values) {
      if (!v) continue;

      selections.push({
        property_id: propertyId,
        category_id: categoryId,
        option_id: Number(v),
      });
    }
  }

  if (selections.length === 0) {
    throw new Error('No selections were provided.');
  }

  try {
    ////////////////////////////////////////////////////////////
    // DELETE
    ////////////////////////////////////////////////////////////
    const { error: deleteError } = await supabase
      .from('property_selections')
      .delete()
      .eq('property_id', propertyId);

    if (deleteError) throw deleteError;

    ////////////////////////////////////////////////////////////
    // INSERT
    ////////////////////////////////////////////////////////////

    console.log('INSERTING:', selections);

    const { error: insertError } = await supabase
      .from('property_selections')
      .insert(selections);

    if (insertError) throw insertError;
  } catch (err) {
    console.error('❌ Save selections failed:', err);

    throw new Error(
      err.code === '23505'
        ? 'Duplicate selections detected. Please refresh and try again.'
        : err.message || 'An unexpected error occurred.'
    );
  }

  ////////////////////////////////////////////////////////////
  // ✅ REVALIDATE OUTSIDE TRY
  ////////////////////////////////////////////////////////////
  revalidatePath('/landAnalysis');
}

export async function savePropertySelections_old_1(propertyId, formData) {
  const selections = [];

  // 1. Extract and format data
  for (const [key] of formData.entries()) {
    if (!key.startsWith('category-')) continue;

    const categoryId = Number(key.replace('category-', ''));

    // Multi-select safe
    const values = formData.getAll(key);

    for (const v of values) {
      if (!v || v === '') continue;

      selections.push({
        property_id: propertyId,
        category_id: categoryId,
        option_id: Number(v),
      });
    }
  }

  try {
    // 🚨 Guard: prevent empty submissions
    if (selections.length === 0) {
      throw new Error('No selections were provided.');
    }

    // 2. Clear existing selections
    const { error: deleteError } = await supabase
      .from('property_values')
      .delete()
      .eq('property_id', propertyId);

    if (deleteError) {
      throw new Error(`Cleanup failed: ${deleteError.message}`);
    }

    // 3. Insert new selections
    const { error: insertError } = await supabase
      .from('property_values')
      .insert(selections);

    if (insertError) {
      // 🔥 Handle known DB errors cleanly
      if (insertError.message.includes('duplicate key')) {
        throw new Error(
          'Duplicate selections detected. Please refresh and try again.'
        );
      }

      if (insertError.message.includes('foreign key')) {
        throw new Error(
          'Invalid selection detected. Please reload the page and try again.'
        );
      }

      // fallback
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    // 4. Revalidate pages
    revalidatePath('/landAnalysis');
    revalidatePath(`/landAnalysis/${propertyId}`);

    return { success: true };
  } catch (err) {
    // 🔍 Full debug logging (safe for dev)
    console.error('FLOW-NET Database Error:', err);
    console.error('🔥 MESSAGE:', err.message);

    // 🔥 IMPORTANT: must throw for toast to catch it
    throw new Error(err.message || 'An unexpected error occurred.');
  }
}

export async function savePropertySelections_old(propertyId, formData) {
  const selections = [];

  // 1. Extract and Format Data
  for (const [key, value] of formData.entries()) {
    // We only care about keys that look like 'category-123'
    if (!key.startsWith('category-')) continue;

    const categoryId = Number(key.replace('category-', ''));

    // Using getAll ensures we capture all checked boxes for Multi-Select categories
    const values = formData.getAll(key);

    for (const v of values) {
      // Ensure we aren't saving empty strings from unselected dropdowns
      if (!v || v === '') continue;

      selections.push({
        property_id: propertyId,
        category_id: categoryId,
        option_id: Number(v),
      });
    }
  }

  try {
    // 2. Clear Existing Selections
    // This handles "unchecking" boxes. We wipe the slate for this property
    // so that the new batch of selections is the definitive state.
    const { error: deleteError } = await supabase
      .from('property_values')
      .delete()
      .eq('property_id', propertyId);

    if (deleteError) throw new Error(`Cleanup failed: ${deleteError.message}`);

    // 3. Batch Insert New Selections
    if (selections.length > 0) {
      const { error: insertError } = await supabase
        .from('property_values')
        .insert(selections);

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
    }

    // 4. Refresh the UI
    // Tells Next.js to dump the cache for the report pages so scores update instantly
    revalidatePath('/landAnalysis');
    revalidatePath(`/landAnalysis/${propertyId}`);

    return { success: true };
  } catch (err) {
    console.error('FLOW-NET Database Error:', err);
    console.error('🔥 FULL ERROR:', err);
    console.error('🔥 MESSAGE:', err.message);
    console.error('🔥 STACK:', err.stack);

    throw err; // ⛔ temporarily remove wrapping
  }
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id');

  if (error) throw new Error(error.message);

  return data;
}

export async function createOption({ category_id, name, weight }) {
  const { error } = await supabase
    .from('options')
    .insert([{ category_id, name, weight }]);

  if (error) throw new Error(error.message);
}

export async function updateOption(id, payload) {
  const { error } = await supabase.from('options').update(payload).eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteOption(id) {
  const { error } = await supabase.from('options').delete().eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getOptions() {
  const { data, error } = await supabase
    .from('options')
    .select(
      `
      id,
      name,
      weight,
      category_id,
      categories ( name )
    `
    )
    .order('id');

  if (error) throw new Error(error.message);

  return data;
}

export async function updateCategory(id, name) {
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getPropertyReport() {
  const { data, error } = await supabase.from('properties').select(`
      id,
      name,
      property_values (
        option_id,
        options (
          name,
          weight,
          categories ( name )
        )
      )
    `);

  if (error) throw new Error(error.message);

  return data.map((p) => {
    let total = 0;

    const breakdown = [];

    for (const pv of p.property_values || []) {
      const weight = Number(pv.options?.weight || 0);

      total += weight;

      breakdown.push({
        category: pv.options?.categories?.name || 'Unknown',
        option: pv.options?.name || 'Unknown',
        weight,
      });
    }

    return {
      id: p.id,
      name: p.name,
      totalScore: total,
      breakdown,
    };
  });
}

/**
 * Creates a property and its associated category values.
 * @param {string} name - The address or Parcel ID from the 'name' state.
 * @param {FormData} formData - The raw form data containing category selections.
 */
export async function createPropertyWithSelections(name, formData) {
 

  // 1. Insert the primary property record into public.properties
  const { data: property, error: propError } = await supabase
    .from('properties')
    .insert([{ name }])
    .select()
    .single();

  if (propError) {
    console.error('Property Insert Error:', propError);
    throw new Error('Failed to create property identity.');
  }

  // 2. Parse the FormData for category selections
  // The form uses name={`category-${cat.id}`}
  const propertyValues = [];

  for (const [key, value] of formData.entries()) {
    // Only process keys that match our category naming convention
    if (key.startsWith('category-') && value) {
      const categoryId = key.replace('category-', '');

      propertyValues.push({
        property_id: property.id,
        category_id: parseInt(categoryId),
        option_id: parseInt(value),
      });
    }
  }

  // 3. Batch insert into public.property_values
  if (propertyValues.length > 0) {
    const { error: valError } = await supabase
      .from('property_values')
      .insert(propertyValues);

    if (valError) {
      console.error('Property Values Insert Error:', valError);

      // OPTIONAL: Delete the "orphaned" property if values fail to save
      // await supabase.from('properties').delete().eq('id', property.id);

      throw new Error(
        `Property saved, but attributes failed: ${valError.message}`
      );
    }
  }

  // 4. Clear cache for relevant pages
  revalidatePath('/properties');
  redirect('/landAnalysis');

  return property;
}
