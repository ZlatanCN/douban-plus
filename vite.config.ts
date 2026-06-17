import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  build: {
    cssMinify: false,
    minify: false,
  },
  plugins: [
    monkey({
      build: {
        autoGrant: true,
        fileName: "douban-plus.user.js",
        metaFileName: true,
      },
      entry: "src/main.ts",
      server: {
        open: true,
        prefix: "dev:",
      },
      userscript: {
        grant: ["GM_addStyle"],
        match: ["*://movie.douban.com/subject/*"],
        name: "Douban Plus",
        namespace: "https://github.com/ZlatanCN/douban-plus",
        "run-at": "document-end",
      },
    }),
  ],
});
