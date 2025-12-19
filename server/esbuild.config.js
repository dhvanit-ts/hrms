import path from "node:path"
import { build } from "esbuild"
import alias from "esbuild-plugin-alias"

await build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  sourcemap: true,
  target: ["node18"],
  outdir: "dist",
  plugins: [
    alias({
      "@/": path.join(process.cwd(), "src") + "/"
    })
  ],
  logLevel: "info",
  packages: "external"
})
