
export type MemoryType = "episodic" | "semantic" | "relational" | "ritual";

export interface MemoryItem {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  salience: number;           // 0..1
  sensitive: boolean;
  usage_count: number;
  last_used_at: string | null;
  cooldown_until: string | null;
  topic_tags: string[];
  embedding?: unknown;        // unused client-side
  source: string;
  created_at: string;
  updated_at: string;
}

export interface LocalMemoryItem extends MemoryItem {
  embedding?: Float32Array; // Stored locally
}
