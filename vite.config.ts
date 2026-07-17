import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  build: {
    cssMinify: false,
    minify: false,
  },
  plugins: [
    preact(),
    monkey({
      build: {
        autoGrant: true,
        fileName: "douban-plus.user.js",
        metaFileName: true,
      },
      entry: "src/main.ts",
      server: {
        mountGmApi: true,
        open: true,
        prefix: "dev:",
      },
      userscript: {
        connect: [
          "douban.com",
          "movie.douban.com",
          "graphql.imdb.com",
          "www.rottentomatoes.com",
          "www.metacritic.com",
        ],
        copyright: "Gabriel Zhu (MIT)",
        downloadURL:
          "https://raw.githubusercontent.com/ZlatanCN/douban-plus/master/dist/douban-plus.user.js",
        exclude: [
          "*://movie.douban.com/subject/*/all_photos",
          "*://movie.douban.com/subject/*/photos*",
          "*://movie.douban.com/subject/*/photos[?]*",
          "*://movie.douban.com/subject/*/comments*",
          "*://movie.douban.com/subject/*/comments[?]*",
          "*://movie.douban.com/subject/*/reviews*",
          "*://movie.douban.com/subject/*/reviews[?]*",
        ],
        grant: ["GM_addStyle", "GM_xmlhttpRequest"],
        homepageURL: "https://github.com/ZlatanCN/douban-plus",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iOTQiIGhlaWdodD0iOTQiIHJ4PSIyMCIgZmlsbD0iIzFjMWMxZSIvPgogIDxyZWN0IHg9IjE0IiB5PSIyNCIgd2lkdGg9IjcyIiBoZWlnaHQ9IjUyIiByeD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEuOCIvPgogIDxjaXJjbGUgY3g9IjcyIiBjeT0iNjIiIHI9IjgiIGZpbGw9IiM0MmJkNTYiLz4KPC9zdmc+Cg==",
        icon64:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iOTQiIGhlaWdodD0iOTQiIHJ4PSIyMCIgZmlsbD0iIzFjMWMxZSIvPgogIDxyZWN0IHg9IjE0IiB5PSIyNCIgd2lkdGg9IjcyIiBoZWlnaHQ9IjUyIiByeD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEuOCIvPgogIDxjaXJjbGUgY3g9IjcyIiBjeT0iNjIiIHI9IjgiIGZpbGw9IiM0MmJkNTYiLz4KPC9zdmc+Cg==",
        include: ["https://accounts.douban.com/passport/login*"],
        match: [
          "*://movie.douban.com/subject/*",
          "*://accounts.douban.com/passport/login*",
        ],
        name: "Douban Plus",
        namespace: "https://github.com/ZlatanCN/douban-plus",
        noframes: true,
        "run-at": "document-start",
        supportURL: "https://github.com/ZlatanCN/douban-plus/issues",
        tag: [
          "douban",
          "豆瓣",
          "movie",
          "电影",
          "enhancement",
          "增强",
          "rating",
          "评分",
          "apple-tv",
          "dark-mode",
          "暗色模式",
          "redesign",
          "tampermonkey",
          "scriptcat",
          "userscript",
          "油猴脚本",
        ],
        updateURL:
          "https://raw.githubusercontent.com/ZlatanCN/douban-plus/master/dist/douban-plus.meta.js",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": new URL("src", import.meta.url).pathname,
    },
  },
});
