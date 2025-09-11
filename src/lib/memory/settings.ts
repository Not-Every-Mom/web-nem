
import { supabase } from "@/integrations/supabase/client";

export type MemorySensitivity = "low" | "medium" | "high";

export type MemorySettings = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  remember_sensitive: boolean;
  max_memories_considered: number;
  max_callbacks_per_reply: number;
  cooldown_minutes: number;
  sensitivity: MemorySensitivity;
};

export type PartialMemorySettings = Partial<Pick<MemorySettings,
  | "remember_sensitive"
  | "max_memories_considered"
  | "max_callbacks_per_reply"
  | "cooldown_minutes"
  | "sensitivity"
>>;

export const DEFAULT_MEMORY_SETTINGS: Omit<MemorySettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  remember_sensitive: false,
  max_memories_considered: 20,
  max_callbacks_per_reply: 1,
  cooldown_minutes: 120,
  sensitivity: "medium",
};

export async function getUserMemorySettings(userId: string) {
  const { data, error } = await supabase
    .from("memory_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If not found, return defaults (don't create yet)
    return {
      settings: undefined as MemorySettings | undefined,
      effective: { ...DEFAULT_MEMORY_SETTINGS },
      error: undefined as string | undefined,
    };
  }

  return {
    settings: data as MemorySettings,
    effective: {
      remember_sensitive: data.remember_sensitive ?? DEFAULT_MEMORY_SETTINGS.remember_sensitive,
      max_memories_considered: data.max_memories_considered ?? DEFAULT_MEMORY_SETTINGS.max_memories_considered,
      max_callbacks_per_reply: data.max_callbacks_per_reply ?? DEFAULT_MEMORY_SETTINGS.max_callbacks_per_reply,
      cooldown_minutes: data.cooldown_minutes ?? DEFAULT_MEMORY_SETTINGS.cooldown_minutes,
      sensitivity: (data.sensitivity as MemorySensitivity) ?? DEFAULT_MEMORY_SETTINGS.sensitivity,
    },
    error: undefined,
  };
}

export async function upsertUserMemorySettings(userId: string, patch: PartialMemorySettings) {
  // Upsert by user_id
  const payload = { user_id: userId, ...patch } as any;
  const { data, error } = await supabase
    .from("memory_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as MemorySettings;
}

export async function getCooldownMinutes(userId: string) {
  const { effective } = await getUserMemorySettings(userId);
  return effective.cooldown_minutes ?? DEFAULT_MEMORY_SETTINGS.cooldown_minutes;
}
