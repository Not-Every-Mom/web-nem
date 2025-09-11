
import { supabase } from "@/integrations/supabase/client";
import { MemoryItem, MemoryType } from "./types";
import { localEngineClient } from "./localEngineClient";

export async function fetchUserMemories(userId: string, limit = 100): Promise<MemoryItem[]> {
  try {
    // Initialize local engine if not already done
    await localEngineClient.init();
    
    // Get basic stats to see if we have any local memories
    const stats = await localEngineClient.getStats();
    
    if (stats.node_count > 0) {
      // Get all candidates for AI retrieval (no user filtering needed in single-user local context)
      const candidates = await localEngineClient.getCandidates("", { limit });
      
      // Convert candidates back to MemoryItem format
      // Note: The worker should eventually return complete LocalMemoryItem data
      // For now, we reconstruct MemoryItem with reasonable defaults
      const memoryItems: MemoryItem[] = candidates.map(candidate => ({
        // Core MemoryItem fields - these should come from the stored data
        id: candidate.id,
        user_id: userId, // Assume current user for local storage
        memory_type: 'episodic' as MemoryType, // Default to episodic for conversations
        content: candidate.content,
        salience: 0.7, // Default high salience for retrieved memories
        sensitive: false, // Default to non-sensitive
        usage_count: 0, // Default if not stored
        last_used_at: null, // Will be updated during retrieval
        cooldown_until: null, // No cooldown by default
        topic_tags: [], // Empty array if not stored
        source: 'local', // Mark as local source
        created_at: new Date().toISOString(), // Default timestamp
        updated_at: new Date().toISOString()
      }));
      
      console.log(`[memory] Retrieved ${memoryItems.length} memories from local engine`);
      return memoryItems;
    }
    
    // Fallback to Supabase if no local memories
    const { data, error } = await supabase
      .from("memory_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[memory] fetchUserMemories error", error);
      return [];
    }
    
    console.log(`[memory] Retrieved ${data?.length || 0} memories from Supabase (fallback)`);
    return (data || []) as MemoryItem[];
  } catch (error) {
    console.error("[memory] fetchUserMemories local engine error", error);
    
    // Fallback to Supabase on local engine error
    const { data, error: supabaseError } = await supabase
      .from("memory_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (supabaseError) {
      console.error("[memory] fetchUserMemories supabase fallback error", supabaseError);
      return [];
    }
    
    return (data || []) as MemoryItem[];
  }
}
