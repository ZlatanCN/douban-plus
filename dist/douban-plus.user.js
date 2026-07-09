// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.0.8
// @author       Gabriel Zhu
// @description  一款适配 ScriptCat / Tampermonkey 的油猴脚本，将豆瓣电影与电视剧详情页重塑为 Apple TV+ 沉浸式暗色 UI。支持模糊背景 Hero 横幅、HD 海报预览、流媒体来源卡片、演员横滑轮播、剧照墙与大图查看、短评网格、推荐作品列表，以及带评分和短评的想看/看过标记弹窗，保留所有原始豆瓣链接与经典豆瓣绿 (#41be5d) 强调色。
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

(function() {
	"use strict";
	var s$2 = new Set();
	var _css = async (t) => {
		if (s$2.has(t)) return;
		s$2.add(t);
		((c) => {
			if (typeof GM_addStyle === "function") GM_addStyle(c);
			else (document.head || document.documentElement).appendChild(document.createElement("style")).append(c);
		})(t);
	};
	var styles_default = "/* ATV stylesheet manifest.\n   Keep this file as the single CSS entry imported from main.ts.\n   Files are ordered to preserve the original cascade from the former giant stylesheet.\n   Do not wrap these imports in @layer: this userscript runs inside Douban pages,\n   and unlayered host author CSS would outrank layered ATV normal declarations. */\n\n:root {\n  --atv-bg-primary: #000000;\n  --atv-bg-secondary: #1c1c1e;\n  --atv-bg-tertiary: #2c2c2e;\n  --atv-bg-elevated: rgba(255, 255, 255, 0.06);\n  --atv-text-primary: #ffffff;\n  --atv-text-secondary: rgba(255, 255, 255, 0.72);\n  --atv-text-tertiary: rgba(255, 255, 255, 0.45);\n  --atv-accent: #41be5d;\n  --atv-accent-bright: #4cd97a;\n  --atv-accent-glow: rgba(65, 190, 93, 0.35);\n  --atv-rating-gold: #ffb800;\n  --atv-border-subtle: rgba(255, 255, 255, 0.08);\n  --atv-border-medium: rgba(255, 255, 255, 0.16);\n  --atv-radius-sm: 8px;\n  --atv-radius-md: 12px;\n  --atv-radius-lg: 16px;\n  --atv-radius-xl: 24px;\n}\n\nbody > #wrapper {\n  display: none !important;\n}\n\nbody {\n  padding: 0 !important;\n  margin: 0 !important;\n  background: #000 !important;\n}\n\n#db-global-nav,\n#db-nav-movie {\n  display: none !important;\n}\n\n[id^=\"dale_\"],\n[class*=\"dale_\"] {\n  display: none !important;\n}\n\n#atv-douban-root {\n  position: relative;\n  min-height: 100vh;\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  font-feature-settings: \"ss01\", \"cv11\";\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-primary);\n  opacity: 0;\n  animation: atv-fadein 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards;\n}\n\n@keyframes atv-fadein {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n\n@keyframes atv-rise {\n  from {\n    opacity: 0;\n    transform: translateY(14px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n#atv-douban-root *,\n#atv-douban-root *::before,\n#atv-douban-root *::after {\n  box-sizing: border-box;\n}\n\n#atv-douban-root a {\n  color: inherit;\n  text-decoration: none;\n}\n\n#atv-douban-root a:hover {\n  background: transparent;\n}\n\n#atv-douban-root img {\n  display: block;\n  max-width: 100%;\n}\n\n/* ---------- Sticky nav ---------- */\n\n.atv-stickynav {\n  position: fixed;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: 9999;\n  box-sizing: border-box;\n  display: flex;\n  gap: 24px;\n  align-items: center;\n  justify-content: space-between;\n  height: 56px;\n  padding: 0 max(28px, 5vw);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  pointer-events: none;\n  background: rgba(10, 10, 12, 0.74);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  opacity: 0;\n  -webkit-backdrop-filter: saturate(180%) blur(24px);\n  backdrop-filter: saturate(180%) blur(24px);\n  transform: translateY(-100%);\n  transition:\n    opacity 280ms ease,\n    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-stickynav.is-visible {\n  pointer-events: auto;\n  opacity: 1;\n  transform: none;\n}\n\n.atv-stickynav-title {\n  flex: 0 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: #fff;\n  white-space: nowrap;\n}\n\n.atv-stickynav-jumps {\n  display: flex;\n  flex: 0 0 auto;\n  gap: 24px;\n}\n\n.atv-stickynav-jumps a {\n  position: relative;\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.7);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  cursor: pointer;\n  transition: color 200ms ease;\n}\n\n.atv-stickynav-jumps a::after {\n  content: \"\";\n  position: absolute;\n  bottom: -4px;\n  left: 50%;\n  width: 0;\n  height: 2px;\n  background: var(--atv-accent);\n  border-radius: 1px;\n  transition:\n    width 250ms ease,\n    left 250ms ease;\n}\n\n.atv-stickynav-jumps a:hover {\n  color: var(--atv-accent-bright);\n  background: transparent;\n}\n\n.atv-stickynav-jumps a.is-active {\n  color: var(--atv-accent-bright);\n}\n\n.atv-stickynav-jumps a.is-active::after {\n  left: 0;\n  width: 100%;\n}\n\n@media (max-width: 768px) {\n  .atv-stickynav-title {\n    font-size: 14px;\n  }\n  .atv-stickynav-jumps {\n    gap: 14px;\n  }\n  .atv-stickynav-jumps a {\n    font-size: 12px;\n  }\n}\n\n/* ---------- Hero ---------- */\n\n.atv-hero {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  min-height: 75vh;\n  padding: 132px max(28px, 5vw) 56px;\n  overflow: visible;\n  isolation: isolate;\n}\n\n.atv-hero-inner-section {\n  flex: 0 0 auto;\n}\n\n.atv-hero-bg {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -4;\n  height: 75vh;\n  overflow: hidden;\n  background: #000;\n}\n\n.atv-hero-still {\n  position: absolute;\n  inset: 0;\n  background-repeat: no-repeat;\n  background-position: center 30%;\n  background-size: cover;\n  transform: scale(1.04);\n  backface-visibility: hidden;\n  will-change: transform, opacity;\n}\n\n.atv-hero-still.is-thumb {\n  filter: blur(12px) saturate(1.12) brightness(0.84);\n  transform: scale(1.14);\n}\n\n.atv-hero-still.is-hd {\n  opacity: 0;\n  filter: saturate(1.08) brightness(0.88);\n  transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.atv-hero-still.is-hd.is-loaded {\n  opacity: 1;\n  animation: atv-kenburns 22s ease-out forwards;\n}\n\n.atv-hero-still.is-poster {\n  background-position: center 22%;\n  filter: blur(60px) saturate(1.25) brightness(0.78);\n  transform: scale(1.25);\n}\n\n@keyframes atv-kenburns {\n  from {\n    transform: scale(1) translate(0, 0);\n  }\n  to {\n    transform: scale(1.1) translate(-1.8%, -1.2%);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-hero-still.is-hd.is-loaded {\n    transform: scale(1.04);\n    animation: none;\n  }\n}\n\n.atv-hero-vignette {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -3;\n  height: 75vh;\n  background: radial-gradient(\n    120% 90% at 70% 30%,\n    transparent 0%,\n    rgba(0, 0, 0, 0.55) 100%\n  );\n}\n\n.atv-hero-overlay-x {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -2;\n  height: 75vh;\n  background: linear-gradient(\n    to right,\n    rgba(0, 0, 0, 0.96) 0%,\n    rgba(0, 0, 0, 0.82) 32%,\n    rgba(0, 0, 0, 0.5) 62%,\n    rgba(0, 0, 0, 0.35) 100%\n  );\n}\n\n.atv-hero-overlay-y {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -1;\n  height: 75vh;\n  background: linear-gradient(\n    to bottom,\n    rgba(0, 0, 0, 0.45) 0%,\n    transparent 28%,\n    transparent 55%,\n    #000 100%\n  );\n}\n\n.atv-hero-inner {\n  display: flex;\n  gap: 56px;\n  align-items: flex-start;\n  width: 100%;\n  max-width: 1100px;\n  margin: 0 auto;\n}\n\n.atv-poster-card {\n  display: flex;\n  flex: 0 0 auto;\n  width: 360px;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  border: none;\n  padding: 0;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-lg);\n  box-shadow:\n    0 24px 60px rgba(0, 0, 0, 0.6),\n    0 0 0 1px var(--atv-border-subtle) inset;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-poster-card:hover {\n  transform: scale(1.03);\n}\n\n.atv-poster-card img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-poster-placeholder {\n  width: 100%;\n  height: 100%;\n}\n\n.atv-hero-info {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n.atv-hero-title {\n  margin: 0 0 8px;\n  font-size: clamp(44px, 5.5vw, 72px);\n  font-weight: 700;\n  line-height: 1.05;\n  color: #fff;\n  letter-spacing: -0.02em;\n  text-shadow:\n    0 2px 20px rgba(0, 0, 0, 0.7),\n    0 0 60px rgba(0, 0, 0, 0.3);\n}\n\n.atv-hero-orig {\n  margin-bottom: 22px;\n  font-size: clamp(18px, 1.6vw, 22px);\n  font-weight: 400;\n  color: var(--atv-text-secondary);\n  letter-spacing: -0.01em;\n  opacity: 0.85;\n}\n\n.atv-hero-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: center;\n  margin-bottom: 24px;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}\n\n.atv-meta-dot {\n  display: inline-flex;\n  align-items: center;\n}\n\n.atv-meta-dot + .atv-meta-dot::before {\n  margin-right: 14px;\n  color: var(--atv-text-tertiary);\n  content: \"·\";\n}\n\n.atv-meta-chips {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.atv-chip {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 11px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: none;\n  letter-spacing: 0.02em;\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: 999px;\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n\n/* ── Ratings Panel ──────────────────────────────── */\n\n/* Unified card presenting Douban + IMDb + RT side by side */\n\n.atv-rating-panel {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0;\n  align-items: stretch;\n  width: fit-content;\n  min-width: 320px;\n  margin-bottom: 28px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: var(--atv-radius-md);\n}\n\n.atv-rating-panel-douban,\n.atv-rating-panel-imdb,\n.atv-rating-panel-rt,\n.atv-rating-panel-mc {\n  flex: 1;\n  display: grid;\n  grid-template-rows: 28px 44px 20px 1fr;\n  justify-items: center;\n  align-items: center;\n  padding: 16px 24px 14px;\n  text-align: center;\n  transition: background 200ms ease;\n}\n\n.atv-rating-panel-douban:hover,\n.atv-rating-panel-imdb:hover,\n.atv-rating-panel-rt:hover,\n.atv-rating-panel-mc:hover {\n  background: rgba(255, 255, 255, 0.03);\n}\n\n.atv-rating-panel-douban {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-imdb {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-mc {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-logo {\n  display: inline-flex;\n  align-items: center;\n  align-self: center;\n  opacity: 0.85;\n  transition: opacity 200ms ease;\n}\n\n.atv-rating-panel-logo:hover {\n  opacity: 1;\n}\n\n.atv-rating-panel-logo svg {\n  display: block;\n}\n\n.atv-rating-panel .atv-rating-panel-score {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 38px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n  color: var(--atv-text-primary);\n}\n\n/* ── MC Score color by range ────────────────────── */\n\n.atv-rating-panel-score.is-high {\n  color: #3bb33b;\n}\n\n.atv-rating-panel-score.is-medium {\n  color: #ffb800;\n}\n\n.atv-rating-panel-score.is-low {\n  color: #fa320a;\n}\n\n/* ── MC label row (score bar + Chinese word label) ── */\n\n.atv-mc-label-row {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.atv-mc-bar-track {\n  display: inline-block;\n  width: 40px;\n  height: 4px;\n  border-radius: 2px;\n  background: rgba(255, 255, 255, 0.1);\n  overflow: hidden;\n  flex-shrink: 0;\n}\n\n.atv-mc-bar-fill {\n  display: block;\n  height: 100%;\n  border-radius: 2px;\n}\n\n.atv-mc-bar-fill.is-high {\n  background: #3bb33b;\n}\n\n.atv-mc-bar-fill.is-medium {\n  background: #ffb800;\n}\n\n.atv-mc-bar-fill.is-low {\n  background: #fa320a;\n}\n\n.atv-mc-word-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  line-height: 1;\n}\n\n.atv-rating-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n\n.atv-rating-stars svg {\n  display: block;\n}\n\n/* ── RT Score Row (values side by side) ─────────── */\n\n.atv-rt-score-row,\n.atv-rt-label-row,\n.atv-rt-count-row {\n  display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  gap: 8px;\n  align-items: center;\n  width: 100%;\n}\n\n.atv-rt-score-value {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 30px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n}\n\n.atv-rt-score-value.is-fresh {\n  color: var(--atv-text-primary);\n}\n\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:first-child {\n  color: rgba(255, 107, 91, 0.85);\n}\n\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:last-child {\n  color: rgba(255, 167, 38, 0.85);\n}\n\n.atv-rt-score-row > .atv-rt-score-value:first-child {\n  justify-self: center;\n  text-align: right;\n}\n\n.atv-rt-score-row > .atv-rt-score-value:last-child {\n  justify-self: center;\n  text-align: left;\n}\n\n/* ── RT Label Row (icons + text) ────────────────── */\n\n.atv-rt-label-row {\n  gap: 8px;\n}\n\n.atv-rt-label-item {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:first-child {\n  justify-self: center;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:last-child {\n  justify-self: center;\n}\n\n.atv-rt-label-row {\n  grid-template-columns: 1fr 1fr;\n}\n\n.atv-rt-score-icon {\n  display: inline-flex;\n  width: 16px;\n  height: 16px;\n  color: var(--atv-text-tertiary);\n  opacity: 0.7;\n}\n\n.atv-rt-score-icon svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-rt-label-item.is-critics.is-fresh .atv-rt-score-icon {\n  color: #ff6b5b;\n  opacity: 1;\n}\n\n.atv-rt-label-item.is-critics.is-rotten .atv-rt-score-icon {\n  color: #50b85e;\n  opacity: 0.6;\n}\n\n.atv-rt-label-item.is-audience.is-fresh .atv-rt-score-icon {\n  color: #ffb800;\n  opacity: 1;\n}\n\n.atv-rt-label-item.is-audience.is-rotten .atv-rt-score-icon {\n  color: #888;\n  opacity: 0.6;\n}\n\n.atv-rt-score-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── Shared count text (Douban / IMDb) ──────────── */\n\n.atv-rating-panel-count {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── RT Count Row (e.g. 评价 300 | 50,000) ──────── */\n\n.atv-rt-count-row {\n  gap: 8px;\n}\n\n.atv-rt-count-value {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n.atv-rt-count-row > .atv-rt-count-value:first-child {\n  justify-self: center;\n}\n\n.atv-rt-count-row > .atv-rt-count-value:last-child {\n  justify-self: center;\n}\n\n.atv-rt-count-row {\n  grid-template-columns: 1fr 1fr;\n}\n\n/* ── RT Divider ─────────────────────────────────── */\n\n.atv-rt-divider {\n  width: 1px;\n  align-self: stretch;\n  margin: 2px 0;\n  background: rgba(255, 255, 255, 0.12);\n  flex-shrink: 0;\n}\n\n@media (max-width: 768px) {\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n    grid-template-rows: 24px 38px 18px 1fr;\n  }\n  .atv-rt-score-value {\n    font-size: 26px;\n  }\n  .atv-rt-score-icon {\n    width: 14px;\n    height: 14px;\n  }\n  .atv-rt-score-label {\n    font-size: 10px;\n  }\n  .atv-mc-bar-track {\n    width: 32px;\n  }\n  .atv-mc-word-label {\n    font-size: 10px;\n  }\n  .atv-rating-panel {\n    min-width: 0;\n  }\n}\n\n.atv-rating-empty {\n  font-size: 13px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.03em;\n  padding: 10px 0;\n}\n\n/* ── Skeleton (loading) ─────────────────────────── */\n\n.atv-rating-panel-imdb.is-loading,\n.atv-rating-panel-rt.is-loading,\n.atv-rating-panel-mc.is-loading {\n  transition: opacity 400ms ease;\n}\n\n.atv-rating-panel-imdb.is-empty,\n.atv-rating-panel-rt.is-empty,\n.atv-rating-panel-mc.is-empty {\n  display: none;\n}\n\n.atv-rating-panel-skeleton {\n  width: 120px;\n  height: 22px;\n  border-radius: 4px;\n  background: linear-gradient(\n    90deg,\n    rgba(255, 255, 255, 0.04) 25%,\n    rgba(255, 255, 255, 0.1) 50%,\n    rgba(255, 255, 255, 0.04) 75%\n  );\n  background-size: 200% 100%;\n  animation: atv-ratings-shimmer 1.6s ease-in-out infinite;\n}\n\n@keyframes atv-ratings-shimmer {\n  0% {\n    background-position: 200% 0;\n  }\n  100% {\n    background-position: -200% 0;\n  }\n}\n\n.atv-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-bottom: 26px;\n}\n\n.atv-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  height: 44px;\n  padding: 0 22px;\n  border: none;\n  background: none;\n  font-family: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  color: inherit;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    transform 200ms ease,\n    background 200ms ease,\n    box-shadow 200ms ease,\n    color 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-btn-primary {\n  color: #fff;\n  background: var(--atv-accent);\n  box-shadow: 0 8px 24px var(--atv-accent-glow);\n}\n\n.atv-btn-primary:hover {\n  background: var(--atv-accent-bright);\n  transform: translateY(-1px);\n}\n\n.atv-btn-secondary {\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n\n.atv-btn-secondary:hover {\n  background: rgba(255, 255, 255, 0.12);\n  transform: translateY(-1px);\n}\n\n.atv-btn.is-active {\n  color: #fff;\n  background: var(--atv-accent);\n  border-color: transparent;\n  box-shadow: 0 6px 20px var(--atv-accent-glow);\n}\n\n.atv-hero-summary {\n  margin-top: 16px;\n}\n\n.atv-hero-teaser {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  max-width: 660px;\n  margin: 0 0 12px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: var(--atv-text-secondary);\n  word-break: break-word;\n  white-space: pre-wrap;\n  overflow: hidden;\n}\n\n.atv-hero-teaser.is-clamped {\n  -webkit-line-clamp: 3;\n}\n\n.atv-hero-more {\n  display: inline-flex;\n  gap: 6px;\n  align-items: center;\n  padding: 0;\n  border: none;\n  background: none;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-accent-bright);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-hero-more:hover {\n  color: var(--atv-accent);\n}\n\n.atv-hero-more svg {\n  transition: transform 220ms ease;\n}\n\n.atv-hero-more.is-open svg {\n  transform: rotate(180deg);\n}\n\n/* ---------- Section ---------- */\n\n.atv-section {\n  max-width: 1280px;\n  padding: 52px max(28px, 5vw);\n  margin: 0 auto;\n  scroll-margin-top: 64px;\n  animation: atv-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;\n}\n\n.atv-section + .atv-section {\n  padding-top: 0;\n}\n\n.atv-section-h {\n  position: relative;\n  display: flex;\n  align-items: center;\n  padding-left: 16px;\n  margin: 0 0 24px;\n  font-size: 24px;\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}\n\n.atv-section-h::before {\n  position: absolute;\n  top: 50%;\n  left: 0;\n  width: 4px;\n  height: 24px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 2px;\n  transform: translateY(-50%);\n}\n\n.atv-section-h-row {\n  display: flex;\n  gap: 16px;\n  align-items: baseline;\n  justify-content: space-between;\n  margin-bottom: 24px;\n}\n\n.atv-section-h-row .atv-section-h {\n  margin-bottom: 0;\n}\n\n.atv-section-more {\n  flex: 0 0 auto;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  transition: color 200ms ease;\n}\n\n.atv-section-more:hover {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Carousel ---------- */\n\n.atv-carousel {\n  display: flex;\n  gap: 16px;\n  overflow-x: auto;\n  scroll-snap-type: x mandatory;\n  scroll-behavior: smooth;\n  padding: 4px 4px 16px;\n  margin: 0 -4px;\n}\n\n.atv-carousel::-webkit-scrollbar {\n  display: none;\n}\n\n.atv-carousel {\n  scrollbar-width: none;\n}\n\n/* ---------- Page scrollbar ---------- */\n\n:root {\n  color-scheme: dark;\n}\n\n::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n}\n\n::-webkit-scrollbar-track {\n  background: #1c1c1e;\n}\n\n::-webkit-scrollbar-thumb {\n  background: #3a3a3c;\n  border-radius: 3px;\n}\n\n::-webkit-scrollbar-thumb:hover {\n  background: #48484a;\n}\n\n::-webkit-scrollbar-corner {\n  background: transparent;\n}\n\n* {\n  scrollbar-color: #3a3a3c #1c1c1e;\n  scrollbar-width: thin;\n}\n\n/* ---------- Series ---------- */\n\n.atv-series-carousel {\n  mask-image: linear-gradient(to right, #000 97%, transparent 100%);\n  -webkit-mask-image: linear-gradient(to right, #000 97%, transparent 100%);\n}\n\n.atv-series-card {\n  flex: 0 0 158px;\n  min-width: 0;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-series-card:hover {\n  transform: translateY(-4px);\n}\n\n/* ── Active season (user is currently on this season's page) ── */\n\n.atv-series-card.is-active .atv-series-poster {\n  box-shadow:\n    inset 0 0 0 2px var(--atv-accent),\n    0 0 20px var(--atv-accent-glow);\n}\n\n.atv-series-card.is-active .atv-series-info::after {\n  width: 20px;\n  opacity: 1;\n}\n\n/* ── Poster ── */\n\n.atv-series-poster {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 400ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 400ms ease;\n}\n\n.atv-series-card:hover .atv-series-poster {\n  box-shadow:\n    0 16px 48px rgba(0, 0, 0, 0.6),\n    0 0 0 1px rgba(255, 255, 255, 0.06);\n  transform: scale(1.06);\n}\n\n/* Poster bottom gradient overlay (Apple TV+ style depth) */\n\n.atv-series-poster::after {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 45%;\n  content: \"\";\n  background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 100%);\n  pointer-events: none;\n}\n\n.atv-series-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n}\n\n/* ── Rating badge (overlay on poster top-right) ── */\n\n.atv-series-badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  z-index: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 28px;\n  height: 22px;\n  padding: 0 7px;\n  font-size: 11px;\n  font-weight: 700;\n  line-height: 1;\n  color: #fff;\n  letter-spacing: 0.02em;\n  background: rgba(0, 0, 0, 0.65);\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  border-radius: 20px;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    background 300ms ease;\n}\n\n.atv-series-card:hover .atv-series-badge {\n  background: rgba(0, 0, 0, 0.8);\n  transform: translateY(-1px) scale(1.05);\n}\n\n/* ── Info row ── */\n\n.atv-series-info {\n  position: relative;\n  margin-top: 10px;\n}\n\n.atv-series-info::after {\n  display: block;\n  width: 0;\n  height: 2px;\n  margin-top: 4px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 1px;\n  opacity: 0;\n  transition:\n    width 400ms cubic-bezier(0.22, 1, 0.36, 1),\n    opacity 400ms ease;\n}\n\n.atv-series-card:hover .atv-series-info::after {\n  width: 100%;\n  opacity: 1;\n}\n\n.atv-series-title {\n  display: block;\n  overflow: hidden;\n  font-size: 14px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  letter-spacing: 0.01em;\n  transition: color 300ms ease;\n}\n\n.atv-series-card:hover .atv-series-title {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Cast ---------- */\n\n.atv-cast-carousel {\n  mask-image: linear-gradient(to right, #000 90%, transparent 100%);\n  -webkit-mask-image: linear-gradient(to right, #000 90%, transparent 100%);\n}\n\n.atv-cast-card {\n  flex: 0 0 160px;\n  min-width: 0;\n  text-align: center;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-cast-card:hover {\n  transform: translateY(-3px);\n}\n\n.atv-cast-avatar {\n  width: 160px;\n  height: 160px;\n  background-color: var(--atv-bg-tertiary);\n  background-position: center top;\n  background-size: cover;\n  border: 2px solid transparent;\n  border-radius: 50%;\n  transition:\n    transform 300ms ease,\n    border-color 300ms ease,\n    box-shadow 300ms ease,\n    filter 300ms ease;\n}\n\n.atv-cast-card:hover .atv-cast-avatar {\n  border-color: rgba(255, 255, 255, 0.2);\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);\n  filter: brightness(1.12);\n  transform: scale(1.05);\n}\n\n.atv-cast-name {\n  margin-top: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\n.atv-cast-role {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  margin-top: 4px;\n  overflow: hidden;\n  -webkit-line-clamp: 2;\n  font-size: 13px;\n  font-weight: 400;\n  line-height: 1.35;\n  color: rgba(255, 255, 255, 0.55);\n}\n\n/* ---------- Photos ---------- */\n\n.atv-photos {\n  gap: 12px;\n}\n\n.atv-photo-tile {\n  display: flex;\n  flex: 0 0 400px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  border: none;\n  padding: 0;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-photo-tile.is-portrait {\n  flex: 0 0 240px;\n  aspect-ratio: 3 / 4;\n}\n\n.atv-photo-tile img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-photo-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n\n/* ---------- Recommendations ---------- */\n\n.atv-recs {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));\n  gap: 24px;\n}\n\n.atv-rec-card {\n  cursor: pointer;\n}\n\n.atv-rec-poster {\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n\n.atv-rec-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-rec-card:hover .atv-rec-poster {\n  box-shadow: 0 12px 40px var(--atv-accent-glow);\n  transform: scale(1.05);\n}\n\n.atv-rec-title {\n  margin-top: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  font-size: 15px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n}\n\n/* ---------- Info grid ---------- */\n\n.atv-info-grid {\n  display: grid;\n  grid-template-columns: 200px 1fr;\n  row-gap: 16px;\n  column-gap: 32px;\n}\n\n.atv-info-label {\n  padding-top: 2px;\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.55);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n\n.atv-info-value {\n  font-size: 15px;\n  font-weight: 400;\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  word-break: break-word;\n}\n\n.atv-info-value a {\n  color: var(--atv-text-primary);\n  border-bottom: 1px solid var(--atv-border-medium);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease;\n}\n\n.atv-info-value a:hover {\n  color: var(--atv-accent-bright);\n  border-color: var(--atv-accent-bright);\n}\n\n/* ---------- Streaming ---------- */\n\n.atv-stream-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n\n.atv-stream-card {\n  display: inline-flex;\n  align-items: center;\n  gap: 11px;\n  height: 52px;\n  max-width: 240px;\n  padding: 0 18px 0 12px;\n  border-radius: var(--atv-radius-md);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  color: var(--atv-text-primary);\n  font-size: 15px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  font-family: inherit;\n  -webkit-tap-highlight-color: transparent;\n  cursor: pointer;\n  transition:\n    background 220ms ease,\n    border-color 220ms ease,\n    box-shadow 220ms ease;\n}\n\n.atv-stream-card:hover {\n  background: rgba(255, 255, 255, 0.075);\n  border-color: rgba(255, 255, 255, 0.18);\n  box-shadow:\n    inset 0 1px 0 rgba(255, 255, 255, 0.08),\n    0 12px 26px rgba(0, 0, 0, 0.24);\n}\n\n.atv-stream-logo {\n  display: inline-flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 8px;\n  background:\n    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0)),\n    rgba(255, 255, 255, 0.05);\n  box-shadow:\n    inset 0 1px 0 rgba(255, 255, 255, 0.12),\n    0 8px 18px rgba(0, 0, 0, 0.18);\n  color: var(--atv-stream-brand, var(--atv-accent-bright));\n  overflow: hidden;\n}\n\n.atv-stream-logo svg {\n  display: block;\n  width: 17px;\n  height: 17px;\n  fill: currentColor;\n}\n\n.atv-stream-logo-fallback {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  font-size: 13px;\n  font-weight: 800;\n  line-height: 1;\n  color: currentColor;\n  text-transform: uppercase;\n}\n\n.atv-stream-name {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.atv-stream-card:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: 3px;\n}\n\n/* ---------- Comments ---------- */\n\n.atv-comments {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 18px;\n}\n\n.atv-comment-card {\n  display: flex;\n  flex-direction: column;\n  padding: 18px 20px;\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 350ms cubic-bezier(0.22, 1, 0.36, 1),\n    border-color 350ms ease,\n    box-shadow 350ms ease;\n}\n\n.atv-comment-card:hover {\n  border-color: rgba(255, 255, 255, 0.12);\n  transform: translateY(-3px);\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.3),\n    0 0 0 1px rgba(65, 190, 93, 0.04);\n}\n\n.atv-comment-top {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  margin-bottom: 14px;\n}\n\n.atv-comment-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  overflow: hidden;\n  font-size: 15px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n  border: 1.5px solid rgba(255, 255, 255, 0.06);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease,\n    filter 260ms ease;\n}\n\n.atv-comment-card:hover .atv-comment-avatar {\n  border-color: rgba(255, 255, 255, 0.3);\n  filter: brightness(1.15);\n}\n\n.atv-comment-avatar.atv-avatar-loaded {\n  animation: atv-avatar-reveal 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;\n}\n\n@keyframes atv-avatar-reveal {\n  from {\n    filter: blur(6px) brightness(1.25);\n  }\n  to {\n    filter: blur(0) brightness(1);\n  }\n}\n\n.atv-comment-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n.atv-comment-author,\na.atv-comment-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\na.atv-comment-author:hover {\n  color: var(--atv-text-primary);\n  background: none;\n}\n\n.atv-comment-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n  color: var(--atv-rating-gold);\n}\n\n.atv-comment-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-comment-body {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  margin: 0 0 14px;\n  border: none;\n  padding: 0;\n  width: 100%;\n  background: none;\n  font: inherit;\n  font-size: 15px;\n  line-height: 1.5;\n  color: rgba(255, 255, 255, 0.85);\n  text-align: left;\n  cursor: pointer;\n  appearance: none;\n  -webkit-appearance: none;\n  word-break: break-word;\n}\n\n.atv-comment-body-text {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  -webkit-line-clamp: 4;\n  word-break: break-word;\n}\n\n.atv-comment-foot {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-comment-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  padding: 4px 10px;\n  font-family: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: none;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 100px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n\n.atv-comment-votes:hover {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.2);\n  background: rgba(65, 190, 93, 0.04);\n  transform: scale(1.05);\n}\n\n.atv-comment-votes:focus-visible {\n  outline: 2px solid rgba(65, 190, 93, 0.75);\n  outline-offset: 3px;\n}\n\n.atv-comment-votes:active {\n  transform: scale(0.95);\n}\n\n.atv-comment-votes.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.25);\n  background: rgba(65, 190, 93, 0.06);\n}\n\n.atv-comment-votes svg {\n  display: block;\n  width: 13px;\n  height: 13px;\n}\n\n.atv-vote-count {\n  font-variant-numeric: tabular-nums;\n}\n\n/* ---------- Comment Expand Overlay ---------- */\n\n.atv-comment-foot-right {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n}\n\n.atv-comment-expand {\n  display: none;\n  align-items: center;\n  justify-content: center;\n  width: 22px;\n  height: 22px;\n  padding: 0;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  background: rgba(0, 0, 0, 0.3);\n  font: inherit;\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  border-radius: 50%;\n  backdrop-filter: blur(4px);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-comment-card.has-overflow .atv-comment-expand {\n  display: inline-flex;\n}\n\n.atv-comment-expand:hover {\n  color: var(--atv-accent);\n  border-color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.1);\n}\n\n.atv-comment-expand:active {\n  transform: scale(0.9);\n}\n\n.atv-comment-expand svg {\n  display: block;\n  width: 12px;\n  height: 12px;\n}\n\n/* ── Overlay ── */\n\n.atv-comment-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 24px;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  opacity: 0;\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-comment-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-comment-overlay-inner {\n  position: relative;\n  width: 100%;\n  max-width: 580px;\n  max-height: 80vh;\n  overflow-y: auto;\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 20px;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-comment-overlay.is-open .atv-comment-overlay-inner {\n  transform: scale(1) translateY(0);\n}\n\n.atv-comment-overlay-accent {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 1;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-comment-overlay.is-open .atv-comment-overlay-accent {\n  transform: scaleX(1);\n}\n\n.atv-comment-overlay-close {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(255, 255, 255, 0.06);\n  color: rgba(255, 255, 255, 0.6);\n  font: inherit;\n  cursor: pointer;\n  border-radius: 50%;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-comment-overlay-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-comment-overlay-close svg {\n  display: block;\n  width: 16px;\n  height: 16px;\n}\n\n.atv-comment-overlay-top {\n  display: flex;\n  gap: 14px;\n  align-items: center;\n  padding: 28px 28px 0;\n}\n\n.atv-comment-overlay-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  overflow: hidden;\n  font-size: 18px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n  border: 2px solid var(--atv-border-subtle);\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease;\n}\n\n.atv-comment-overlay-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n.atv-comment-overlay-author,\na.atv-comment-overlay-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\na.atv-comment-overlay-author:hover {\n  color: var(--atv-text-primary);\n  background: none;\n}\n\n.atv-comment-overlay-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n\n.atv-comment-overlay-stars svg {\n  display: block;\n  width: 16px;\n  height: 16px;\n}\n\n.atv-comment-overlay-body {\n  padding: 20px 28px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: rgba(255, 255, 255, 0.85);\n  word-break: break-word;\n  white-space: pre-wrap;\n}\n\n.atv-comment-overlay-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 28px 28px;\n}\n\n.atv-comment-overlay-time {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-comment-overlay-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  padding: 6px 14px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: rgba(255, 255, 255, 0.04);\n  font: inherit;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  border-radius: 100px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-comment-overlay-votes:hover {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.2);\n  background: rgba(65, 190, 93, 0.04);\n}\n\n.atv-comment-overlay-votes:focus-visible {\n  outline: 2px solid rgba(65, 190, 93, 0.75);\n  outline-offset: 3px;\n}\n\n.atv-comment-overlay-votes:active {\n  transform: scale(0.95);\n}\n\n.atv-comment-overlay-votes.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.25);\n  background: rgba(65, 190, 93, 0.06);\n}\n\n.atv-comment-overlay-votes svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n/* ---------- Poster Modal ---------- */\n\n.atv-poster-card {\n  cursor: pointer;\n}\n\n.atv-modal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.78);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(28px) saturate(1.15);\n  backdrop-filter: blur(28px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-modal-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-modal-img {\n  max-width: 90vw;\n  max-height: 90vh;\n  object-fit: contain;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-modal-overlay.is-open .atv-modal-img {\n  transform: scale(1);\n}\n\n.atv-modal-close {\n  position: fixed;\n  top: 24px;\n  right: 24px;\n  z-index: 10001;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  padding: 0;\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  background: rgba(255, 255, 255, 0.08);\n  color: #fff;\n  font: inherit;\n  cursor: pointer;\n  border-radius: 50%;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n\n.atv-modal-close svg {\n  display: block;\n}\n\n/* ---------- Footer spacer ---------- */\n\n.atv-footer-spacer {\n  height: 64px;\n}\n\n/* ---------- Login Prompt Modal ---------- */\n\ndialog::backdrop {\n  background: transparent;\n}\n\n.atv-login-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  min-height: 100vh;\n  min-height: 100dvh;\n  margin: 0;\n  border: none;\n  padding: max(24px, env(safe-area-inset-top))\n    max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom))\n    max(24px, env(safe-area-inset-left));\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  visibility: hidden;\n  overscroll-behavior: contain;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition:\n    visibility 0s linear 360ms,\n    opacity 360ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-login-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n  visibility: visible;\n  transition-delay: 0s;\n}\n\n.atv-login-modal-inner {\n  position: relative;\n  box-sizing: border-box;\n  width: min(100%, 424px);\n  max-height: min(736px, calc(100dvh - 48px));\n  padding: 30px 22px 22px;\n  overflow: auto;\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  color: var(--atv-text-primary);\n  text-align: center;\n  background: var(--atv-bg-secondary);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 20px;\n  box-shadow:\n    inset 0 1px 0 rgba(255, 255, 255, 0.08),\n    0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n  scrollbar-width: none;\n}\n\n.atv-login-modal-inner::-webkit-scrollbar {\n  display: none;\n}\n\n.atv-login-modal.is-open .atv-login-modal-inner {\n  transform: scale(1) translateY(0);\n}\n\n.atv-login-modal-accent {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-login-modal.is-open .atv-login-modal-accent {\n  transform: scaleX(1);\n}\n\n.atv-login-modal-close {\n  position: absolute;\n  top: 12px;\n  right: 12px;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  color: rgba(255, 255, 255, 0.6);\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.06);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 50%;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n  touch-action: manipulation;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.atv-login-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-login-modal-close svg {\n  display: block;\n}\n\n.atv-login-modal-title {\n  margin: 0 42px 6px;\n  font-size: 18px;\n  font-weight: 650;\n  line-height: 1.35;\n  color: var(--atv-text-primary);\n  text-wrap: balance;\n}\n\n.atv-login-modal-desc {\n  max-width: 300px;\n  margin: 0 auto 14px;\n  font-size: 13px;\n  line-height: 1.55;\n  color: var(--atv-text-tertiary);\n  text-wrap: pretty;\n}\n\n.atv-login-modal-status {\n  min-height: 20px;\n  margin: 8px 0 0;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-login-modal-status[hidden] {\n  display: none;\n}\n\n.atv-login-modal-native {\n  position: relative;\n  box-sizing: border-box;\n  width: 100%;\n  margin-top: 10px;\n  padding: 10px;\n  overflow: hidden;\n  border-radius: 16px;\n}\n\n.atv-login-modal-native:empty {\n  min-height: 360px;\n}\n\n.atv-login-modal-native[aria-busy=\"true\"] {\n  min-height: 360px;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.055),\n      transparent\n    ),\n    rgba(255, 255, 255, 0.035);\n  background-size:\n    220% 100%,\n    auto;\n  animation: atv-login-native-loading 1400ms ease-in-out infinite;\n}\n\n.atv-login-modal-native > iframe,\n.atv-login-modal-iframe {\n  display: block !important;\n  box-sizing: border-box !important;\n  width: 340px !important;\n  max-width: 100% !important;\n  height: 448px !important;\n  max-height: calc(100vh - 168px) !important;\n  margin: 0 auto !important;\n  overflow: hidden !important;\n  background: #fff !important;\n  border: 0 !important;\n  border-radius: 10px !important;\n  box-shadow: none !important;\n  /* Cross-origin iframe dark-mode override (first-principles):\n     invert(0.89) maps white #fff → #1c1c1c, which matches\n     --atv-bg-secondary: #1c1c1e within 2 RGB points — no more\n     pure-black void. Text #333 → #bbb, borders #e0 → #343434.\n     hue-rotate(180deg) counter-rotates the color shift from\n     invert so green stays green-ish and blue stays blue-ish.\n     invert(0.89) is the precise value calculated to hit the\n     existing modal surface color while keeping text readable. */\n  filter: invert(0.89) hue-rotate(180deg) !important;\n}\n\n.atv-login-modal-close:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 3px;\n}\n\n@keyframes atv-login-native-loading {\n  from {\n    background-position:\n      160% 0,\n      0 0;\n  }\n  to {\n    background-position:\n      -60% 0,\n      0 0;\n  }\n}\n\n/* ---------- Interest Modal ---------- */\n\n.atv-interest-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 24px;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-interest-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-interest-modal-inner {\n  position: relative;\n  width: 100%;\n  max-width: 380px;\n  max-height: 90vh;\n  overflow-y: auto;\n  background: var(--atv-bg-secondary);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 20px;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-interest-modal.is-open .atv-interest-modal-inner {\n  transform: scale(1) translateY(0);\n}\n\n.atv-interest-modal-accent {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 1;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-interest-modal.is-open .atv-interest-modal-accent {\n  transform: scaleX(1);\n}\n\n.atv-interest-modal-header {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px 48px 0;\n}\n\n.atv-interest-modal-header__title {\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  letter-spacing: 0.01em;\n}\n\n.atv-interest-modal-close {\n  position: absolute;\n  top: 14px;\n  right: 14px;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  color: rgba(255, 255, 255, 0.6);\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.06);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 50%;\n  font-family: inherit;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.atv-interest-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-interest-modal-close:active {\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n\n.atv-interest-modal-close svg {\n  display: block;\n}\n\n.atv-interest-modal-body {\n  padding: 16px 20px 20px;\n}\n\n.atv-interest-modal-statuses {\n  display: flex;\n  gap: 0;\n  padding: 3px;\n  margin-bottom: 20px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 999px;\n}\n\n.atv-interest-modal-status {\n  flex: 1;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  height: 36px;\n  padding: 0 12px;\n  border: none;\n  background: transparent;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-status:hover {\n  color: var(--atv-text-secondary);\n}\n\n.atv-interest-modal-status.is-active {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n}\n\n.atv-interest-modal-stars {\n  display: flex;\n  gap: 6px;\n  justify-content: center;\n  margin-bottom: 24px;\n}\n\n.atv-interest-modal-star {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  border: none;\n  background: none;\n  color: rgba(255, 255, 255, 0.2);\n  cursor: pointer;\n  transition:\n    color 200ms ease,\n    transform 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-star.is-full {\n  color: var(--atv-rating-gold);\n}\n\n.atv-interest-modal-star:hover {\n  transform: scale(1.15);\n}\n\n.atv-interest-modal-star svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-interest-modal-comment {\n  display: block;\n  width: 100%;\n  min-height: 64px;\n  padding: 10px 14px;\n  margin-bottom: 16px;\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 10px;\n  font-family: inherit;\n  resize: vertical;\n  transition:\n    border-color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  box-sizing: border-box;\n}\n\n.atv-interest-modal-comment::placeholder {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-interest-modal-comment:focus {\n  outline: none;\n  border-color: rgba(255, 255, 255, 0.2);\n  background: rgba(255, 255, 255, 0.06);\n}\n\n.atv-interest-modal-submit {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 44px;\n  padding: 0 24px;\n  margin-bottom: 10px;\n  border: none;\n  background: var(--atv-accent);\n  font: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  color: #fff;\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    background 200ms ease,\n    transform 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  -webkit-font-smoothing: antialiased;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-submit:hover {\n  background: var(--atv-accent-bright);\n}\n\n.atv-interest-modal-submit:active {\n  transform: scale(0.97);\n}\n\n.atv-interest-modal-submit:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n.atv-interest-modal-remove {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 36px;\n  padding: 0 24px;\n  margin-bottom: 4px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: transparent;\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-remove:hover {\n  color: var(--atv-text-secondary);\n  border-color: rgba(255, 255, 255, 0.15);\n  background: rgba(255, 255, 255, 0.04);\n}\n\n.atv-interest-modal-remove:active {\n  background: rgba(255, 255, 255, 0.08);\n}\n\n.atv-interest-modal-error {\n  font-size: 12px;\n  font-weight: 500;\n  color: #ff453a;\n  text-align: center;\n  border-radius: 10px;\n}\n\n.atv-interest-modal-error:empty {\n  display: none;\n}\n\n.atv-interest-modal-error:not(:empty) {\n  padding: 8px 16px;\n  margin-top: 8px;\n  background: rgba(255, 69, 58, 0.08);\n}\n\n/* ---------- Interest Panel (S3 marked state) ---------- */\n\n.atv-interest-panel {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  width: 100%;\n}\n\n.atv-interest-panel-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n.atv-interest-badge {\n  cursor: pointer;\n}\n\n.atv-interest-panel-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n}\n\n.atv-interest-panel-stars svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n}\n\n.atv-interest-panel-date {\n  font-size: 13px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-interest-panel-comment {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  font-size: 14px;\n  line-height: 1.6;\n  color: var(--atv-text-secondary);\n  font-style: italic;\n  padding: 6px 0 2px;\n}\n\n.atv-useful-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-size: 12px;\n  font-style: normal;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ---------- Trailer Tile ---------- */\n\n.atv-trailer-tile {\n  flex: 0 0 400px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  background-size: cover;\n  background-position: center;\n  position: relative;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n}\n\n.atv-trailer-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n\n.atv-trailer-play-overlay {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(0, 0, 0, 0.12);\n  transition: background 300ms ease;\n}\n\n.atv-trailer-tile:hover .atv-trailer-play-overlay {\n  background: rgba(0, 0, 0, 0.2);\n}\n\n.atv-trailer-play-btn {\n  width: 56px;\n  height: 56px;\n  background: rgba(0, 0, 0, 0.6);\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n\n.atv-trailer-play-btn svg {\n  display: block;\n  width: 24px;\n  height: 24px;\n  color: #fff;\n  margin-left: 3px;\n}\n\n.atv-trailer-tile:hover .atv-trailer-play-btn {\n  transform: scale(1.08);\n  box-shadow: 0 0 30px var(--atv-accent-glow);\n}\n\n.atv-trailer-label {\n  position: absolute;\n  bottom: 12px;\n  left: 12px;\n  padding: 4px 10px;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.6);\n  font-size: 12px;\n  font-weight: 500;\n  color: #fff;\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n}\n\n/* ---------- Video Modal ---------- */\n\n.atv-modal-overlay.is-video {\n  background: #000;\n  -webkit-backdrop-filter: none;\n  backdrop-filter: none;\n}\n\n.atv-modal-video {\n  display: block;\n  max-width: 95vw;\n  max-height: 90vh;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-modal-overlay.is-open .atv-modal-video {\n  transform: scale(1);\n}\n\n/* ---------- Reviews ---------- */\n\n.atv-reviews {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));\n  gap: 20px;\n}\n\n.atv-review-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  padding: 22px;\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: var(--atv-radius-md);\n  cursor: pointer;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n  transition:\n    transform 350ms cubic-bezier(0.22, 1, 0.36, 1),\n    border-color 350ms ease,\n    box-shadow 350ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-review-open-button {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  padding: 0;\n  cursor: pointer;\n  background: transparent;\n  border: 0;\n  border-radius: var(--atv-radius-md);\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-review-content {\n  position: relative;\n  z-index: 1;\n  display: contents;\n}\n\n.atv-review-card:hover {\n  border-color: rgba(255, 255, 255, 0.12);\n  transform: translateY(-3px);\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.3),\n    0 0 0 1px rgba(65, 190, 93, 0.04);\n}\n\n.atv-review-card:active {\n  transform: translateY(0);\n  box-shadow: none;\n}\n\n.atv-review-card:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 4px;\n  border-color: rgba(65, 190, 93, 0.45);\n  box-shadow: 0 0 0 5px rgba(65, 190, 93, 0.12);\n}\n\n.atv-review-open-button:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 4px;\n}\n\n.atv-review-top {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-bottom: 12px;\n  pointer-events: none;\n}\n\n.atv-review-avatar {\n  width: 36px;\n  height: 36px;\n  border-radius: 50%;\n  background: var(--atv-accent);\n  background-size: cover;\n  background-position: center;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 14px;\n  font-weight: 600;\n  color: #fff;\n  border: 1.5px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-review-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  min-width: 0;\n  pointer-events: none;\n}\n\n.atv-review-author {\n  position: relative;\n  z-index: 2;\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  text-decoration: none;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  pointer-events: auto;\n}\n\n.atv-review-author:hover {\n  color: var(--atv-accent);\n}\n\n.atv-review-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n  color: var(--atv-rating-gold);\n}\n\n.atv-review-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-review-title {\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.35;\n  letter-spacing: -0.01em;\n  color: #f0f0f0;\n  margin-bottom: 8px;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  pointer-events: none;\n}\n\n.atv-review-excerpt {\n  font-size: 14px;\n  line-height: 1.7;\n  color: rgba(255, 255, 255, 0.72);\n  display: -webkit-box;\n  -webkit-line-clamp: 4;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  margin-bottom: 14px;\n  flex: 1;\n  pointer-events: none;\n}\n\n.atv-review-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding-top: 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n  pointer-events: none;\n}\n\n.atv-review-time {\n  font-size: 12px;\n  font-weight: 400;\n  color: rgba(255, 255, 255, 0.35);\n  letter-spacing: 0.02em;\n}\n\n.atv-review-readmore {\n  opacity: 0;\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-accent);\n  letter-spacing: 0.04em;\n  pointer-events: none;\n  transition:\n    opacity 300ms ease,\n    transform 300ms ease;\n  transform: translateX(-3px);\n}\n\n.atv-review-card:hover .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-card:focus-visible .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-card:has(.atv-review-open-button:focus-visible) {\n  border-color: rgba(65, 190, 93, 0.45);\n  box-shadow: 0 0 0 5px rgba(65, 190, 93, 0.12);\n}\n\n.atv-review-card:has(.atv-review-open-button:focus-visible)\n  .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-actions {\n  position: relative;\n  z-index: 2;\n  display: flex;\n  gap: 6px;\n  margin-left: auto;\n  pointer-events: auto;\n}\n\n.atv-vote-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 5px 12px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: rgba(255, 255, 255, 0.03);\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.55);\n  border-radius: 100px;\n  cursor: pointer;\n  line-height: 1;\n  transition:\n    color 250ms ease,\n    background 250ms ease,\n    border-color 250ms ease;\n  white-space: nowrap;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-vote-btn:hover {\n  border-color: var(--atv-accent);\n  color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.06);\n}\n\n.atv-vote-btn:focus-visible {\n  outline: 2px solid rgba(65, 190, 93, 0.75);\n  outline-offset: 3px;\n}\n\n.atv-vote-btn.is-lg {\n  padding: 8px 20px;\n  font-size: 14px;\n}\n\n.atv-vote-btn svg {\n  display: block;\n  width: 11px;\n  height: 11px;\n  transform-box: fill-box;\n  transform-origin: center;\n}\n\n.atv-vote-btn.down:hover {\n  background: rgba(255, 69, 58, 0.06);\n  border-color: #ff453a;\n  color: #ff453a;\n}\n\n.atv-vote-btn.down svg {\n  transform: rotate(180deg);\n}\n\n.atv-vote-btn.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.2);\n  background: rgba(65, 190, 93, 0.06);\n  cursor: default;\n}\n\n.atv-vote-btn.down.is-voted {\n  color: #ff453a;\n  border-color: rgba(255, 69, 58, 0.22);\n  background: rgba(255, 69, 58, 0.06);\n}\n\n/* ---------- Review Modal ---------- */\n\n.atv-review-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 48px;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-review-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-review-modal .atv-modal-close {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n  z-index: 2;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  color: rgba(255, 255, 255, 0.6);\n  background: rgba(255, 255, 255, 0.06);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n\n.atv-review-modal .atv-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-review-modal-scroll {\n  position: relative;\n  width: 100%;\n  max-width: 800px;\n  max-height: 85vh;\n  overflow-y: auto;\n  border-radius: var(--atv-radius-lg);\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  padding: 48px 56px 32px;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-review-modal.is-open .atv-review-modal-scroll {\n  transform: scale(1) translateY(0);\n}\n\n/* Accent bar — same pattern as .atv-comment-overlay-accent */\n\n.atv-review-modal-accent {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 1;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-review-modal.is-open .atv-review-modal-accent {\n  transform: scaleX(1);\n}\n\n.atv-review-modal-header {\n  margin-bottom: 16px;\n  padding-bottom: 14px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n\n.atv-review-modal-title {\n  font-size: 24px;\n  font-weight: 600;\n  line-height: 1.32;\n  letter-spacing: -0.01em;\n  color: #f0f0f0;\n  margin-bottom: 4px;\n}\n\n.atv-review-modal-title:focus {\n  outline: none;\n}\n\n.atv-review-modal-byline {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-top: 4px;\n}\n\n.atv-review-modal-avatar {\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  background: var(--atv-accent);\n  background-size: cover;\n  background-position: center;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 12px;\n  font-weight: 600;\n  color: #fff;\n  border: 1.5px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-review-modal-byline-text {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 13px;\n  line-height: 1;\n}\n\n.atv-review-modal-byline-name {\n  color: var(--atv-text-secondary);\n}\n\n.atv-review-modal-byline-time {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body {\n  color: rgba(255, 255, 255, 0.82);\n  font-size: 16px;\n  line-height: 1.85;\n}\n\n.atv-review-modal-body h2 {\n  font-size: 20px;\n  font-weight: 600;\n  margin-bottom: 16px;\n  line-height: 1.4;\n  color: #f0f0f0;\n}\n\n.atv-review-modal-body h2 a {\n  color: inherit;\n  background: transparent;\n  text-decoration: none;\n}\n\n.atv-review-modal-body h2 a:hover {\n  color: var(--atv-accent);\n  background: transparent;\n}\n\n.atv-review-modal-body p {\n  margin-bottom: 16px;\n}\n\n.atv-review-modal-body blockquote {\n  margin: 20px 0;\n  padding: 16px 20px;\n  border-left: 3px solid var(--atv-accent);\n  border-radius: 0 var(--atv-radius-sm) var(--atv-radius-sm) 0;\n  background: rgba(255, 255, 255, 0.03);\n  color: rgba(255, 255, 255, 0.82);\n}\n\n.atv-review-modal-body blockquote p {\n  margin-bottom: 8px;\n}\n\n.atv-review-modal-body blockquote p:last-child {\n  margin-bottom: 0;\n}\n\n.atv-review-modal-body blockquote cite,\n.atv-review-modal-body blockquote footer {\n  display: block;\n  margin-top: 8px;\n  font-size: 13px;\n  font-weight: 500;\n  font-style: normal;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body blockquote cite::before,\n.atv-review-modal-body blockquote footer::before {\n  content: \"\\2014\\00a0\";\n}\n\n.atv-review-modal-body blockquote blockquote {\n  margin-left: 0;\n  border-left-color: rgba(255, 255, 255, 0.2);\n  background: rgba(255, 255, 255, 0.06);\n}\n\n/* ── Review content images (Douban image-container) ── */\n\n.atv-review-modal-body .image-container {\n  margin: 24px 0;\n  clear: both;\n}\n\n.atv-review-modal-body .image-container.image-float-left {\n  float: left;\n  margin: 8px 24px 8px 0;\n  max-width: 50%;\n}\n\n.atv-review-modal-body .image-container.image-float-right {\n  float: right;\n  margin: 8px 0 8px 24px;\n  max-width: 50%;\n}\n\n.atv-review-modal-body .image-wrapper {\n  overflow: hidden;\n  border-radius: var(--atv-radius-sm);\n  line-height: 0;\n}\n\n.atv-review-modal-body .image-wrapper img {\n  display: block;\n  width: auto;\n  height: auto;\n  max-width: 100%;\n  margin: 0 auto;\n}\n\n.atv-review-modal-body .image-caption-wrapper {\n  margin-top: 8px;\n  text-align: center;\n}\n\n.atv-review-modal-body .image-caption {\n  display: inline-block;\n  font-size: 13px;\n  font-weight: 400;\n  line-height: 1.6;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  font-style: italic;\n}\n\n/* ── Review content links (Douban a.link / generic) ── */\n\n.atv-review-modal-body a:link,\n.atv-review-modal-body a:visited {\n  color: var(--atv-accent);\n  text-decoration: none;\n  background: transparent;\n  border-bottom: 1px solid rgba(65, 190, 93, 0.25);\n  transition:\n    border-color 200ms ease,\n    color 200ms ease;\n  word-break: break-word;\n}\n\n.atv-review-modal-body a:hover,\n.atv-review-modal-body a:active {\n  color: var(--atv-accent-bright);\n  border-bottom-color: var(--atv-accent-bright);\n  background: transparent;\n}\n\n/* ============================================\n   7. Review Content Typography — All Elements\n      Target ALL HTML tags that may appear inside\n      Douban review rich-text content.\n   ============================================ */\n\n/* --- Headings --- */\n\n.atv-review-modal-body h3 {\n  font-size: 18px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--atv-text-primary);\n  margin: 28px 0 12px;\n}\n\n.atv-review-modal-body h4 {\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--atv-text-primary);\n  margin: 24px 0 10px;\n}\n\n.atv-review-modal-body h5,\n.atv-review-modal-body h6 {\n  font-size: 14px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--atv-text-secondary);\n  margin: 20px 0 8px;\n}\n\n/* --- Horizontal Rule --- */\n\n.atv-review-modal-body hr {\n  border: none;\n  border-top: 1px solid var(--atv-border-subtle);\n  margin: 28px 0;\n  height: 0;\n}\n\n/* --- Lists --- */\n\n.atv-review-modal-body ul,\n.atv-review-modal-body ol {\n  margin: 0 0 16px;\n  padding-left: 24px;\n  line-height: 1.7;\n}\n\n.atv-review-modal-body ul {\n  list-style: disc;\n}\n\n.atv-review-modal-body ol {\n  list-style: decimal;\n}\n\n.atv-review-modal-body li {\n  margin-bottom: 6px;\n  line-height: 1.7;\n}\n\n.atv-review-modal-body li:last-child {\n  margin-bottom: 0;\n}\n\n/* --- Inline Text Semantics --- */\n\n.atv-review-modal-body strong,\n.atv-review-modal-body b {\n  font-weight: 700;\n  color: rgba(255, 255, 255, 0.92);\n}\n\n.atv-review-modal-body em,\n.atv-review-modal-body i {\n  font-style: italic;\n}\n\n.atv-review-modal-body small {\n  font-size: 0.85em;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body q {\n  font-style: italic;\n}\n\n.atv-review-modal-body q::before {\n  content: \"\\201C\";\n}\n\n.atv-review-modal-body q::after {\n  content: \"\\201D\";\n}\n\n.atv-review-modal-body u {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n  text-decoration-thickness: 1px;\n}\n\n.atv-review-modal-body s,\n.atv-review-modal-body del {\n  text-decoration: line-through;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body sup {\n  font-size: 0.75em;\n  line-height: 1;\n  vertical-align: super;\n}\n\n.atv-review-modal-body sub {\n  font-size: 0.75em;\n  line-height: 1;\n  vertical-align: sub;\n}\n\n/* --- Code --- */\n\n.atv-review-modal-body code {\n  font-family:\n    \"SF Mono\", Monaco, \"Cascadia Code\", \"JetBrains Mono\", \"Fira Code\", Consolas,\n    monospace;\n  font-size: 0.9em;\n  padding: 2px 6px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 4px;\n  word-break: break-word;\n}\n\n.atv-review-modal-body pre {\n  background: rgba(0, 0, 0, 0.4);\n  border: 1px solid var(--atv-border-subtle);\n  padding: 16px 20px;\n  border-radius: var(--atv-radius-sm);\n  overflow-x: auto;\n  -webkit-overflow-scrolling: touch;\n  line-height: 1.6;\n  margin: 0 0 20px;\n}\n\n.atv-review-modal-body pre code {\n  background: none;\n  padding: 0;\n  font-size: 14px;\n  word-break: normal;\n}\n\n/* --- Tables --- */\n\n.atv-review-modal-body table {\n  width: 100%;\n  border-collapse: collapse;\n  margin: 20px 0;\n  line-height: 1.6;\n}\n\n.atv-review-modal-body thead {\n  border-bottom: 2px solid var(--atv-border-medium);\n}\n\n.atv-review-modal-body th {\n  font-weight: 600;\n  text-align: left;\n  padding: 10px 14px;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\n.atv-review-modal-body td {\n  padding: 10px 14px;\n  border-bottom: 1px solid var(--atv-border-subtle);\n  color: rgba(255, 255, 255, 0.82);\n}\n\n.atv-review-modal-body tbody tr:last-child td {\n  border-bottom: none;\n}\n\n.atv-review-modal-body .review-content,\n.atv-review-modal-body .review-content p,\n.atv-review-modal-body .review-content div,\n.atv-review-modal-body .review-content span {\n  color: rgba(255, 255, 255, 0.82);\n}\n\n.atv-review-modal-body .spoiler-tip {\n  color: #ff9f0a;\n  font-size: 13px;\n  font-weight: 600;\n  margin-bottom: 12px;\n}\n\n.atv-review-modal-body .main-hd {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-bottom: 16px;\n}\n\n.atv-review-modal-body .main-hd a.name {\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-accent);\n  text-decoration: none;\n}\n\n.atv-review-modal-body .main-hd a.name:hover {\n  text-decoration: underline;\n}\n\n.atv-review-modal-footer {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-top: 28px;\n  padding-top: 20px;\n  border-top: 1px solid rgba(255, 255, 255, 0.04);\n}\n\n.atv-review-modal-votes {\n  display: flex;\n  gap: 14px;\n}\n\n.atv-review-modal-link {\n  display: flex;\n  align-items: center;\n}\n\n#atv-douban-root .atv-review-modal-link-a {\n  font-size: 13px;\n  color: rgba(255, 255, 255, 0.5);\n  background: transparent;\n  text-decoration: none;\n  transition: color 200ms ease;\n}\n\n#atv-douban-root .atv-review-modal-link-a:link,\n#atv-douban-root .atv-review-modal-link-a:visited {\n  color: rgba(255, 255, 255, 0.5);\n  background: transparent;\n}\n\n#atv-douban-root .atv-review-modal-link-a:hover,\n#atv-douban-root .atv-review-modal-link-a:active {\n  color: var(--atv-accent);\n  background: transparent;\n}\n\n.atv-review-modal-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n  margin: 0 0 4px;\n  color: var(--atv-rating-gold);\n}\n\n.atv-review-modal-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-review-modal-body.is-skeleton {\n  position: relative;\n  min-height: 140px;\n  color: transparent;\n}\n\n.atv-review-modal-body.is-skeleton::before,\n.atv-review-modal-body.is-skeleton::after {\n  display: block;\n  height: 14px;\n  border-radius: 4px;\n  content: \"\";\n  background: linear-gradient(\n    90deg,\n    rgba(255, 255, 255, 0.04) 25%,\n    rgba(255, 255, 255, 0.1) 50%,\n    rgba(255, 255, 255, 0.04) 75%\n  );\n  background-size: 200% 100%;\n  animation: atv-ratings-shimmer 1.6s ease-in-out infinite;\n}\n\n.atv-review-modal-body.is-skeleton::before {\n  width: 92%;\n  margin-bottom: 14px;\n}\n\n.atv-review-modal-body.is-skeleton::after {\n  width: 68%;\n}\n\n.atv-review-modal-body.is-error {\n  display: flex;\n  min-height: 140px;\n  align-items: center;\n  justify-content: center;\n  color: var(--atv-text-tertiary);\n  text-align: center;\n}\n\n.atv-review-modal-error {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  align-items: center;\n}\n\n.atv-review-modal-error p {\n  margin: 0;\n}\n\n.atv-review-modal-retry {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 34px;\n  padding: 0 18px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(255, 255, 255, 0.04);\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-text-secondary);\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-review-modal-retry:hover,\n.atv-review-modal-retry:focus-visible {\n  color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.08);\n  border-color: rgba(65, 190, 93, 0.35);\n}\n\n.atv-review-modal-retry:focus-visible,\n.atv-review-modal .atv-modal-close:focus-visible,\n#atv-douban-root .atv-review-modal-link-a:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 3px;\n}\n\n/* ---------- Responsive ---------- */\n\n@media (max-width: 1024px) {\n  .atv-hero {\n    min-height: 64vh;\n    padding: 104px 24px 48px;\n  }\n  .atv-hero-inner {\n    flex-direction: column;\n    gap: 28px;\n    align-items: flex-start;\n  }\n  .atv-poster-card {\n    width: 220px;\n  }\n  .atv-section {\n    padding: 44px 24px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 160px 1fr;\n    column-gap: 24px;\n  }\n}\n\n@media (max-width: 768px) {\n  .atv-hero {\n    min-height: 56vh;\n    padding: 88px 20px 40px;\n  }\n  .atv-poster-card {\n    width: 180px;\n  }\n  .atv-section {\n    padding: 36px 20px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 1fr;\n    row-gap: 4px;\n  }\n  .atv-info-label {\n    padding-top: 12px;\n  }\n  .atv-recs {\n    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));\n    gap: 18px;\n  }\n  .atv-cast-card {\n    flex-basis: 120px;\n  }\n  .atv-cast-avatar {\n    width: 120px;\n    height: 120px;\n  }\n  .atv-series-card {\n    flex-basis: 120px;\n  }\n  .atv-photo-tile {\n    flex-basis: 280px;\n  }\n  .atv-photo-tile.is-portrait {\n    flex-basis: 170px;\n  }\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n  }\n  .atv-rating-panel {\n    min-width: 0;\n  }\n  .atv-comments {\n    grid-template-columns: 1fr;\n  }\n  .atv-comment-overlay-inner {\n    max-width: 95vw;\n    border-radius: 16px;\n  }\n  .atv-comment-overlay-top {\n    padding: 24px 20px 0;\n  }\n  .atv-comment-overlay-body {\n    padding: 16px 20px;\n    font-size: 14px;\n  }\n  .atv-comment-overlay-foot {\n    padding: 0 20px 24px;\n  }\n  .atv-reviews {\n    grid-template-columns: 1fr;\n  }\n  .atv-review-modal-scroll {\n    padding: 24px 18px 22px;\n    max-width: 100vw;\n    max-height: 92vh;\n    border-radius: 20px 20px 0 0;\n  }\n  .atv-review-modal {\n    align-items: flex-end;\n    padding: 0;\n    overscroll-behavior: contain;\n  }\n  .atv-review-modal .atv-modal-close {\n    top: 14px;\n    right: 14px;\n  }\n  .atv-review-modal-body blockquote {\n    margin: 16px 0;\n    padding: 12px 14px;\n  }\n  .atv-review-modal-body blockquote blockquote {\n    padding: 10px 12px;\n  }\n  .atv-review-modal-body .image-container {\n    margin: 16px 0;\n  }\n  .atv-review-modal-body .image-container.image-float-left,\n  .atv-review-modal-body .image-container.image-float-right {\n    float: none;\n    max-width: 100%;\n    margin: 16px 0;\n  }\n\n  /* Review content typography — responsive */\n  .atv-review-modal-body h3 {\n    margin-top: 22px;\n  }\n  .atv-review-modal-body h4 {\n    margin-top: 18px;\n  }\n  .atv-review-modal-body hr {\n    margin: 22px 0;\n  }\n  .atv-review-modal-body pre {\n    padding: 12px 16px;\n  }\n  .atv-review-modal-body th,\n  .atv-review-modal-body td {\n    padding: 8px 10px;\n  }\n  .atv-login-modal {\n    align-items: flex-end;\n    padding: 16px;\n  }\n  .atv-login-modal-inner {\n    width: 100%;\n    padding: 28px 20px 20px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-trailer-tile,\n  .atv-trailer-tile:hover {\n    transform: none;\n    filter: none;\n  }\n  .atv-trailer-play-overlay {\n    transition: none;\n  }\n  .atv-trailer-play-btn {\n    transition: none;\n  }\n  .atv-trailer-tile:hover .atv-trailer-play-btn {\n    transform: none;\n    box-shadow: none;\n  }\n  .atv-modal-video {\n    transition: none;\n  }\n  .atv-modal-overlay.is-open .atv-modal-video {\n    transform: none;\n  }\n  .atv-comment-avatar.atv-avatar-loaded {\n    animation: none;\n  }\n  .atv-review-card,\n  .atv-review-card:hover,\n  .atv-review-card:active {\n    transform: none;\n    transition: none;\n    box-shadow: none;\n  }\n  .atv-review-modal-scroll {\n    transition: none;\n    transform: none;\n  }\n  .atv-review-modal.is-open .atv-review-modal-scroll {\n    transform: none;\n  }\n  .atv-review-modal-accent {\n    transition: none;\n    transform: scaleX(1);\n  }\n  .atv-review-modal {\n    transition: none;\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n  }\n  .atv-review-modal-body.is-skeleton::before,\n  .atv-review-modal-body.is-skeleton::after {\n    animation: none;\n  }\n\n  /* Modal overlay fades */\n  .atv-modal-overlay,\n  .atv-comment-overlay,\n  .atv-interest-modal,\n  .atv-login-modal {\n    transition: none;\n  }\n  .atv-login-modal-inner,\n  .atv-login-modal.is-open .atv-login-modal-inner {\n    transform: none;\n    transition: none;\n  }\n  .atv-login-modal-native[aria-busy=\"true\"] {\n    animation: none;\n  }\n\n  /* Accent edge glow */\n  .atv-comment-overlay-accent,\n  .atv-interest-modal-accent,\n  .atv-login-modal-accent {\n    transition: none;\n  }\n\n  /* Ensure accent glows are visible even without animation */\n  .atv-comment-overlay.is-open .atv-comment-overlay-accent,\n  .atv-interest-modal.is-open .atv-interest-modal-accent,\n  .atv-login-modal.is-open .atv-login-modal-accent {\n    transform: scaleX(1);\n  }\n}\n\n@media (max-width: 768px) {\n  .atv-trailer-tile {\n    flex-basis: 280px;\n  }\n}\n";
	var LOGIN_FRAME_STYLE_ID = "atv-login-frame-theme";
	var LOGIN_FRAME_CSS = `
:root {
  color-scheme: dark;
  --atv-login-bg: #1c1c1e;
  --atv-login-bg-elevated: rgba(255, 255, 255, 0.06);
  --atv-login-border: rgba(255, 255, 255, 0.12);
  --atv-login-border-strong: rgba(65, 190, 93, 0.32);
  --atv-login-text: #ffffff;
  --atv-login-text-muted: rgba(255, 255, 255, 0.64);
  --atv-login-text-faint: rgba(255, 255, 255, 0.42);
  --atv-login-accent: #41be5d;
  --atv-login-accent-bright: #4cd97a;
  --atv-login-danger: #ff6b6b;
}

html,
body {
  box-sizing: border-box !important;
  min-width: 0 !important;
  margin: 0 !important;
  color: var(--atv-login-text) !important;
  background: var(--atv-login-bg) !important;
}

*,
*::before,
*::after {
  box-sizing: inherit !important;
}

body,
button,
input,
select,
textarea {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", "Microsoft YaHei", Inter, system-ui, sans-serif !important;
}

a,
a:link,
a:visited {
  color: var(--atv-login-accent) !important;
  text-decoration: none !important;
  background: transparent !important;
}

a:hover,
a:active {
  color: var(--atv-login-accent-bright) !important;
  background: transparent !important;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--atv-login-accent) !important;
  outline-offset: 2px !important;
}

.account-body,
.account-main,
.account-form,
.login-wrap,
.login-box {
  box-sizing: border-box !important;
  max-width: 100% !important;
  color: var(--atv-login-text) !important;
  background: transparent !important;
  box-shadow: none !important;
}

.account-body {
  width: 100% !important;
  min-width: 0 !important;
  padding: 0 0 10px !important;
}

.account-body-tabs,
.account-tabcon-start,
.account-tabcon-quick,
.account-quick,
.account-form {
  width: 100% !important;
}

.account-body-tabs {
  margin-bottom: 16px !important;
}

.account-body-tabs ul,
.account-tab,
.tab-start,
.tab-quick {
  border-color: var(--atv-login-border) !important;
}

.account-tab a,
.account-tab span,
.account-tab-phone,
.account-tab-account,
.account-tab-scan {
  color: var(--atv-login-text-muted) !important;
  background: transparent !important;
  transition:
    color 180ms ease,
    border-color 180ms ease !important;
}

.account-tab a.on,
.account-tab span.on,
.account-tab-phone.on,
.account-tab-account.on,
.account-tab-scan.on,
.account-tab .active {
  color: var(--atv-login-text) !important;
  border-color: var(--atv-login-accent) !important;
}

.account-tab-switch,
.account-tab-switch-icon,
.quick.icon-switch,
.start.icon-switch {
  filter: saturate(0.4) brightness(1.8) !important;
}

.account-form-tips,
.account-form-error,
.account-form-err,
.account-error,
.error,
.tips,
.tip {
  line-height: 1.5 !important;
}

.account-form-tips {
  color: var(--atv-login-text-muted) !important;
}

.account-form-error,
.account-form-err,
.account-error,
.error {
  color: var(--atv-login-danger) !important;
}

.account-form-field,
.account-form-field-phone,
.account-form-field-code,
.account-form-field-password,
.account-form-field-submit {
  box-sizing: border-box !important;
}

.account-form-field,
.account-form-field-phone,
.account-form-field-code,
.account-form-field-password,
.global-phone-input-input {
  min-height: 44px !important;
  color: var(--atv-login-text) !important;
  background: var(--atv-login-bg-elevated) !important;
  border-color: var(--atv-login-border) !important;
  border-radius: 10px !important;
}

.account-form-field:focus-within,
.account-form-field-phone:focus-within,
.account-form-field-code:focus-within,
.account-form-field-password:focus-within,
.global-phone-input-input:focus-within {
  border-color: var(--atv-login-border-strong) !important;
  box-shadow: 0 0 0 3px rgba(65, 190, 93, 0.12) !important;
}

.account-form-field input,
.account-form-field-phone input,
.account-form-field-code input,
.account-form-field-password input,
.global-phone-input-input input,
input[type="text"],
input[type="password"],
input[type="tel"],
input[type="phone"] {
  min-height: 42px !important;
  color: var(--atv-login-text) !important;
  caret-color: var(--atv-login-accent) !important;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.account-form-field input::placeholder,
.account-form-field-phone input::placeholder,
.account-form-field-code input::placeholder,
.account-form-field-password input::placeholder,
input::placeholder {
  color: var(--atv-login-text-faint) !important;
}

.account-form-field-area-code,
.account-form-field-label,
.account-form-raw,
.account-form-tip,
.account-form-tips,
.account-form-ft,
.account-form-3rd,
.account-form-3rd-hd,
.global-phone-input-area {
  color: var(--atv-login-text-muted) !important;
}

.account-form-field-area-code,
.global-phone-input-area,
.account-form-field-code {
  border-color: var(--atv-login-border) !important;
}

.account-form-field-submit .btn,
.account-form-field-submit button,
.account-form-field-submit input[type="submit"],
.btn,
.btn-phone,
.btn-account,
.btn-submit,
.btn-account {
  color: #fff !important;
  background: var(--atv-login-accent) !important;
  border-color: var(--atv-login-accent) !important;
  border-radius: 999px !important;
  box-shadow: 0 10px 26px rgba(65, 190, 93, 0.24) !important;
}

.account-form-field-submit .btn:hover,
.account-form-field-submit button:hover,
.account-form-field-submit input[type="submit"]:hover,
.btn:hover,
.btn-phone:hover,
.btn-account:hover,
.btn-submit:hover,
.btn-account:hover {
  color: #fff !important;
  background: var(--atv-login-accent-bright) !important;
  border-color: var(--atv-login-accent-bright) !important;
}

.account-form-3rd,
.account-form-ft {
  border-color: var(--atv-login-border) !important;
}

.account-form-3rd a,
.account-form-3rd .link-3rd,
.link-3rd-wx,
.link-3rd-wb,
.link-3rd-qq {
  background-color: rgba(255, 255, 255, 0.06) !important;
  border-color: var(--atv-login-border) !important;
  filter: grayscale(1) brightness(1.4) !important;
}

.account-quick,
.account-quick .qrcode,
.account-quick .qr-code,
.account-quick img,
.qrcode,
.qr-code {
  color: var(--atv-login-text-muted) !important;
  background-color: transparent !important;
  border-color: var(--atv-login-border) !important;
}

.account-quick img,
.qrcode img,
.qr-code img {
  border-radius: 12px !important;
}

@media (max-width: 380px) {
  .account-body {
    padding-right: 0 !important;
    padding-left: 0 !important;
  }

  .account-form-field,
  .account-form-field-phone,
  .account-form-field-code,
  .account-form-field-password,
  .global-phone-input-input {
    border-radius: 9px !important;
  }
}
`;
	var isDoubanLoginFrame = (loc = window.location) => loc.hostname === "accounts.douban.com" && loc.pathname.startsWith("/passport/login");
	var installLoginFrameTheme = (doc = document) => {
		if (doc.querySelector(`#${LOGIN_FRAME_STYLE_ID}`)) return;
		const style = doc.createElement("style");
		style.id = LOGIN_FRAME_STYLE_ID;
		style.textContent = LOGIN_FRAME_CSS;
		(doc.head ?? doc.documentElement).append(style);
	}, n, l$1, u$2, i$2, r$1, o$2, e$1, f$2, c$1, a$1, s$1, h$1, p$1, v$1, y$1, d$1 = {}, w$1 = [], _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, g = Array.isArray;
	function m$1(n, l) {
		for (var u in l) n[u] = l[u];
		return n;
	}
	function b(n) {
		n && n.parentNode && n.parentNode.removeChild(n);
	}
	function k$1(l, u, t) {
		var i, r, o, e = {};
		for (o in u) "key" == o ? i = u[o] : "ref" == o ? r = u[o] : e[o] = u[o];
		if (arguments.length > 2 && (e.children = arguments.length > 3 ? n.call(arguments, 2) : t), "function" == typeof l && null != l.defaultProps) for (o in l.defaultProps) void 0 === e[o] && (e[o] = l.defaultProps[o]);
		return x$1(l, e, i, r, null);
	}
	function x$1(n, t, i, r, o) {
		var e = {
			type: n,
			props: t,
			key: i,
			ref: r,
			__k: null,
			__: null,
			__b: 0,
			__e: null,
			__c: null,
			constructor: void 0,
			__v: null == o ? ++u$2 : o,
			__i: -1,
			__u: 0
		};
		return null == o && null != l$1.vnode && l$1.vnode(e), e;
	}
	function S(n) {
		return n.children;
	}
	function C$1(n, l) {
		this.props = n, this.context = l;
	}
	function $$1(n, l) {
		if (null == l) return n.__ ? $$1(n.__, n.__i + 1) : null;
		for (var u; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) return u.__e;
		return "function" == typeof n.type ? $$1(n) : null;
	}
	function I(n) {
		if (n.__P && n.__d) {
			var u = n.__v, t = u.__e, i = [], r = [], o = m$1({}, u);
			o.__v = u.__v + 1, l$1.vnode && l$1.vnode(o), q$1(n.__P, o, u, n.__n, n.__P.namespaceURI, 32 & u.__u ? [t] : null, i, null == t ? $$1(u) : t, !!(32 & u.__u), r), o.__v = u.__v, o.__.__k[o.__i] = o, D$1(i, o, r), u.__e = u.__ = null, o.__e != t && P(o);
		}
	}
	function P(n) {
		if (null != (n = n.__) && null != n.__c) return n.__e = n.__c.base = null, n.__k.some(function(l) {
			if (null != l && null != l.__e) return n.__e = n.__c.base = l.__e;
		}), P(n);
	}
	function A$1(n) {
		(!n.__d && (n.__d = !0) && i$2.push(n) && !H.__r++ || r$1 != l$1.debounceRendering) && ((r$1 = l$1.debounceRendering) || o$2)(H);
	}
	function H() {
		try {
			for (var n, l = 1; i$2.length;) i$2.length > l && i$2.sort(e$1), n = i$2.shift(), l = i$2.length, I(n);
		} finally {
			i$2.length = H.__r = 0;
		}
	}
	function L(n, l, u, t, i, r, o, e, f, c, a) {
		var s, h, p, v, y, _, g, m = t && t.__k || w$1, b = l.length;
		for (f = T$1(u, l, m, f, b), s = 0; s < b; s++) null != (p = u.__k[s]) && (h = -1 != p.__i && m[p.__i] || d$1, p.__i = s, _ = q$1(n, p, h, i, r, o, e, f, c, a), v = p.__e, p.ref && h.ref != p.ref && (h.ref && J(h.ref, null, p), a.push(p.ref, p.__c || v, p)), null == y && null != v && (y = v), (g = !!(4 & p.__u)) || h.__k === p.__k ? (f = j$1(p, f, n, g), g && h.__e && (h.__e = null)) : "function" == typeof p.type && void 0 !== _ ? f = _ : v && (f = v.nextSibling), p.__u &= -7);
		return u.__e = y, f;
	}
	function T$1(n, l, u, t, i) {
		var r, o, e, f, c, a = u.length, s = a, h = 0;
		for (n.__k = new Array(i), r = 0; r < i; r++) null != (o = l[r]) && "boolean" != typeof o && "function" != typeof o ? ("string" == typeof o || "number" == typeof o || "bigint" == typeof o || o.constructor == String ? o = n.__k[r] = x$1(null, o, null, null, null) : g(o) ? o = n.__k[r] = x$1(S, { children: o }, null, null, null) : void 0 === o.constructor && o.__b > 0 ? o = n.__k[r] = x$1(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : n.__k[r] = o, f = r + h, o.__ = n, o.__b = n.__b + 1, e = null, -1 != (c = o.__i = O(o, u, f, s)) && (s--, (e = u[c]) && (e.__u |= 2)), null == e || null == e.__v ? (-1 == c && (i > a ? h-- : i < a && h++), "function" != typeof o.type && (o.__u |= 4)) : c != f && (c == f - 1 ? h-- : c == f + 1 ? h++ : (c > f ? h-- : h++, o.__u |= 4))) : n.__k[r] = null;
		if (s) for (r = 0; r < a; r++) null != (e = u[r]) && 0 == (2 & e.__u) && (e.__e == t && (t = $$1(e)), K(e, e));
		return t;
	}
	function j$1(n, l, u, t) {
		var i, r;
		if ("function" == typeof n.type) {
			for (i = n.__k, r = 0; i && r < i.length; r++) i[r] && (i[r].__ = n, l = j$1(i[r], l, u, t));
			return l;
		}
		n.__e != l && (t && (l && n.type && !l.parentNode && (l = $$1(n)), u.insertBefore(n.__e, l || null)), l = n.__e);
		do
			l = l && l.nextSibling;
		while (null != l && 8 == l.nodeType);
		return l;
	}
	function O(n, l, u, t) {
		var i, r, o, e = n.key, f = n.type, c = l[u], a = null != c && 0 == (2 & c.__u);
		if (null === c && null == e || a && e == c.key && f == c.type) return u;
		if (t > (a ? 1 : 0)) {
			for (i = u - 1, r = u + 1; i >= 0 || r < l.length;) if (null != (c = l[o = i >= 0 ? i-- : r++]) && 0 == (2 & c.__u) && e == c.key && f == c.type) return o;
		}
		return -1;
	}
	function z$1(n, l, u) {
		"-" == l[0] ? n.setProperty(l, null == u ? "" : u) : n[l] = null == u ? "" : "number" != typeof u || _.test(l) ? u : u + "px";
	}
	function N(n, l, u, t, i) {
		var r, o;
		n: if ("style" == l) if ("string" == typeof u) n.style.cssText = u;
		else {
			if ("string" == typeof t && (n.style.cssText = t = ""), t) for (l in t) u && l in u || z$1(n.style, l, "");
			if (u) for (l in u) t && u[l] == t[l] || z$1(n.style, l, u[l]);
		}
		else if ("o" == l[0] && "n" == l[1]) r = l != (l = l.replace(s$1, "$1")), o = l.toLowerCase(), l = o in n || "onFocusOut" == l || "onFocusIn" == l ? o.slice(2) : l.slice(2), n.l || (n.l = {}), n.l[l + r] = u, u ? t ? u[a$1] = t[a$1] : (u[a$1] = h$1, n.addEventListener(l, r ? v$1 : p$1, r)) : n.removeEventListener(l, r ? v$1 : p$1, r);
		else {
			if ("http://www.w3.org/2000/svg" == i) l = l.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
			else if ("width" != l && "height" != l && "href" != l && "list" != l && "form" != l && "tabIndex" != l && "download" != l && "rowSpan" != l && "colSpan" != l && "role" != l && "popover" != l && l in n) try {
				n[l] = null == u ? "" : u;
				break n;
			} catch (n) {}
			"function" == typeof u || (null == u || !1 === u && "-" != l[4] ? n.removeAttribute(l) : n.setAttribute(l, "popover" == l && 1 == u ? "" : u));
		}
	}
	function V(n) {
		return function(u) {
			if (this.l) {
				var t = this.l[u.type + n];
				if (null == u[c$1]) u[c$1] = h$1++;
				else if (u[c$1] < t[a$1]) return;
				return t(l$1.event ? l$1.event(u) : u);
			}
		};
	}
	function q$1(n, u, t, i, r, o, e, f, c, a) {
		var s, h, p, v, y, d, _, k, x, M, $, I, P, A, H, T, j = u.type;
		if (void 0 !== u.constructor) return null;
		128 & t.__u && (c = !!(32 & t.__u), o = [f = u.__e = t.__e]), (s = l$1.__b) && s(u);
		n: if ("function" == typeof j) {
			h = e.length;
			try {
				if (x = u.props, M = j.prototype && j.prototype.render, $ = (s = j.contextType) && i[s.__c], I = s ? $ ? $.props.value : s.__ : i, t.__c ? k = (p = u.__c = t.__c).__ = p.__E : (M ? u.__c = p = new j(x, I) : (u.__c = p = new C$1(x, I), p.constructor = j, p.render = Q), $ && $.sub(p), p.state || (p.state = {}), p.__n = i, v = p.__d = !0, p.__h = [], p._sb = []), M && null == p.__s && (p.__s = p.state), M && null != j.getDerivedStateFromProps && (p.__s == p.state && (p.__s = m$1({}, p.__s)), m$1(p.__s, j.getDerivedStateFromProps(x, p.__s))), y = p.props, d = p.state, p.__v = u, v) M && null == j.getDerivedStateFromProps && null != p.componentWillMount && p.componentWillMount(), M && null != p.componentDidMount && p.__h.push(p.componentDidMount);
				else {
					if (M && null == j.getDerivedStateFromProps && x !== y && null != p.componentWillReceiveProps && p.componentWillReceiveProps(x, I), u.__v == t.__v || !p.__e && null != p.shouldComponentUpdate && !1 === p.shouldComponentUpdate(x, p.__s, I)) {
						u.__v != t.__v && (p.props = x, p.state = p.__s, p.__d = !1), u.__e = t.__e, u.__k = t.__k, u.__k.some(function(n) {
							n && (n.__ = u);
						}), w$1.push.apply(p.__h, p._sb), p._sb = [], p.__h.length && e.push(p);
						break n;
					}
					null != p.componentWillUpdate && p.componentWillUpdate(x, p.__s, I), M && null != p.componentDidUpdate && p.__h.push(function() {
						p.componentDidUpdate(y, d, _);
					});
				}
				if (p.context = I, p.props = x, p.__P = n, p.__e = !1, P = l$1.__r, A = 0, M) p.state = p.__s, p.__d = !1, P && P(u), s = p.render(p.props, p.state, p.context), w$1.push.apply(p.__h, p._sb), p._sb = [];
				else do
					p.__d = !1, P && P(u), s = p.render(p.props, p.state, p.context), p.state = p.__s;
				while (p.__d && ++A < 25);
				p.state = p.__s, null != p.getChildContext && (i = m$1(m$1({}, i), p.getChildContext())), M && !v && null != p.getSnapshotBeforeUpdate && (_ = p.getSnapshotBeforeUpdate(y, d)), H = null != s && s.type === S && null == s.key ? E(s.props.children) : s, f = L(n, g(H) ? H : [H], u, t, i, r, o, e, f, c, a), p.base = u.__e, u.__u &= -161, p.__h.length && e.push(p), k && (p.__E = p.__ = null);
			} catch (n) {
				if (e.length = h, u.__v = null, c || null != o) {
					if (n.then) {
						for (u.__u |= c ? 160 : 128; f && 8 == f.nodeType && f.nextSibling;) f = f.nextSibling;
						null != o && (o[o.indexOf(f)] = null), u.__e = f;
					} else if (null != o) for (T = o.length; T--;) b(o[T]);
				} else u.__e = t.__e;
				u.__k ??= t.__k || [], n.then || B$1(u), l$1.__e(n, u, t);
			}
		} else null == o && u.__v == t.__v ? (u.__k = t.__k, u.__e = t.__e) : f = u.__e = G(t.__e, u, t, i, r, o, e, c, a);
		return (s = l$1.diffed) && s(u), 128 & u.__u ? void 0 : f;
	}
	function B$1(n) {
		n && (n.__c && (n.__c.__e = !0), n.__k && n.__k.some(B$1));
	}
	function D$1(n, u, t) {
		for (var i = 0; i < t.length; i++) J(t[i], t[++i], t[++i]);
		l$1.__c && l$1.__c(u, n), n.some(function(u) {
			try {
				n = u.__h, u.__h = [], n.some(function(n) {
					n.call(u);
				});
			} catch (n) {
				l$1.__e(n, u.__v);
			}
		});
	}
	function E(n) {
		return "object" != typeof n || null == n || n.__b > 0 ? n : g(n) ? n.map(E) : void 0 !== n.constructor ? null : m$1({}, n);
	}
	function G(u, t, i, r, o, e, f, c, a) {
		var s, h, p, v, y, w, _, m = i.props || d$1, k = t.props, x = t.type;
		if ("svg" == x ? o = "http://www.w3.org/2000/svg" : "math" == x ? o = "http://www.w3.org/1998/Math/MathML" : o || (o = "http://www.w3.org/1999/xhtml"), null != e) {
			for (s = 0; s < e.length; s++) if ((y = e[s]) && "setAttribute" in y == !!x && (x ? y.localName == x : 3 == y.nodeType)) {
				u = y, e[s] = null;
				break;
			}
		}
		if (null == u) {
			if (null == x) return document.createTextNode(k);
			u = document.createElementNS(o, x, k.is && k), c && (l$1.__m && l$1.__m(t, e), c = !1), e = null;
		}
		if (null == x) m === k || c && u.data == k || (u.data = k);
		else {
			if (e = "textarea" == x && null != k.defaultValue ? null : e && n.call(u.childNodes), !c && null != e) for (m = {}, s = 0; s < u.attributes.length; s++) m[(y = u.attributes[s]).name] = y.value;
			for (s in m) y = m[s], "dangerouslySetInnerHTML" == s ? p = y : "children" == s || s in k || "value" == s && "defaultValue" in k || "checked" == s && "defaultChecked" in k || N(u, s, null, y, o);
			for (s in k) y = k[s], "children" == s ? v = y : "dangerouslySetInnerHTML" == s ? h = y : "value" == s ? w = y : "checked" == s ? _ = y : c && "function" != typeof y || m[s] === y || N(u, s, y, m[s], o);
			if (h) c || p && (h.__html == p.__html || h.__html == u.innerHTML) || (u.innerHTML = h.__html), t.__k = [];
			else if (p && (u.innerHTML = ""), L("template" == t.type ? u.content : u, g(v) ? v : [v], t, i, r, "foreignObject" == x ? "http://www.w3.org/1999/xhtml" : o, e, f, e ? e[0] : i.__k && $$1(i, 0), c, a), null != e) for (s = e.length; s--;) b(e[s]);
			c && "textarea" != x || (s = "value", "progress" == x && null == w ? u.removeAttribute("value") : null != w && (w !== u[s] || "progress" == x && !w || "option" == x && w != m[s]) && N(u, s, w, m[s], o), s = "checked", null != _ && _ != u[s] && N(u, s, _, m[s], o));
		}
		return u;
	}
	function J(n, u, t) {
		try {
			if ("function" == typeof n) {
				var i = "function" == typeof n.__u;
				i && n.__u(), i && null == u || (n.__u = n(u));
			} else n.current = u;
		} catch (n) {
			l$1.__e(n, t);
		}
	}
	function K(n, u, t) {
		var i, r;
		if (l$1.unmount && l$1.unmount(n), (i = n.ref) && (i.current && i.current != n.__e || J(i, null, u)), null != (i = n.__c)) {
			if (i.componentWillUnmount) try {
				i.componentWillUnmount();
			} catch (n) {
				l$1.__e(n, u);
			}
			i.base = i.__P = i.__n = null;
		}
		if (i = n.__k) for (r = 0; r < i.length; r++) i[r] && K(i[r], u, t || "function" != typeof n.type);
		t || b(n.__e), n.__c = n.__ = n.__e = void 0;
	}
	function Q(n, l, u) {
		return this.constructor(n, u);
	}
	function R(u, t, i) {
		var r, o, e, f;
		t == document && (t = document.documentElement), l$1.__ && l$1.__(u, t), o = (r = "function" == typeof i) ? null : i && i.__k || t.__k, e = [], f = [], q$1(t, u = (!r && i || t).__k = k$1(S, null, [u]), o || d$1, d$1, t.namespaceURI, !r && i ? [i] : o ? null : t.firstChild ? n.call(t.childNodes) : null, e, !r && i ? i : o ? o.__e : t.firstChild, r, f), D$1(e, u, f), u.props.children = null;
	}
	function X(n) {
		function l(n) {
			var u, t;
			return this.getChildContext || (u = new Set(), (t = {})[l.__c] = this, this.getChildContext = function() {
				return t;
			}, this.componentWillUnmount = function() {
				u = null;
			}, this.shouldComponentUpdate = function(n) {
				this.props.value != n.value && u.forEach(function(n) {
					n.__e = !0, A$1(n);
				});
			}, this.sub = function(n) {
				u.add(n);
				var l = n.componentWillUnmount;
				n.componentWillUnmount = function() {
					u && u.delete(n), l && l.call(n);
				};
			}), n.children;
		}
		return l.__c = "__cC" + y$1++, l.__ = n, l.Provider = l.__l = (l.Consumer = function(n, l) {
			return n.children(l);
		}).contextType = l, l;
	}
	n = w$1.slice, l$1 = { __e: function(n, l, u, t) {
		for (var i, r, o; l = l.__;) if ((i = l.__c) && !i.__) try {
			if ((r = i.constructor) && null != r.getDerivedStateFromError && (i.setState(r.getDerivedStateFromError(n)), o = i.__d), null != i.componentDidCatch && (i.componentDidCatch(n, t || {}), o = i.__d), o) return i.__E = i;
		} catch (l) {
			n = l;
		}
		throw n;
	} }, u$2 = 0, C$1.prototype.setState = function(n, l) {
		var u = null != this.__s && this.__s != this.state ? this.__s : this.__s = m$1({}, this.state);
		"function" == typeof n && (n = n(m$1({}, u), this.props)), n && m$1(u, n), null != n && this.__v && (l && this._sb.push(l), A$1(this));
	}, C$1.prototype.forceUpdate = function(n) {
		this.__v && (this.__e = !0, n && this.__h.push(n), A$1(this));
	}, C$1.prototype.render = S, i$2 = [], o$2 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$1 = function(n, l) {
		return n.__v.__b - l.__v.__b;
	}, H.__r = 0, f$2 = Math.random().toString(8), c$1 = "__d" + f$2, a$1 = "__a" + f$2, s$1 = /(PointerCapture)$|Capture$/i, h$1 = 0, p$1 = V(!1), v$1 = V(!0), y$1 = 0;
	var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
	var delay = (ms) => new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
	var getXhr = () => {
		const g = _GM_xmlhttpRequest;
		if (!g) throw new Error("[DOUBAN-PLUS] GM_xmlhttpRequest unavailable");
		return g;
	};
	var gmRequest = (method, url, referer, extraHeaders, data) => {
		const headers = {
			"Content-Type": "application/x-www-form-urlencoded",
			...extraHeaders
		};
		if (referer) headers.Referer = referer;
		return new Promise((resolve, reject) => {
			getXhr()({
				data,
				headers,
				method,
				onerror: () => reject(new Error("GM_xmlhttpRequest failed")),
				onload: (r) => resolve(r.responseText),
				url
			});
		});
	};
	var gmPostOnce = (url, data, referer, extraHeaders) => gmRequest("POST", url, referer, extraHeaders, data);
	var RETRY_DELAYS = [
		300,
		800,
		2e3
	];
	var gmPost = async (url, data, referer, extraHeaders) => {
		for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) try {
			return await gmPostOnce(url, data, referer, extraHeaders);
		} catch (error) {
			if (attempt < RETRY_DELAYS.length) {
				console.warn("[GM] POST failed (attempt", attempt + 1, "), retrying in", RETRY_DELAYS[attempt], "ms —", error.message);
				await delay(RETRY_DELAYS[attempt]);
			} else throw error;
		}
		throw new Error("[GM] POST failed after all retries");
	};
	var gmGet = (url, referer) => gmRequest("GET", url, referer);
	var getCk = () => (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";
	var API_VOTE = "https://movie.douban.com/j/comment/vote";
	var postVote = async (cid, subjectId) => {
		const ck = getCk();
		if (!ck) return { ok: false };
		try {
			const text = await gmPost(API_VOTE, `id=${cid}&ck=${ck}`, subjectId ? `https://movie.douban.com/subject/${subjectId}/` : void 0);
			const data = JSON.parse(text);
			if (data.r === 0) return {
				count: data.count,
				ok: true
			};
			return { ok: false };
		} catch (error) {
			console.warn("[ATV-Douban] postVote error:", error);
			return { ok: false };
		}
	};
	var API_REVIEW_VOTE = "https://movie.douban.com/j/review";
	var postReviewVote = async (rid, type, subjectId) => {
		const ck = getCk();
		if (!ck) return { ok: false };
		try {
			const text = await gmPost(`${API_REVIEW_VOTE}/${rid}/${type}`, `ck=${ck}`, subjectId ? `https://movie.douban.com/subject/${subjectId}/` : void 0, { "x-csrf-token": `${ck} ck` });
			const data = JSON.parse(text);
			if (data.r === 0) return {
				ok: true,
				usefulCount: data.useful_count,
				uselessCount: data.useless_count
			};
			return { ok: false };
		} catch (error) {
			console.warn("[ATV-Douban] postReviewVote error:", error);
			return { ok: false };
		}
	};
	var computeNavSections = (data) => {
		const sections = [];
		if (data.streaming.length > 0) sections.push({
			id: "atv-stream",
			label: "在哪儿看"
		});
		if (data.series.length > 0) sections.push({
			id: "atv-series",
			label: "同系列"
		});
		if (data.celebrities.length > 0) sections.push({
			id: "atv-cast",
			label: "演职员"
		});
		if (data.photos.length > 0 || data.trailers.length > 0) sections.push({
			id: "atv-photos",
			label: "剧照"
		});
		if (data.comments.length > 0) sections.push({
			id: "atv-comments",
			label: "短评"
		});
		if (data.reviews.length > 0) sections.push({
			id: "atv-reviews",
			label: data.isTV ? "剧评" : "影评"
		});
		if (data.recommendations.length > 0) sections.push({
			id: "atv-recs",
			label: "相似作品"
		});
		sections.push({
			id: "atv-info",
			label: "详情"
		});
		return sections;
	}, f$1 = 0;
	Array.isArray;
	function u$1(e, t, n, o, i, u) {
		t || (t = {});
		var a, c, p = t;
		if ("ref" in p) for (c in p = {}, t) "ref" == c ? a = t[c] : p[c] = t[c];
		var l = {
			type: e,
			props: p,
			key: n,
			ref: a,
			__k: null,
			__: null,
			__b: 0,
			__e: null,
			__c: null,
			constructor: void 0,
			__v: --f$1,
			__i: -1,
			__u: 0,
			__source: i,
			__self: u
		};
		if ("function" == typeof e && (a = e.defaultProps)) for (c in a) void 0 === p[c] && (p[c] = a[c]);
		return l$1.vnode && l$1.vnode(l), l;
	}
	var Section = ({ children, id, moreLink, title }) => u$1("section", {
		class: "atv-section",
		id,
		children: [moreLink ? u$1("div", {
			class: "atv-section-h-row",
			children: [u$1("h2", {
				class: "atv-section-h",
				children: title
			}), u$1("a", {
				class: "atv-section-more",
				href: moreLink.href,
				rel: "noopener",
				target: "_blank",
				children: moreLink.text
			})]
		}) : u$1("h2", {
			class: "atv-section-h",
			children: title
		}), children]
	});
	var StickyNav = ({ sections, title }) => u$1(S, { children: [u$1("div", {
		class: "atv-stickynav-title",
		children: title.primary || title.full
	}), u$1("div", {
		class: "atv-stickynav-jumps",
		children: sections.map((section) => u$1("a", {
			href: `#${section.id}`,
			onClick: (event) => {
				event.preventDefault();
				document.querySelector(`#${section.id}`)?.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			},
			children: section.label
		}, section.id))
	})] });
	var t, r, u, i, o = 0, f = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, p = c.__;
	function s(n, t) {
		c.__h && c.__h(r, n, o || t), o = 0;
		var u = r.__H || (r.__H = {
			__: [],
			__h: []
		});
		return n >= u.__.length && u.__.push({}), u.__[n];
	}
	function d(n) {
		return o = 1, y(D, n);
	}
	function y(n, u, i) {
		var o = s(t++, 2);
		if (o.t = n, !o.__c && (o.__ = [i ? i(u) : D(void 0, u), function(n) {
			var t = o.__N ? o.__N[0] : o.__[0], r = o.t(t, n);
			t !== r && (o.__N = [r, o.__[1]], o.__c.setState({}));
		}], o.__c = r, !r.__f)) {
			var f = function(n, t, r) {
				if (!o.__c.__H) return !0;
				var u = !1, i = o.__c.props !== n;
				if (o.__c.__H.__.some(function(n) {
					if (n.__N) {
						u = !0;
						var t = n.__[0];
						n.__ = n.__N, n.__N = void 0, t !== n.__[0] && (i = !0);
					}
				}), c) {
					var f = c.call(this, n, t, r);
					return u ? f || i : f;
				}
				return !u || i;
			};
			r.__f = !0;
			var c = r.shouldComponentUpdate, e = r.componentWillUpdate;
			r.componentWillUpdate = function(n, t, r) {
				if (this.__e) {
					var u = c;
					c = void 0, f(n, t, r), c = u;
				}
				e && e.call(this, n, t, r);
			}, r.shouldComponentUpdate = f;
		}
		return o.__N || o.__;
	}
	function h(n, u) {
		var i = s(t++, 3);
		!c.__s && C(i.__H, u) && (i.__ = n, i.u = u, r.__H.__h.push(i));
	}
	function A(n) {
		return o = 5, T(function() {
			return { current: n };
		}, []);
	}
	function T(n, r) {
		var u = s(t++, 7);
		return C(u.__H, r) && (u.__ = n(), u.__H = r, u.__h = n), u.__;
	}
	function q(n, t) {
		return o = 8, T(function() {
			return n;
		}, t);
	}
	function x(n) {
		var u = r.context[n.__c], i = s(t++, 9);
		return i.c = n, u ? (i.__ ?? (i.__ = !0, u.sub(r)), u.props.value) : n.__;
	}
	function j() {
		for (var n; n = f.shift();) {
			var t = n.__H;
			if (n.__P && t) try {
				t.__h.some(z), t.__h.some(B), t.__h = [];
			} catch (r) {
				t.__h = [], c.__e(r, n.__v);
			}
		}
	}
	c.__b = function(n) {
		r = null, e && e(n);
	}, c.__ = function(n, t) {
		n && t.__k && t.__k.__m && (n.__m = t.__k.__m), p && p(n, t);
	}, c.__r = function(n) {
		a && a(n), t = 0;
		var i = (r = n.__c).__H;
		i && (u === r ? (i.__h = [], r.__h = [], i.__.some(function(n) {
			n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
		})) : (i.__h.some(z), i.__h.some(B), i.__h = [], t = 0)), u = r;
	}, c.diffed = function(n) {
		v && v(n);
		var t = n.__c;
		t && t.__H && (t.__H.__h.length && (1 !== f.push(t) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j)), t.__H.__.some(function(n) {
			n.u && (n.__H = n.u, n.u = void 0);
		})), u = r = null;
	}, c.__c = function(n, t) {
		t.some(function(n) {
			try {
				n.__h.some(z), n.__h = n.__h.filter(function(n) {
					return !n.__ || B(n);
				});
			} catch (r) {
				t.some(function(n) {
					n.__h && (n.__h = []);
				}), t = [], c.__e(r, n.__v);
			}
		}), l && l(n, t);
	}, c.unmount = function(n) {
		m && m(n);
		var t, r = n.__c;
		r && r.__H && (r.__H.__.some(function(n) {
			try {
				z(n);
			} catch (n) {
				t = n;
			}
		}), r.__H = void 0, t && c.__e(t, r.__v));
	};
	var k = "function" == typeof requestAnimationFrame;
	function w(n) {
		var t, r = function() {
			clearTimeout(u), k && cancelAnimationFrame(t), setTimeout(n);
		}, u = setTimeout(r, 35);
		k && (t = requestAnimationFrame(r));
	}
	function z(n) {
		var t = r, u = n.__c;
		"function" == typeof u && (n.__c = void 0, u()), r = t;
	}
	function B(n) {
		var t = r;
		n.__c = n.__(), r = t;
	}
	function C(n, t) {
		return !n || n.length !== t.length || t.some(function(t, r) {
			return t !== n[r];
		});
	}
	function D(n, t) {
		return "function" == typeof t ? t(n) : t;
	}
	var CommentAvatar = ({ className, comment }) => u$1("div", {
		class: className,
		"data-cid": comment.cid || void 0,
		style: comment.avatar ? { backgroundImage: `url("${comment.avatar}")` } : void 0,
		children: comment.avatar ? null : (comment.name || "?").slice(0, 1).toUpperCase()
	});
	var HtmlContent = ({ children, className, html, ...rest }) => {
		const setRef = (el) => {
			if (el && html) el.innerHTML = html;
		};
		return u$1("div", {
			class: className,
			ref: setRef,
			...rest,
			children: html ? null : children
		});
	};
	var IconStarFull = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "currentColor",
			d: "M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
		})
	});
	var IconStarHalf = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: [u$1("defs", { children: u$1("linearGradient", {
			id: "atvHalfStar",
			children: [u$1("stop", {
				offset: "50%",
				"stop-color": "currentColor"
			}), u$1("stop", {
				offset: "50%",
				"stop-color": "currentColor",
				"stop-opacity": "0.22"
			})]
		}) }), u$1("path", {
			fill: "url(#atvHalfStar)",
			d: "M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
		})]
	});
	var IconStarEmpty = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "currentColor",
			"fill-opacity": "0.22",
			d: "M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
		})
	});
	var IconPlay = (props) => u$1("svg", {
		viewBox: "0 0 14 14",
		width: "14",
		height: "14",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "currentColor",
			d: "M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z"
		})
	});
	var IconCheck = (props) => u$1("svg", {
		viewBox: "0 0 14 14",
		width: "14",
		height: "14",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M2.5 7.5l3 3 6-7"
		})
	});
	var IconChevron = (props) => u$1("svg", {
		viewBox: "0 0 12 12",
		width: "10",
		height: "10",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "1.6",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M2.5 4l3.5 4 3.5-4"
		})
	});
	var IconArrow = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "15",
		height: "15",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "1.8",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5"
		})
	});
	var IconThumb = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "13",
		height: "13",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "currentColor",
			d: "M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z"
		})
	});
	var IconVoteTriangle = (props) => u$1("svg", {
		viewBox: "0 0 12 12",
		width: "12",
		height: "12",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "currentColor",
			d: "M6 2.2 10.4 9H1.6L6 2.2z"
		})
	});
	var IconExpand = (props) => u$1("svg", {
		viewBox: "0 0 14 14",
		width: "12",
		height: "12",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "1.5",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M3 5.5l4 4 4-4"
		})
	});
	var IconTomato = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u$1("circle", {
			cx: "8",
			cy: "8",
			r: "5.5",
			fill: "currentColor"
		})
	});
	var IconPopcorn = (props) => u$1("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u$1("path", {
			fill: "currentColor",
			d: "M8 2l6 6-6 6-6-6z"
		})
	});
	var IconClose = ({ size = 22, ...props }) => u$1("svg", {
		viewBox: "0 0 24 24",
		width: size,
		height: size,
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "2",
		"stroke-linecap": "round",
		...props,
		children: u$1("path", { d: "M6 6l12 12M18 6l-12 12" })
	});
	var IconFilmPlaceholder = (props) => u$1("svg", {
		viewBox: "0 0 64 96",
		width: "100%",
		height: "100%",
		preserveAspectRatio: "xMidYMid slice",
		"aria-hidden": "true",
		...props,
		children: [
			u$1("defs", { children: u$1("linearGradient", {
				id: "atvFilmGrad",
				x1: "0",
				y1: "0",
				x2: "1",
				y2: "1",
				children: [u$1("stop", {
					offset: "0%",
					"stop-color": "#2c2c2e"
				}), u$1("stop", {
					offset: "100%",
					"stop-color": "#1c1c1e"
				})]
			}) }),
			u$1("rect", {
				width: "64",
				height: "96",
				fill: "url(#atvFilmGrad)"
			}),
			u$1("g", {
				fill: "rgba(255,255,255,0.12)",
				children: [
					u$1("rect", {
						x: "4",
						y: "6",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "4",
						y: "18",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "4",
						y: "30",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "4",
						y: "42",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "4",
						y: "54",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "4",
						y: "66",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "4",
						y: "78",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "6",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "18",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "30",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "42",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "54",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "66",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u$1("rect", {
						x: "54",
						y: "78",
						width: "6",
						height: "6",
						rx: "1"
					})
				]
			}),
			u$1("path", {
				d: "M26 38l14 10-14 10z",
				fill: "rgba(255,255,255,0.28)"
			})
		]
	});
	var LogoDouban = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "豆瓣",
		fill: "#2D963D",
		...props,
		children: u$1("path", { d: "M.51 3.06h22.98V.755H.51V3.06Zm20.976 2.537v9.608h-2.137l-1.669 5.76H24v2.28H0v-2.28h6.32l-1.67-5.76H2.515V5.597h18.972Zm-5.066 9.608H7.58l1.67 5.76h5.501l1.67-5.76ZM18.367 7.9H5.634v5.025h12.733V7.9Z" })
	});
	var LogoImdb = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "IMDb",
		fill: "#F5C518",
		...props,
		children: u$1("path", { d: "M22.3781 0H1.6218C.7411.0583.0587.7437.0018 1.5953l-.001 20.783c.0585.8761.7125 1.543 1.5559 1.6191A.337.337 0 0 0 1.6016 24h20.7971a.4579.4579 0 0 0 .0437-.002c.8727-.0768 1.5568-.8271 1.5568-1.7085V1.7098c0-.8914-.696-1.6416-1.584-1.7078A.3294.3294 0 0 0 22.3781 0zm0 .496a1.2144 1.2144 0 0 1 1.1252 1.2139v20.5797c0 .6377-.4875 1.1602-1.1045 1.2145H1.6016c-.5967-.0543-1.0645-.5297-1.1053-1.1258V1.6284C.5371 1.0185 1.0184.5364 1.6217.496h20.7564zM4.7954 8.2603v7.3636H2.8899V8.2603h1.9055zm6.5367 0v7.3636H9.6707v-4.9704l-.6711 4.9704H7.813l-.6986-4.8618-.0066 4.8618h-1.668V8.2603h2.468c.0748.4476.1492.9694.2307 1.5734l.2712 1.8713.4407-3.4447h2.4817zm2.9772 1.3289c.0742.0404.122.108.1417.2034.0279.0953.0345.3118.0345.6442v2.8548c0 .4881-.0345.7867-.0955.8954-.0609.1152-.2304.1695-.5018.1695V9.5211c.204 0 .3457.0205.4211.0681zm-.0211 6.0347c.4543 0 .8006-.0265 1.0245-.0742.2304-.0477.4204-.1357.5694-.2648.1556-.1218.2642-.298.3251-.5219.0611-.2238.1021-.6648.1021-1.3224v-2.5832c0-.6986-.0271-1.1668-.0742-1.4039-.041-.237-.1431-.4543-.3126-.6437-.1695-.1973-.4198-.3324-.7456-.421-.3191-.0808-.8542-.1285-1.7694-.1285h-1.4244v7.3636h2.3051zm5.14-1.7827c0 .3523-.0199.5762-.0544.6708-.033.0947-.1894.1424-.3046.1424-.1086 0-.19-.0477-.2238-.1351-.041-.0887-.0609-.2986-.0609-.6238v-1.9469c0-.3324.0199-.5423.0543-.6237.0338-.0808.1086-.122.2171-.122.1153 0 .2709.0412.3114.1425.041.0947.0609.2986.0609.6032v1.8926zm-2.4747-5.5809v7.3636h1.7157l.1152-.4675c.1556.1894.3251.3324.5152.4271.1828.0881.4608.1357.678.1357.3047 0 .5629-.0748.7802-.237.2165-.1562.3589-.3462.4198-.5628.0543-.2173.0887-.543.0887-.9841v-2.0675c0-.4409-.0139-.7324-.0344-.8681-.0199-.1357-.0742-.2781-.1695-.4204-.1021-.1425-.2437-.251-.4272-.3325-.1834-.0742-.3999-.1152-.6576-.1152-.2172 0-.4952.0477-.6846.1285-.1835.0887-.353.2238-.5086.4007V8.2603h-1.8309z" })
	});
	var LogoMetacritic = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "Metacritic",
		fill: "#FFD500",
		...props,
		children: u$1("path", { d: "M11.99 0A12 12 0 1 0 24 12v-.014A12 12 0 0 0 11.99 0Zm-.055 2.564a9.399 9.399 0 0 1 9.407 9.389v.01a9.399 9.399 0 1 1-9.408-9.399Zm-1.61 17.198 2.046-2.046-3.94-3.94c-.165-.166-.345-.373-.442-.608-.221-.47-.318-1.203.221-1.742.664-.664 1.548-.387 2.406.47l3.788 3.788 2.046-2.046-3.954-3.954a2.48 2.48 0 0 1-.456-.622c-.263-.539-.25-1.216.235-1.7.677-.678 1.562-.429 2.544.553l3.677 3.677 2.046-2.046-3.982-3.982c-2.018-2.018-3.912-1.949-5.212-.65-.498.499-.802 1.024-.954 1.618a4.026 4.026 0 0 0-.055 1.686l-.027.028c-.996-.414-2.13-.166-3 .705-1.162 1.161-1.12 2.392-.982 3.11l-.042.043-1.009-.816-1.77 1.77a64.1 64.1 0 0 1 2.213 2.1z" })
	});
	var LogoRT = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "Rotten Tomatoes",
		fill: "#FA320A",
		...props,
		children: u$1("path", { d: "M5.866 0L4.335 1.262l2.082 1.8c-2.629-.989-4.842 1.4-5.012 2.338 1.384-.323 2.24-.422 3.344-.335-7.042 4.634-4.978 13.148-1.434 16.094 5.784 4.612 13.77 3.202 17.91-1.316C27.26 13.363 22.993.65 10.86 2.766c.107-1.17.633-1.503 1.243-1.602-.89-1.493-3.67-.734-4.556 1.374C7.52 2.602 5.866 0 5.866 0zM4.422 7.217H6.9c2.673 0 2.898.012 3.55.202 1.06.307 1.868.973 2.313 1.904.05.106.092.206.13.305l7.623.008.027 2.912-2.745-.024v7.549l-2.982-.016v-7.522l-2.127.016a2.92 2.92 0 0 1-1.056 1.134c-.287.176-.3.19-.254.264.127.2 2.125 3.642 2.125 3.659l-3.39.019-2.013-3.376c-.034-.047-.122-.068-.344-.084l-.297-.02.037 3.48-3.075-.038zm3.016 2.288l.024.338c.014.186.024.729.024 1.206v.867l.582-.025c.32-.013.695-.049.833-.078.694-.146 1.048-.478 1.087-1.018.027-.378-.063-.636-.303-.87-.318-.309-.761-.416-1.733-.418Z" })
	});
	var PlayIcon = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		fill: "none",
		stroke: "white",
		"stroke-width": "2",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		...props,
		children: u$1("polygon", {
			points: "6 3 20 12 6 21 6 3",
			fill: "white",
			stroke: "none"
		})
	});
	var LogoBilibili = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z" })
	});
	var LogoNetflix = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z" })
	});
	var LogoYouTube = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" })
	});
	var LogoAppleTv = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M20.57 17.735h-1.815l-3.34-9.203h1.633l2.02 5.987c.075.231.273.9.586 2.012l.297-.997.33-1.006 2.094-6.004H24zm-5.344-.066a5.76 5.76 0 0 1-1.55.207c-1.23 0-1.84-.693-1.84-2.087V9.646h-1.063V8.532h1.121V7.081l1.476-.602v2.062h1.707v1.113H13.38v5.805c0 .446.074.75.214.932.14.182.396.264.75.264.207 0 .495-.041.883-.115zm-7.29-5.343c.017 1.764 1.55 2.358 1.567 2.366-.017.042-.248.842-.808 1.658-.487.71-.99 1.418-1.79 1.435-.783.016-1.03-.462-1.93-.462-.89 0-1.17.445-1.913.478-.758.025-1.344-.775-1.838-1.484-.998-1.451-1.765-4.098-.734-5.88.51-.89 1.426-1.451 2.416-1.46.75-.016 1.468.512 1.93.512.461 0 1.327-.627 2.234-.536.38.016 1.452.157 2.136 1.154-.058.033-1.278.743-1.27 2.219M6.468 7.988c.404-.495.685-1.18.61-1.864-.585.025-1.294.388-1.723.883-.38.437-.71 1.138-.619 1.806.652.05 1.328-.338 1.732-.825Z" })
	});
	var LogoHbo = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872Z" })
	});
	var LogoHboMax = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M3.784 8.716c-.655 0-1.32.29-2.173.946v-.78H0v6.236h1.715V11.24c.749-.592 1.091-.78 1.372-.78.333 0 .551.209.551.729v3.928h1.715V11.23c.748-.582 1.081-.769 1.372-.769.333 0 .55.208.55.728v3.928H8.99v-4.53c0-1.403-.8-1.871-1.57-1.871-.654 0-1.32.27-2.192.936-.28-.697-.894-.936-1.444-.936zm8.689 0c-1.705 0-3.118 1.466-3.118 3.284 0 1.82 1.413 3.285 3.118 3.285.842 0 1.57-.312 2.131-.988v.82h1.632V8.883h-1.632v.822c-.561-.676-1.29-.988-2.131-.988zm4.064.166c.707 1.102 1.507 2.09 2.443 3.077a26.593 26.593 0 0 0-2.443 3.16h2.069a13.603 13.603 0 0 1 1.673-2.183 14.067 14.067 0 0 1 1.632 2.182H24a25.142 25.142 0 0 0-2.432-3.16A23.918 23.918 0 0 0 24 8.883h-2.047a14.65 14.65 0 0 1-1.674 2.11 13.357 13.357 0 0 1-1.674-2.11zm-3.804 1.279c1.018 0 1.84.82 1.84 1.84a1.837 1.837 0 0 1-1.84 1.839c-1.019 0-1.84-.82-1.84-1.84 0-1.018.821-1.84 1.84-1.84zm0 .415c-.78 0-1.414.633-1.414 1.423s.634 1.424 1.413 1.424c.78 0 1.414-.634 1.414-1.424s-.634-1.424-1.414-1.424z" })
	});
	var LogoParamountPlus = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M16.347 21.373c.057-.084.151-.314-.025-.74l-.53-1.428c-.073-.182.084-.293.19-.173 0 0 1.004 1.157 1.264 1.64l.495.822c.425.028 1.6.06 2.732.06a3.26 3.26 0 0 1-.316-.364c-1.93-2.392-3.154-3.724-3.166-3.737-.391-.426-.572-.508-.87-.643a4.82 4.82 0 0 1-.138-.065v.364c0 .047-.057.073-.086.022l-2.846-5.001a1.598 1.598 0 0 0-.508-.587l-.277-.194-1.354 3.123c.212 0 .354.216.27.409l-1.25 2.893h1.147c.443 0 .883.087 1.294.255l.302.125s-.913 1.878-.913 2.867c0 .181.028.362.075.534h2.104l-.096-.595s1.266.294 2.502.413M12 2.437c-6.627 0-12 5.373-12 12 0 2.669.873 5.133 2.346 7.126.503-.218.783-.542.983-.791l2.234-2.858a.467.467 0 0 1 .179-.138l.336-.146 3.674-4.659.534-.417 1.094-1.524a.482.482 0 0 1 .101-.102l.478-.347a.34.34 0 0 1 .398-.004l.578.407c.308.216.557.504.726.84l2.322 4.077c.051.09.09.129.182.174.454.227.732.268 1.33.913.277.304 1.495 1.666 3.203 3.784.236.318.538.588.963.783A11.948 11.948 0 0 0 24 14.437c0-6.627-5.373-12-12-12M3.236 15.1l-.778-.253-.48.662v-.818l-.778-.253.778-.253v-.818l.48.662.778-.253-.48.662Zm-.185 2.676-.252.778-.253-.778h-.818l.661-.481-.253-.777.663.48.66-.48-.252.777.662.481Zm.156-6.195.253.778-.661-.48-.663.48.253-.778-.66-.48h.817l.253-.778.252.777h.818Zm1.314-1.76L4.04 9.16l-.778.253.48-.661-.48-.663.778.254.48-.662v.818l.778.253-.777.252Zm2.045-2.862-.253.777-.252-.777h-.818l.662-.48-.253-.778.661.48.661-.48-.252.777.662.48Zm2.577-1.313-.48.661V5.49l-.779-.254.778-.253v-.817l.48.66.78-.253-.481.663.48.66zm3.265-.75.253.778-.661-.48-.662.48.252-.777-.66-.481h.818L12 3.637l.252.778h.818zm2.93.595v.816l-.481-.661-.777.252.48-.662-.48-.662.777.253.48-.66v.817l.779.252zm5.426 8.285.778.253.48-.662v.818l.778.253-.778.253v.818l-.48-.662-.778.253.48-.662zm-3.077-6.04-.253-.777h-.818l.662-.48-.253-.778.662.48.662-.48-.254.778.662.48h-.818zm1.792 2.086v-.818l-.777-.252.777-.253V7.68l.481.662.777-.254-.48.663.48.66-.777-.252zm1.469 1.278.253-.777.254.777h.816l-.66.481.252.778-.662-.48-.661.48.253-.778-.662-.48zm.506 6.676-.253.778-.253-.778h-.817l.662-.481-.253-.777.66.48.663-.48-.253.777.661.481zm-12.08-.615.76-1.588c.024-.048-.032-.108-.067-.067l-.664.668c-.313.329-.847 1.25-.95 1.421l-.808 1.335a.109.109 0 0 1 .1.162l-.739 1.238c-.18.309.145.523.189.452 1.157-1.868 1.832-1.719 1.832-1.719l.387-.897c.022-.047-.001-.1-.05-.12-.12-.05-.316-.27.01-.885z" })
	});
	var LogoTubi = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M16.696 15.272v-.752c.4.548 1.107.917 1.934.917 1.475 0 2.28-.956 2.28-2.865 0-1.714-.893-2.858-2.235-2.858-.851 0-1.55.347-1.979.908v-2.06h-2.674v6.71zm1.57-2.614c0 .827-.337 1.275-.827 1.275-.486 0-.837-.452-.837-1.275s.342-1.28.837-1.28c.495 0 .828.452.828 1.28zM6.94 9.988v3.6c0 1.236.754 1.841 1.955 1.841.959 0 1.625-.396 2.028-1.064v.91h2.597V9.989h-2.675v3.14c0 .493-.346.693-.666.693-.321 0-.568-.192-.568-.655V9.989Zm14.39 0H24v5.276h-2.67ZM6.553 11.136c0 .781-.635 1.415-1.42 1.415-.783 0-1.419-.634-1.419-1.415 0-.782.636-1.415 1.42-1.415.784 0 1.42.633 1.42 1.415zM3.49 9.702v2.668c.005.653.327.924.976.924.225 0 .526-.053.672-.166v1.931c-.49.243-.869.378-1.535.378 0 0-.069 0-.18-.006l-.003.006c-1.614 0-2.51-1.035-2.482-2.686v-.47H0V9.99h.92V8.563h2.569Z" })
	});
	var LogoVimeo = (props) => u$1("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u$1("path", { d: "M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.8809 1.132l-1.129-1.457a315.06 315.06 0 003.501-3.1279c1.579-1.368 2.765-2.085 3.5539-2.159 1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.5069.5389 2.45 1.1309 3.674 1.7759 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z" })
	});
	var starComponents = (score, outOfFive = false) => {
		const normalized = outOfFive ? score : score / 2;
		return Array.from({ length: 5 }, (_, index) => {
			const position = index + 1;
			if (normalized >= position - .25) return IconStarFull;
			if (normalized >= position - .5) return IconStarHalf;
			return IconStarEmpty;
		});
	};
	var Stars = ({ className = "atv-rating-stars", outOfFive = false, score }) => u$1("span", {
		class: className,
		children: starComponents(score, outOfFive).map((Icon, index) => u$1(Icon, {}, index))
	});
	var commentVoteKey = (comment) => comment.cid || comment.link;
	var initialCommentVoteState = (comment) => ({
		count: comment.votes,
		voted: comment.voted
	});
	var optimisticCommentVoteState = (state) => ({
		count: state.count + 1,
		voted: true
	});
	var resolvedCommentVoteState = (current, result) => ({
		count: result.count ?? current.count,
		voted: true
	});
	var commentWithVoteState = (comment, state) => ({
		...comment,
		voted: state.voted,
		votes: state.count
	});
	var CommentVoteButton = ({ canVote, cid, className, count, onStateChange, onVote, state, voted }) => {
		const [localState, setLocalState] = d({
			count,
			voted
		});
		const [loading, setLoading] = d(false);
		const voteState = state ?? localState;
		const setVoteState = (nextState) => {
			if (onStateChange) onStateChange(nextState);
			else setLocalState(nextState);
		};
		const vote = async () => {
			if (loading || voteState.voted || !cid) return;
			if (canVote && !canVote()) return;
			setLoading(true);
			const previous = voteState;
			const optimistic = optimisticCommentVoteState(voteState);
			setVoteState(optimistic);
			const result = await onVote(cid);
			if (result.ok) setVoteState(resolvedCommentVoteState(optimistic, result));
			else setVoteState(previous);
			setLoading(false);
		};
		return u$1("button", {
			"aria-label": `有用，${voteState.count} 人觉得有用`,
			"aria-pressed": voteState.voted,
			class: `${className}${voteState.voted ? " is-voted" : ""}`,
			disabled: loading || voteState.voted || !cid,
			onClick: (event) => {
				event.stopPropagation();
				vote();
			},
			type: "button",
			children: [u$1(IconThumb, {}), u$1("span", {
				class: "atv-vote-count",
				children: voteState.count
			})]
		});
	};
	var CommentCard = ({ canVote, comment, onOpen, onVoteStateChange, onVote, voteState }) => u$1("div", {
		class: "atv-comment-card",
		"data-cid": comment.cid || void 0,
		children: [
			u$1("div", {
				class: "atv-comment-top",
				children: [u$1(CommentAvatar, {
					className: "atv-comment-avatar",
					comment
				}), u$1("div", {
					class: "atv-comment-meta",
					children: [comment.link ? u$1("a", {
						class: "atv-comment-author",
						href: comment.link,
						rel: "noopener",
						target: "_blank",
						children: comment.name
					}) : u$1("div", {
						class: "atv-comment-author",
						children: comment.name
					}), comment.stars > 0 ? u$1(Stars, {
						className: "atv-comment-stars",
						outOfFive: true,
						score: comment.stars
					}) : null]
				})]
			}),
			u$1("button", {
				class: "atv-comment-body",
				onClick: (event) => {
					if (event.currentTarget.closest(".atv-comment-card")?.classList.contains("has-overflow")) onOpen(comment);
				},
				type: "button",
				children: u$1("span", {
					class: "atv-comment-body-text",
					children: comment.content
				})
			}),
			u$1("div", {
				class: "atv-comment-foot",
				children: [u$1("span", { children: comment.time || "" }), u$1("div", {
					class: "atv-comment-foot-right",
					children: [u$1("button", {
						"aria-label": "展开短评",
						class: "atv-comment-expand",
						onClick: (event) => {
							event.stopPropagation();
							onOpen(comment);
						},
						type: "button",
						children: u$1(IconExpand, {})
					}), u$1(CommentVoteButton, {
						canVote,
						cid: comment.cid,
						className: "atv-comment-votes",
						count: comment.votes,
						onStateChange: onVoteStateChange ? (state) => onVoteStateChange(comment, state) : void 0,
						onVote,
						state: voteState,
						voted: comment.voted
					})]
				})]
			})
		]
	});
	var focusableSelector = [
		"button:not([disabled])",
		"iframe",
		"a[href]",
		"input:not([disabled])",
		"select:not([disabled])",
		"textarea:not([disabled])",
		"[tabindex]:not([tabindex='-1'])"
	].join(", ");
	var focusableElements = (root) => [...root.querySelectorAll(focusableSelector)].filter((node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true");
	var trapFocus = (event, root) => {
		if (event.key !== "Tab") return;
		const focusable = focusableElements(root);
		if (!focusable.length) {
			event.preventDefault();
			root.focus();
			return;
		}
		const [first] = focusable;
		const last = focusable.at(-1);
		const active = document.activeElement;
		if (event.shiftKey && active === first) {
			event.preventDefault();
			last?.focus();
			return;
		}
		if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	};
	var ModalCloseButton = ({ ariaLabel, className = "atv-modal-close", onClick, size = 22 }) => u$1("button", {
		"aria-label": ariaLabel,
		class: className,
		onClick,
		type: "button",
		children: u$1(IconClose, { size })
	});
	var ModalCloseContext = X(null);
	var useModalClose = () => {
		const close = x(ModalCloseContext);
		if (!close) throw new Error("useModalClose must be used inside a ModalShell");
		return close;
	};
	var TRANSITION_DURATION_MS = 400;
	var ModalShell = ({ ariaDescribedBy, ariaLabelledBy, children, className, id, onClose, surfaceClassName }) => {
		const overlayRef = A(null);
		const surfaceRef = A(null);
		const [isOpen, setIsOpen] = d(false);
		const [closing, setClosing] = d(false);
		const realOnCloseRef = A(onClose);
		h(() => {
			realOnCloseRef.current = onClose;
		}, [onClose]);
		h(() => {
			requestAnimationFrame(() => setIsOpen(true));
		}, []);
		const handleClose = q(() => {
			if (closing) return;
			setClosing(true);
			setIsOpen(false);
			setTimeout(() => {
				realOnCloseRef.current();
			}, TRANSITION_DURATION_MS);
		}, [closing]);
		h(() => {
			const previousOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			const onKeydown = (event) => {
				if (event.key === "Escape") {
					handleClose();
					return;
				}
				const surface = surfaceRef.current;
				if (surface) trapFocus(event, surface);
			};
			document.addEventListener("keydown", onKeydown);
			requestAnimationFrame(() => surfaceRef.current?.focus());
			return () => {
				document.removeEventListener("keydown", onKeydown);
				document.body.style.overflow = previousOverflow;
			};
		}, [handleClose]);
		h(() => {
			const overlay = overlayRef.current;
			if (!overlay) return;
			const onClick = (event) => {
				if (event.target === overlay) handleClose();
			};
			overlay.addEventListener("click", onClick);
			return () => overlay.removeEventListener("click", onClick);
		}, [handleClose]);
		const openClass = isOpen ? " is-open" : "";
		return u$1(ModalCloseContext.Provider, {
			value: handleClose,
			children: u$1("dialog", {
				"aria-describedby": ariaDescribedBy,
				"aria-labelledby": ariaLabelledBy,
				"aria-modal": "true",
				class: `${className}${openClass}`,
				id,
				open: true,
				ref: overlayRef,
				children: u$1("div", {
					class: surfaceClassName,
					onClick: (event) => event.stopPropagation(),
					ref: surfaceRef,
					role: "none",
					tabindex: -1,
					children
				})
			})
		});
	};
	var RE_SLASH_SEP = /\s*\/\s*/gu;
	var RE_WS_GLOBAL = /\s+/gu;
	var RE_COLON_WS = /[:：\s]/gu;
	var RE_YEAR_TRAIL = /\(\d{4}\)\s*$/u;
	var RE_WS = /\s+/u;
	var RE_YEAR = /(?<year>\d{4})/u;
	var RE_NON_DIGIT = /\D/gu;
	var RE_HSPACE = /[ \t]+/gu;
	var RE_NL_MULTI = /\n{3,}/gu;
	var RE_IMDB_ID = /(?<id>tt\d+)/u;
	var RE_BG_URL = /url\(["']?(?<url>[^"')]+)["']?\)/u;
	var RE_SUBJECT_ID = /subject\/(?<id>\d+)/u;
	var RE_ALLSTAR = /allstar(?<rating>\d{2})/u;
	var RE_HTTP = /^https?:\/\//u;
	var RE_ONLINE_VIDEO = /online-video/u;
	var RE_WISH = /想看/u;
	var RE_DO = /在看/u;
	var RE_COLLECT = /看过/u;
	var RE_WISH_EXACT = /^想看$/u;
	var RE_DO_EXACT = /^在看$/u;
	var RE_COLLECT_EXACT = /^看过$/u;
	var RE_INTEREST_ACTIVE = /done|active|on\b|j_a\b/u;
	var RE_IMDB_LINK = /^tt\d+$/u;
	var RE_SEASON_SUFFIX = /\d$/u;
	var RE_SEASON_EP = /^第[一二三四五六七八九十百\d]+[季集]\s*/u;
	var RE_PLAY_SOURCES = /sources\[(?<sourceId>\d+)\]\s*=\s*\[\s*\{play_link:\s*"(?<playLink>[^"]+)"/gu;
	var RE_SOURCES_SCRIPT = /\bsources\s*\[/u;
	var strAttrs = [
		["id", "id"],
		["textContent", "textContent"],
		["text", "textContent"],
		["href", "href"],
		["src", "src"],
		["alt", "alt"],
		["target", "target"],
		["rel", "rel"],
		["type", "type"]
	];
	var el = (tag, attrs, children) => {
		const node = document.createElement(tag);
		if (attrs) {
			const cls = attrs.className ?? attrs.class;
			if (cls) node.className = Array.isArray(cls) ? cls.join(" ") : cls;
			for (const [key, attr] of strAttrs) {
				const val = attrs[key];
				if (val) if (attr === "id") node.id = val;
				else if (attr === "textContent") node.textContent = val;
				else node.setAttribute(attr, val);
			}
			if (attrs.html) node.innerHTML = attrs.html;
			if (attrs.attrs) for (const k of Object.keys(attrs.attrs)) node.setAttribute(k, attrs.attrs[k]);
			if (attrs.style) for (const k of Object.keys(attrs.style)) node.style.setProperty(k, attrs.style[k]);
			if (attrs.onclick) node.addEventListener("click", attrs.onclick);
		}
		if (children) for (const child of children) if (typeof child === "string") node.append(document.createTextNode(child));
		else node.append(child);
		return node;
	};
	var CLOSE_SVG = "<svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M6 6l12 12M18 6l-12 12\"/></svg>";
	var createOverlay = (options) => {
		const existing = document.querySelector(`#${options.id}`);
		if (existing) existing.remove();
		const overlay = el("div", {
			className: options.className || "",
			id: options.id
		});
		if (options.content) for (const child of options.content) overlay.append(child);
		const closeBtn = options.closeButton ?? el("button", {
			attrs: { type: "button" },
			className: "atv-modal-close",
			html: (() => {
				const icon = options.closeIcon ?? CLOSE_SVG;
				return options.closeSize ? icon.replace(`width="22"`, `width="${options.closeSize}"`).replace(`height="22"`, `height="${options.closeSize}"`) : icon;
			})()
		});
		if (!overlay.contains(closeBtn)) overlay.append(closeBtn);
		let dismissed = false;
		let keyHandler = null;
		const dismiss = () => {
			if (dismissed || !overlay.isConnected) return;
			dismissed = true;
			overlay.classList.remove("is-open");
			document.body.style.overflow = "";
			if (keyHandler) document.removeEventListener("keydown", keyHandler);
			options.onClose?.();
			setTimeout(() => {
				overlay.remove();
			}, 350);
		};
		closeBtn.addEventListener("click", dismiss);
		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) dismiss();
		});
		keyHandler = (e) => {
			if (e.key === "Escape") dismiss();
		};
		document.addEventListener("keydown", keyHandler);
		document.body.append(overlay);
		document.body.style.overflow = "hidden";
		requestAnimationFrame(() => overlay.classList.add("is-open"));
		return {
			closeBtn,
			dismiss,
			overlay
		};
	};
	var openPosterModal = (src, alt) => {
		createOverlay({
			className: "atv-modal-overlay",
			content: [el("img", {
				alt: alt || "",
				className: "atv-modal-img",
				src
			})],
			id: "atv-poster-modal"
		});
	};
	var openVideoModal = (trailer) => {
		if (!document.querySelector("#atv-vs")) {
			const s = el("style", {
				id: "atv-vs",
				textContent: "@keyframes atv-spin{to{transform:rotate(360deg)}}.atv-modal-loading{display:flex;flex-direction:column;align-items:center;gap:16px;color:#fff;font-size:15px}.atv-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#41be5d;border-radius:50%;animation:atv-spin .8s linear infinite}"
			});
			document.head.append(s);
		}
		const content = el("div", { className: "atv-modal-video-content" });
		const loading = el("div", {
			className: "atv-modal-loading",
			html: "<div class=\"atv-spinner\"></div><span>加载中...</span>"
		});
		content.append(loading);
		const { dismiss, overlay } = createOverlay({
			className: ["atv-modal-overlay", "is-video"],
			content: [content],
			id: "atv-video-modal"
		});
		const showToast = (msg) => {
			const t = el("div", {
				className: "atv-modal-toast",
				text: msg
			});
			content.append(t);
			setTimeout(() => t.remove(), 3e3);
		};
		(async () => {
			try {
				const res = await fetch(trailer.trailerPageUrl);
				if (!overlay.isConnected) return;
				const ldMatch = (await res.text()).match(/<script type="application\/ld\+json">(?<json>[\s\S]*?)<\/script>/u);
				if (!ldMatch || !ldMatch.groups) throw new Error("no ld+json");
				const data = JSON.parse(ldMatch.groups.json);
				const embedUrl = data?.embedUrl ?? data?.video?.embedUrl ?? null;
				if (typeof embedUrl !== "string" || !embedUrl) throw new Error("no embedUrl");
				if (!overlay.isConnected) return;
				const video = el("video", {
					attrs: {
						autoplay: "true",
						controls: "true",
						playsinline: "true",
						src: embedUrl
					},
					className: "atv-modal-video"
				});
				content.innerHTML = "";
				content.append(video);
			} catch {
				if (!overlay.isConnected) return;
				showToast("视频加载失败");
				setTimeout(() => {
					window.open(trailer.trailerPageUrl, "_blank");
					dismiss();
				}, 1500);
			}
		})();
	};
	var CommentModalContent = ({ canVote, comment, onVoteStateChange, onVote, voteState }) => {
		const handleClose = useModalClose();
		return u$1(S, { children: [
			u$1("div", { class: "atv-comment-overlay-accent" }),
			u$1(ModalCloseButton, {
				ariaLabel: "关闭短评",
				className: "atv-comment-overlay-close",
				onClick: handleClose,
				size: 16
			}),
			u$1("div", {
				class: "atv-comment-overlay-top",
				children: [u$1(CommentAvatar, {
					className: "atv-comment-overlay-avatar",
					comment
				}), u$1("div", {
					class: "atv-comment-overlay-meta",
					children: [comment.link ? u$1("a", {
						class: "atv-comment-overlay-author",
						href: comment.link,
						rel: "noopener",
						target: "_blank",
						children: comment.name
					}) : u$1("div", {
						class: "atv-comment-overlay-author",
						children: comment.name
					}), comment.stars > 0 ? u$1(Stars, {
						className: "atv-comment-overlay-stars",
						outOfFive: true,
						score: comment.stars
					}) : null]
				})]
			}),
			u$1("div", {
				class: "atv-comment-overlay-body",
				children: comment.content
			}),
			u$1("div", {
				class: "atv-comment-overlay-foot",
				children: [u$1("span", {
					class: "atv-comment-overlay-time",
					children: comment.time || ""
				}), u$1(CommentVoteButton, {
					canVote,
					cid: comment.cid,
					className: "atv-comment-overlay-votes",
					count: comment.votes,
					onStateChange: onVoteStateChange ? (state) => onVoteStateChange(comment, state) : void 0,
					onVote,
					state: voteState,
					voted: comment.voted
				})]
			})
		] });
	};
	var CommentModal = ({ canVote, comment, onClose, onVoteStateChange, onVote, voteState }) => u$1(ModalShell, {
		className: "atv-comment-overlay",
		id: "atv-comment-overlay",
		onClose,
		surfaceClassName: "atv-comment-overlay-inner",
		children: u$1(CommentModalContent, {
			canVote,
			comment,
			onVoteStateChange,
			onVote,
			voteState
		})
	});
	var CommentsSection = ({ canVote, comments, getVoteState, onOpen, onVoteStateChange, onVote, subjectId }) => {
		const gridRef = A(null);
		h(() => {
			requestAnimationFrame(() => {
				const cards = gridRef.current?.querySelectorAll(".atv-comment-card") ?? [];
				for (const card of cards) {
					const body = card.querySelector(".atv-comment-body-text");
					if (body && body.scrollHeight > body.clientHeight) card.classList.add("has-overflow");
				}
			});
		}, [comments]);
		if (!comments.length) return null;
		return u$1(Section, {
			id: "atv-comments",
			moreLink: subjectId ? {
				href: `https://movie.douban.com/subject/${subjectId}/comments?status=P`,
				text: "查看全部 →"
			} : void 0,
			title: "热门短评",
			children: u$1("div", {
				class: "atv-comments",
				ref: gridRef,
				children: comments.map((comment) => u$1(CommentCard, {
					canVote,
					comment,
					onOpen,
					onVoteStateChange,
					onVote,
					voteState: getVoteState?.(comment)
				}, comment.cid))
			})
		});
	};
	var textValue = (text) => u$1("div", {
		class: "atv-info-value",
		children: text
	});
	var linkParts = (items) => items.flatMap((item, index) => [index > 0 ? u$1("span", { children: " / " }, `sep-${index}`) : null, item.href ? u$1("a", {
		href: item.href,
		rel: "noopener",
		target: "_blank",
		children: item.text
	}, `link-${index}`) : u$1("span", { children: item.text }, `text-${index}`)]);
	var linksValue = (items) => u$1("div", {
		class: "atv-info-value",
		children: linkParts(items)
	});
	var imdbValue = (imdb) => u$1("div", {
		class: "atv-info-value",
		children: RE_IMDB_LINK.test(imdb) ? u$1("a", {
			href: `https://www.imdb.com/title/${imdb}/`,
			rel: "noopener",
			target: "_blank",
			children: [imdb, u$1(IconArrow, {})]
		}) : imdb
	});
	var collectTimeRows = (info, isTV, rows) => {
		if (isTV) {
			if (info.firstAired) rows.push({
				label: "首播",
				value: textValue(info.firstAired)
			});
			else if (info.releaseDate) rows.push({
				label: "首播",
				value: textValue(info.releaseDate)
			});
			if (info.seasons) rows.push({
				label: "季数",
				value: textValue(info.seasons)
			});
			if (info.episodes) rows.push({
				label: "集数",
				value: textValue(info.episodes)
			});
			if (info.episodeRuntime) rows.push({
				label: "单集片长",
				value: textValue(info.episodeRuntime)
			});
			return;
		}
		if (info.releaseDate) rows.push({
			label: "上映日期",
			value: textValue(info.releaseDate)
		});
		if (info.runtime) rows.push({
			label: "片长",
			value: textValue(info.runtime)
		});
	};
	var awardRows = (awards) => awards.map((award) => ({
		label: u$1("div", {
			class: "atv-info-label",
			style: { color: "var(--atv-rating-gold)" },
			children: award.orgLink ? u$1("a", {
				href: award.orgLink,
				rel: "noopener",
				style: { color: "inherit" },
				target: "_blank",
				children: award.org
			}) : award.org
		}),
		value: u$1("div", {
			class: "atv-info-value",
			children: [award.name ? u$1("div", { children: award.name }) : null, award.person ? u$1("div", {
				style: {
					color: "var(--atv-text-tertiary)",
					fontSize: "13px",
					marginTop: "2px"
				},
				children: award.personLink ? u$1("a", {
					href: award.personLink,
					rel: "noopener",
					target: "_blank",
					children: award.person
				}) : award.person
			}) : null]
		})
	}));
	var collectDetailRows = ({ awards, info, isTV }) => {
		const rows = [];
		if (info.director.length) rows.push({
			label: "导演",
			value: linksValue(info.director)
		});
		if (info.writers.length) rows.push({
			label: "编剧",
			value: linksValue(info.writers)
		});
		if (info.cast.length) rows.push({
			label: "主演",
			value: linksValue(info.cast)
		});
		if (info.genres.length) rows.push({
			label: "类型",
			value: textValue(info.genres.join(" / "))
		});
		if (info.country) rows.push({
			label: "制片国家/地区",
			value: textValue(info.country)
		});
		if (info.language) rows.push({
			label: "语言",
			value: textValue(info.language)
		});
		collectTimeRows(info, isTV, rows);
		if (info.aliases) rows.push({
			label: "又名",
			value: textValue(info.aliases)
		});
		if (info.imdb) rows.push({
			label: "IMDb",
			value: imdbValue(info.imdb)
		});
		if (awards.length) rows.push(...awardRows(awards));
		return rows;
	};
	var DetailsSection = ({ data }) => {
		const rows = collectDetailRows(data);
		if (!rows.length) return null;
		return u$1(Section, {
			id: "atv-info",
			title: "详细信息",
			children: u$1("div", {
				class: "atv-info-grid",
				children: rows.map((row) => u$1(S, { children: [typeof row.label === "string" ? u$1("div", {
					class: "atv-info-label",
					children: row.label
				}) : row.label, row.value] }))
			})
		});
	};
	var LOGO_MAP = {
		douban: u$1(LogoDouban, {}),
		imdb: u$1(LogoImdb, {}),
		metacritic: u$1(LogoMetacritic, {}),
		rt: u$1(LogoRT, {})
	};
	var RatingLogo = ({ name }) => u$1("div", {
		class: "atv-rating-panel-logo",
		children: LOGO_MAP[name]
	});
	var DoubanRating = ({ rating }) => u$1("div", {
		class: "atv-rating-panel-douban",
		children: [u$1(RatingLogo, { name: "douban" }), rating ? u$1(S, { children: [
			u$1("div", {
				class: "atv-rating-panel-score",
				children: rating.score.toFixed(1)
			}),
			u$1(Stars, { score: rating.score }),
			u$1("div", {
				class: "atv-rating-panel-count",
				children: rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分"
			})
		] }) : u$1("div", {
			class: "atv-rating-empty",
			children: "暂无评分"
		})]
	});
	var scoreClass = (score) => {
		if (score >= 61) return "is-high";
		if (score >= 40) return "is-medium";
		return "is-low";
	};
	var mcWordRatingChinese = (score) => {
		if (score >= 81) return "普遍赞誉";
		if (score >= 61) return "大体好评";
		if (score >= 40) return "褒贬不一";
		if (score >= 20) return "大体差评";
		return "普遍差评";
	};
	var isFresh = (score) => score >= 60;
	var ratingStateClass = (hasRating, resolved) => {
		if (hasRating) return "is-loaded";
		if (resolved) return "is-empty";
		return "is-loading";
	};
	var renderImdbContent = (rating, resolved) => {
		if (rating) return u$1(S, { children: [
			u$1("div", {
				class: "atv-rating-panel-score",
				children: rating.score.toFixed(1)
			}),
			u$1(Stars, { score: rating.score }),
			u$1("div", {
				class: "atv-rating-panel-count",
				children: rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分"
			})
		] });
		if (resolved) return null;
		return u$1("div", { class: "atv-rating-panel-skeleton" });
	};
	var ImdbRating = ({ rating, resolved }) => u$1("div", {
		class: `atv-rating-panel-imdb ${ratingStateClass(Boolean(rating), resolved)}`,
		children: [u$1(RatingLogo, { name: "imdb" }), renderImdbContent(rating, resolved)]
	});
	var renderMetacriticContent = (rating, resolved) => {
		if (rating) return u$1(S, { children: [
			u$1("div", {
				class: `atv-rating-panel-score ${scoreClass(rating.score)}`,
				children: String(rating.score)
			}),
			u$1("div", {
				class: "atv-mc-label-row",
				children: [u$1("span", {
					class: "atv-mc-bar-track",
					children: u$1("span", {
						class: `atv-mc-bar-fill ${scoreClass(rating.score)}`,
						style: { width: `${Math.min(100, rating.score)}%` }
					})
				}), u$1("span", {
					class: "atv-mc-word-label",
					children: mcWordRatingChinese(rating.score)
				})]
			}),
			u$1("div", {
				class: "atv-rating-panel-count",
				children: rating.reviewCount ? `评价 ${rating.reviewCount.toLocaleString("en-US")}` : "已评分"
			})
		] });
		if (resolved) return null;
		return u$1("div", { class: "atv-rating-panel-skeleton" });
	};
	var MetacriticRating = ({ rating, resolved }) => u$1("div", {
		class: `atv-rating-panel-mc ${ratingStateClass(Boolean(rating), resolved)}`,
		children: [u$1(RatingLogo, { name: "metacritic" }), renderMetacriticContent(rating, resolved)]
	});
	var RtLabel = ({ className, icon, score, text }) => u$1("span", {
		class: `atv-rt-label-item ${className} ${isFresh(score) ? "is-fresh" : "is-rotten"}`,
		children: [u$1("span", {
			class: "atv-rt-score-icon",
			children: icon
		}), u$1("span", {
			class: "atv-rt-score-label",
			children: text
		})]
	});
	var renderRottenTomatoesContent = (rating, resolved) => {
		if (rating) return u$1(S, { children: [
			u$1("div", {
				class: "atv-rt-score-row",
				children: [
					u$1("div", {
						class: `atv-rt-score-value ${isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"}`,
						children: `${rating.criticsScore}%`
					}),
					u$1("div", { class: "atv-rt-divider" }),
					u$1("div", {
						class: `atv-rt-score-value ${isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"}`,
						children: `${rating.audienceScore}%`
					})
				]
			}),
			u$1("div", {
				class: "atv-rt-label-row",
				children: [u$1(RtLabel, {
					className: "is-critics",
					icon: u$1(IconTomato, {}),
					score: rating.criticsScore,
					text: "影评人"
				}), u$1(RtLabel, {
					className: "is-audience",
					icon: u$1(IconPopcorn, {}),
					score: rating.audienceScore,
					text: "观众"
				})]
			}),
			u$1("div", {
				class: "atv-rt-count-row",
				children: [u$1("span", {
					class: "atv-rt-count-value",
					children: `评价 ${rating.criticsCount.toLocaleString("en-US")}`
				}), u$1("span", {
					class: "atv-rt-count-value",
					children: `评价 ${rating.audienceCount.toLocaleString("en-US")}`
				})]
			})
		] });
		if (resolved) return null;
		return u$1("div", { class: "atv-rating-panel-skeleton" });
	};
	var RottenTomatoesRating = ({ rating, resolved }) => u$1("div", {
		class: `atv-rating-panel-rt ${ratingStateClass(Boolean(rating), resolved)}`,
		children: [u$1(RatingLogo, { name: "rt" }), renderRottenTomatoesContent(rating, resolved)]
	});
	var extractEnglishSeriesName = (h1) => {
		const m = h1.replace(/\s*\(\d{4}\)\s*$/u, "").trim().match(/[A-Za-z][\w\s'\-!&.,]*/u);
		if (!m) return "";
		return m[0].replace(/\s*(?<seasonLabel>Season|S|Vol)\s*\d+/iu, "").trim();
	};
	var extractSeasonFromH1 = (h1) => {
		const cn = "一二三四五六七八九十";
		const m = h1.match(/(?:Season|第)\s*(?<digit>\d+|[一二三四五六七八九十])/iu);
		if (!m?.groups?.digit) return;
		const d = m.groups.digit;
		return /^\d+$/u.test(d) ? Math.trunc(Number(d)) : cn.indexOf(d) + 1;
	};
	var buildContext = (imdbId, isTV, doc) => {
		const doubanH1 = doc.querySelector("#content h1")?.textContent?.trim() || "";
		const englishTitle = doubanH1 ? extractEnglishSeriesName(doubanH1) : null;
		const season = doubanH1 ? extractSeasonFromH1(doubanH1) : void 0;
		const yearMatch = doubanH1.match(/\((?<year>\d{4})\)\s*$/u);
		const year = isTV ? void 0 : yearMatch?.groups?.year ?? void 0;
		return {
			englishTitle: englishTitle || null,
			imdbId,
			isTV,
			season,
			year
		};
	};
	var createCache = (storageKey, ttlMs = 1440 * 60 * 1e3) => {
		const load = () => {
			try {
				const raw = localStorage.getItem(storageKey);
				if (!raw) return new Map();
				const parsed = JSON.parse(raw);
				return new Map(parsed);
			} catch {
				return new Map();
			}
		};
		const persist = (entries) => {
			try {
				localStorage.setItem(storageKey, JSON.stringify([...entries.entries()]));
			} catch {}
		};
		return {
			get(key) {
				const entries = load();
				const entry = entries.get(key);
				if (!entry) return;
				if (Date.now() > entry.expiresAt) {
					entries.delete(key);
					persist(entries);
					return;
				}
				return entry.value;
			},
			set(key, value) {
				const entries = load();
				entries.set(key, {
					expiresAt: Date.now() + ttlMs,
					value
				});
				persist(entries);
			}
		};
	};
	var imdbCache = createCache("dp:imdb-cache", 720 * 60 * 60 * 1e3);
	var GRAPHQL_QUERY = `query GetRating($id: ID!) {
  title(id: $id) {
    id
    titleText { text }
    ratingsSummary { aggregateRating voteCount }
    series {
      series {
        id
        titleText { text }
      }
    }
  }
}`;
	var SEASON_EPISODES_QUERY = `query GetSeasonEpisodes($id: ID!, $season: String!) {
  title(id: $id) {
    episodes {
      episodes(first: 50, filter: {includeSeasons: [$season]}) {
        edges {
          node {
            ratingsSummary { aggregateRating voteCount }
          }
        }
      }
    }
  }
}`;
	var extractTitleFields = (parsed) => {
		if (parsed.errors) return null;
		const title = parsed?.data?.title;
		const seriesNested = title?.series?.series;
		const seriesInfo = seriesNested?.id ? {
			id: seriesNested.id,
			titleText: seriesNested.titleText?.text ?? title?.titleText?.text ?? ""
		} : null;
		return {
			aggregateRating: title?.ratingsSummary?.aggregateRating,
			seriesInfo,
			titleText: title?.titleText?.text ?? null,
			voteCount: title?.ratingsSummary?.voteCount
		};
	};
	var parseResponse = (json) => {
		try {
			return extractTitleFields(JSON.parse(json)) ?? { error: true };
		} catch {
			return { error: true };
		}
	};
	var parseSeasonRating = (json) => {
		try {
			const edges = JSON.parse(json)?.data?.title?.episodes?.episodes?.edges;
			if (!edges || edges.length === 0) return null;
			let totalWeighted = 0;
			let totalVotes = 0;
			for (const edge of edges) {
				const rs = edge?.node?.ratingsSummary;
				if (rs && typeof rs.aggregateRating === "number" && typeof rs.voteCount === "number" && rs.voteCount > 0) {
					totalWeighted += rs.aggregateRating * rs.voteCount;
					totalVotes += rs.voteCount;
				}
			}
			if (totalVotes === 0) return null;
			return { rating: {
				count: totalVotes,
				score: Math.round(totalWeighted / totalVotes * 10) / 10
			} };
		} catch {
			return null;
		}
	};
	var seasonCacheKey = (seriesId, season) => `${seriesId}-s${String(season).padStart(2, "0")}`;
	var fetchImdbRating = async (imdbId, season) => {
		if (!imdbId) return {
			rating: null,
			title: null
		};
		const cached = imdbCache.get(imdbId);
		if (cached) return {
			rating: cached.rating,
			title: cached.title
		};
		let json;
		try {
			json = await gmPost("https://graphql.imdb.com/", JSON.stringify({
				query: GRAPHQL_QUERY,
				variables: { id: imdbId }
			}), "https://www.imdb.com/", { "Content-Type": "application/json" });
		} catch (error) {
			console.warn("[IMDB] fetch FAILED for", imdbId, error);
			return {
				rating: null,
				title: null
			};
		}
		const parsed = parseResponse(json);
		if ("error" in parsed) return {
			rating: null,
			title: null
		};
		const { aggregateRating, voteCount, titleText, seriesInfo } = parsed;
		const seriesIdForSeason = seriesInfo?.id ?? (season ? imdbId : null);
		if (season && seriesIdForSeason) {
			const sKey = seasonCacheKey(seriesIdForSeason, season);
			const sCached = imdbCache.get(sKey);
			if (sCached) return {
				rating: sCached.rating,
				title: sCached.title
			};
			try {
				const seasonResult = parseSeasonRating(await gmPost("https://graphql.imdb.com/", JSON.stringify({
					query: SEASON_EPISODES_QUERY,
					variables: {
						id: seriesIdForSeason,
						season: String(season)
					}
				}), "https://www.imdb.com/", { "Content-Type": "application/json" }));
				if (seasonResult) {
					const title = seriesInfo?.titleText ?? titleText ?? "";
					imdbCache.set(sKey, {
						rating: seasonResult.rating,
						title
					});
					return {
						rating: seasonResult.rating,
						title
					};
				}
			} catch {
				console.warn("[IMDB] season episodes query failed, falling back");
			}
		}
		const effectiveRating = aggregateRating;
		const effectiveCount = voteCount;
		const effectiveTitle = titleText;
		if (typeof effectiveRating === "number" && typeof effectiveCount === "number") {
			const rating = {
				count: effectiveCount,
				score: effectiveRating
			};
			const title = typeof effectiveTitle === "string" ? effectiveTitle : "";
			imdbCache.set(imdbId, {
				rating,
				title
			});
			return {
				rating,
				title
			};
		}
		return {
			rating: null,
			title: effectiveTitle
		};
	};
	var resolveImdb = (ctx) => {
		if (!ctx.imdbId) return Promise.resolve(null);
		return fetchImdbRating(ctx.imdbId, ctx.season);
	};
	var mcCache = createCache("dp:metacritic-cache", 10080 * 60 * 1e3);
	var toMcSlug = (title) => title.normalize("NFD").replaceAll(/[\u0300-\u036F]/gu, "").toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-").replaceAll(/^-|-$/gu, "");
	var cacheKey$1 = (slug, season, year) => {
		let key = slug;
		if (year) key = `${key}-${year}`;
		if (season) key = `${key}-s${String(season).padStart(2, "0")}`;
		return key;
	};
	var parseMcPage = (html) => {
		const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(?<json>[\s\S]*?)<\/script>/iu);
		if (!match?.groups?.json) return null;
		try {
			const rating = JSON.parse(match.groups.json.trim())?.aggregateRating;
			if (rating?.ratingValue === null || rating?.reviewCount === null) return null;
			const score = Math.trunc(Number(String(rating.ratingValue)));
			const reviewCount = Math.trunc(Number(String(rating.reviewCount)));
			if (Number.isNaN(score) || Number.isNaN(reviewCount)) return null;
			return {
				reviewCount,
				score
			};
		} catch {
			return null;
		}
	};
	var fetchMcRating = async (title, isTV, season, year) => {
		if (!title) return null;
		const slug = toMcSlug(title);
		if (!slug) return null;
		const key = cacheKey$1(slug, season, year);
		const cached = mcCache.get(key);
		if (cached) return cached;
		const urls = [];
		if (isTV) {
			if (season) urls.push(`https://www.metacritic.com/tv/${slug}/season-${season}`);
			urls.push(`https://www.metacritic.com/tv/${slug}`);
		} else {
			if (year) urls.push(`https://www.metacritic.com/movie/${slug}-${year}`);
			urls.push(`https://www.metacritic.com/movie/${slug}`);
		}
		for (const url of urls) try {
			const rating = parseMcPage(await gmGet(url, "https://www.metacritic.com/"));
			if (rating) {
				mcCache.set(key, rating);
				return rating;
			}
		} catch {}
		return null;
	};
	var resolveMc = (ctx) => {
		if (!ctx.englishTitle) return Promise.resolve(null);
		return fetchMcRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
	};
	var rottenCache = createCache("dp:rotten-cache", 10080 * 60 * 1e3);
	var toSlug = (title) => title.normalize("NFD").replaceAll(/[\u0300-\u036F]/gu, "").toLowerCase().replaceAll(/[^a-z0-9]+/gu, "_").replaceAll(/^_|_$/gu, "");
	var cacheKey = (slug, season, year) => {
		let key = slug;
		if (year) key = `${key}_${year}`;
		if (season) key = `${key}-s${String(season).padStart(2, "0")}`;
		return key;
	};
	var parseData = (raw) => {
		const data = JSON.parse(raw);
		const criticsRaw = data.criticsScore?.score;
		const audienceRaw = data.audienceScore?.score;
		if (criticsRaw === void 0 || criticsRaw === null || audienceRaw === void 0 || audienceRaw === null) return null;
		const criticsScore = typeof criticsRaw === "string" ? Math.trunc(Number(criticsRaw)) : criticsRaw;
		const audienceScore = typeof audienceRaw === "string" ? Math.trunc(Number(audienceRaw)) : audienceRaw;
		if (Number.isNaN(criticsScore) || Number.isNaN(audienceScore)) return null;
		return {
			audienceCount: (data.audienceScore?.likedCount ?? 0) + (data.audienceScore?.notLikedCount ?? 0),
			audienceScore,
			criticsCount: data.criticsScore?.ratingCount ?? 0,
			criticsScore
		};
	};
	var parseMediaScorecard = (html) => {
		const mc = html.match(/<script[^>]*data-json="mediaScorecard"[^>]*>(?<json>[\s\S]*?)<\/script>/iu);
		if (!mc?.groups?.json) return null;
		try {
			return parseData(mc.groups.json.trim());
		} catch {
			return null;
		}
	};
	var parseRtPage = (html) => {
		const msRating = parseMediaScorecard(html);
		if (msRating) return msRating;
		const match = html.match(/<script[^>]*type="application\/json"[^>]*data-json="reviewsData"[^>]*>(?<json>[\s\S]*?)<\/script>/iu);
		if (match?.groups?.json) try {
			return parseData(match.groups.json.trim());
		} catch {}
		return null;
	};
	var fetchRtRating = async (title, isTV, season, year) => {
		if (!title) return null;
		const slug = toSlug(title);
		if (!slug) return null;
		const key = cacheKey(slug, season, year);
		const cached = rottenCache.get(key);
		if (cached) return cached;
		const urls = [];
		if (isTV) {
			if (season) urls.push(`https://www.rottentomatoes.com/tv/${slug}/s${String(season).padStart(2, "0")}`);
			urls.push(`https://www.rottentomatoes.com/tv/${slug}`);
		} else {
			if (year) urls.push(`https://www.rottentomatoes.com/m/${slug}_${year}`);
			urls.push(`https://www.rottentomatoes.com/m/${slug}`);
		}
		for (const url of urls) try {
			const rating = parseRtPage(await gmGet(url, "https://www.rottentomatoes.com/"));
			if (rating) {
				rottenCache.set(key, rating);
				return rating;
			}
		} catch {}
		return null;
	};
	var resolveRt = (ctx) => {
		if (!ctx.englishTitle) return Promise.resolve(null);
		return fetchRtRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
	};
	var createDefaultDeps = () => ({
		resolveImdb,
		resolveMc,
		resolveRt
	});
	var resolveAll = async (ctx, deps) => {
		const { resolveImdb, resolveMc, resolveRt } = deps ?? createDefaultDeps();
		if (ctx.englishTitle) {
			const [imdb, rt, mc] = await Promise.allSettled([
				resolveImdb(ctx),
				resolveRt(ctx),
				resolveMc(ctx)
			]);
			return {
				imdb: imdb.status === "fulfilled" ? imdb.value : null,
				mc: mc.status === "fulfilled" ? mc.value : null,
				rt: rt.status === "fulfilled" ? rt.value : null
			};
		}
		const imdbResult = await resolveImdb(ctx);
		if (imdbResult?.title) {
			const fallbackCtx = {
				...ctx,
				englishTitle: imdbResult.title
			};
			const [rt, mc] = await Promise.allSettled([resolveRt(fallbackCtx), resolveMc(fallbackCtx)]);
			return {
				imdb: imdbResult,
				mc: mc.status === "fulfilled" ? mc.value : null,
				rt: rt.status === "fulfilled" ? rt.value : null
			};
		}
		return {
			imdb: imdbResult,
			mc: null,
			rt: null
		};
	};
	var useExternalRatings = (imdbId, isTV) => {
		const [external, setExternal] = d(null);
		h(() => {
			if (!imdbId) {
				setExternal(null);
				return;
			}
			let cancelled = false;
			const loadRatings = async () => {
				const ratings = await resolveAll(buildContext(imdbId, isTV, document));
				if (!cancelled) setExternal(ratings);
			};
			loadRatings();
			return () => {
				cancelled = true;
			};
		}, [imdbId, isTV]);
		return external;
	};
	var RatingPanel = ({ douban, imdbId, isTV }) => {
		const external = useExternalRatings(imdbId, isTV);
		if (!douban && !imdbId) return null;
		const resolved = Boolean(external);
		return u$1("div", {
			class: "atv-rating-panel",
			children: [u$1(DoubanRating, { rating: douban }), imdbId ? u$1(S, { children: [
				u$1(ImdbRating, {
					rating: external?.imdb?.rating ?? null,
					resolved
				}),
				u$1(MetacriticRating, {
					rating: external?.mc ?? null,
					resolved
				}),
				u$1(RottenTomatoesRating, {
					rating: external?.rt ?? null,
					resolved
				})
			] }) : null]
		});
	};
	var INTEREST_LABELS = {
		collect: "看过",
		do: "在看",
		none: "未标记",
		wish: "想看"
	};
	var InterestButton = ({ className, label, onClick }) => u$1("button", {
		class: className,
		onClick,
		type: "button",
		children: [u$1("span", { children: label === "想看" ? u$1(IconPlay, {}) : u$1(IconCheck, {}) }), u$1("span", { children: label })]
	});
	var HeroActions = ({ callbacks, state }) => {
		if (!state.loggedIn) return u$1("div", {
			class: "atv-actions",
			children: [
				u$1(InterestButton, {
					className: "atv-btn atv-btn-primary",
					label: "想看",
					onClick: callbacks.handleWishClick
				}),
				state.hasWatching ? u$1(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "在看",
					onClick: callbacks.handleWatchingClick
				}) : null,
				u$1(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "看过",
					onClick: callbacks.handleCollectClick
				})
			]
		});
		if (!state.marked) return u$1("div", {
			class: "atv-actions",
			children: [
				u$1(InterestButton, {
					className: "atv-btn atv-btn-primary",
					label: "想看",
					onClick: () => callbacks.handleOpenInterest(state)
				}),
				state.hasWatching ? u$1(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "在看",
					onClick: () => callbacks.handleOpenInterest(state)
				}) : null,
				u$1(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "看过",
					onClick: () => callbacks.handleOpenInterest(state)
				})
			]
		});
		const label = INTEREST_LABELS[state.status];
		return u$1("div", {
			class: "atv-actions",
			children: u$1("div", {
				class: "atv-interest-panel",
				children: [u$1("div", {
					class: "atv-interest-panel-header",
					children: [
						u$1("button", {
							class: "atv-btn atv-btn-primary is-active atv-interest-badge",
							onClick: () => callbacks.handleOpenInterest(state),
							type: "button",
							children: [u$1("span", { children: u$1(IconCheck, {}) }), u$1("span", { children: label })]
						}),
						state.rating > 0 ? u$1("span", {
							class: "atv-interest-panel-stars",
							children: Array.from({ length: 5 }, (_, index) => index < state.rating ? u$1(IconStarFull, {}, index) : u$1(IconStarEmpty, {}, index))
						}) : null,
						state.date ? u$1("span", {
							class: "atv-interest-panel-date",
							children: state.date
						}) : null
					]
				}), state.comment ? u$1("div", {
					class: "atv-interest-panel-comment",
					children: [u$1("span", { children: `"${state.comment}"` }), state.usefulCount ? u$1("span", {
						class: "atv-useful-badge",
						children: [u$1(IconThumb, {}), u$1("span", { children: state.usefulCount.replaceAll(/\D/gu, "") })]
					}) : null]
				}) : null]
			})
		});
	};
	var hashStr = (str) => {
		let h = 0;
		for (let i = 0; i < str.length; i += 1) h = (h * 31 + (str.codePointAt(i) ?? 0)) % 1000000007;
		return h;
	};
	var pickStill = (photos, seed) => {
		if (!photos.length) return null;
		return photos[hashStr(String(seed || "")) % photos.length];
	};
	var backgroundStyle = (still, poster) => {
		if (still?.hdUrl || poster) return {};
		return { background: "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)" };
	};
	var stillBackground = (still, hdLoaded) => u$1(S, { children: [u$1("div", {
		class: "atv-hero-still is-thumb",
		style: { backgroundImage: `url("${still.thumbUrl || still.hdUrl}")` }
	}), u$1("div", {
		"aria-hidden": "true",
		class: `atv-hero-still is-hd${hdLoaded ? " is-loaded" : ""}`,
		style: { backgroundImage: hdLoaded ? `url("${still.hdUrl || still.thumbUrl}")` : void 0 }
	})] });
	var posterBackground = (poster) => u$1("div", {
		class: "atv-hero-still is-poster",
		style: { backgroundImage: `url("${poster}")` }
	});
	var HeroBackground = ({ photos, poster, subjectId }) => {
		const still = pickStill(photos, subjectId);
		const [hdLoaded, setHdLoaded] = d(false);
		h(() => {
			setHdLoaded(false);
			if (!still?.hdUrl) return;
			const loader = new Image();
			loader.addEventListener("load", () => requestAnimationFrame(() => setHdLoaded(true)), { once: true });
			loader.addEventListener("error", () => {
				if (still.thumbUrl && still.thumbUrl !== still.hdUrl) requestAnimationFrame(() => setHdLoaded(true));
			}, { once: true });
			loader.src = still.hdUrl;
		}, [still?.hdUrl, still?.thumbUrl]);
		return u$1("div", {
			class: "atv-hero-bg",
			style: backgroundStyle(still, poster),
			children: [still?.hdUrl ? stillBackground(still, hdLoaded) : null, !still?.hdUrl && poster ? posterBackground(poster) : null]
		});
	};
	var HeroMeta = ({ info, isTV, year }) => {
		const metaParts = [];
		if (year) metaParts.push(year);
		if (isTV) {
			const episodeParts = [];
			if (info.seasons) episodeParts.push(info.seasons + (RE_SEASON_SUFFIX.test(info.seasons) ? "季" : ""));
			if (info.episodes) episodeParts.push(info.episodes + (RE_SEASON_SUFFIX.test(info.episodes) ? "集" : ""));
			if (episodeParts.length) metaParts.push(episodeParts.join(" · "));
			else if (info.episodeRuntime) metaParts.push(info.episodeRuntime);
		} else if (info.runtime) metaParts.push(info.runtime);
		if (info.country) metaParts.push(info.country);
		return u$1("div", {
			class: "atv-hero-meta",
			children: [metaParts.map((part) => u$1("span", {
				class: "atv-meta-dot",
				children: part
			}, part)), info.genres.length ? u$1("span", {
				class: "atv-meta-chips",
				children: info.genres.map((genre) => u$1("span", {
					class: "atv-chip",
					children: genre
				}, genre))
			}) : null]
		});
	};
	var PosterPlaceholder = () => u$1("div", {
		class: "atv-poster-placeholder",
		children: u$1(IconFilmPlaceholder, {})
	});
	var HeroPoster = ({ poster, title }) => {
		const [failed, setFailed] = d(false);
		return u$1("button", {
			class: "atv-poster-card",
			onClick: () => {
				if (poster) openPosterModal(poster, title.primary || "");
			},
			type: "button",
			children: poster && !failed ? u$1("img", {
				alt: title.primary || "",
				onError: () => setFailed(true),
				src: poster
			}) : u$1(PosterPlaceholder, {})
		});
	};
	var HeroSummary = ({ text }) => {
		const teaserRef = A(null);
		const [expanded, setExpanded] = d(false);
		const [showToggle, setShowToggle] = d(true);
		h(() => {
			requestAnimationFrame(() => {
				const teaser = teaserRef.current;
				if (teaser) setShowToggle(teaser.scrollHeight - teaser.clientHeight > 4);
			});
		}, [text]);
		return u$1("div", {
			class: "atv-hero-summary",
			children: [u$1("p", {
				class: `atv-hero-teaser${expanded ? "" : " is-clamped"}`,
				ref: teaserRef,
				children: text
			}), u$1("button", {
				class: `atv-hero-more${expanded ? " is-open" : ""}`,
				onClick: () => setExpanded((value) => !value),
				style: { display: showToggle ? void 0 : "none" },
				type: "button",
				children: [u$1("span", { children: expanded ? "收起" : "展开" }), u$1(IconChevron, {})]
			})]
		});
	};
	var Hero = ({ callbacks, data }) => u$1("section", {
		class: "atv-hero",
		children: [
			u$1(HeroBackground, {
				photos: data.photos,
				poster: data.poster,
				subjectId: data.subjectId
			}),
			u$1("div", { class: "atv-hero-vignette" }),
			u$1("div", { class: "atv-hero-overlay-x" }),
			u$1("div", { class: "atv-hero-overlay-y" }),
			u$1("div", {
				class: "atv-hero-inner-section",
				children: u$1("div", {
					class: "atv-hero-inner",
					children: [u$1(HeroPoster, {
						poster: data.poster,
						title: data.title
					}), u$1("div", {
						class: "atv-hero-info",
						children: [
							u$1("h1", {
								class: "atv-hero-title",
								children: data.title.primary || data.title.full
							}),
							data.title.original ? u$1("div", {
								class: "atv-hero-orig",
								children: data.title.original
							}) : null,
							u$1(HeroMeta, {
								info: data.info,
								isTV: data.isTV,
								year: data.year
							}),
							u$1(RatingPanel, {
								douban: data.rating,
								imdbId: data.imdbId,
								isTV: data.isTV
							}),
							u$1(HeroActions, {
								callbacks,
								state: data.interest
							}),
							data.summary ? u$1(HeroSummary, { text: data.summary }) : null
						]
					})]
				})
			})
		]
	});
	var CastSection = ({ celebrities }) => celebrities.length ? u$1(Section, {
		id: "atv-cast",
		title: "演职员",
		children: u$1("div", {
			class: "atv-carousel atv-cast-carousel",
			children: celebrities.map((person) => {
				const content = u$1(S, { children: [
					u$1("div", {
						class: "atv-cast-avatar",
						style: person.avatar ? { backgroundImage: `url("${person.avatar}")` } : void 0
					}),
					u$1("div", {
						class: "atv-cast-name",
						children: person.name
					}),
					person.role ? u$1("div", {
						class: "atv-cast-role",
						children: person.role
					}) : null
				] });
				return person.link ? u$1("a", {
					class: "atv-cast-card",
					href: person.link,
					rel: "noopener",
					target: "_blank",
					children: content
				}, person.link) : u$1("div", {
					class: "atv-cast-card",
					children: content
				}, person.name);
			})
		})
	}) : null;
	var PhotoTile = ({ photo }) => {
		const tileRef = A(null);
		return u$1("button", {
			class: "atv-photo-tile",
			onClick: () => openPosterModal(photo.hdUrl || photo.thumbUrl, "剧照"),
			ref: tileRef,
			type: "button",
			children: u$1("img", {
				alt: "剧照",
				loading: "lazy",
				onError: (event) => {
					const img = event.currentTarget;
					if (photo.thumbUrl && img.src !== photo.thumbUrl) img.src = photo.thumbUrl;
				},
				onLoad: (event) => {
					const img = event.currentTarget;
					if (img.naturalHeight > img.naturalWidth) tileRef.current?.classList.add("is-portrait");
				},
				src: photo.hdUrl || photo.thumbUrl
			})
		});
	};
	var PhotosSection = ({ data }) => data.photos.length || data.trailers.length ? u$1(Section, {
		id: "atv-photos",
		moreLink: data.subjectId ? {
			href: `https://movie.douban.com/subject/${data.subjectId}/all_photos`,
			text: "查看全部 →"
		} : void 0,
		title: "剧照",
		children: u$1("div", {
			class: "atv-carousel atv-photos",
			children: [data.trailers.map((trailer) => u$1("button", {
				class: "atv-photo-tile atv-trailer-tile",
				onClick: () => openVideoModal(trailer),
				style: {
					backgroundImage: `url("${trailer.thumbUrl}")`,
					backgroundPosition: "center",
					backgroundSize: "cover"
				},
				type: "button",
				children: [u$1("div", {
					class: "atv-trailer-play-overlay",
					children: u$1("div", {
						class: "atv-trailer-play-btn",
						children: u$1(PlayIcon, {})
					})
				}), u$1("span", {
					class: "atv-trailer-label",
					children: trailer.title || "预告片"
				})]
			}, trailer.trailerPageUrl)), data.photos.map((photo) => u$1(PhotoTile, { photo }, photo.link))]
		})
	}) : null;
	var PosterImage = ({ alt, className, poster }) => {
		const [failed, setFailed] = d(false);
		if (!poster || failed) return u$1(PosterPlaceholder, {});
		return u$1("img", {
			alt,
			class: className,
			loading: "lazy",
			onError: () => setFailed(true),
			src: poster
		});
	};
	var RecommendationsSection = ({ recommendations }) => recommendations.length ? u$1(Section, {
		id: "atv-recs",
		title: "相似作品",
		children: u$1("div", {
			class: "atv-recs",
			children: recommendations.map((item) => {
				const content = u$1(S, { children: [u$1("div", {
					class: "atv-rec-poster",
					children: u$1(PosterImage, {
						alt: item.title,
						poster: item.poster
					})
				}), u$1("div", {
					class: "atv-rec-title",
					children: item.title
				})] });
				return item.link ? u$1("a", {
					class: "atv-rec-card",
					href: item.link,
					rel: "noopener",
					target: "_blank",
					children: content
				}, item.link) : u$1("div", {
					class: "atv-rec-card",
					children: content
				}, item.title);
			})
		})
	}) : null;
	var subjectPath = (url) => {
		try {
			return new URL(url).pathname;
		} catch {
			return "";
		}
	};
	var SeriesSection = ({ items, moreLink }) => items.length ? u$1(Section, {
		id: "atv-series",
		moreLink,
		title: "同系列作品",
		children: u$1("div", {
			class: "atv-carousel atv-series-carousel",
			children: items.map((item) => {
				const className = `atv-series-card${item.link && subjectPath(item.link) === window.location.pathname ? " is-active" : ""}`;
				const key = item.link || item.title;
				const content = u$1(S, { children: [u$1("div", {
					class: "atv-series-poster",
					children: [u$1(PosterImage, {
						alt: item.title,
						poster: item.poster
					}), item.rating ? u$1("span", {
						class: "atv-series-badge",
						children: item.rating
					}) : null]
				}), u$1("div", {
					class: "atv-series-info",
					children: u$1("span", {
						class: "atv-series-title",
						children: item.title
					})
				})] });
				return item.link ? u$1("a", {
					class: className,
					href: item.link,
					rel: "noopener",
					target: "_blank",
					children: content
				}, key) : u$1("div", {
					class: className,
					children: content
				}, key);
			})
		})
	}) : null;
	var UNKNOWN_PROVIDER_COLOR = "#41be5d";
	var PROVIDERS = [
		{
			Icon: LogoBilibili,
			aliases: [
				"哔哩哔哩",
				"bilibili",
				"b站",
				"b 站"
			],
			color: "#00A1D6",
			hosts: ["bilibili.com"],
			key: "bilibili",
			label: "哔哩哔哩"
		},
		{
			aliases: [
				"爱奇艺",
				"iqiyi",
				"iQIYI"
			],
			color: "#00CC36",
			hosts: ["iqiyi.com"],
			key: "iqiyi",
			label: "爱奇艺"
		},
		{
			aliases: ["腾讯视频", "tencent video"],
			color: "#00A2FF",
			hosts: ["v.qq.com"],
			key: "tencent-video",
			label: "腾讯视频"
		},
		{
			aliases: ["优酷", "youku"],
			color: "#00A6FF",
			hosts: ["youku.com"],
			key: "youku",
			label: "优酷"
		},
		{
			aliases: [
				"咪咕视频",
				"咪咕",
				"migu"
			],
			color: "#F04B23",
			hosts: ["miguvideo.com", "migu.cn"],
			key: "migu",
			label: "咪咕视频"
		},
		{
			Icon: LogoNetflix,
			aliases: ["netflix"],
			color: "#E50914",
			hosts: ["netflix.com"],
			key: "netflix",
			label: "Netflix"
		},
		{
			Icon: LogoYouTube,
			aliases: ["youtube", "youtube tv"],
			color: "#FF0000",
			hosts: ["youtube.com", "youtu.be"],
			key: "youtube",
			label: "YouTube"
		},
		{
			Icon: LogoAppleTv,
			aliases: ["apple tv", "apple tv+"],
			color: "#F5F5F7",
			hosts: ["tv.apple.com"],
			key: "apple-tv",
			label: "Apple TV"
		},
		{
			Icon: LogoHbo,
			aliases: ["hbo"],
			color: "#F5F5F7",
			hosts: ["hbo.com"],
			key: "hbo",
			label: "HBO"
		},
		{
			Icon: LogoHboMax,
			aliases: ["hbo max", "max"],
			color: "#8A7CFF",
			hosts: ["max.com", "hbomax.com"],
			key: "hbo-max",
			label: "HBO Max"
		},
		{
			Icon: LogoParamountPlus,
			aliases: ["paramount+"],
			color: "#0064FF",
			hosts: ["paramountplus.com"],
			key: "paramount-plus",
			label: "Paramount+"
		},
		{
			Icon: LogoTubi,
			aliases: ["tubi"],
			color: "#7408FF",
			hosts: ["tubi.tv"],
			key: "tubi",
			label: "Tubi"
		},
		{
			Icon: LogoVimeo,
			aliases: ["vimeo"],
			color: "#1AB7EA",
			hosts: ["vimeo.com"],
			key: "vimeo",
			label: "Vimeo"
		}
	];
	var normalizeText = (value) => value.toLowerCase().replaceAll(/\s+/gu, "");
	var decodeStreamingHref = (href) => {
		try {
			return new URL(href).searchParams.get("url") || href;
		} catch {
			return href;
		}
	};
	var hostMatches = (href, provider) => {
		const decoded = decodeStreamingHref(href);
		try {
			const host = new URL(decoded).hostname.replace(/^www\./u, "");
			return provider.hosts.some((providerHost) => host.endsWith(providerHost));
		} catch {
			return provider.hosts.some((providerHost) => decoded.includes(providerHost));
		}
	};
	var nameMatches = (name, provider) => {
		const normalized = normalizeText(name);
		return provider.aliases.some((alias) => normalized.includes(normalizeText(alias)));
	};
	var resolveStreamingProvider = (item) => {
		const provider = PROVIDERS.find((candidate) => nameMatches(item.name, candidate) || hostMatches(item.href, candidate));
		if (provider) {
			const { Icon, color, key, label } = provider;
			return {
				Icon,
				color,
				key,
				label
			};
		}
		return {
			color: UNKNOWN_PROVIDER_COLOR,
			key: "unknown",
			label: item.name
		};
	};
	var StreamingLogo = ({ fallbackLabel, Icon }) => u$1("span", {
		class: "atv-stream-logo",
		"aria-hidden": "true",
		children: Icon ? u$1(Icon, {}) : u$1("span", {
			class: "atv-stream-logo-fallback",
			children: fallbackLabel.trim().at(0) || u$1(IconPlay, {})
		})
	});
	var StreamingSection = ({ streaming }) => streaming.length ? u$1(Section, {
		id: "atv-stream",
		title: "在哪儿看",
		children: u$1("div", {
			class: "atv-stream-row",
			children: streaming.map((item) => {
				const provider = resolveStreamingProvider(item);
				const style = { "--atv-stream-brand": provider.color };
				return u$1("a", {
					class: "atv-stream-card",
					"data-provider": provider.key,
					href: item.href,
					rel: "noopener",
					style,
					target: "_blank",
					children: [u$1(StreamingLogo, {
						fallbackLabel: provider.label,
						Icon: provider.Icon
					}), u$1("span", {
						class: "atv-stream-name",
						children: item.name
					})]
				}, item.href);
			})
		})
	}) : null;
	var reviewNumericId = (rid) => rid.match(/(?<num>\d+)$/u)?.groups?.num ?? rid;
	var reviewDisplayName = (name) => name.trim() || "匿名用户";
	var reviewVoteCache = createCache("atv:review:vote", 365 * 24 * 60 * 60 * 1e3);
	var reviewVoteKey = (review) => reviewNumericId(review.id);
	var voteDirection = (value) => {
		const type = typeof value === "string" ? value : value?.type;
		if (type === "useful" || type === "up") return "useful";
		if (type === "useless" || type === "down") return "useless";
		return null;
	};
	var initialReviewVoteState = (review) => {
		const cached = reviewVoteCache.get(reviewVoteKey(review));
		return {
			usefulCount: typeof cached === "object" && typeof cached.usefulCount === "number" ? cached.usefulCount : review.usefulCount ?? 0,
			uselessCount: typeof cached === "object" && typeof cached.uselessCount === "number" ? cached.uselessCount : review.uselessCount ?? 0,
			voted: voteDirection(cached)
		};
	};
	var optimisticReviewVoteState = (state, type) => ({
		usefulCount: state.usefulCount + (type === "useful" ? 1 : 0),
		uselessCount: state.uselessCount + (type === "useless" ? 1 : 0),
		voted: type
	});
	var resolvedReviewVoteState = (current, type, result) => ({
		usefulCount: result.usefulCount ?? current.usefulCount,
		uselessCount: result.uselessCount ?? current.uselessCount,
		voted: type
	});
	var persistReviewVoteState = (review, state) => {
		if (!state.voted) return;
		reviewVoteCache.set(reviewVoteKey(review), {
			type: state.voted,
			usefulCount: state.usefulCount,
			uselessCount: state.uselessCount
		});
	};
	var reviewWithVoteState = (review, state) => ({
		...review,
		usefulCount: state.usefulCount,
		uselessCount: state.uselessCount
	});
	var ReviewVoteButtons = ({ canVote, onStateChange, onVote, review, size = "normal", state }) => {
		const [localState, setLocalState] = d(() => initialReviewVoteState(review));
		const [loading, setLoading] = d(false);
		const voteState = state ?? localState;
		const setVoteState = (nextState, options) => {
			if (onStateChange) onStateChange(review, nextState, options);
			else {
				setLocalState(nextState);
				if (options?.persist) persistReviewVoteState(review, nextState);
			}
		};
		const vote = async (type) => {
			if (loading || voteState.voted === type || !onVote) return;
			if (canVote && !canVote()) return;
			const previous = voteState;
			setLoading(true);
			setVoteState(optimisticReviewVoteState(voteState, type));
			const result = await onVote(reviewNumericId(review.id), type);
			if (result.ok) setVoteState(resolvedReviewVoteState(voteState, type, result), { persist: true });
			else setVoteState(previous);
			setLoading(false);
		};
		const sizeClass = size === "large" ? " is-lg" : "";
		return u$1(S, { children: [u$1("button", {
			"aria-label": `有用，${voteState.usefulCount} 人觉得有用`,
			"aria-pressed": voteState.voted === "useful",
			class: `atv-vote-btn up${voteState.voted === "useful" ? " is-voted" : ""}${sizeClass}`,
			disabled: !onVote || loading || voteState.voted === "useful",
			onClick: (event) => {
				event.stopPropagation();
				vote("useful");
			},
			type: "button",
			children: [u$1(IconVoteTriangle, {}), u$1("span", {
				class: "atv-vote-count",
				children: voteState.usefulCount
			})]
		}), u$1("button", {
			"aria-label": `没用，${voteState.uselessCount} 人觉得没用`,
			"aria-pressed": voteState.voted === "useless",
			class: `atv-vote-btn down${voteState.voted === "useless" ? " is-voted" : ""}${sizeClass}`,
			disabled: !onVote || loading || voteState.voted === "useless",
			onClick: (event) => {
				event.stopPropagation();
				vote("useless");
			},
			type: "button",
			children: [u$1(IconVoteTriangle, {}), u$1("span", {
				class: "atv-vote-count",
				children: voteState.uselessCount
			})]
		})] });
	};
	var ReviewCard = ({ canVote, onOpen, onVote, onVoteStateChange, review, voteState }) => {
		const displayName = reviewDisplayName(review.name);
		return u$1("article", {
			class: "atv-review-card",
			"data-rid": review.id || void 0,
			children: [u$1("button", {
				"aria-label": `展开阅读：${review.title}`,
				class: "atv-review-open-button",
				onClick: () => onOpen(review),
				type: "button"
			}), u$1("div", {
				class: "atv-review-content",
				children: [
					u$1("div", {
						class: "atv-review-top",
						children: [u$1("div", {
							class: "atv-review-avatar",
							style: review.avatar ? { backgroundImage: `url("${review.avatar}")` } : void 0,
							children: review.avatar ? null : displayName.slice(0, 1).toUpperCase()
						}), u$1("div", {
							class: "atv-review-meta",
							children: [review.link ? u$1("a", {
								class: "atv-review-author",
								href: review.link,
								onClick: (event) => event.stopPropagation(),
								rel: "noopener",
								target: "_blank",
								children: displayName
							}) : u$1("div", {
								class: "atv-review-author",
								children: displayName
							}), review.stars > 0 ? u$1(Stars, {
								className: "atv-review-stars",
								outOfFive: true,
								score: review.stars
							}) : null]
						})]
					}),
					u$1("div", {
						class: "atv-review-title",
						children: review.title
					}),
					u$1("div", {
						class: "atv-review-excerpt",
						children: review.content
					}),
					u$1("div", {
						class: "atv-review-foot",
						children: [
							u$1("span", {
								class: "atv-review-time",
								children: review.time || ""
							}),
							u$1("span", {
								class: "atv-review-readmore",
								children: "展开阅读"
							}),
							u$1("div", {
								class: "atv-review-actions",
								"data-rid": review.id || void 0,
								children: u$1(ReviewVoteButtons, {
									canVote,
									onStateChange: onVoteStateChange,
									onVote,
									review,
									state: voteState
								})
							})
						]
					})
				]
			})]
		});
	};
	var stripInlineStyles = (html) => html.replaceAll(/\sstyle="[^"]*"/giu, "");
	var findNativeReviewContent = (rid) => {
		const numericId = reviewNumericId(rid);
		const fullContent = document.querySelector(`[id="${rid}"]`)?.querySelector(`#review_${numericId}_full .review-content`);
		const text = (fullContent?.textContent ?? "").trim();
		return fullContent && text ? stripInlineStyles(fullContent.innerHTML) : null;
	};
	var useReviewContent = (rid) => {
		const [state, setState] = d(() => {
			const nativeHtml = findNativeReviewContent(rid);
			return nativeHtml ? {
				html: nativeHtml,
				status: "loaded"
			} : {
				html: null,
				status: "loading"
			};
		});
		h(() => {
			const nativeHtml = findNativeReviewContent(rid);
			if (nativeHtml) {
				setState({
					html: nativeHtml,
					status: "loaded"
				});
				return;
			}
			let cancelled = false;
			const numericId = reviewNumericId(rid);
			setState({
				html: null,
				status: "loading"
			});
			const loadReview = async () => {
				try {
					const response = await fetch(`https://movie.douban.com/review/${numericId}/`);
					if (!response.ok) throw new Error(String(response.status));
					const html = await response.text();
					if (cancelled) return;
					const content = new DOMParser().parseFromString(html, "text/html").querySelector(".review-content");
					if (!content) throw new Error("no content");
					setState({
						html: stripInlineStyles(content.innerHTML),
						status: "loaded"
					});
				} catch {
					if (!cancelled) setState({
						html: null,
						status: "error"
					});
				}
			};
			loadReview();
			return () => {
				cancelled = true;
			};
		}, [rid]);
		return state;
	};
	var bodyClassName = (status) => {
		if (status === "loaded") return "atv-review-modal-body";
		if (status === "error") return "atv-review-modal-body is-error";
		return "atv-review-modal-body is-skeleton";
	};
	var ReviewModalContent = ({ canVote, onVoteStateChange, onVote, review, voteState }) => {
		const handleClose = useModalClose();
		const content = useReviewContent(review.id);
		const displayName = reviewDisplayName(review.name);
		const numericId = reviewNumericId(review.id);
		return u$1(S, { children: [
			u$1(ModalCloseButton, {
				ariaLabel: "关闭影评",
				onClick: handleClose
			}),
			u$1("div", { class: "atv-review-modal-accent" }),
			u$1("div", {
				class: "atv-review-modal-header",
				children: [
					u$1("div", {
						class: "atv-review-modal-title",
						id: "atv-review-modal-title",
						tabindex: -1,
						children: review.title
					}),
					review.stars > 0 ? u$1(Stars, {
						className: "atv-review-modal-stars",
						outOfFive: true,
						score: review.stars
					}) : null,
					u$1("div", {
						class: "atv-review-modal-byline",
						children: [u$1("div", {
							class: "atv-review-modal-avatar",
							style: review.avatar ? { backgroundImage: `url("${review.avatar}")` } : void 0,
							children: review.avatar ? null : displayName.slice(0, 1).toUpperCase()
						}), u$1("div", {
							class: "atv-review-modal-byline-text",
							children: [u$1("span", {
								class: "atv-review-modal-byline-name",
								children: displayName
							}), review.time ? u$1("span", {
								class: "atv-review-modal-byline-time",
								children: ["· ", review.time]
							}) : null]
						})]
					})
				]
			}),
			u$1(HtmlContent, {
				"aria-busy": content.status === "loading" ? "true" : "false",
				"aria-live": "polite",
				class: bodyClassName(content.status),
				html: content.html || void 0,
				children: [content.status === "loading" ? "加载中" : null, content.status === "error" ? u$1("div", {
					class: "atv-review-modal-error",
					children: u$1("p", { children: "影评内容暂时加载失败" })
				}) : null]
			}),
			u$1("div", {
				class: "atv-review-modal-footer",
				children: [u$1("div", {
					class: "atv-review-modal-votes",
					children: u$1("div", {
						class: "atv-review-actions",
						"data-rid": review.id || void 0,
						children: u$1(ReviewVoteButtons, {
							canVote,
							onStateChange: onVoteStateChange,
							onVote,
							review,
							size: "large",
							state: voteState
						})
					})
				}), u$1("div", {
					class: "atv-review-modal-link",
					children: u$1("a", {
						class: "atv-review-modal-link-a",
						href: `https://movie.douban.com/review/${numericId}/`,
						rel: "noopener",
						target: "_blank",
						children: "查看豆瓣原文 →"
					})
				})]
			})
		] });
	};
	var ReviewModal = ({ canVote, onClose, onVoteStateChange, onVote, review, voteState }) => u$1(ModalShell, {
		ariaLabelledBy: "atv-review-modal-title",
		className: "atv-review-modal",
		id: "atv-review-modal",
		onClose,
		surfaceClassName: "atv-review-modal-scroll",
		children: u$1(ReviewModalContent, {
			canVote,
			onVote,
			onVoteStateChange,
			review,
			voteState
		})
	});
	var ReviewsSection = ({ canVote, getVoteState, isTV, onOpen, onVoteStateChange, onVote, reviews, subjectId }) => {
		if (!reviews.length) return null;
		return u$1(Section, {
			id: "atv-reviews",
			moreLink: {
				href: `https://movie.douban.com/subject/${subjectId}/reviews`,
				text: "查看全部 →"
			},
			title: isTV ? "热门剧评" : "热门影评",
			children: u$1("div", {
				class: "atv-reviews",
				children: reviews.map((review) => u$1(ReviewCard, {
					canVote,
					onOpen,
					onVote,
					onVoteStateChange,
					review,
					voteState: getVoteState?.(review)
				}, review.id))
			})
		});
	};
	var toHeroData = (data) => ({
		imdbId: data.info.imdb || null,
		info: data.info,
		interest: data.interest,
		isTV: data.isTV,
		photos: data.photos,
		poster: data.poster,
		rating: data.rating,
		subjectId: data.subjectId,
		summary: data.summary,
		title: data.title,
		year: data.year
	});
	var SubjectPage = ({ data, deps }) => {
		const [activeComment, setActiveComment] = d(null);
		const [activeReview, setActiveReview] = d(null);
		const [commentVoteStates, setCommentVoteStates] = d(() => Object.fromEntries(data.comments.map((comment) => [commentVoteKey(comment), initialCommentVoteState(comment)])));
		const [reviewVoteStates, setReviewVoteStates] = d(() => Object.fromEntries(data.reviews.map((review) => [reviewVoteKey(review), initialReviewVoteState(review)])));
		const getCommentVoteState = (comment) => commentVoteStates[commentVoteKey(comment)] ?? initialCommentVoteState(comment);
		const setCommentVoteState = (comment, state) => {
			setCommentVoteStates((current) => ({
				...current,
				[commentVoteKey(comment)]: state
			}));
		};
		const getReviewVoteState = (review) => reviewVoteStates[reviewVoteKey(review)] ?? initialReviewVoteState(review);
		const setReviewVoteState = (review, state, options) => {
			setReviewVoteStates((current) => ({
				...current,
				[reviewVoteKey(review)]: state
			}));
			if (options?.persist) persistReviewVoteState(review, state);
		};
		return u$1(S, { children: [
			u$1(Hero, {
				callbacks: deps.heroCallbacks,
				data: toHeroData(data)
			}),
			u$1(StreamingSection, { streaming: data.streaming }),
			u$1(SeriesSection, {
				items: data.series,
				moreLink: deps.seriesMoreLink
			}),
			u$1(CastSection, { celebrities: data.celebrities }),
			u$1(PhotosSection, { data: {
				photos: data.photos,
				subjectId: data.subjectId,
				trailers: data.trailers
			} }),
			u$1(CommentsSection, {
				canVote: deps.canVote,
				comments: data.comments.map((comment) => commentWithVoteState(comment, getCommentVoteState(comment))),
				getVoteState: getCommentVoteState,
				onOpen: setActiveComment,
				onVoteStateChange: setCommentVoteState,
				onVote: deps.handleVote,
				subjectId: data.subjectId
			}),
			u$1(ReviewsSection, {
				canVote: deps.canReviewVote,
				getVoteState: getReviewVoteState,
				isTV: data.isTV,
				onOpen: setActiveReview,
				onVoteStateChange: setReviewVoteState,
				onVote: deps.handleReviewVote,
				reviews: data.reviews.map((review) => reviewWithVoteState(review, getReviewVoteState(review))),
				subjectId: data.subjectId
			}),
			u$1(RecommendationsSection, { recommendations: data.recommendations }),
			u$1(DetailsSection, { data: {
				awards: data.awards,
				info: data.info,
				isTV: data.isTV
			} }),
			u$1("div", { class: "atv-footer-spacer" }),
			activeComment ? u$1(CommentModal, {
				canVote: deps.canVote,
				comment: commentWithVoteState(activeComment, getCommentVoteState(activeComment)),
				onClose: () => setActiveComment(null),
				onVoteStateChange: setCommentVoteState,
				onVote: deps.handleVote,
				voteState: getCommentVoteState(activeComment)
			}) : null,
			activeReview ? u$1(ReviewModal, {
				canVote: deps.canReviewVote,
				onClose: () => setActiveReview(null),
				onVoteStateChange: setReviewVoteState,
				onVote: deps.handleReviewVote,
				review: reviewWithVoteState(activeReview, getReviewVoteState(activeReview)),
				voteState: getReviewVoteState(activeReview)
			}) : null
		] });
	};
	var nativeDialogSelector = ".account_pop.dui-dialog, .account-pop.dui-dialog, .account_pop, .account-form, .login-modal";
	var nativeMaskSelector = ".dui-dialog-msk, .ui-mask, .account-mask";
	var maxAttempts = 24;
	var trustedHosts = new Set(["accounts.douban.com"]);
	var loginTriggerSelector = [
		".a_show_login",
		".j.a_show_login",
		"a[href*='accounts/login']",
		"a[href*='douban.com/accounts/login']",
		"a[href*='register']",
		"a[href*='douban.com/register']"
	].join(", ");
	var clearNativeLoginMasks = () => {
		for (const mask of document.querySelectorAll(nativeMaskSelector)) mask.remove();
	};
	var findNativeLoginDialog = () => document.querySelector(nativeDialogSelector);
	var isTrustedLoginIframe = (iframe) => {
		const source = iframe.getAttribute("src");
		if (!source || source === "about:blank") return true;
		try {
			const url = new URL(source, window.location.href);
			return trustedHosts.has(url.hostname) && url.pathname.startsWith("/passport/login");
		} catch {
			return false;
		}
	};
	var prepareNativeLoginIframe = (dialog) => {
		const iframe = dialog.querySelector("iframe");
		if (!iframe || !isTrustedLoginIframe(iframe)) return {
			message: "无法载入豆瓣登录组件，请刷新页面后重试。",
			ok: false
		};
		iframe.title = "豆瓣登录";
		iframe.referrerPolicy = "strict-origin-when-cross-origin";
		iframe.removeAttribute("width");
		iframe.removeAttribute("height");
		iframe.removeAttribute("frameborder");
		iframe.removeAttribute("scrolling");
		iframe.removeAttribute("style");
		iframe.classList.add("atv-login-modal-iframe");
		iframe.remove();
		dialog.remove();
		return {
			iframe,
			ok: true
		};
	};
	var triggerNativeLoginDialog = () => {
		const triggers = [...document.querySelectorAll(loginTriggerSelector)];
		(triggers.find((node) => node.offsetParent !== null) ?? triggers[0])?.click();
	};
	var mountNativeLoginFrame = (host, onError, attempt = 0) => {
		clearNativeLoginMasks();
		const dialog = findNativeLoginDialog();
		if (dialog) {
			const result = prepareNativeLoginIframe(dialog);
			if (!result.ok) {
				onError(result.message);
				return;
			}
			host.replaceChildren(result.iframe);
			host.setAttribute("aria-busy", "false");
			onError("");
			requestAnimationFrame(() => result.iframe.focus());
			return;
		}
		if (attempt === 0) {
			triggerNativeLoginDialog();
			clearNativeLoginMasks();
		}
		if (attempt < maxAttempts) {
			window.setTimeout(() => {
				mountNativeLoginFrame(host, onError, attempt + 1);
			}, 100);
			return;
		}
		onError("无法载入豆瓣登录组件，请刷新页面后重试。");
	};
	var LoginModalContent = ({ action, busy, hostRef, status }) => {
		const handleClose = useModalClose();
		return u$1(S, { children: [
			u$1("div", { class: "atv-login-modal-accent" }),
			u$1(ModalCloseButton, {
				ariaLabel: "关闭登录弹窗",
				className: "atv-login-modal-close",
				onClick: handleClose,
				size: 18
			}),
			u$1("h2", {
				class: "atv-login-modal-title",
				id: "atv-login-modal-title",
				children: "登录豆瓣后继续"
			}),
			u$1("p", {
				class: "atv-login-modal-desc",
				id: "atv-login-modal-desc",
				children: `登录后才能${action}。`
			}),
			u$1("p", {
				"aria-live": "polite",
				class: "atv-login-modal-status",
				hidden: !status,
				children: status
			}),
			u$1("div", {
				"aria-busy": busy ? "true" : "false",
				class: "atv-login-modal-native",
				ref: hostRef
			})
		] });
	};
	var LoginModal = ({ action, onClose }) => {
		const hostRef = A(null);
		const [status, setStatus] = d("正在载入豆瓣登录组件…");
		const [busy, setBusy] = d(true);
		h(() => {
			const host = hostRef.current;
			if (!host) return;
			mountNativeLoginFrame(host, (message) => {
				setStatus(message);
				setBusy(false);
				host.setAttribute("aria-busy", "false");
			});
		}, []);
		h(() => {
			const timer = setInterval(() => {
				if (!hostRef.current?.querySelector("iframe")) return;
				if (document.cookie.split(";").some((cookie) => cookie.trim().startsWith("ck="))) {
					clearInterval(timer);
					onClose();
					window.location.reload();
				}
			}, 300);
			return () => clearInterval(timer);
		}, [onClose]);
		return u$1(ModalShell, {
			ariaDescribedBy: "atv-login-modal-desc",
			ariaLabelledBy: "atv-login-modal-title",
			className: "atv-login-modal",
			id: "atv-login-modal",
			onClose,
			surfaceClassName: "atv-login-modal-inner",
			children: u$1(LoginModalContent, {
				action,
				busy,
				hostRef,
				status
			})
		});
	};
	var openLoginModal = (options) => {
		options.returnUrl;
		document.querySelector("#atv-login-modal")?.remove();
		clearNativeLoginMasks();
		const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const host = document.createElement("div");
		document.body.append(host);
		const close = () => {
			clearNativeLoginMasks();
			R(null, host);
			host.remove();
			if (previousFocus?.isConnected) previousFocus.focus();
		};
		R(u$1(LoginModal, {
			action: options.action,
			onClose: close
		}), host);
	};
	var createAccountGate = (options) => {
		const openPrompt = options.openPrompt ?? ((action) => {
			openLoginModal({ action });
		});
		const requireLogin = (action) => {
			if (options.loggedIn) return true;
			openPrompt(action);
			return false;
		};
		return { requireLogin };
	};
	var avatarCache = createCache("dp:avatar-cache", 1800 * 1e3);
	var AVATAR_SELECTORS = [
		"#profile .pic img",
		".user-face",
		"img[src*='/icon/']"
	];
	var extractProfileAvatar = (html) => {
		const doc = new DOMParser().parseFromString(html, "text/html");
		for (const sel of AVATAR_SELECTORS) {
			const img = doc.querySelector(sel);
			if (!img) continue;
			const src = img.src || img.dataset.src || img.dataset.original || "";
			if (src) return src;
		}
		return "";
	};
	var fetchAvatarUrls = async (links) => {
		if (links.length === 0) return new Map();
		const result = new Map();
		const missing = [];
		for (const link of links) {
			const cached = avatarCache.get(link);
			if (cached) result.set(link, cached);
			else missing.push(link);
		}
		if (missing.length === 0) return result;
		const fetchResults = await Promise.allSettled(missing.map(async (link) => {
			try {
				return {
					link,
					url: extractProfileAvatar(await gmGet(link, location.href))
				};
			} catch {
				return {
					link,
					url: ""
				};
			}
		}));
		for (const fetchResult of fetchResults) if (fetchResult.status === "fulfilled") {
			const { link, url } = fetchResult.value;
			if (url) avatarCache.set(link, url);
			result.set(link, url);
		}
		return result;
	};
	var updateAvatarDom = (url, selector, retries = 5) => {
		const el = document.querySelector(selector);
		if (!el) {
			if (retries > 0) requestAnimationFrame(() => updateAvatarDom(url, selector, retries - 1));
			return;
		}
		el.style.backgroundImage = `url("${url}")`;
		el.textContent = "";
		el.classList.add("atv-avatar-loaded");
		try {
			const img = new Image();
			img.addEventListener("error", () => {
				console.warn("[AVATAR] preload FAILED for", url);
			});
			img.src = url;
		} catch {}
	};
	var applyCommentAvatars = (urlMap, comments) => {
		for (const comment of comments) {
			const url = urlMap.get(comment.link);
			if (!url) continue;
			comment.avatar = url;
			updateAvatarDom(url, `.atv-comment-card[data-cid="${comment.cid}"] .atv-comment-avatar`);
			updateAvatarDom(url, `.atv-comment-overlay-avatar[data-cid="${comment.cid}"]`);
		}
	};
	var startAvatarEffect = (comments) => {
		if (comments.length === 0) return;
		const links = comments.map((comment) => comment.link);
		(async () => {
			applyCommentAvatars(await fetchAvatarUrls(links), comments);
		})();
	};
	var $ = (selector, ctx) => (ctx ?? document).querySelector(selector);
	var $$ = (selector, ctx) => [...(ctx ?? document).querySelectorAll(selector)];
	var safeText = (el) => el ? (el.textContent ?? "").trim() : "";
	var extractAwards = (doc) => $$("ul.award", doc).map((ul) => {
		const lis = $$("li", ul);
		const orgEl = lis[0] ? $("a", lis[0]) : null;
		const org = lis[0] ? safeText(lis[0]) : "";
		const name = lis[1] ? safeText(lis[1]) : "";
		const personEl = lis[2] ? $("a", lis[2]) : null;
		const person = lis[2] ? safeText(lis[2]) : "";
		return {
			name,
			org,
			orgLink: orgEl ? orgEl.href : "",
			person,
			personLink: personEl ? personEl.href : ""
		};
	}).filter((a) => a.org);
	var upgradePoster = (url) => {
		if (!url) return null;
		return encodeURI(url.replace("/s_ratio_poster/", "/l_ratio_poster/").replace("s_ratio_poster", "l_ratio_poster"));
	};
	var upgradePhoto = (url) => {
		if (!url) return null;
		return encodeURI(url.replace("/sqxs/", "/large/").replace("/m/", "/l/"));
	};
	var extractTitle = (doc) => {
		const h1 = $("#content h1", doc);
		const full = safeText($("span[property=\"v:itemreviewed\"]", h1 ?? doc)) || safeText(h1).replace(RE_YEAR_TRAIL, "").trim();
		let primary = full;
		let original = "";
		const idx = full.search(RE_WS);
		if (idx > 0) {
			primary = full.slice(0, idx).trim();
			original = full.slice(idx).trim().replace(RE_SEASON_EP, "");
		}
		return {
			full,
			original,
			primary
		};
	};
	var extractYear = (doc) => {
		const m = safeText($("#content h1 .year", doc)).match(RE_YEAR);
		return m ? m[1] : "";
	};
	var extractPoster = (doc) => {
		const img = $("#mainpic img", doc) || $("a.nbgnbg img", doc);
		if (!img) return null;
		return upgradePoster(img.src || img.dataset.src || "");
	};
	var extractSubjectId = (doc) => {
		const m = (doc.defaultView?.location.pathname ?? "").match(RE_SUBJECT_ID);
		return m ? m[1] : "";
	};
	var findLabel = (root, label) => {
		if (!root) return null;
		const spans = $$("span.pl", root);
		for (const s of spans) if ((s.textContent || "").replace(RE_COLON_WS, "") === label) return s;
		return null;
	};
	var collectInfoTextAfter = (root, label, trim) => {
		const labelEl = findLabel(root, label);
		if (!labelEl) return "";
		let out = "";
		let n = labelEl.nextSibling;
		while (n) {
			if (n.nodeType === 1 && n.classList?.contains("pl")) break;
			if (n.nodeType === 1 && n.tagName === "BR") break;
			if (n.nodeType === 3) out += n.nodeValue;
			else if (n.nodeType === 1) out += n.textContent || "";
			n = n.nextSibling;
		}
		let result = out.replace(RE_SLASH_SEP, " / ").replace(RE_WS_GLOBAL, " ");
		if (trim !== false) result = result.trim();
		return result;
	};
	var collectLinksAfter = (root, label) => {
		const labelEl = findLabel(root, label);
		if (!labelEl) return [];
		const out = [];
		let n = labelEl.nextSibling;
		while (n) {
			if (n.nodeType === 1 && n.classList?.contains("pl")) break;
			if (n.nodeType === 1 && n.tagName === "BR") break;
			if (n.nodeType === 1) {
				const el = n;
				const anchors = el.tagName === "A" ? [el] : $$("a", el);
				for (const a of anchors) {
					const t = (a.textContent || "").trim();
					if (t) out.push({
						href: a.href || "",
						text: t
					});
				}
			}
			n = n.nextSibling;
		}
		return out;
	};
	var extractInfo = (doc) => {
		const info = $("#info", doc);
		const out = {
			aliases: "",
			cast: [],
			country: "",
			director: [],
			episodeRuntime: "",
			episodes: "",
			firstAired: "",
			genres: [],
			imdb: "",
			language: "",
			releaseDate: "",
			runtime: "",
			seasons: "",
			writers: []
		};
		if (!info) return out;
		out.director = collectLinksAfter(info, "导演");
		out.writers = collectLinksAfter(info, "编剧");
		const starringEls = $$("a[rel=\"v:starring\"]", info);
		out.cast = starringEls.length ? starringEls.map((a) => ({
			href: a.href || "",
			text: (a.textContent || "").trim()
		})).filter((x) => x.text) : collectLinksAfter(info, "主演");
		out.genres = $$("span[property=\"v:genre\"]", info).map((e) => (e.textContent || "").trim()).filter(Boolean);
		out.country = collectInfoTextAfter(info, "制片国家/地区");
		out.language = collectInfoTextAfter(info, "语言");
		const relEls = $$("span[property=\"v:initialReleaseDate\"]", info);
		if (relEls.length) out.releaseDate = relEls.map((e) => (e.textContent || "").trim()).filter(Boolean).join(" / ");
		out.firstAired = collectInfoTextAfter(info, "首播");
		const runEls = $$("span[property=\"v:runtime\"]", info);
		if (runEls.length) out.runtime = runEls.map((e) => (e.textContent || "").trim()).filter(Boolean).join(" / ");
		out.episodes = collectInfoTextAfter(info, "集数");
		if (findLabel(info, "季数")) {
			const sel = $("#season", info);
			if (sel) {
				const opt = sel.options[sel.selectedIndex];
				out.seasons = opt ? (opt.textContent || "").trim() : collectInfoTextAfter(info, "季数");
			} else out.seasons = collectInfoTextAfter(info, "季数");
		}
		out.episodeRuntime = collectInfoTextAfter(info, "单集片长");
		out.aliases = collectInfoTextAfter(info, "又名");
		if (findLabel(info, "IMDb")) {
			const raw = collectInfoTextAfter(info, "IMDb");
			const m = raw.match(RE_IMDB_ID);
			out.imdb = m ? m[1] : raw;
		}
		return out;
	};
	var matchInterestText = (text, s3Only = false) => {
		if (text.includes("已看过")) return "collect";
		if (text.includes("已想看")) return "wish";
		if (text.includes("已在看")) return "do";
		if (/^我看过(?:这部电影|这部电视剧)/u.test(text)) return "collect";
		if (/^我想看(?:这部电影|这部电视剧)/u.test(text)) return "wish";
		if (/^(?:我在看|我正在看)(?:这部电影|这部电视剧)?/u.test(text)) return "do";
		if (!s3Only) {
			if (/^看过$/u.test(text)) return "collect";
			if (/^想看$/u.test(text)) return "wish";
			if (/^(?:正在?)?在看$/u.test(text)) return "do";
		}
		return null;
	};
	var findInterestButtons = (doc) => {
		const result = {
			collect: null,
			do: null,
			wish: null
		};
		const root = $("#interest_sect_level", doc) || $("#interest_sectl", doc);
		const anchors = root ? $$("a", root) : [];
		const scan = (list, doRe, wishRe, collectRe) => {
			for (const a of list) {
				const t = (a.textContent || "").trim();
				if (!result.do && doRe.test(t)) result.do = a;
				if (!result.wish && wishRe.test(t)) result.wish = a;
				if (!result.collect && collectRe.test(t)) result.collect = a;
			}
		};
		scan(anchors, RE_DO, RE_WISH, RE_COLLECT);
		if (!result.do || !result.wish || !result.collect) scan($$("#interest_sectl a", doc), RE_DO_EXACT, RE_WISH_EXACT, RE_COLLECT_EXACT);
		return result;
	};
	var detectS3State = (root) => {
		let status = "none";
		const allTextEls = root.querySelectorAll("span, div, a");
		for (const el of allTextEls) {
			const s = matchInterestText((el.textContent || "").trim(), true);
			if (s) {
				status = s;
				break;
			}
		}
		const hasWatching = [...allTextEls].some((el) => /^(?:正在?)?在看/u.test((el.textContent || "").trim()));
		const ratingInput = root.querySelector("#n_rating");
		const rating = ratingInput ? Math.trunc(Number(ratingInput.value)) : 0;
		const dateEl = root.querySelector(".collection_date");
		const date = dateEl ? (dateEl.textContent || "").trim() : "";
		const commentEl = root.querySelector(".j.a_stars > span:not(.mr10):not(#rating)");
		let comment = "";
		let usefulCount = "";
		if (commentEl) {
			const voteEl = commentEl.querySelector(".pl");
			usefulCount = voteEl ? (voteEl.textContent || "").trim() : "";
			for (const node of commentEl.childNodes) if (node.nodeType === Node.TEXT_NODE) comment += node.textContent || "";
			comment = comment.trim();
		}
		return {
			comment,
			date,
			hasWatching,
			rating,
			status,
			usefulCount
		};
	};
	var detectS2Status = (anchors) => {
		let status = "none";
		let hasWatching = false;
		for (const a of anchors) {
			const text = (a.textContent || "").trim();
			if (text === "在看") hasWatching = true;
			if (status !== "none") continue;
			const s = matchInterestText(text);
			if (s) {
				const cls = `${a.className} ${a.parentElement?.className || ""}`;
				if (RE_INTEREST_ACTIVE.test(cls)) status = s;
			}
		}
		return {
			hasWatching,
			status
		};
	};
	var extractInterestState = (doc) => {
		const ck = (doc.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";
		const loggedIn = !!ck;
		const root = $("#interest_sect_level", doc) || $("#interest_sectl", doc);
		const anchors = root ? $$("a", root) : [];
		if (!loggedIn) return {
			ck,
			comment: "",
			date: "",
			hasWatching: anchors.some((a) => /^在看$/u.test((a.textContent || "").trim())),
			loggedIn: false,
			marked: false,
			rating: 0,
			status: "none",
			tags: [],
			usefulCount: ""
		};
		if (root) {
			const s3 = detectS3State(root);
			if (s3.status !== "none") return {
				ck,
				comment: s3.comment,
				date: s3.date,
				hasWatching: s3.hasWatching,
				loggedIn: true,
				marked: true,
				rating: s3.rating,
				status: s3.status,
				tags: [],
				usefulCount: s3.usefulCount
			};
		}
		const s2 = detectS2Status(anchors);
		return {
			ck,
			comment: "",
			date: "",
			hasWatching: s2.hasWatching,
			loggedIn: true,
			marked: false,
			rating: 0,
			status: s2.status,
			tags: [],
			usefulCount: ""
		};
	};
	var extractCelebrities = (doc) => $$("#celebrities li.celebrity", doc).map((li) => {
		const nameEl = $(".info .name a", li) ?? $(".info .name", li);
		const roleEl = $(".info .role", li);
		const avatarEl = $(".avatar", li);
		let avatar = "";
		if (avatarEl) {
			const m = (avatarEl.getAttribute("style") || "").match(RE_BG_URL);
			if (m) [, avatar] = m;
		}
		return {
			avatar: encodeURI(avatar),
			link: nameEl && nameEl.tagName === "A" ? nameEl.href : "",
			name: safeText(nameEl),
			role: safeText(roleEl)
		};
	}).filter((c) => c.name);
	var extractPhotos = (doc) => $$("#related-pic .related-pic-bd img", doc).map((img) => {
		const thumb = img.src || img.dataset.src || "";
		const a = img.closest("a");
		return {
			hdUrl: upgradePhoto(thumb) || "",
			link: a ? a.href : "",
			thumbUrl: encodeURI(thumb)
		};
	}).filter((p) => p.thumbUrl);
	var extractTrailers = (doc) => $$("#related-pic li.label-trailer a.related-pic-video", doc).map((a) => {
		const m = (a.getAttribute("style") || "").match(RE_BG_URL);
		const thumbUrl = m ? m[1] : "";
		return {
			thumbUrl: encodeURI(thumbUrl),
			title: a.getAttribute("title") || "",
			trailerPageUrl: a.href
		};
	}).filter((t) => t.trailerPageUrl);
	var RE_CRLF = /\r\n?/gu;
	var RE_LINE_EDGE_HSPACE = /^[ \t\u00A0\u3000]+|[ \t\u00A0\u3000]+$/gu;
	var extractRating$1 = (doc) => {
		const raw = safeText($("strong.rating_num", doc) || $("strong[property=\"v:average\"]", doc));
		const score = raw ? Number(raw) : NaN;
		if (!score || Number.isNaN(score) || score <= 0) return null;
		const votesEl = $("span[property=\"v:votes\"]", doc) || $(".rating_people span", doc);
		return {
			count: votesEl ? Math.trunc(Number(safeText(votesEl).replace(RE_NON_DIGIT, ""))) || 0 : 0,
			score
		};
	};
	var normalizeSummaryText = (text) => text.replace(RE_CRLF, "\n").split("\n").map((line) => line.replace(RE_LINE_EDGE_HSPACE, "").replace(RE_HSPACE, " ")).join("\n").replace(RE_NL_MULTI, "\n").trim();
	var extractSummary = (doc) => {
		const summary = $("span[property=\"v:summary\"]", doc);
		if (!summary) return null;
		return normalizeSummaryText(summary.textContent || "") || null;
	};
	var extractReviewRating = (item) => {
		let stars = 0;
		let ratingWord = "";
		const ratingEl = $("[class*=\"allstar\"]", item);
		if (ratingEl) {
			const rm = (ratingEl.className || "").match(RE_ALLSTAR);
			if (rm) stars = Math.trunc(Number(rm[1])) / 10;
			ratingWord = ratingEl.getAttribute("title") || "";
		}
		if (stars === 0) {
			const titleRating = $(".main-title-rating", item);
			if (titleRating) ratingWord = titleRating.getAttribute("title") || "";
		}
		return {
			ratingWord,
			stars
		};
	};
	var extractReviewContent = (item) => {
		const shortContent = $(".review-short .short-content", item);
		if (shortContent) {
			shortContent.querySelector("a.unfold")?.remove();
			return safeText(shortContent).replace(/[\s\u00A0]*\(\)[\s\u00A0]*$/u, "").trim();
		}
		const mainBd = $(".main-bd", item);
		return mainBd ? safeText(mainBd) : "";
	};
	var extractReviewVotes = (item) => {
		const action = $(".action", item);
		if (!action) return {
			usefulCount: 0,
			uselessCount: 0
		};
		const upEl = $(".action-btn.up", action);
		const downEl = $(".action-btn.down", action);
		return {
			usefulCount: Math.trunc(Number((upEl?.textContent ?? "").trim())) || 0,
			uselessCount: Math.trunc(Number((downEl?.textContent ?? "").trim())) || 0
		};
	};
	var extractReviewItem = (item) => {
		const title = safeText($(".main-bd h2 a", item));
		if (!title) return null;
		const nameLink = $(".main-hd a.name", item);
		const name = safeText(nameLink);
		if (!name) return null;
		const avatarImg = $(".main-hd .avator img", item);
		const avatar = avatarImg ? encodeURI(avatarImg.src || avatarImg.dataset.original || avatarImg.dataset.src || "") : "";
		const { stars, ratingWord } = extractReviewRating(item);
		const time = safeText($(".main-hd .main-meta", item));
		const content = extractReviewContent(item);
		const { usefulCount, uselessCount } = extractReviewVotes(item);
		const spoiler = !!$(".spoiler-tip", item);
		return {
			avatar,
			content,
			id: item.id || "",
			link: nameLink?.href ?? "",
			name,
			ratingWord,
			spoiler,
			stars,
			time,
			title,
			usefulCount,
			uselessCount
		};
	};
	var extractReviews = (doc) => {
		const items = $$("#reviews-wrapper .review-item", doc);
		const out = [];
		for (const item of items) {
			const review = extractReviewItem(item);
			if (review) out.push(review);
		}
		return out;
	};
	var CN_DIGIT = {
		一: 1,
		七: 7,
		三: 3,
		九: 9,
		二: 2,
		五: 5,
		八: 8,
		六: 6,
		四: 4
	};
	var parseCnNum = (s) => {
		const arabic = Math.trunc(Number(s));
		if (!Number.isNaN(arabic)) return arabic;
		const parts = s.split("十");
		if (parts.length === 2) {
			const tens = parts[0] ? CN_DIGIT[parts[0]] ?? 1 : 1;
			const ones = parts[1] ? CN_DIGIT[parts[1]] ?? 0 : 0;
			return tens * 10 + ones;
		}
		if (s === "十") return 10;
		return CN_DIGIT[s] ?? 0;
	};
	var seasonNum = (title) => {
		const m = title.match(/第\s*(?<num>[\d一二三四五六七八九十百]+)\s*季/u);
		if (!m?.groups?.num) return 0;
		return parseCnNum(m.groups.num);
	};
	var extractSeries = (doc) => {
		const container = $("#series-items .items-swiper", doc);
		if (!container) return [];
		const seen = new Set();
		const items = $$(".items-swiper-item", container);
		const out = [];
		for (const el of items) {
			const linkEl = $(".items-swiper-item-pic a", el);
			const imgEl = $(".items-swiper-item-pic a img", el);
			const titleEl = $(".items-swiper-item-title a", el);
			const ratingEl = $(".items-swiper-item-rating", el);
			const link = linkEl ? linkEl.href : "";
			if (!link || seen.has(link)) continue;
			seen.add(link);
			out.push({
				link,
				poster: imgEl ? imgEl.src || imgEl.dataset.src || "" : "",
				rating: safeText(ratingEl),
				title: safeText(titleEl)
			});
		}
		return [...out].toSorted((a, b) => seasonNum(a.title) - seasonNum(b.title));
	};
	var extractRecommendations = (doc) => $$(".recommendations-bd dl", doc).map((dl) => {
		const linkEl = $("dt a", dl);
		const imgEl = $("dt a img", dl);
		const titleEl = $("dd a", dl);
		const rawPoster = imgEl ? imgEl.src || imgEl.dataset.src || "" : "";
		return {
			link: linkEl ? linkEl.href : "",
			poster: upgradePoster(rawPoster) || "",
			title: safeText(titleEl)
		};
	}).filter((r) => r.title);
	var extractRating = (item) => {
		const ratingEl = $("[class*=\"allstar\"]", item);
		if (!ratingEl) return {
			ratingWord: "",
			stars: 0
		};
		const rm = (ratingEl.className || "").match(RE_ALLSTAR);
		return {
			ratingWord: ratingEl.getAttribute("title") || "",
			stars: rm ? Math.trunc(Number(rm[1])) / 10 : 0
		};
	};
	var extractTime = (item) => {
		const timeEl = $(".comment-time", item);
		return timeEl ? timeEl.getAttribute("title") || safeText(timeEl) : "";
	};
	var extractVotes = (item) => {
		const votesEl = $(".vote-count", item) ?? $(".votes", item);
		return votesEl ? Math.trunc(Number(safeText(votesEl).replace(RE_NON_DIGIT, ""))) || 0 : 0;
	};
	var extractAvatar = (item) => {
		const img = $(".avatar img", item);
		if (!img) return "";
		return encodeURI(img.src || img.dataset.original || img.dataset.src || "");
	};
	var extractVoted = (item) => {
		if (item.querySelector(".j.vote-comment")) return false;
		const voteArea = $(".comment-vote", item);
		return /已投票|已赞|已推荐/u.test(safeText(voteArea));
	};
	var extractComments = (doc) => {
		const items = $$("#hot-comments .comment-item", doc);
		const out = [];
		for (const item of items) {
			const authorEl = $(".comment-info a", item);
			const name = safeText(authorEl);
			if (!name) continue;
			const content = safeText($(".full", item) ?? $(".short", item) ?? $(".comment-content", item));
			if (!content) continue;
			const { stars, ratingWord } = extractRating(item);
			out.push({
				avatar: extractAvatar(item),
				cid: item.dataset.cid ?? "",
				content,
				link: authorEl?.href ?? "",
				name,
				ratingWord,
				stars,
				time: extractTime(item),
				voted: extractVoted(item),
				votes: extractVotes(item)
			});
		}
		return out;
	};
	var isRealUrl = (h) => RE_HTTP.test(h || "");
	var parsePlaySources = (doc) => {
		const srcScript = $$("script:not([src])", doc).find((s) => RE_SOURCES_SCRIPT.test(s.textContent || ""));
		if (!srcScript) return {};
		const txt = srcScript.textContent;
		const map = {};
		let m = RE_PLAY_SOURCES.exec(txt);
		while (m) {
			const [, sourceId] = m;
			const playLink = m[2].replaceAll("&amp;", "&");
			if (!map[sourceId]) map[sourceId] = playLink;
			m = RE_PLAY_SOURCES.exec(txt);
		}
		return map;
	};
	var extractStreaming = (doc) => {
		const seen = new Set();
		const out = [];
		const sourcesMap = parsePlaySources(doc);
		const playBtns = $$("a.playBtn", doc);
		for (const a of playBtns) {
			const name = (a.dataset.cn || a.textContent || "").trim();
			if (!name || seen.has(name)) continue;
			seen.add(name);
			let { href } = a;
			if (!isRealUrl(href)) {
				const sourceId = a.dataset.source;
				if (sourceId && sourcesMap[sourceId]) href = sourcesMap[sourceId];
				else continue;
			}
			out.push({
				href,
				name
			});
		}
		for (const a of $$("a", doc)) {
			if (!RE_ONLINE_VIDEO.test(a.href || "")) continue;
			const name = (a.dataset.cn || a.textContent || "").trim();
			if (!name || seen.has(name)) continue;
			seen.add(name);
			if (isRealUrl(a.href)) out.push({
				href: a.href,
				name
			});
		}
		return out;
	};
	var isTVInfo = (info) => !!(info.episodes || info.seasons || info.episodeRuntime || info.firstAired);
	var extractDoubanData = (doc) => {
		const info = extractInfo(doc);
		const isTV = isTVInfo(info);
		return {
			awards: extractAwards(doc),
			celebrities: extractCelebrities(doc),
			comments: extractComments(doc),
			info,
			interest: extractInterestState(doc),
			isTV,
			photos: extractPhotos(doc),
			poster: extractPoster(doc),
			rating: extractRating$1(doc),
			recommendations: extractRecommendations(doc),
			reviews: extractReviews(doc),
			series: extractSeries(doc),
			streaming: extractStreaming(doc),
			subjectId: extractSubjectId(doc),
			summary: extractSummary(doc),
			title: extractTitle(doc),
			trailers: extractTrailers(doc),
			year: extractYear(doc)
		};
	};
	var API_INTEREST = "https://movie.douban.com/j/subject";
	var API_REMOVE = "https://movie.douban.com/subject";
	var postInterest = async (subjectId, interest, options) => {
		const ck = getCk();
		if (!ck) return {
			error: "未登录",
			ok: false
		};
		const params = new URLSearchParams({
			ck,
			comment: options?.comment ?? "",
			foldcollect: "F",
			interest,
			private: "",
			rating: typeof options?.rating === "number" ? String(options.rating) : "",
			tags: options?.tags?.join(",") ?? ""
		});
		try {
			const text = await gmPost(`${API_INTEREST}/${subjectId}/interest`, params.toString(), `https://movie.douban.com/subject/${subjectId}/`);
			const data = JSON.parse(text);
			if (data.r === 0) return { ok: true };
			return {
				error: data.msg || "操作失败",
				ok: false
			};
		} catch (error) {
			console.warn("[ATV-Douban] postInterest error:", error);
			return {
				error: String(error),
				ok: false
			};
		}
	};
	var removeInterest = async (subjectId, currentStatus) => {
		if (currentStatus === "none") return { ok: true };
		const ck = getCk();
		if (!ck) return {
			error: "未登录",
			ok: false
		};
		const params = new URLSearchParams({ ck });
		try {
			await gmPost(`${API_REMOVE}/${subjectId}/remove`, params.toString(), `https://movie.douban.com/subject/${subjectId}/`);
			return { ok: true };
		} catch (error) {
			console.warn("[ATV-Douban] removeInterest error:", error);
			return {
				error: String(error),
				ok: false
			};
		}
	};
	var StarRatingInput = ({ disabled = false, onChange, rating }) => u$1("div", {
		class: "atv-interest-modal-stars",
		children: Array.from({ length: 5 }, (_, index) => {
			const value = index + 1;
			const full = value <= rating;
			return u$1("button", {
				class: `atv-interest-modal-star${full ? " is-full" : ""}`,
				disabled,
				onClick: () => {
					if (!disabled) onChange(value);
				},
				type: "button",
				children: full ? u$1(IconStarFull, {}) : u$1(IconStarEmpty, {})
			}, index);
		})
	});
	var statusEntries = (hasWatching) => [
		{
			label: "想看",
			value: "wish"
		},
		...hasWatching ? [{
			label: "在看",
			value: "do"
		}] : [],
		{
			label: "看过",
			value: "collect"
		}
	];
	var initialStatus = (state) => state.marked && state.status !== "none" ? state.status : "wish";
	var InterestFormContent = ({ callbacks, state }) => {
		const handleClose = useModalClose();
		const [status, setStatus] = d(initialStatus(state));
		const [rating, setRating] = d(state.rating || 0);
		const [comment, setComment] = d(state.comment || "");
		const [loading, setLoading] = d(false);
		const [error, setError] = d("");
		const titlePrefix = state.marked ? "修改" : "标记";
		const save = async () => {
			if (loading) return;
			setLoading(true);
			setError("");
			const result = await callbacks.onSave({
				comment: comment.trim(),
				rating,
				status
			});
			if (result.ok) {
				handleClose();
				return;
			}
			setError(result.error || "操作失败");
			setLoading(false);
		};
		const remove = async () => {
			if (loading) return;
			setLoading(true);
			setError("");
			const result = await callbacks.onRemove(state.status);
			if (result.ok) {
				handleClose();
				return;
			}
			setError(result.error || "取消标记失败");
			setLoading(false);
		};
		return u$1(S, { children: [
			u$1("div", { class: "atv-interest-modal-accent" }),
			u$1("div", {
				class: "atv-interest-modal-header",
				children: [u$1("span", {
					class: "atv-interest-modal-header__title",
					id: "atv-interest-modal-title",
					children: `${titlePrefix}${INTEREST_LABELS[status]}`
				}), u$1(ModalCloseButton, {
					ariaLabel: "关闭标记弹窗",
					className: "atv-interest-modal-close",
					onClick: handleClose
				})]
			}),
			u$1("div", {
				class: "atv-interest-modal-body",
				children: [
					u$1("div", {
						class: "atv-interest-modal-statuses",
						children: statusEntries(state.hasWatching).map((entry) => u$1("button", {
							class: `atv-interest-modal-status${entry.value === status ? " is-active" : ""}`,
							"data-value": entry.value,
							disabled: loading,
							onClick: () => setStatus(entry.value),
							type: "button",
							children: entry.label
						}, entry.value))
					}),
					u$1(StarRatingInput, {
						disabled: loading,
						onChange: setRating,
						rating
					}),
					u$1("textarea", {
						class: "atv-interest-modal-comment",
						maxLength: 350,
						onInput: (event) => setComment(event.currentTarget.value),
						placeholder: "写一段短评…",
						rows: 3,
						value: comment
					}),
					u$1("button", {
						class: "atv-interest-modal-submit",
						disabled: loading,
						onClick: () => void save(),
						type: "button",
						children: loading ? "保存中..." : "保存"
					}),
					state.marked ? u$1("button", {
						class: "atv-interest-modal-remove",
						disabled: loading,
						onClick: () => void remove(),
						type: "button",
						children: "取消标记"
					}) : null,
					u$1("div", {
						class: "atv-interest-modal-error",
						children: error
					})
				]
			})
		] });
	};
	var InterestForm = ({ callbacks, onClose, state }) => u$1(ModalShell, {
		ariaLabelledBy: "atv-interest-modal-title",
		className: "atv-interest-modal",
		id: "atv-interest-modal",
		onClose,
		surfaceClassName: "atv-interest-modal-inner",
		children: u$1(InterestFormContent, {
			callbacks,
			state
		})
	});
	var openInterestModal = (state, callbacks) => {
		document.querySelector("#atv-interest-modal")?.remove();
		const host = document.createElement("div");
		document.body.append(host);
		const close = () => {
			R(null, host);
			host.remove();
		};
		R(u$1(InterestForm, {
			callbacks,
			onClose: close,
			state
		}), host);
	};
	var reloadPage = () => {
		location.reload();
	};
	var saveOptionsFromForm = (form) => ({
		comment: form.comment,
		rating: form.rating > 0 ? form.rating : void 0
	});
	var buildModalCallbacks = (subjectId, adapters) => ({
		onRemove: async (status) => {
			const result = await adapters.remove(subjectId, status);
			if (result.ok) adapters.reload();
			return result;
		},
		onSave: async (form) => {
			const result = await adapters.post(subjectId, form.status, saveOptionsFromForm(form));
			if (result.ok) adapters.reload();
			return result;
		}
	});
	var buildInterestMarkingCallbacks = (subjectId, adapters = {}) => {
		const interestBtns = findInterestButtons(adapters.doc ?? document);
		const accountGate = adapters.accountGate ?? createAccountGate({ loggedIn: adapters.loggedIn ?? true });
		const modalAdapters = {
			post: adapters.post ?? postInterest,
			reload: adapters.reload ?? reloadPage,
			remove: adapters.remove ?? removeInterest
		};
		const openModal = adapters.openModal ?? openInterestModal;
		return {
			handleCollectClick: () => {
				if (!accountGate.requireLogin("标记看过")) return;
				interestBtns.collect?.click();
			},
			handleOpenInterest: (state) => {
				if (!accountGate.requireLogin("标记这部作品")) return;
				openModal(state, buildModalCallbacks(subjectId, modalAdapters));
			},
			handleWatchingClick: () => {
				if (!accountGate.requireLogin("标记在看")) return;
				interestBtns.do?.click();
			},
			handleWishClick: () => {
				if (!accountGate.requireLogin("标记想看")) return;
				interestBtns.wish?.click();
			}
		};
	};
	var buildHeroCallbacks = (subjectId, doc = document, loggedIn = true) => buildInterestMarkingCallbacks(subjectId, {
		doc,
		loggedIn
	});
	var extractSeriesMoreLink = (doc = document) => {
		const linkEl = doc.querySelector("#series-items .items-swiper-title .pl a");
		if (!linkEl) return;
		return {
			href: linkEl.href,
			text: (linkEl.textContent || "").replaceAll(/[()（）]/gu, "").trim()
		};
	};
	var insertSeriesSection = (root, stickyNav, doc) => {
		const items = extractSeries(doc);
		if (items.length === 0) return;
		const host = doc.createElement("div");
		R(u$1(SeriesSection, {
			items,
			moreLink: extractSeriesMoreLink(doc)
		}), host);
		const series = host.firstElementChild;
		if (!(series instanceof HTMLElement)) return;
		const ref = root.querySelector("#atv-stream");
		if (ref) ref.after(series);
		else if (root.firstElementChild) root.firstElementChild.after(series);
		const wrap = stickyNav.querySelector(".atv-stickynav-jumps");
		if (!wrap || wrap.querySelector("a[href=\"#atv-series\"]")) return;
		const link = el("a", {
			href: "#atv-series",
			text: "同系列"
		});
		link.addEventListener("click", (event) => {
			event.preventDefault();
			doc.querySelector("#atv-series")?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		});
		const streamLink = wrap.querySelector("a[href=\"#atv-stream\"]");
		if (streamLink) streamLink.after(link);
		else wrap.prepend(link);
	};
	var watchSeries = (root, stickyNav, doc = document) => {
		const container = doc.querySelector("#series-items");
		if (!container) return;
		if (container.querySelector(".items-swiper")) return;
		if (root.querySelector("#atv-series")) return;
		const observer = new MutationObserver(() => {
			if (!container.querySelector(".items-swiper")) return;
			observer.disconnect();
			insertSeriesSection(root, stickyNav, doc);
		});
		observer.observe(container, {
			childList: true,
			subtree: true
		});
	};
	var startStickyReveal = (stickyNav, win = window) => {
		const reveal = () => {
			const y = win.scrollY || win.pageYOffset || 0;
			stickyNav.classList.toggle("is-visible", y > 300);
		};
		win.addEventListener("scroll", reveal, { passive: true });
		reveal();
	};
	var trackActiveSection = (nav, doc = document, win = window) => {
		const links = nav.querySelectorAll(".atv-stickynav-jumps a");
		if (links.length === 0) return;
		const sectionIds = [];
		for (const link of links) {
			const id = link.getAttribute("href")?.slice(1);
			if (id) sectionIds.push(id);
		}
		const observer = new IntersectionObserver(() => {
			let activeId = "";
			let bestScore = -Infinity;
			for (const id of sectionIds) {
				const sectionEl = doc.querySelector(`#${id}`);
				if (!sectionEl) continue;
				const rect = sectionEl.getBoundingClientRect();
				const visibleTop = Math.max(rect.top, 56);
				const visibleBottom = Math.min(rect.bottom, win.innerHeight * .55);
				const visible = Math.max(0, visibleBottom - visibleTop);
				if (visible > bestScore) {
					bestScore = visible;
					activeId = id;
				}
			}
			for (const link of links) link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
		}, { threshold: [
			0,
			.25,
			.5
		] });
		for (const id of sectionIds) {
			const sectionEl = doc.querySelector(`#${id}`);
			if (sectionEl) observer.observe(sectionEl);
		}
	};
	var setSubjectTitle = (doc, data) => {
		doc.title = `${(data.title.primary || data.title.full) + (data.year ? ` (${data.year})` : "")} · 豆瓣`;
	};
	var mountSubjectPage = (doc = document) => {
		if (doc.querySelector("#atv-douban-root")) return;
		if (!doc.querySelector("#content h1")) {
			console.warn("[ATV-Douban] 未找到内容区域，跳过渲染");
			return;
		}
		const data = (() => {
			try {
				return extractDoubanData(doc);
			} catch (error) {
				console.warn("[ATV-Douban] 数据提取失败：", error);
				return null;
			}
		})();
		if (!data) return;
		setSubjectTitle(doc, data);
		const accountGate = createAccountGate({ loggedIn: data.interest.loggedIn });
		const root = doc.createElement("div");
		root.id = "atv-douban-root";
		const stickyNav = doc.createElement("nav");
		stickyNav.className = "atv-stickynav";
		R(u$1(SubjectPage, {
			data,
			deps: {
				canReviewVote: () => accountGate.requireLogin("给影评投票"),
				canVote: () => accountGate.requireLogin("给短评点有用"),
				handleReviewVote: (rid, type) => postReviewVote(rid, type, data.subjectId),
				handleVote: (cid) => postVote(cid, data.subjectId),
				heroCallbacks: buildHeroCallbacks(data.subjectId, doc, data.interest.loggedIn),
				seriesMoreLink: extractSeriesMoreLink(doc)
			}
		}), root);
		R(u$1(StickyNav, {
			sections: computeNavSections(data),
			title: data.title
		}), stickyNav);
		startAvatarEffect(data.comments);
		doc.body.insertBefore(root, doc.body.firstChild);
		doc.body.append(stickyNav);
		startStickyReveal(stickyNav);
		trackActiveSection(stickyNav, doc);
		watchSeries(root, stickyNav, doc);
	};
	var mountSubjectPageWhenReady = async () => {
		await _css(styles_default);
		if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountSubjectPage(), { once: true });
		else mountSubjectPage();
	};
	if (isDoubanLoginFrame()) installLoginFrameTheme();
	else mountSubjectPageWhenReady();
})();
