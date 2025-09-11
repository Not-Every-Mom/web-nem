
import { embedTexts, cosineSimilarity } from "@/lib/embeddings";
import { MemoryItem } from "./types";
import { emitMemoryDebugEvent } from "./debugBus";

export type RetrievalOptions = {
  now?: Date;
  maxResults?: number;
  diversity?: number; // 0..1, higher means more diversity (MMR lambda)
  penalizeRecentReuseMinutes?: number; // cooldown soft-penalty
  respectCooldown?: boolean;
  respectSensitive?: boolean;
  rememberSensitive?: boolean;
};

function notInCooldown(m: MemoryItem, now: Date) {
  if (!m.cooldown_until) return true;
  return new Date(m.cooldown_until) <= now;
}

function recencyBoost(m: MemoryItem, now: Date) {
  // Slightly prefer more recent memories but avoid overfitting
  const created = new Date(m.created_at).getTime();
  const ageDays = Math.max(0, (now.getTime() - created) / (1000 * 60 * 60 * 24));
  const boost = Math.max(0.85, 1 - ageDays / 365); // within a year ~ up to +15%
  return boost;
}

function reusePenalty(m: MemoryItem, now: Date, windowMin: number) {
  if (!m.last_used_at) return 1;
  const deltaMin = (now.getTime() - new Date(m.last_used_at).getTime()) / (1000 * 60);
  if (deltaMin < windowMin) {
    return 0.8; // soft penalty if reused too soon
  }
  return 1;
}

export async function retrieveRelevantMemories(
  query: string,
  candidates: MemoryItem[],
  opts: RetrievalOptions = {}
) {
  const now = opts.now ?? new Date();
  try { emitMemoryDebugEvent('retrieval:start', { query, candidatesCount: candidates.length }); } catch {}
  // Filter by sensitive and cooldown hard filter
  let filtered = candidates.filter((m) => {
    if (opts.respectSensitive && m.sensitive && !opts.rememberSensitive) return false;
    if (opts.respectCooldown && !notInCooldown(m, now)) return false;
    return true;
  });
  try { emitMemoryDebugEvent('retrieval:filtered', { filteredCount: filtered.length }); } catch {}

  if (filtered.length === 0) return [];

  const texts = [query, ...filtered.map((m) => m.content)];
  const embeddings = await embedTexts(texts);
  const queryVec = embeddings[0];
  const memVecs = embeddings.slice(1);

  // Base score: cosine similarity
  const baseScores = memVecs.map((v) => cosineSimilarity(queryVec, v));

  // Combine with salience, recency, and soft reuse penalty
  const combined = filtered.map((m, i) => {
    const sim = baseScores[i];
    const sal = Math.min(1, Math.max(0, m.salience));
    const rec = recencyBoost(m, now);
    const reuse = reusePenalty(m, now, opts.penalizeRecentReuseMinutes ?? 120);
    const score = sim * 0.7 + sal * 0.2 + (rec * 0.1);
    return { mem: m, vec: memVecs[i], score: score * reuse, sim };
  });
  try { emitMemoryDebugEvent('retrieval:scored', { items: combined.map(({ mem, score, sim }) => ({ id: mem.id, salience: mem.salience, sim, score })) }); } catch {}

  // Sort by score desc
  combined.sort((a, b) => b.score - a.score);

  // MMR for diversity
  const lambda = opts.diversity ?? 0.7;
  const k = Math.min(opts.maxResults ?? 3, combined.length);
  const selected: typeof combined = [];
  const rest = [...combined];

  while (selected.length < k && rest.length > 0) {
    if (selected.length === 0) {
      selected.push(rest.shift()!);
      continue;
    }
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < rest.length; i++) {
      const cand = rest[i];
      // diversity penalty: max sim to selected
      let maxSim = -Infinity;
      for (const s of selected) {
        const sim = cosineSimilarity(cand.vec, s.vec);
        if (sim > maxSim) maxSim = sim;
      }
      const mmr = lambda * cand.score - (1 - lambda) * (maxSim === -Infinity ? 0 : maxSim);
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIdx = i;
      }
    }
    selected.push(rest.splice(bestIdx, 1)[0]);
  }

  const result = selected.map((s) => s.mem);
  try { emitMemoryDebugEvent('retrieval:selected', { selected: result.map((m) => ({ id: m.id, contentPreview: m.content.slice(0, 80) })) }); } catch {}
  return result;
}
