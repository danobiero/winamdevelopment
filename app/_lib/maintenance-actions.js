'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';

const CONFIG_PATH = path.join(process.cwd(), 'app', '_lib', 'maintenance-config.json');

const DEFAULT_CONFIG = {
  is_maintenance_mode: false,
  maintenance_start_time: '',
  maintenance_end_time: '',
  maintenance_message: 'Our platform is currently undergoing scheduled secure infrastructure and system maintenance.',
  updated_at: new Date().toISOString(),
};

/**
 * Reads local fallback JSON config safely
 */
function readLocalConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('readLocalConfig error:', err.message);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Writes to local fallback JSON config safely
 */
function writeLocalConfig(data) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('writeLocalConfig error:', err.message);
  }
}

/**
 * Retrieves the current system maintenance configuration
 * Checks Supabase settings table first, falls back to local configuration
 */
export async function getSystemMaintenanceConfig() {
  noStore();
  const localConfig = readLocalConfig();

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('settings')
      .select('is_maintenance_mode, maintenance_start_time, maintenance_end_time, maintenance_message, maintenance_updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data && data.maintenance_updated_at) {
      const dbUpdatedAt = new Date(data.maintenance_updated_at).getTime();
      const localUpdatedAt = new Date(localConfig.updated_at || 0).getTime();

      // Return DB if newer or valid
      if (dbUpdatedAt >= localUpdatedAt || data.is_maintenance_mode !== null) {
        return {
          is_maintenance_mode: Boolean(data.is_maintenance_mode),
          maintenance_start_time: data.maintenance_start_time || '',
          maintenance_end_time: data.maintenance_end_time || '',
          maintenance_message: data.maintenance_message || DEFAULT_CONFIG.maintenance_message,
          updated_at: data.maintenance_updated_at,
        };
      }
    }
  } catch (err) {
    // DB column might not be migrated yet, fallback to localConfig
  }

  return localConfig;
}

/**
 * Computes active maintenance state and advance alert state
 * @returns {
 *   isMaintenanceActive: boolean,
 *   isAdvanceNoticeActive: boolean,
 *   hoursUntilStart: number | null,
 *   config: object
 * }
 */
export async function getMaintenanceStatus() {
  noStore();
  const config = await getSystemMaintenanceConfig();
  const now = Date.now();

  const isToggleOn = Boolean(config.is_maintenance_mode);
  const startTime = config.maintenance_start_time ? new Date(config.maintenance_start_time).getTime() : null;
  const endTime = config.maintenance_end_time ? new Date(config.maintenance_end_time).getTime() : null;

  let isMaintenanceActive = false;
  let isAdvanceNoticeActive = false;
  let hoursUntilStart = null;

  if (isToggleOn) {
    // If times are set:
    if (startTime && endTime) {
      if (now >= startTime && now <= endTime) {
        isMaintenanceActive = true;
      } else if (now < startTime) {
        // We are before start time. Check if within 8 hours
        const diffMs = startTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        hoursUntilStart = Math.max(0, Number(diffHours.toFixed(1)));
        if (diffHours <= 8 && diffHours >= 0) {
          isAdvanceNoticeActive = true;
        }
      }
    } else if (endTime) {
      // Only end time specified: active until end time
      if (now <= endTime) {
        isMaintenanceActive = true;
      }
    } else {
      // Toggle is ON without bounds -> actively in maintenance
      isMaintenanceActive = true;
    }
  }

  return {
    isMaintenanceActive,
    isAdvanceNoticeActive,
    hoursUntilStart,
    config,
  };
}

/**
 * Updates the maintenance configuration
 */
export async function updateSystemMaintenanceConfig(prevState, formData) {
  try {
    const session = await auth();
    if (!session?.user?.adminId && !session?.user?.email) {
      return { error: true, message: 'Unauthorized. Admin credentials required.' };
    }

    const isMaintenanceMode = formData.get('is_maintenance_mode') === 'true' || formData.get('is_maintenance_mode') === 'on';
    const startTimeRaw = formData.get('maintenance_start_time')?.trim() || '';
    const endTimeRaw = formData.get('maintenance_end_time')?.trim() || '';
    const message = formData.get('maintenance_message')?.trim() || DEFAULT_CONFIG.maintenance_message;

    // Convert local datetime string to ISO safely
    let startTimeISO = '';
    if (startTimeRaw) {
      const d = new Date(startTimeRaw);
      if (!isNaN(d.getTime())) startTimeISO = d.toISOString();
    }

    let endTimeISO = '';
    if (endTimeRaw) {
      const d = new Date(endTimeRaw);
      if (!isNaN(d.getTime())) endTimeISO = d.toISOString();
    }

    if (startTimeISO && endTimeISO && new Date(startTimeISO) >= new Date(endTimeISO)) {
      return {
        error: true,
        message: 'Maintenance start time must be before maintenance end time.',
      };
    }

    const nowISO = new Date().toISOString();

    const newConfig = {
      is_maintenance_mode: isMaintenanceMode,
      maintenance_start_time: startTimeISO,
      maintenance_end_time: endTimeISO,
      maintenance_message: message,
      updated_at: nowISO,
    };

    // 1. Save to local config file immediately
    writeLocalConfig(newConfig);

    // 2. Attempt saving to Supabase settings table if columns exist
    try {
      const supabase = createAdminSupabaseClient();
      await supabase
        .from('settings')
        .update({
          is_maintenance_mode: isMaintenanceMode,
          maintenance_start_time: startTimeISO,
          maintenance_end_time: endTimeISO,
          maintenance_message: message,
          maintenance_updated_at: nowISO,
        })
        .eq('id', 1);
    } catch (dbErr) {
      console.warn('Could not update Supabase settings table for maintenance:', dbErr.message);
    }

    revalidatePath('/admin/system/maintenance');
    revalidatePath('/account');
    revalidatePath('/account/investments');

    return {
      success: true,
      error: false,
      message: isMaintenanceMode
        ? 'System maintenance mode activated and schedule saved.'
        : 'System maintenance mode turned off.',
      config: newConfig,
    };
  } catch (err) {
    console.error('updateSystemMaintenanceConfig error:', err);
    return {
      error: true,
      message: err.message || 'Failed to update system maintenance settings.',
    };
  }
}
