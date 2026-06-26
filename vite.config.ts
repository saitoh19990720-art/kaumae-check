import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages（main/docs）配信用に base './'＋docs出力
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "docs" },
});
