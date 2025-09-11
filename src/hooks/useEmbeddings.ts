
import { useEffect, useState, useCallback, useMemo } from "react";
import { ensureEmbeddingsReady, getEmbeddingsStatus, EmbeddingsInitStatus, resetEmbeddings } from "@/lib/embeddings";

export function useEmbeddings() {
  const [state, setState] = useState<EmbeddingsInitStatus>(getEmbeddingsStatus());

  useEffect(() => {
    let mounted = true;
    // Subscribe to cross-tab updates
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("embeddings-status");
      bc.onmessage = (e) => {
        if (mounted && e?.data) setState(e.data as EmbeddingsInitStatus);
      };
    } catch (e) {
      // BroadcastChannel may be unavailable in some environments (e.g. older browsers,
      // restrictive iframes). Log a warning but continue — embedding warmup will
      // proceed in this tab regardless.
      // eslint-disable-next-line no-console
      console.warn("useEmbeddings: BroadcastChannel unavailable or failed", e);
    }

    if (!state.isReady && !state.isLoading) {
      ensureEmbeddingsReady()
        .then(() => mounted && setState(getEmbeddingsStatus()))
        .catch(() => mounted && setState(getEmbeddingsStatus()));
    }
    return () => {
      mounted = false;
      try {
        bc?.close();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("useEmbeddings: closing BroadcastChannel failed", e);
      }
    };
    // Re-run when readiness/loading change so we can kick off warmup if needed
  }, [state.isReady, state.isLoading]);

  const ensureReady = useCallback(async () => {
    setState(prev => {
      if (prev.isReady) return prev;
      return { ...prev, isLoading: true };
    });
    try {
      await ensureEmbeddingsReady();
    } finally {
      setState(getEmbeddingsStatus());
    }
  }, []);

  const retry = useCallback(async () => {
    resetEmbeddings();
    setState(getEmbeddingsStatus());
    await ensureReady();
  }, [ensureReady]);

  return useMemo(() => ({
    isLoading: state.isLoading,
    isReady: state.isReady,
    error: state.error,
    progress: state.progress,
    etaSeconds: state.etaSeconds,
    device: state.device,
    lastWarmupMs: state.lastWarmupMs,
    ensureReady,
    retry,
  }), [state, ensureReady, retry]);
}
