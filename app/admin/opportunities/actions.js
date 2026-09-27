'use server';

import { createServerSupabaseClient } from '@/app/_lib/supabase-server';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { auth } from '@/app/_lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ============================================================================
// OPPORTUNITIES
// ============================================================================

export async function getOpportunities(options = {}) {
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (typeof options?.from === 'number' && typeof options?.to === 'number') {
    query = query.range(options.from, options.to);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getOpportunities error in actions.js:', error.message);
    return [];
  }
  return data || [];
}

export async function createOpportunity(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // Extract and format the analysis field into an array
  const rawAnalysis = formData.get('analysis');
  let analysisArray = null;

  if (rawAnalysis) {
    analysisArray = rawAnalysis
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }

  // Your default placeholder image
  const DEFAULT_IMAGE =
    'https://qgkjifmsbwfjzowejmqn.supabase.co/storage/v1/object/public/winam_images/logo.png';

  const newOpportunity = {
    name: formData.get('name'),
    description: formData.get('description'),

    // Check for an image, if none exists, use the default
    image_url: formData.get('image') || DEFAULT_IMAGE,

    type: formData.get('type'),
    status: formData.get('status') || 'active',
    minimum_investment: Number(formData.get('minimum_investment')) || 0,
    total_value: formData.get('total_value')
      ? Number(formData.get('total_value'))
      : null,
    expected_return: formData.get('expected_return')
      ? Number(formData.get('expected_return'))
      : null,
    duration_months: formData.get('duration_months')
      ? Number(formData.get('duration_months'))
      : null,
    created_by: session.user.id,
    is_featured: formData.get('is_featured') === 'true',
    analysis: analysisArray,
  };

  const { data, error } = await supabase
    .from('opportunities')
    .insert([newOpportunity])
    .select()
    .single();

  if (error) throw new Error(error.message);

  redirect(`/admin/opportunities?created=${data.id}`);
}

