/**
 * Avatar Storage Utility
 * Handles saving/loading avatars from localStorage and Supabase
 * 
 * NOTE: The new Omni-Avatar Engine uses Zustand with persist middleware
 * for state management. This file provides legacy compatibility and
 * Supabase sync stubs for future cloud storage.
 */

// Legacy type - kept for backward compatibility
export interface LegacyAvatarParameters {
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  height: number;
  weight: number;
  [key: string]: string | number;
}

export interface SavedAvatar {
  id?: string;
  parameters: LegacyAvatarParameters | Record<string, unknown>;
  avatarUrl?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "yocreator_avatar";
const AVATARS_LIST_KEY = "yocreator_avatars";

/**
 * Save avatar to localStorage
 */
export function saveAvatarLocal(avatar: Omit<SavedAvatar, "id" | "createdAt" | "updatedAt">): SavedAvatar {
  const now = new Date().toISOString();
  const saved: SavedAvatar = {
    ...avatar,
    id: `local_${Date.now()}`,
    createdAt: now,
    updatedAt: now
  };
  
  // Save current avatar
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  
  // Add to avatars list
  const list = getAvatarsList();
  list.unshift(saved);
  localStorage.setItem(AVATARS_LIST_KEY, JSON.stringify(list.slice(0, 20))); // Keep last 20
  
  return saved;
}

/**
 * Load current avatar from localStorage
 */
export function loadAvatarLocal(): SavedAvatar | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Get list of saved avatars
 */
export function getAvatarsList(): SavedAvatar[] {
  try {
    const data = localStorage.getItem(AVATARS_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Delete avatar from list
 */
export function deleteAvatarLocal(id: string): void {
  const list = getAvatarsList().filter(a => a.id !== id);
  localStorage.setItem(AVATARS_LIST_KEY, JSON.stringify(list));
}

// ============================================
// SUPABASE INTEGRATION STUBS
// TODO: Implement when Supabase avatar table is ready
// ============================================

/**
 * Save avatar to Supabase
 * @stub - Implement with Supabase client
 */
export async function saveAvatarSupabase(
  userId: string, 
  avatar: Omit<SavedAvatar, "id" | "createdAt" | "updatedAt">
): Promise<SavedAvatar | null> {
  console.log("🔧 Supabase save stub called", { userId, avatar });
  
  // TODO: Implement
  // const { data, error } = await supabase
  //   .from('avatars')
  //   .insert({
  //     user_id: userId,
  //     parameters: avatar.parameters,
  //     avatar_url: avatar.avatarUrl,
  //     thumbnail_url: avatar.thumbnailUrl
  //   })
  //   .select()
  //   .single();
  
  // For now, save locally
  return saveAvatarLocal(avatar);
}

/**
 * Load user's avatar from Supabase
 * @stub - Implement with Supabase client
 */
export async function loadAvatarSupabase(userId: string): Promise<SavedAvatar | null> {
  console.log("🔧 Supabase load stub called", { userId });
  
  // TODO: Implement
  // const { data, error } = await supabase
  //   .from('avatars')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .order('updated_at', { ascending: false })
  //   .limit(1)
  //   .single();
  
  // For now, load locally
  return loadAvatarLocal();
}

/**
 * Get user's avatar history from Supabase
 * @stub - Implement with Supabase client
 */
export async function getAvatarsSupabase(userId: string): Promise<SavedAvatar[]> {
  console.log("🔧 Supabase list stub called", { userId });
  
  // TODO: Implement
  // const { data, error } = await supabase
  //   .from('avatars')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .order('updated_at', { ascending: false })
  //   .limit(20);
  
  // For now, return local list
  return getAvatarsList();
}
