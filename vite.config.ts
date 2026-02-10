import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("/react-dom/") || id.includes("/react/"))
              return "react-vendor"
            if (id.includes("/@supabase/")) return "supabase-vendor"
            if (id.includes("/react-router")) return "router-vendor"
            if (id.includes("/radix-ui/")) return "radix-vendor"
            if (
              id.includes("/class-variance-authority/") ||
              id.includes("/clsx/") ||
              id.includes("/tailwind-merge/") ||
              id.includes("/sonner/") ||
              id.includes("/next-themes/")
            )
              return "ui-vendor"
          }
        },
      },
    },
  },
})
