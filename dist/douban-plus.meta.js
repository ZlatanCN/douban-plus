// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.4.1
// @author       Gabriel Zhu
// @description  适配 ScriptCat 和 Tampermonkey 的豆瓣电影详情页增强脚本，用 Preact 重排 Apple TV 风格暗色界面，并保留豆瓣原生登录、标记和跳转能力。
// @license      MIT
// @copyright    Gabriel Zhu (MIT)
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iOTQiIGhlaWdodD0iOTQiIHJ4PSIyMCIgZmlsbD0iIzFjMWMxZSIvPgogIDxyZWN0IHg9IjE0IiB5PSIyNCIgd2lkdGg9IjcyIiBoZWlnaHQ9IjUyIiByeD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEuOCIvPgogIDxjaXJjbGUgY3g9IjcyIiBjeT0iNjIiIHI9IjgiIGZpbGw9IiM0MmJkNTYiLz4KPC9zdmc+Cg==
// @icon64       data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iOTQiIGhlaWdodD0iOTQiIHJ4PSIyMCIgZmlsbD0iIzFjMWMxZSIvPgogIDxyZWN0IHg9IjE0IiB5PSIyNCIgd2lkdGg9IjcyIiBoZWlnaHQ9IjUyIiByeD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEuOCIvPgogIDxjaXJjbGUgY3g9IjcyIiBjeT0iNjIiIHI9IjgiIGZpbGw9IiM0MmJkNTYiLz4KPC9zdmc+Cg==
// @homepageURL  https://github.com/ZlatanCN/douban-plus
// @supportURL   https://github.com/ZlatanCN/douban-plus/issues
// @downloadURL  https://raw.githubusercontent.com/ZlatanCN/douban-plus/master/dist/douban-plus.user.js
// @updateURL    https://raw.githubusercontent.com/ZlatanCN/douban-plus/master/dist/douban-plus.meta.js
// @include      https://accounts.douban.com/passport/login*
// @match        *://movie.douban.com/subject/*
// @match        *://www.douban.com/personage/*
// @match        *://accounts.douban.com/passport/login*
// @exclude      *://movie.douban.com/subject/*/all_photos
// @exclude      *://movie.douban.com/subject/*/photos*
// @exclude      *://movie.douban.com/subject/*/photos[?]*
// @exclude      *://movie.douban.com/subject/*/comments*
// @exclude      *://movie.douban.com/subject/*/comments[?]*
// @exclude      *://movie.douban.com/subject/*/reviews*
// @exclude      *://movie.douban.com/subject/*/reviews[?]*
// @tag          douban
// @tag          豆瓣
// @tag          movie
// @tag          电影
// @tag          enhancement
// @tag          增强
// @tag          rating
// @tag          评分
// @tag          apple-tv
// @tag          dark-mode
// @tag          暗色模式
// @tag          redesign
// @tag          tampermonkey
// @tag          scriptcat
// @tag          userscript
// @tag          油猴脚本
// @connect      douban.com
// @connect      movie.douban.com
// @connect      graphql.imdb.com
// @connect      www.rottentomatoes.com
// @connect      www.metacritic.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @noframes
// ==/UserScript==