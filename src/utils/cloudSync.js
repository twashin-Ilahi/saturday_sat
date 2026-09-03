import { supabase } from './supabase';

/**
 * Upload local progress to cloud (Supabase)
 * Uses both Supabase user_metadata (always works out-of-the-box) and
 * user_progress table (if created with RLS).
 */
export async function syncLocalToCloud(progressState, user) {
  if (!user || user.isGuest) {
    throw new Error("You must be signed in with an account to sync progress to the cloud.");
  }

  const timestamp = new Date().toISOString();
  const payload = {
    currentIndex: progressState.currentIndex ?? 0,
    selectedAnswers: progressState.selectedAnswers ?? [],
    checkedStatus: progressState.checkedStatus ?? [],
    flaggedStatus: progressState.flaggedStatus ?? [],
    eliminatedStatus: progressState.eliminatedStatus ?? [],
    errorLog: progressState.errorLog ?? [],
    autoStartEnabled: progressState.autoStartEnabled ?? true,
    lastSyncedAt: timestamp,
  };

  let tableSuccess = false;

  // 1. Attempt to sync to public.user_progress table if it exists
  try {
    const { error: tableError } = await supabase
      .from('user_progress')
      .upsert({
        id: user.id,
        user_id: user.id,
        progress: payload,
        updated_at: timestamp,
      }, { onConflict: 'id' });

    if (!tableError) {
      tableSuccess = true;
    }
  } catch (e) {
    // Table may not exist yet in schema cache
  }

  // 2. Sync to user.user_metadata (guaranteed to work with Supabase Auth without database table migration)
  const { data: userData, error: metaError } = await supabase.auth.updateUser({
    data: {
      sat_progress: payload,
      last_synced_at: timestamp,
    }
  });

  if (metaError && !tableSuccess) {
    throw new Error(metaError.message || "Failed to sync data to the cloud.");
  }

  // Record last sync time in local storage
  try {
    localStorage.setItem(`sat_last_synced_${user.id}`, timestamp);
  } catch (e) {}

  return {
    success: true,
    timestamp,
    user: userData?.user || user,
  };
}

/**
 * Fetch progress from cloud (Supabase)
 * Tries user_progress table first, then user.user_metadata.
 */
export async function fetchCloudProgress(user) {
  if (!user || user.isGuest) {
    throw new Error("You must be signed in to download cloud progress.");
  }

  let cloudData = null;

  // 1. Try public.user_progress table
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('progress, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data?.progress) {
      cloudData = data.progress;
    }
  } catch (e) {}

  // 2. If table didn't have it, fetch from fresh user metadata
  if (!cloudData) {
    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      if (!error && freshUser?.user_metadata?.sat_progress) {
        cloudData = freshUser.user_metadata.sat_progress;
      } else if (user.user_metadata?.sat_progress) {
        cloudData = user.user_metadata.sat_progress;
      }
    } catch (e) {}
  }

  if (!cloudData) {
    throw new Error("No cloud backup found for this account. Try syncing your current progress first.");
  }

  return cloudData;
}

/**
 * Get last synced timestamp for the user
 */
export function getLastSyncedTime(user) {
  if (!user || user.isGuest) return null;
  try {
    const local = localStorage.getItem(`sat_last_synced_${user.id}`);
    if (local) return local;
  } catch (e) {}
  return user.user_metadata?.last_synced_at || null;
}
