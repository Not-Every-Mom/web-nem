import { MemoryItem } from "./types";

function casualParaphrase(content: string) {
  const lower = content.toLowerCase();

  // Examples of light paraphrasing to avoid verbatim repeats
  if (lower.includes("grilled peaches")) return "that grilled fruit you like";
  if (lower.includes("goat cheese")) return "Amanda's goat cheese idea";
  if (lower.includes("buffalo sauce")) return "milder flavors";
  if (lower.includes("dry tortugas") || lower.includes("sea urchin"))
    return "that past sea-urchin adventure";

  // Generic softening
  return "that thing you like";
}

export function weaveAcknowledgment(query: string, memory?: MemoryItem): string | undefined {
  if (!memory) return undefined;
  const hint = casualParaphrase(memory.content);
  // Return only a short private hint; never shown directly to user
  return hint;
}
