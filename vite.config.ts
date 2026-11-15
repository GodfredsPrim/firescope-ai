import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localApi } from "./server/local-api.mjs";
import { contextApi } from './server/context-api.mjs';
export default defineConfig(({ mode }) => {
  const middleware = localApi(loadEnv(mode, process.cwd(), ''));
  const context = contextApi(loadEnv(mode, process.cwd(), ''));
  return { plugins: [react(), {
    name: 'private-local-api',
    configureServer(server) { server.middlewares.use(context); server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(context); server.middlewares.use(middleware); },
  }] };
});