export async function createOpportunity_b(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // 1. Extract and format the analysis field into an array
  const rawAnalysis = formData.get('analysis');
  let analysisArray = null;

  if (rawAnalysis) {
    // Split by double newlines, trim whitespace, and filter out empty strings
    analysisArray = rawAnalysis
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }

  const newOpportunity = {
    name: formData.get('name'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    type: formData.get('type'),
    status: formData.get('status') || 'active',
    minimum_investment: Number(formData.get('minimum_investment')) || 0,
    total_value: formData.get('total_value')
      ? Number(formData.get('total_value'))
      : null,
    expected_return: formData.get('expected_return')
      ? Number(formData.get('expected_return'))
      : null,
    duration_months: formData.get('duration_months')
      ? Number(formData.get('duration_months'))
      : null,
    created_by: session.user.id,
    is_featured: formData.get('is_featured') === 'true',
    analysis: analysisArray, // 2. Add the formatted array to the payload
  };

  const { data, error } = await supabase
    .from('opportunities')
    .insert([newOpportunity])
    .select()
    .single();

  if (error) throw new Error(error.message);

  redirect(`/admin/opportunities?created=${data.id}`);
}

export async function createOpportunity_old(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const newOpportunity = {
    name: formData.get('name'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    type: formData.get('type'),
    status: formData.get('status') || 'active',
    minimum_investment: Number(formData.get('minimum_investment')) || 0,
    total_value: formData.get('total_value')
      ? Number(formData.get('total_value'))
      : null,
    expected_return: formData.get('expected_return')
      ? Number(formData.get('expected_return'))
      : null,
    duration_months: formData.get('duration_months')
      ? Number(formData.get('duration_months'))
      : null,
    created_by: session.user.id,
    is_featured: formData.get('is_featured') === 'true',
  };

  const { data, error } = await supabase
    .from('opportunities')
    .insert([newOpportunity])
    .select()
    .single();

  if (error) throw new Error(error.message);

  redirect(`/admin/opportunities?created=${data.id}`);
}

export async function getOpportunityById(id) {
  
  const supabase = createAdminSupabaseClient();
  const numericId = Number(id);

  // 1️⃣ Fetch Opportunity
  const { data: opportunity, error: oppErr } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', numericId)
    .maybeSingle();

  if (oppErr) throw new Error(oppErr.message);
  if (!opportunity) return null;

  // 2️⃣ Fetch Documents
  const { data: documents, error: docErr } = await supabase
    .from('opportunity_documents')
    .select('*')
    .eq('opportunity_id', numericId)
    .order('created_at', { ascending: false });

  if (docErr) throw new Error(docErr.message);

  return {
    opportunity,
    documents: documents || [],
  };
}

export async function updateOpportunity(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();
  const id = Number(formData.get('id'));

  // 1. Extract and format the analysis field into an array (just like create)
  const rawAnalysis = formData.get('analysis');
  let analysisArray = null;

  if (rawAnalysis) {
    analysisArray = rawAnalysis
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }

  const updated = {
    name: formData.get('name'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    type: formData.get('type'),

    // ❌ REMOVED `status` entirely so we don't accidentally overwrite the database with null!

    minimum_investment: Number(formData.get('minimum_investment')) || 0,
    total_value: formData.get('total_value')
      ? Number(formData.get('total_value'))
      : null,
    expected_return: formData.get('expected_return')
      ? Number(formData.get('expected_return'))
      : null,
    duration_months: formData.get('duration_months')
      ? Number(formData.get('duration_months'))
      : null,
    is_featured: formData.get('is_featured') === 'true',
    analysis: analysisArray, // 2. Added the formatted array to the update payload
  };

  const { error } = await supabase
    .from('opportunities')
    .update(updated)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function updateOpportunity_old(formData) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();
  const id = Number(formData.get('id'));

  const updated = {
    name: formData.get('name'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    type: formData.get('type'),
    status: formData.get('status'),
    minimum_investment: Number(formData.get('minimum_investment')) || 0,
    total_value: formData.get('total_value')
      ? Number(formData.get('total_value'))
      : null,
    expected_return: formData.get('expected_return')
      ? Number(formData.get('expected_return'))
      : null,
    duration_months: formData.get('duration_months')
      ? Number(formData.get('duration_months'))
      : null,
    is_featured: formData.get('is_featured') === 'true',
  };

  const { error } = await supabase
    .from('opportunities')
    .update(updated)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function deleteOpportunityAction(opportunityId) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  try {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', opportunityId);

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'This opportunity is linked to active investments or records and cannot be deleted right now.'
        );
      }
      throw new Error(
        'Could not delete the opportunity. Please try again later.'
      );
    }
  } catch (err) {
    throw new Error(
      err.message ||
        'An unexpected error occurred while trying to delete the opportunity.'
    );
  }

  redirect(`/admin/opportunities?deleted=${opportunityId}`);
}

export async function toggleOpportunityStatusAction(
  opportunityId,
  currentStatus
) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();
  const newStatus = currentStatus === 'active' ? 'closed' : 'active';

  try {
    const { error } = await supabase
      .from('opportunities')
      .update({ status: newStatus })
      .eq('id', opportunityId);

    if (error) throw new Error(error.message);
  } catch (err) {
    throw new Error(`Failed to update status: ${err.message}`);
  }

  redirect(`/admin/opportunities?status=${newStatus}`);
}

// ============================================================================
// INVESTMENTS (JUNCTION & VALIDATION)
// ============================================================================

export async function checkOpportunityHasInvestments(opportunityId) {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('investments')
      .select('id', { count: 'exact' })
      .eq('opportunity_id', opportunityId);

    if (error) {
      // Catch table-does-not-exist error (42P01) gracefully during development
      if (error.code === '42P01') {
        return { hasInvestments: false, count: 0 };
      }
      throw new Error(error.message);
    }

    return {
      hasInvestments: data.length > 0,
      count: data.length,
    };
  } catch (err) {
    console.error('Error checking investments:', err);
    return { hasInvestments: false, count: 0 };
  }
}

