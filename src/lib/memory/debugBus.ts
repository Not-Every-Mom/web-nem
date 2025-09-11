export type MemoryDebugEventType =
  | "retrieval:start"
  | "retrieval:filtered"
  | "retrieval:scored"
  | "retrieval:selected"
  | "engine:init"
  | "engine:stats"
  | "engine:error"
  | "storage:read"
  | "storage:write"
  | "storage:quota"
  | "ann:search"
  | "ann:add"
  | "ann:rebuild"
  | "ann:save"
  | "crypto:encrypt"
  | "crypto:decrypt"
  | "crypto:keygen"
  | "crypto:unlock"
  | "sync:upload"
  | "sync:download"
  | "sync:conflict"
  | "sync:error"
  | "test:start"
  | "test:step"
  | "test:complete"
  | "test:error"
  | "analytics:start"
  | "analytics:complete"
  | "analytics:error";

export interface MemoryDebugEvent {
  type: MemoryDebugEventType;
  payload: unknown;
  timestamp: number;
  source?: 'worker' | 'client' | 'test';
}

type Listener = (event: MemoryDebugEvent) => void;

const listeners = new Set<Listener>();

export function emitMemoryDebugEvent(type: MemoryDebugEventType, payload: unknown) {
  const evt: MemoryDebugEvent = { type, payload, timestamp: Date.now() };
  listeners.forEach((cb) => {
    try {
      cb(evt);
    } catch {
      // Ignore callback errors to prevent breaking debug system
    }
  });
  return evt;
}

export function subscribeMemoryDebugEvents(cb: Listener) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
