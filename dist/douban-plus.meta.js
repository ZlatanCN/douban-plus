// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.0.0
// @author       Gabriel Zhu
// @description  A Tampermonkey/ScriptCat userscript that transforms Douban movie & TV detail pages into an immersive Apple TV+ dark UI — featuring a hero banner with blurred backdrop, HD poster preview, streaming source cards, horizontal cast carousel, photo wall with lightbox, comments grid, recommendations, and a full interest-marking modal with rating & short review, while preserving all original Douban links and the iconic Douban green (#41be5d) accent.
// @license      MIT
// @match        *://movie.douban.com/subject/*
// @exclude      *://movie.douban.com/subject/*/all_photos
// @exclude      *://movie.douban.com/subject/*/photos*
// @exclude      *://movie.douban.com/subject/*/photos[?]*
// @exclude      *://movie.douban.com/subject/*/comments*
// @exclude      *://movie.douban.com/subject/*/comments[?]*
// @connect      douban.com
// @connect      movie.douban.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==