import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/", // or the full public URL if using a custom domain
  // Worker configuration to handle SharedWorker with heavy dependencies
  worker: {
    format: 'es',
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  // Build optimization for workers - disable code splitting for workers
  build: {
    rollupOptions: {
      output: {
        // Ensure proper handling of worker chunks - bundle everything together
        manualChunks: (id) => {
          // Force all worker dependencies into a single chunk to avoid splitting
          if (id.includes('/workers/') ||
              (id.includes('/lib/memory/') && !id.includes('.d.ts'))) {
            return undefined; // Let Rollup handle bundling automatically
          }
        },
      },
    },
  },
}));
