import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // server: {
  //   allowedHosts: ["https://0b8d-2409-40c1-3f-71f1-6268-fc31-6e5-1614.ngrok-free.app/"]
  // },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
