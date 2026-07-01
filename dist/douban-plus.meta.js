// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.0.2
// @author       Gabriel Zhu
// @description  一款适配 ScriptCat / Tampermonkey 的油猴脚本，将豆瓣电影与电视剧详情页重塑为 Apple TV+ 沉浸式暗色 UI。支持模糊背景 Hero 横幅、HD 海报预览、流媒体来源卡片、演员横滑轮播、剧照墙与大图查看、短评网格、推荐作品列表，以及带评分和短评的想看/看过标记弹窗，保留所有原始豆瓣链接与经典豆瓣绿 (#41be5d) 强调色。
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