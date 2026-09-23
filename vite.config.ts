import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    TanStackRouterVite(),
    tanstackStart({
      // Static SPA build: emits the prerendered shell into the client output
      // directory so Vercel can serve it as a static site (see vercel.json).
      spa: {
        enabled: true,
      },
    }),
    react(),
    tailwindcss(),
  ],
});
