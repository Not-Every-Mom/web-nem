
import { pipeline } from "@huggingface/transformers";

let extractorPromise: Promise<any> | null = null;
let deviceUsed: "webgpu" | "wasm" | undefined;

export type EmbeddingsInitStatus = {
  isLoading: boolean;
  isReady: boolean;
  progress?: number; // 0-100
  etaSeconds?: number; // rough estimate
  device?: "webgpu" | "wasm";
  lastWarmupMs?: number;
  error?: string;
};

let status: EmbeddingsInitStatus = { isLoading: false, isReady: false };

// Broadcast status across tabs so only one needs to warm up
let bc: BroadcastChannel | null = null;
function getBC() {
  if (typeof BroadcastChannel !== "undefined") {
    bc ??= new BroadcastChannel("embeddings-status");
  }
  return bc;
}
function broadcast() {
  try {
    getBC()?.postMessage(status);
  } catch {}
}

export const getEmbeddingsStatus = () => status;

function setStatus(patch: Partial<EmbeddingsInitStatus>) {
  status = { ...status, ...patch };
  broadcast();
}

export function resetEmbeddings() {
  extractorPromise = null;
  deviceUsed = undefined;
  setStatus({ isLoading: false, isReady: false, progress: 0, etaSeconds: undefined, error: undefined });
}

function pickDevice(): "webgpu" | "wasm" {
  try {
    // Prefer WebGPU when available
    // @ts-ignore - navigator may be undefined in some environments
    const hasWebGPU = typeof navigator !== "undefined" && !!(navigator as any)?.gpu;
    return hasWebGPU ? "webgpu" : "wasm";
  } catch {
    return "wasm";
  }
}

export async function ensureEmbeddingsReady() {
  if (status.isReady) return;

  // If already initializing, wait for it
  if (extractorPromise) {
    await extractorPromise;
    setStatus({ isLoading: false, isReady: true, device: deviceUsed });
    return;
  }

  const start = (typeof performance !== "undefined" ? performance.now() : Date.now());

  async function initWith(device: "webgpu" | "wasm") {
    deviceUsed = device;
    setStatus({ isLoading: true, isReady: false, device, progress: 1, error: undefined });

    const startInner = (typeof performance !== "undefined" ? performance.now() : Date.now());

    extractorPromise = pipeline(
      "feature-extraction",
      "mixedbread-ai/mxbai-embed-xsmall-v1",
      {
        device,
        // Progress updates while models/weights are fetched and compiled
        progress_callback: (data: any) => {
          try {
            const loaded = Number(data?.loaded ?? 0);
            const total = Number(data?.total ?? 0);
            if (total > 0) {
              const pct = Math.min(100, Math.max(1, Math.round((loaded / total) * 100)));
              const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
              const elapsed = (now - startInner) / 1000;
              const eta = pct > 0 ? Math.max(0, Math.round((elapsed / pct) * (100 - pct))) : undefined;
              setStatus({ progress: pct, etaSeconds: eta, device });
            }
          } catch {}
        },
      } as any
    ).catch((err: any) => {
      // Do not clear status here; caller will handle fallback or error state
      extractorPromise = null;
      throw err;
    });

    await extractorPromise;
    const end = (typeof performance !== "undefined" ? performance.now() : Date.now());
    setStatus({ isLoading: false, isReady: true, progress: 100, etaSeconds: 0, device, lastWarmupMs: end - start });
  }

  // Try preferred device, fallback to WASM if WebGPU fails
  const preferred = pickDevice();
  try {
    await initWith(preferred);
  } catch (e: any) {
    if (preferred === "webgpu") {
      try {
        await initWith("wasm");
      } catch (e2: any) {
        setStatus({ isLoading: false, isReady: false, error: String(e2?.message || e2) });
        throw e2;
      }
    } else {
      setStatus({ isLoading: false, isReady: false, error: String(e?.message || e) });
      throw e;
    }
  }
}

function toList(output: any): number[] | number[][] {
  // transformers.js returns a Tensor with tolist()
  if (output && typeof output.tolist === "function") {
    return output.tolist();
  }
  return output;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  await ensureEmbeddingsReady();
  const extractor = await extractorPromise!;
  const out = await extractor(texts, { pooling: "mean", normalize: true });
  const list = toList(out) as number[] | number[][];
  return Array.isArray(list[0]) ? (list as number[][]) : [list as number[]];
}

export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}
