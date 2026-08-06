import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Expose /healthz sur le serveur de développement (S1-09).
 *
 * En production c'est nginx qui répond (cf. nginx.conf) ; sans ce plugin le
 * healthcheck Docker du mode dev interrogerait une route inexistante et Vite
 * renverrait index.html, donc un 200 trompeur.
 */
function healthzPlugin(): Plugin {
  return {
    name: 'taskforge-healthz',
    configureServer(server) {
      server.middlewares.use('/healthz', (_requete, reponse) => {
        reponse.statusCode = 200;
        reponse.setHeader('Content-Type', 'application/json');
        reponse.end(JSON.stringify({ status: 'ok', service: 'frontend' }));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), healthzPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      // nécessaire pour le hot-reload dans un conteneur avec un volume monté depuis Windows
      usePolling: true,
    },
  },
});
