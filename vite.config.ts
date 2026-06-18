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
        connect: ["douban.com", "movie.douban.com"],
        exclude: [
          "*://movie.douban.com/subject/*/all_photos",
          "*://movie.douban.com/subject/*/photos*",
          "*://movie.douban.com/subject/*/photos[?]*",
          "*://movie.douban.com/subject/*/comments*",
          "*://movie.douban.com/subject/*/comments[?]*",
        ],
        grant: ["GM_addStyle", "GM_xmlhttpRequest"],
        match: ["*://movie.douban.com/subject/*"],
        name: "Douban Plus",
        namespace: "https://github.com/ZlatanCN/douban-plus",
        "run-at": "document-end",
      },
    }),
  ],
});
