// Thin facade: re-export the refactored crypto worker implementation to preserve import path
export { CryptoWorkerModule } from './cryptoWorkerFacade.impl';
export * from './types';
