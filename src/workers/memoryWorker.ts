// Thin facade: expose the refactored memory worker implementation while preserving original path
import * as Comlink from 'comlink';
import { API as MemoryEngineAPI } from './memoryWorker.impl';

/* Handle SharedWorker connections.
   Use a runtime check for 'onconnect' to avoid relying on the
   SharedWorkerGlobalScope type which may not be present in TS libs. */
if ('onconnect' in self) {
  (self as any).onconnect = (e: MessageEvent) => {
    const port = (e as any).ports[0];
    console.log('SharedWorker: New connection established (facade)');
    Comlink.expose(MemoryEngineAPI, port);
  };
} else {
  // Regular Worker fallback
  console.log('Worker: Regular worker mode (facade)');
  Comlink.expose(MemoryEngineAPI);
}

// Export the API type for consumers
export { MemoryEngineAPI };
