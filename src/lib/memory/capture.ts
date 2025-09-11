
import { supabase } from "@/integrations/supabase/client";
import type { MemoryItem } from "./types";
import { localEngineClient } from "./localEngineClient";
import { useEmbeddings } from "../../hooks/useEmbeddings";

export type CaptureResult = {
  created?: MemoryItem;
  reason?: string;
};

function inferMemoryFromText(text: string) {
  const content = text.trim();
  const lower = content.toLowerCase();

  // Very lightweight heuristics (expanded for natural phrasing)
  // Favorites / go-to
  const fav = content.match(/\b(My\s+favorite|Favorite|Go-?to)\b[^.?!]*?(?:is|are)?\s*([^.!?]+)[.!?]?/i);
  if (fav) {
    return {
      memory_type: "semantic" as const,
      content: `Favorite: ${fav[2].trim()}`,
      salience: 0.75,
      topic_tags: ["preference"],
    };
  }

  // Cravings / "been into"
  const into = content.match(/\b(I['’]m\s+craving|I\s+crave|Been\s+into|Lately\s+I['’]m\s+into|These\s+days\s+I['’]m\s+into)\b[^.?!]+/i);
  if (into) {
    return {
      memory_type: "semantic" as const,
      content: content.substring(into.index || 0).replace(/^I\b/i, "You"),
      salience: 0.75,
      topic_tags: ["preference"],
    };
  }

  // Avoid / cut back / can't stand
  const avoid = content.match(/\b(I['’]m\s+trying\s+to\s+(quit|cut\s+back\s+on|avoid)|I\s+can['’]?t\s+(stand|do))\b[^.?!]+/i);
  if (avoid) {
    return {
      memory_type: "semantic" as const,
      content: content.substring(avoid.index || 0).replace(/^I\b/i, "You"),
      salience: 0.8,
      topic_tags: ["preference"],
    };
  }

  // Allergic
  const allergy = content.match(/\bI['’]?m\s+allergic\s+to\b\s*([^.!?]+)/i);
  if (allergy) {
    return {
      memory_type: "semantic" as const,
      content: `Allergic to ${allergy[1].trim()}`,
      salience: 0.9,
      topic_tags: ["preference"],
    };
  }

  // Preferences (original heuristic)
  const prefMatch = lower.match(/\b(i\s+(really\s+)?(love|like|hate|dislike|prefer|avoid|allergic to))\b(.+?)(\.|$)/);
  if (prefMatch) {
    const phrase = content.substring(prefMatch.index || 0).replace(/^(i\s+)/i, "You ");
    return {
      memory_type: "semantic" as const,
      content: phrase,
      salience: /really|allergic/.test(lower) ? 0.9 : 0.7,
      topic_tags: ["preference"],
    };
  }

  // People suggestions / recommendations
  const suggested = content.match(/([A-Z][a-z]+)\s+(sugg?ested|recommended|mentioned|said)\s+(?:I\s+should\s+try\s+)?(.+?)(\.|$)/);
  if (suggested) {
    const who = suggested[1];
    const whatVerb = suggested[2];
    const what = suggested[3];
    return {
      memory_type: "relational" as const,
      content: `${who} ${whatVerb} ${what}`,
      salience: 0.7,
      topic_tags: ["people"],
    };
  }

  // Simple episodic cue: after/since incident
  if (/\b(after|since)\b.+\b(incident|accident|trip|vacation|issue|problem)\b/i.test(content)) {
    return {
      memory_type: "episodic" as const,
      content,
      salience: 0.8,
      topic_tags: ["memory"],
    };
  }

  return null;
}

// Generate a simple ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function captureMemoryIfRelevant(userId: string, text: string): Promise<CaptureResult> {
  const inferred = inferMemoryFromText(text);
  if (!inferred) return { reason: "no-inference" };

  // Create memory item
  const memoryItem: MemoryItem = {
    id: generateId(),
    user_id: userId,
    memory_type: inferred.memory_type,
    content: inferred.content,
    salience: inferred.salience,
    sensitive: false,
    usage_count: 0,
    last_used_at: null,
    cooldown_until: null,
    topic_tags: inferred.topic_tags,
    source: "chat",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // Initialize local engine if not already done
    await localEngineClient.init();
    
    // TODO: Generate embedding for the content
    // For now, we'll add without embeddings
    await localEngineClient.addMemory(memoryItem);

    // Also store in Supabase for backup/sync (optional)
    const { data, error } = await supabase
      .from("memory_items")
      .insert({
        user_id: userId,
        memory_type: inferred.memory_type,
        content: inferred.content,
        salience: inferred.salience,
        sensitive: false,
        topic_tags: inferred.topic_tags,
        source: "chat",
      })
      .select("*")
      .single();

    if (error) {
      console.warn("[memory] supabase backup insert error", error);
      // Continue anyway since local storage succeeded
    }

    return { created: memoryItem };
  } catch (error) {
    console.error("[memory] local capture error", error);
    return { reason: "local-insert-error" };
  }
}
