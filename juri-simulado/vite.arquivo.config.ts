import { defineConfig, mergeConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import base from "./vite.config";

// Gera um único HTML com tudo embutido, para abrir sem servidor (inclusive no celular).
export default mergeConfig(
  base,
  defineConfig({
    plugins: [viteSingleFile()],
    build: { outDir: "dist-arquivo" },
  }),
);
