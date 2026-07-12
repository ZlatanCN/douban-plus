// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.2.7
// @author       Gabriel Zhu
// @description  适配 ScriptCat 和 Tampermonkey 的豆瓣电影详情页增强脚本，用 Preact 重排 Apple TV 风格暗色界面，并保留豆瓣原生登录、标记和跳转能力。
// @license      MIT
// @include      https://accounts.douban.com/passport/login*
// @match        *://movie.douban.com/subject/*
// @match        *://accounts.douban.com/passport/login*
// @exclude      *://movie.douban.com/subject/*/all_photos
// @exclude      *://movie.douban.com/subject/*/photos*
// @exclude      *://movie.douban.com/subject/*/photos[?]*
// @exclude      *://movie.douban.com/subject/*/comments*
// @exclude      *://movie.douban.com/subject/*/comments[?]*
// @exclude      *://movie.douban.com/subject/*/reviews*
// @exclude      *://movie.douban.com/subject/*/reviews[?]*
// @connect      douban.com
// @connect      movie.douban.com
// @connect      graphql.imdb.com
// @connect      www.rottentomatoes.com
// @connect      www.metacritic.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==