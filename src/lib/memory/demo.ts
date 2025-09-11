
import { MemoryItem } from "./types";

const nowISO = () => new Date().toISOString();

export function getDemoMemories(userId = "demo-user"): MemoryItem[] {
  // Focus on requested example: connect "grilled peaches" to "summer fruit ideas"
  return [
    {
      id: "m1",
      user_id: userId,
      memory_type: "semantic",
      content: "You love grilled peaches with a drizzle of honey.",
      salience: 0.85,
      sensitive: false,
      usage_count: 2,
      last_used_at: null,
      cooldown_until: null,
      topic_tags: ["food", "fruit", "summer"],
      source: "seed",
      created_at: nowISO(),
      updated_at: nowISO(),
    },
    {
      id: "m2",
      user_id: userId,
      memory_type: "relational",
      content: "Amanda suggested adding goat cheese to your salads.",
      salience: 0.7,
      sensitive: false,
      usage_count: 1,
      last_used_at: null,
      cooldown_until: null,
      topic_tags: ["people", "salad", "cheese"],
      source: "seed",
      created_at: nowISO(),
      updated_at: nowISO(),
    },
    {
      id: "m3",
      user_id: userId,
      memory_type: "semantic",
      content: "You hate buffalo sauce and prefer milder flavors.",
      salience: 0.9,
      sensitive: false,
      usage_count: 3,
      last_used_at: null,
      cooldown_until: null,
      topic_tags: ["food", "preference"],
      source: "seed",
      created_at: nowISO(),
      updated_at: nowISO(),
    },
    {
      id: "m4",
      user_id: userId,
      memory_type: "episodic",
      content: "After the sea urchin incident in Dry Tortugas, you stick to familiar seafood.",
      salience: 0.8,
      sensitive: false,
      usage_count: 1,
      last_used_at: null,
      cooldown_until: null,
      topic_tags: ["travel", "seafood", "memory"],
      source: "seed",
      created_at: nowISO(),
      updated_at: nowISO(),
    },
  ];
}
