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
        namespace: "https://github.com/zhujiayou/douban-appletv-beautify",
        version: "1.0.1",
        description:
          "将豆瓣电影/电视剧详情页重塑为 Apple TV+ 风格的高级沉浸式页面，保留豆瓣绿作为强调色",
        author: "Sisyphus",
        license: "MIT",
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
