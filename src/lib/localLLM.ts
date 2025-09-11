/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lightweight in-browser LLM helper (lazy singleton) with adaptive model selection.
 * - Prefers WebGPU and device capability to attempt a slightly larger model (flan-t5-small)
 *   for better demo quality on capable devices.
 * - Falls back to a very small model (LaMini-Flan-T5-77M) for low-power devices.
 *
 * Behavior:
 * - pickModel() decides which model to try based on navigator features.
 * - getLocalGenerator() lazily creates a pipeline for the chosen model and caches it.
 * - generateLocalReply() calls the generator and extracts `generated_text`.
 *
 * Notes:
 * - First load may take several seconds to download/compile the model.
 * - We keep types loose for the pipeline object because transformers runtime shapes vary.
 */

import { pipeline } from '@huggingface/transformers';

let generatorPromise: Promise<any | null> | null = null;
let selectedModelName: string | null = null;

/**
 * Heuristic to detect whether device is likely capable of running the larger model.
 * - prefer WebGPU (navigator.gpu) when present
 * - require at least 4GB deviceMemory and >=4 logical CPU cores
 */
function prefersBigModel(): boolean {
  try {
    const deviceMemory = (navigator as any).deviceMemory || 0;
    const hwConcurrency = navigator.hardwareConcurrency || 2;
    const hasWebGPU = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
    return !!hasWebGPU && deviceMemory >= 4 && hwConcurrency >= 4;
  } catch {
    return false;
  }
}

/**
 * Select which model to attempt to load.
 * - If device looks capable, try flan-t5-small for better quality.
 * - Otherwise use LaMini for compactness.
 */
function pickModel(): string {
  if (prefersBigModel()) {
    return 'Xenova/flan-t5-small';
  }
  return 'Xenova/LaMini-Flan-T5-77M';
}

/**
 * Expose the chosen model name (useful for UI/warm-up messages).
 */
export function getSelectedModelName(): string | null {
  return selectedModelName;
}

/**
 * Warm the local generator (optional explicit call).
 * This triggers lazy load and caches the pipeline.
 */
export async function warmLocalGenerator(): Promise<void> {
  await getLocalGenerator();
}

export async function getLocalGenerator(): Promise<any | null> {
  if (generatorPromise) return generatorPromise;

  generatorPromise = (async () => {
    try {
      // Device selection for compute backend: prefer WebGPU else wasm
      const device = (typeof navigator !== 'undefined' && (navigator as any).gpu) ? 'webgpu' : 'wasm';

      // Decide model adaptively
      const model = pickModel();
      selectedModelName = model;

      // Small safety: if WebGPU not available for the chosen model, we still allow wasm fallback
      // Create the pipeline (transformers runtime will fetch and cache model files)
      const gen = await pipeline('text2text-generation', model, { device });

      return gen as any;
    } catch (e) {
      // If loading fails, try a fallback (LaMini) unless we already tried it
      // eslint-disable-next-line no-console
      console.warn('[local-llm] initial generator load failed', e);

      // If we initially tried the bigger model, fallback to LaMini
      if (selectedModelName && selectedModelName !== 'Xenova/LaMini-Flan-T5-77M') {
        try {
          const fallbackDevice = (typeof navigator !== 'undefined' && (navigator as any).gpu) ? 'webgpu' : 'wasm';
          const fallbackModel = 'Xenova/LaMini-Flan-T5-77M';
          selectedModelName = fallbackModel;
          const genFallback = await pipeline('text2text-generation', fallbackModel, { device: fallbackDevice });
          return genFallback as any;
        } catch (e2) {
          // eslint-disable-next-line no-console
          console.warn('[local-llm] fallback generator load failed', e2);
          return null;
        }
      }

      return null;
    }
  })();

  return generatorPromise;
}

export async function generateLocalReply(prompt: string, opts?: { max_new_tokens?: number; temperature?: number; repetition_penalty?: number; }) {
  try {
    const gen = await getLocalGenerator();
    if (!gen) throw new Error('local-generator-unavailable');

    const { max_new_tokens = 120, temperature = 0.8, repetition_penalty = 1.1 } = opts || {};

    const out = await gen(prompt, { max_new_tokens, temperature, repetition_penalty });

    // Output shape may vary; try to extract generated_text
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const text = (Array.isArray(out) ? (out as any)[0]?.generated_text : (out as any)?.generated_text) || '';
    return String(text).trim();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[local-llm] generateLocalReply failed', e);
    throw e;
  }
}
