import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocalMemoryEngine, type AddMemoryItem, localEngineClient } from '@/lib/memory/localEngineClient';
import { useEmbeddings } from '@/hooks/useEmbeddings';

export function useLocalMemory(kek?: string, enabled = true) {
  const { ensureReady, isReady } = useEmbeddings();
  const [engineReady, setEngineReady] = useState(false);
  const [encrypted, setEncrypted] = useState<boolean>(false);
  const [workerType, setWorkerType] = useState<'SharedWorker' | 'Worker' | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!enabled) {
        if (mounted) setEngineReady(false);
        return;
      }
      try {
        await ensureReady();
        const res = await LocalMemoryEngine.init(kek);
        if (!mounted) return;
        setEncrypted(!!res.encrypted);
        setEngineReady(true);
        // Detect worker type
        setWorkerType(typeof SharedWorker !== 'undefined' ? 'SharedWorker' : 'Worker');
      } catch (e) {
        console.error('LocalMemoryEngine init failed', e);
        setEngineReady(false);
      }
    })();
    return () => { mounted = false; };
  }, [kek, ensureReady, enabled]);

  const addMemory = useCallback(async (item: AddMemoryItem & { embedFromText?: boolean }) => {
    if (!enabled) throw new Error('Local memory engine is disabled');
    let embedding = item.embedding;
    if (!embedding && item.embedFromText) {
      // Embed with on-device model
      const { embedText } = await import('@/lib/embeddings');
      const embeddingArray = await embedText(item.content);
      embedding = new Float32Array(embeddingArray);
    }
    return LocalMemoryEngine.addMemory({ ...item, embedding });
  }, [enabled]);

  const search = useCallback(async (query: string, maxResults = 5) => {
    if (!enabled) return [];
    const { embedText } = await import('@/lib/embeddings');
    const embeddingArray = await embedText(query);
    const q = new Float32Array(embeddingArray);
    return LocalMemoryEngine.searchByEmbedding(q, maxResults);
  }, [enabled]);

  const exportData = useCallback(async (): Promise<ArrayBuffer> => {
    if (!enabled) throw new Error('Local memory engine is disabled');
    return localEngineClient.exportData();
  }, [enabled]);

  const importData = useCallback(async (data: ArrayBuffer): Promise<void> => {
    if (!enabled) throw new Error('Local memory engine is disabled');
    return localEngineClient.importData(data);
  }, [enabled]);

  const getStats = useCallback(async () => {
    if (!enabled) return { node_count: 0 };
    return localEngineClient.getStats();
  }, [enabled]);

  const rebuildANNIndex = useCallback(async (): Promise<void> => {
    if (!enabled) throw new Error('Local memory engine is disabled');
    return localEngineClient.rebuildANNIndex();
  }, [enabled]);

  const getANNStats = useCallback(async () => {
    if (!enabled) return { currentElements: 0, maxElements: 0, dimension: 0, isIndexed: false };
    return localEngineClient.getANNStats();
  }, [enabled]);

  return useMemo(() => ({
    isReady: engineReady && isReady && enabled,
    encrypted,
    workerType,
    enabled,
    addMemory,
    search,
    persist: () => enabled ? LocalMemoryEngine.persist() : Promise.resolve(),
    clear: () => enabled ? LocalMemoryEngine.clear() : Promise.resolve(),
    exportData,
    importData,
    getStats,
    rebuildANNIndex,
    getANNStats,
  }), [engineReady, isReady, encrypted, workerType, enabled, addMemory, search, exportData, importData, getStats, rebuildANNIndex, getANNStats]);
}
