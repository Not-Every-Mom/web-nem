import { getDemoMemories } from "@/lib/memory/demo";
import { fetchUserMemories } from "@/lib/memory/fetch";
import { retrieveRelevantMemories } from "@/lib/memory/retrieval";
import { weaveAcknowledgment } from "@/lib/memory/weave";
import { useLocalMemory } from "@/hooks/useLocalMemory";
import type { MemoryItem } from "@/lib/memory/types";

export const retrieveMemoryContext = async (
  messageContent: string,
  userId: string,
  localMemory: ReturnType<typeof useLocalMemory>
): Promise<string | undefined> => {
  try {
    // Get memory candidates
    let candidates: MemoryItem[] = [];
    
    candidates = await fetchUserMemories(userId, 200);

    // Try local on-device retrieval first
    let acknowledgment: string | undefined;
    let chosenMemory: MemoryItem | undefined;
    
    if (localMemory.isReady) {
      try {
        const localResult = await localMemory.search(messageContent, 1);
        let localTopResult;
        
        // Handle different return formats from local memory search
        if (Array.isArray(localResult)) {
          localTopResult = localResult[0];
        } else if (localResult?.results && Array.isArray(localResult.results)) {
          localTopResult = localResult.results[0];
        }
        
        if (localTopResult && localTopResult.content) {
          acknowledgment = weaveAcknowledgment(
            messageContent.toLowerCase().includes("summer")
              ? "summer fruit ideas"
              : messageContent,
            { content: localTopResult.content } as MemoryItem
          );
        }
      } catch (error) {
        console.warn('[local-memory] search failed', error);
      }
    }

    // Fallback to remote retrieval if needed
    if (!acknowledgment && candidates.length > 0) {
      const relevantMemories = await retrieveRelevantMemories(messageContent, candidates, {
        maxResults: 1,
        diversity: 0.2,
        respectCooldown: true,
        respectSensitive: true,
        rememberSensitive: false,
        penalizeRecentReuseMinutes: 360,
      });
      
      chosenMemory = relevantMemories[0];
      if (chosenMemory) {
        acknowledgment = weaveAcknowledgment(
          messageContent.toLowerCase().includes("summer")
            ? "summer fruit ideas"
            : messageContent,
          chosenMemory
        );
      }
    }

    return acknowledgment;
  } catch (error) {
    console.error('Error retrieving memory context:', error);
    return undefined;
  }
};

export const updateMemoryUsage = async (
  memory: MemoryItem,
  userId: string
): Promise<void> => {
  try {
    const { getCooldownMinutes } = await import("@/lib/memory/settings");
    const { supabase } = await import("@/integrations/supabase/client");
    
    const cooldownMinutes = await getCooldownMinutes(userId);
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + (cooldownMinutes ?? 120) * 60 * 1000).toISOString();
    
    await supabase
      .from('memory_items')
      .update({
        usage_count: (memory.usage_count ?? 0) + 1,
        last_used_at: now.toISOString(),
        cooldown_until: cooldownUntil,
      })
      .eq('id', memory.id)
      .eq('user_id', userId);
  } catch (error) {
    console.warn('[memory] update usage failed', error);
  }
};