// ============================================================================
// OPPORTUNITY DOCUMENTS
// ============================================================================

export async function uploadOpportunityDocument(formData) {
  try {
    const supabase = createAdminSupabaseClient();

    const opportunityId = formData.get('opportunityId');
    const file = formData.get('file');
    const documentType = formData.get('documentType') || 'brochure';

    if (!opportunityId || !file)
      return { error: 'Missing opportunity or file.' };

    let cleanName = file.name.replace(/\s+/g, '_');

    // If report type is General or Project, tag the name so reports filter recognizes it
    if (
      (documentType === 'General' || documentType === 'Project') &&
      !cleanName.toLowerCase().startsWith(`[${documentType.toLowerCase()}]`)
    ) {
      cleanName = `[${documentType}]_${cleanName}`;
    }

    // CHECK DUPLICATE
    const { data: existing } = await supabase
      .from('opportunity_documents')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .eq('name', cleanName)
      .maybeSingle();

    if (existing) {
      return {
        error: `A document named "${cleanName}" already exists for this opportunity.`,
      };
    }

    const storagePath = `opportunity_${opportunityId}/${Date.now()}_${cleanName}`;

    // UPLOAD FILE
    const { error: uploadErr } = await supabase.storage
      .from('opportunity-documents')
      .upload(storagePath, file, { upsert: false });

    if (uploadErr) return { error: uploadErr.message };

    // GET URL
    const { data: urlObj } = supabase.storage
      .from('opportunity-documents')
      .getPublicUrl(storagePath);

    // Try inserting with document_type column; fallback if column does not exist
    let inserted = null;
    try {
      const { data, error } = await supabase
        .from('opportunity_documents')
        .insert({
          opportunity_id: opportunityId,
          name: cleanName,
          file_url: urlObj.publicUrl,
          storage_path: storagePath,
          document_type: documentType,
        })
        .select()
        .single();

      if (!error && data) {
        inserted = data;
      }
    } catch (e) {}

    if (!inserted) {
      const { data, error: insertErr } = await supabase
        .from('opportunity_documents')
        .insert({
          opportunity_id: opportunityId,
          name: cleanName,
          file_url: urlObj.publicUrl,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (insertErr) return { error: insertErr.message };
      inserted = data;
    }

    return {
      success: true,
      newDocument: { ...inserted, document_type: documentType },
      document: { ...inserted, document_type: documentType },
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function getOpportunityDocuments(opportunityId) {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from('opportunity_documents')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function deleteOpportunityDocument(documentId, storagePath) {
  try {
    const supabase = createAdminSupabaseClient();

    await supabase.storage.from('opportunity-documents').remove([storagePath]);
    await supabase.from('opportunity_documents').delete().eq('id', documentId);

    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================================
// STANDALONE IMAGES BUCKET
// ============================================================================

export async function getAllOpportunityImages() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.storage
    .from('winam_images')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) return { error: error.message };

  const images = data
    .filter((file) => file.id !== null)
    .map((file) => ({
      name: file.name,
      url: supabase.storage.from('winam_images').getPublicUrl(file.name)
        .data.publicUrl,
    }));

  return { data: images };
}

export async function uploadStandaloneImage(formData) {
  const supabase = createAdminSupabaseClient();
  const file = formData.get('file');
  if (!file) return { error: 'No file provided' };

  const cleanName = file.name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();

  const { data: existingFiles } = await supabase.storage
    .from('winam_images')
    .list('', { search: cleanName });

  const fileExists = existingFiles?.some((f) => f.name === cleanName);
  const finalName = fileExists ? `${Date.now()}_${cleanName}` : cleanName;

  const { error } = await supabase.storage
    .from('winam_images')
    .upload(finalName, file);

  if (error) return { error: error.message };

  revalidatePath('/admin/opportunities/upload');
  return { success: true };
}

export async function deleteLibraryImage(fileName) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.storage
    .from('winam_images')
    .remove([fileName]);

  if (error) return { error: error.message };

  revalidatePath('/admin/opportunities/upload');
  return { success: true };
}
