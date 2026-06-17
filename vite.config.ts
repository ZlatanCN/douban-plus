import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  build: {
    cssMinify: false,
    minify: false,
  },
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "Douban Plus",
        namespace: "https://github.com/ZlatanCN/douban-plus",
        match: ["*://movie.douban.com/subject/*"],
        "run-at": "document-end",
        grant: ["GM_addStyle"],
      },
      server: {
        open: true,
        prefix: "dev:",
      },
      build: {
        fileName: "douban-plus.user.js",
        metaFileName: true,
        autoGrant: true,
      },
    }),
  ],
});
