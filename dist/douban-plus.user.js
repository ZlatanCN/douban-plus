// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.1.1
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
	var styles_default = "/* ATV stylesheet manifest.\n   Keep this file as the single CSS entry imported from main.ts.\n   Files are ordered to preserve the original cascade from the former giant stylesheet.\n   Do not wrap these imports in @layer: this userscript runs inside Douban pages,\n   and unlayered host author CSS would outrank layered ATV normal declarations. */\n\n:root {\n  --atv-bg-primary: #000000;\n  --atv-bg-secondary: #1c1c1e;\n  --atv-bg-tertiary: #2c2c2e;\n  --atv-bg-elevated: rgba(255, 255, 255, 0.06);\n  --atv-text-primary: #ffffff;\n  --atv-text-secondary: rgba(255, 255, 255, 0.72);\n  --atv-text-tertiary: rgba(255, 255, 255, 0.45);\n  --atv-accent: #41be5d;\n  --atv-accent-bright: #4cd97a;\n  --atv-accent-glow: rgba(65, 190, 93, 0.35);\n  --atv-rating-gold: #ffb800;\n  --atv-border-subtle: rgba(255, 255, 255, 0.08);\n  --atv-border-medium: rgba(255, 255, 255, 0.16);\n  --atv-radius-sm: 8px;\n  --atv-radius-md: 12px;\n  --atv-radius-lg: 16px;\n  --atv-radius-xl: 24px;\n}\n\nbody > #wrapper {\n  display: none !important;\n}\n\nbody {\n  padding: 0 !important;\n  margin: 0 !important;\n  background: #000 !important;\n}\n\n#db-global-nav,\n#db-nav-movie {\n  display: none !important;\n}\n\n[id^=\"dale_\"],\n[class*=\"dale_\"] {\n  display: none !important;\n}\n\n#atv-douban-root {\n  position: relative;\n  min-height: 100vh;\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  font-feature-settings: \"ss01\", \"cv11\";\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-primary);\n  opacity: 0;\n  animation: atv-fadein 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards;\n}\n\n@keyframes atv-fadein {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n\n@keyframes atv-rise {\n  from {\n    opacity: 0;\n    transform: translateY(14px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n#atv-douban-root *,\n#atv-douban-root *::before,\n#atv-douban-root *::after {\n  box-sizing: border-box;\n}\n\n#atv-douban-root a {\n  color: inherit;\n  text-decoration: none;\n}\n\n#atv-douban-root a:hover {\n  background: transparent;\n}\n\n#atv-douban-root img {\n  display: block;\n  max-width: 100%;\n}\n\n/* ---------- Sticky nav ---------- */\n\n.atv-stickynav {\n  position: fixed;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: 9999;\n  box-sizing: border-box;\n  display: flex;\n  gap: 24px;\n  align-items: center;\n  justify-content: space-between;\n  height: 56px;\n  padding: 0 max(28px, 5vw);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  pointer-events: none;\n  background: rgba(10, 10, 12, 0.74);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  opacity: 0;\n  -webkit-backdrop-filter: saturate(180%) blur(24px);\n  backdrop-filter: saturate(180%) blur(24px);\n  transform: translateY(-100%);\n  transition:\n    opacity 280ms ease,\n    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-stickynav.is-visible {\n  pointer-events: auto;\n  opacity: 1;\n  transform: none;\n}\n\n.atv-stickynav-title {\n  flex: 0 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: #fff;\n  white-space: nowrap;\n}\n\n.atv-stickynav-jumps {\n  display: flex;\n  flex: 0 0 auto;\n  gap: 24px;\n}\n\n.atv-stickynav-jumps a {\n  position: relative;\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.7);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  cursor: pointer;\n  transition: color 200ms ease;\n}\n\n.atv-stickynav-jumps a::after {\n  content: \"\";\n  position: absolute;\n  bottom: -4px;\n  left: 50%;\n  width: 0;\n  height: 2px;\n  background: var(--atv-accent);\n  border-radius: 1px;\n  transition:\n    width 250ms ease,\n    left 250ms ease;\n}\n\n.atv-stickynav-jumps a:hover {\n  color: var(--atv-accent-bright);\n  background: transparent;\n}\n\n.atv-stickynav-jumps a.is-active {\n  color: var(--atv-accent-bright);\n}\n\n.atv-stickynav-jumps a.is-active::after {\n  left: 0;\n  width: 100%;\n}\n\n@media (max-width: 768px) {\n  .atv-stickynav-title {\n    font-size: 14px;\n  }\n  .atv-stickynav-jumps {\n    gap: 14px;\n  }\n  .atv-stickynav-jumps a {\n    font-size: 12px;\n  }\n}\n\n/* ---------- Hero ---------- */\n\n.atv-hero {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  min-height: 75vh;\n  padding: 132px max(28px, 5vw) 56px;\n  overflow: visible;\n  isolation: isolate;\n}\n\n.atv-hero-inner-section {\n  flex: 0 0 auto;\n}\n\n.atv-hero-bg {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -4;\n  height: 75vh;\n  overflow: hidden;\n  background: #000;\n}\n\n.atv-hero-still {\n  position: absolute;\n  inset: 0;\n  background-repeat: no-repeat;\n  background-position: center 30%;\n  background-size: cover;\n  transform: scale(1.04);\n  backface-visibility: hidden;\n  will-change: transform, opacity;\n}\n\n.atv-hero-still.is-thumb {\n  filter: blur(12px) saturate(1.12) brightness(0.84);\n  transform: scale(1.14);\n}\n\n.atv-hero-still.is-hd {\n  opacity: 0;\n  filter: saturate(1.08) brightness(0.88);\n  transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.atv-hero-still.is-hd.is-loaded {\n  opacity: 1;\n  animation: atv-kenburns 22s ease-out forwards;\n}\n\n.atv-hero-still.is-poster {\n  background-position: center 22%;\n  filter: blur(60px) saturate(1.25) brightness(0.78);\n  transform: scale(1.25);\n}\n\n@keyframes atv-kenburns {\n  from {\n    transform: scale(1) translate(0, 0);\n  }\n  to {\n    transform: scale(1.1) translate(-1.8%, -1.2%);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-hero-still.is-hd.is-loaded {\n    transform: scale(1.04);\n    animation: none;\n  }\n}\n\n.atv-hero-vignette {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -3;\n  height: 75vh;\n  background: radial-gradient(\n    120% 90% at 70% 30%,\n    transparent 0%,\n    rgba(0, 0, 0, 0.55) 100%\n  );\n}\n\n.atv-hero-overlay-x {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -2;\n  height: 75vh;\n  background: linear-gradient(\n    to right,\n    rgba(0, 0, 0, 0.96) 0%,\n    rgba(0, 0, 0, 0.82) 32%,\n    rgba(0, 0, 0, 0.5) 62%,\n    rgba(0, 0, 0, 0.35) 100%\n  );\n}\n\n.atv-hero-overlay-y {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -1;\n  height: 75vh;\n  background: linear-gradient(\n    to bottom,\n    rgba(0, 0, 0, 0.45) 0%,\n    transparent 28%,\n    transparent 55%,\n    #000 100%\n  );\n}\n\n.atv-hero-inner {\n  display: flex;\n  gap: 56px;\n  align-items: flex-start;\n  width: 100%;\n  max-width: 1100px;\n  margin: 0 auto;\n}\n\n.atv-poster-card {\n  display: flex;\n  flex: 0 0 auto;\n  width: 360px;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  border: none;\n  padding: 0;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-lg);\n  box-shadow:\n    0 24px 60px rgba(0, 0, 0, 0.6),\n    0 0 0 1px var(--atv-border-subtle) inset;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-poster-card:hover {\n  transform: scale(1.03);\n}\n\n.atv-poster-card img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-poster-placeholder {\n  width: 100%;\n  height: 100%;\n}\n\n.atv-hero-info {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n.atv-hero-title {\n  margin: 0 0 8px;\n  font-size: clamp(44px, 5.5vw, 72px);\n  font-weight: 700;\n  line-height: 1.05;\n  color: #fff;\n  letter-spacing: -0.02em;\n  text-shadow:\n    0 2px 20px rgba(0, 0, 0, 0.7),\n    0 0 60px rgba(0, 0, 0, 0.3);\n}\n\n.atv-hero-orig {\n  margin-bottom: 22px;\n  font-size: clamp(18px, 1.6vw, 22px);\n  font-weight: 400;\n  color: var(--atv-text-secondary);\n  letter-spacing: -0.01em;\n  opacity: 0.85;\n}\n\n.atv-hero-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: center;\n  margin-bottom: 24px;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}\n\n.atv-meta-dot {\n  display: inline-flex;\n  align-items: center;\n}\n\n.atv-meta-dot + .atv-meta-dot::before {\n  margin-right: 14px;\n  color: var(--atv-text-tertiary);\n  content: \"·\";\n}\n\n.atv-meta-chips {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.atv-chip {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 11px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: none;\n  letter-spacing: 0.02em;\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: 999px;\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n\n/* ── Ratings Panel ──────────────────────────────── */\n\n/* Unified card presenting Douban + IMDb + RT side by side */\n\n.atv-rating-panel {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0;\n  align-items: stretch;\n  width: fit-content;\n  min-width: 320px;\n  margin-bottom: 28px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: var(--atv-radius-md);\n}\n\n.atv-rating-panel-douban,\n.atv-rating-panel-imdb,\n.atv-rating-panel-rt,\n.atv-rating-panel-mc {\n  flex: 1;\n  display: grid;\n  grid-template-rows: 28px 44px 20px 1fr;\n  justify-items: center;\n  align-items: center;\n  padding: 16px 24px 14px;\n  text-align: center;\n  transition: background 200ms ease;\n}\n\n.atv-rating-panel-douban:hover,\n.atv-rating-panel-imdb:hover,\n.atv-rating-panel-rt:hover,\n.atv-rating-panel-mc:hover {\n  background: rgba(255, 255, 255, 0.03);\n}\n\n.atv-rating-panel-douban {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-imdb {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-mc {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-logo {\n  display: inline-flex;\n  align-items: center;\n  align-self: center;\n  opacity: 0.85;\n  transition: opacity 200ms ease;\n}\n\n.atv-rating-panel-logo:hover {\n  opacity: 1;\n}\n\n.atv-rating-panel-logo svg {\n  display: block;\n}\n\n.atv-rating-panel .atv-rating-panel-score {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 38px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n  color: var(--atv-text-primary);\n}\n\n/* ── MC Score color by range ────────────────────── */\n\n.atv-rating-panel-score.is-high {\n  color: #3bb33b;\n}\n\n.atv-rating-panel-score.is-medium {\n  color: #ffb800;\n}\n\n.atv-rating-panel-score.is-low {\n  color: #fa320a;\n}\n\n/* ── MC label row (score bar + Chinese word label) ── */\n\n.atv-mc-label-row {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.atv-mc-bar-track {\n  display: inline-block;\n  width: 40px;\n  height: 4px;\n  border-radius: 2px;\n  background: rgba(255, 255, 255, 0.1);\n  overflow: hidden;\n  flex-shrink: 0;\n}\n\n.atv-mc-bar-fill {\n  display: block;\n  height: 100%;\n  border-radius: 2px;\n}\n\n.atv-mc-bar-fill.is-high {\n  background: #3bb33b;\n}\n\n.atv-mc-bar-fill.is-medium {\n  background: #ffb800;\n}\n\n.atv-mc-bar-fill.is-low {\n  background: #fa320a;\n}\n\n.atv-mc-word-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  line-height: 1;\n}\n\n.atv-rating-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n\n.atv-rating-stars svg {\n  display: block;\n}\n\n/* ── RT Score Row (values side by side) ─────────── */\n\n.atv-rt-score-row,\n.atv-rt-label-row,\n.atv-rt-count-row {\n  display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  gap: 8px;\n  align-items: center;\n  width: 100%;\n}\n\n.atv-rt-score-value {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 30px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n}\n\n.atv-rt-score-value.is-fresh {\n  color: var(--atv-text-primary);\n}\n\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:first-child {\n  color: rgba(255, 107, 91, 0.85);\n}\n\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:last-child {\n  color: rgba(255, 167, 38, 0.85);\n}\n\n.atv-rt-score-row > .atv-rt-score-value:first-child {\n  justify-self: center;\n  text-align: right;\n}\n\n.atv-rt-score-row > .atv-rt-score-value:last-child {\n  justify-self: center;\n  text-align: left;\n}\n\n/* ── RT Label Row (icons + text) ────────────────── */\n\n.atv-rt-label-row {\n  gap: 8px;\n}\n\n.atv-rt-label-item {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:first-child {\n  justify-self: center;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:last-child {\n  justify-self: center;\n}\n\n.atv-rt-label-row {\n  grid-template-columns: 1fr 1fr;\n}\n\n.atv-rt-score-icon {\n  display: inline-flex;\n  width: 16px;\n  height: 16px;\n  color: var(--atv-text-tertiary);\n  opacity: 0.7;\n}\n\n.atv-rt-score-icon svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-rt-label-item.is-critics.is-fresh .atv-rt-score-icon {\n  color: #ff6b5b;\n  opacity: 1;\n}\n\n.atv-rt-label-item.is-critics.is-rotten .atv-rt-score-icon {\n  color: #50b85e;\n  opacity: 0.6;\n}\n\n.atv-rt-label-item.is-audience.is-fresh .atv-rt-score-icon {\n  color: #ffb800;\n  opacity: 1;\n}\n\n.atv-rt-label-item.is-audience.is-rotten .atv-rt-score-icon {\n  color: #888;\n  opacity: 0.6;\n}\n\n.atv-rt-score-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── Shared count text (Douban / IMDb) ──────────── */\n\n.atv-rating-panel-count {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── RT Count Row (e.g. 评价 300 | 50,000) ──────── */\n\n.atv-rt-count-row {\n  gap: 8px;\n}\n\n.atv-rt-count-value {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n.atv-rt-count-row > .atv-rt-count-value:first-child {\n  justify-self: center;\n}\n\n.atv-rt-count-row > .atv-rt-count-value:last-child {\n  justify-self: center;\n}\n\n.atv-rt-count-row {\n  grid-template-columns: 1fr 1fr;\n}\n\n/* ── RT Divider ─────────────────────────────────── */\n\n.atv-rt-divider {\n  width: 1px;\n  align-self: stretch;\n  margin: 2px 0;\n  background: rgba(255, 255, 255, 0.12);\n  flex-shrink: 0;\n}\n\n@media (max-width: 768px) {\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n    grid-template-rows: 24px 38px 18px 1fr;\n  }\n  .atv-rt-score-value {\n    font-size: 26px;\n  }\n  .atv-rt-score-icon {\n    width: 14px;\n    height: 14px;\n  }\n  .atv-rt-score-label {\n    font-size: 10px;\n  }\n  .atv-mc-bar-track {\n    width: 32px;\n  }\n  .atv-mc-word-label {\n    font-size: 10px;\n  }\n  .atv-rating-panel {\n    min-width: 0;\n  }\n}\n\n.atv-rating-empty {\n  font-size: 13px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.03em;\n  padding: 10px 0;\n}\n\n/* ── Skeleton (loading) ─────────────────────────── */\n\n.atv-rating-panel-imdb.is-loading,\n.atv-rating-panel-rt.is-loading,\n.atv-rating-panel-mc.is-loading {\n  transition: opacity 400ms ease;\n}\n\n.atv-rating-panel-imdb.is-empty,\n.atv-rating-panel-rt.is-empty,\n.atv-rating-panel-mc.is-empty {\n  display: none;\n}\n\n.atv-rating-panel-skeleton {\n  width: 120px;\n  height: 22px;\n  border-radius: 4px;\n  background: linear-gradient(\n    90deg,\n    rgba(255, 255, 255, 0.04) 25%,\n    rgba(255, 255, 255, 0.1) 50%,\n    rgba(255, 255, 255, 0.04) 75%\n  );\n  background-size: 200% 100%;\n  animation: atv-ratings-shimmer 1.6s ease-in-out infinite;\n}\n\n@keyframes atv-ratings-shimmer {\n  0% {\n    background-position: 200% 0;\n  }\n  100% {\n    background-position: -200% 0;\n  }\n}\n\n.atv-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-bottom: 26px;\n}\n\n.atv-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  height: 44px;\n  padding: 0 22px;\n  border: none;\n  background: none;\n  font-family: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  color: inherit;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    transform 200ms ease,\n    background 200ms ease,\n    box-shadow 200ms ease,\n    color 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-btn-primary {\n  color: #fff;\n  background: var(--atv-accent);\n  box-shadow: 0 8px 24px var(--atv-accent-glow);\n}\n\n.atv-btn-primary:hover {\n  background: var(--atv-accent-bright);\n  transform: translateY(-1px);\n}\n\n.atv-btn-secondary {\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n\n.atv-btn-secondary:hover {\n  background: rgba(255, 255, 255, 0.12);\n  transform: translateY(-1px);\n}\n\n.atv-btn.is-active {\n  color: #fff;\n  background: var(--atv-accent);\n  border-color: transparent;\n  box-shadow: 0 6px 20px var(--atv-accent-glow);\n}\n\n.atv-hero-summary {\n  margin-top: 16px;\n}\n\n.atv-hero-teaser {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  max-width: 660px;\n  margin: 0 0 12px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: var(--atv-text-secondary);\n  word-break: break-word;\n  white-space: pre-wrap;\n  overflow: hidden;\n}\n\n.atv-hero-teaser.is-clamped {\n  -webkit-line-clamp: 3;\n}\n\n.atv-hero-more {\n  display: inline-flex;\n  gap: 6px;\n  align-items: center;\n  padding: 0;\n  border: none;\n  background: none;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-accent-bright);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-hero-more:hover {\n  color: var(--atv-accent);\n}\n\n.atv-hero-more svg {\n  transition: transform 220ms ease;\n}\n\n.atv-hero-more.is-open svg {\n  transform: rotate(180deg);\n}\n\n/* ---------- Section ---------- */\n\n.atv-section {\n  max-width: 1280px;\n  padding: 52px max(28px, 5vw);\n  margin: 0 auto;\n  scroll-margin-top: 64px;\n  animation: atv-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;\n}\n\n.atv-section + .atv-section {\n  padding-top: 0;\n}\n\n.atv-section-h {\n  position: relative;\n  display: flex;\n  align-items: center;\n  padding-left: 16px;\n  margin: 0 0 24px;\n  font-size: 24px;\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}\n\n.atv-section-h::before {\n  position: absolute;\n  top: 50%;\n  left: 0;\n  width: 4px;\n  height: 24px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 2px;\n  transform: translateY(-50%);\n}\n\n.atv-section-h-row {\n  display: flex;\n  gap: 16px;\n  align-items: baseline;\n  justify-content: space-between;\n  margin-bottom: 24px;\n}\n\n.atv-section-h-row .atv-section-h {\n  margin-bottom: 0;\n}\n\n.atv-section-more {\n  flex: 0 0 auto;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  transition: color 200ms ease;\n}\n\n.atv-section-more:hover {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Carousel ---------- */\n\n.atv-carousel {\n  display: flex;\n  gap: 16px;\n  overflow-x: auto;\n  scroll-snap-type: x mandatory;\n  scroll-behavior: smooth;\n  padding: 4px 4px 16px;\n  margin: 0 -4px;\n}\n\n.atv-carousel::-webkit-scrollbar {\n  display: none;\n}\n\n.atv-carousel {\n  scrollbar-width: none;\n}\n\n/* ---------- Page scrollbar ---------- */\n\n:root {\n  color-scheme: dark;\n}\n\n::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n}\n\n::-webkit-scrollbar-track {\n  background: #1c1c1e;\n}\n\n::-webkit-scrollbar-thumb {\n  background: #3a3a3c;\n  border-radius: 3px;\n}\n\n::-webkit-scrollbar-thumb:hover {\n  background: #48484a;\n}\n\n::-webkit-scrollbar-corner {\n  background: transparent;\n}\n\n* {\n  scrollbar-color: #3a3a3c #1c1c1e;\n  scrollbar-width: thin;\n}\n\n/* ---------- Series ---------- */\n\n.atv-series-carousel {\n  mask-image: linear-gradient(to right, #000 97%, transparent 100%);\n  -webkit-mask-image: linear-gradient(to right, #000 97%, transparent 100%);\n}\n\n.atv-series-card {\n  flex: 0 0 158px;\n  min-width: 0;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-series-card:hover {\n  transform: translateY(-4px);\n}\n\n/* ── Active season (user is currently on this season's page) ── */\n\n.atv-series-card.is-active .atv-series-poster {\n  box-shadow:\n    inset 0 0 0 2px var(--atv-accent),\n    0 0 20px var(--atv-accent-glow);\n}\n\n.atv-series-card.is-active .atv-series-info::after {\n  width: 20px;\n  opacity: 1;\n}\n\n/* ── Poster ── */\n\n.atv-series-poster {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 400ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 400ms ease;\n}\n\n.atv-series-card:hover .atv-series-poster {\n  box-shadow:\n    0 16px 48px rgba(0, 0, 0, 0.6),\n    0 0 0 1px rgba(255, 255, 255, 0.06);\n  transform: scale(1.06);\n}\n\n/* Poster bottom gradient overlay (Apple TV+ style depth) */\n\n.atv-series-poster::after {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 45%;\n  content: \"\";\n  background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 100%);\n  pointer-events: none;\n}\n\n.atv-series-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n}\n\n/* ── Rating badge (overlay on poster top-right) ── */\n\n.atv-series-badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  z-index: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 28px;\n  height: 22px;\n  padding: 0 7px;\n  font-size: 11px;\n  font-weight: 700;\n  line-height: 1;\n  color: #fff;\n  letter-spacing: 0.02em;\n  background: rgba(0, 0, 0, 0.65);\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  border-radius: 20px;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    background 300ms ease;\n}\n\n.atv-series-card:hover .atv-series-badge {\n  background: rgba(0, 0, 0, 0.8);\n  transform: translateY(-1px) scale(1.05);\n}\n\n/* ── Info row ── */\n\n.atv-series-info {\n  position: relative;\n  margin-top: 10px;\n}\n\n.atv-series-info::after {\n  display: block;\n  width: 0;\n  height: 2px;\n  margin-top: 4px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 1px;\n  opacity: 0;\n  transition:\n    width 400ms cubic-bezier(0.22, 1, 0.36, 1),\n    opacity 400ms ease;\n}\n\n.atv-series-card:hover .atv-series-info::after {\n  width: 100%;\n  opacity: 1;\n}\n\n.atv-series-title {\n  display: block;\n  overflow: hidden;\n  font-size: 14px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  letter-spacing: 0.01em;\n  transition: color 300ms ease;\n}\n\n.atv-series-card:hover .atv-series-title {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Cast ---------- */\n\n.atv-cast-carousel {\n  mask-image: linear-gradient(to right, #000 90%, transparent 100%);\n  -webkit-mask-image: linear-gradient(to right, #000 90%, transparent 100%);\n}\n\n.atv-cast-card {\n  flex: 0 0 160px;\n  min-width: 0;\n  text-align: center;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-cast-card:hover {\n  transform: translateY(-3px);\n}\n\n.atv-cast-avatar {\n  width: 160px;\n  height: 160px;\n  background-color: var(--atv-bg-tertiary);\n  background-position: center top;\n  background-size: cover;\n  border: 2px solid transparent;\n  border-radius: 50%;\n  transition:\n    transform 300ms ease,\n    border-color 300ms ease,\n    box-shadow 300ms ease,\n    filter 300ms ease;\n}\n\n.atv-cast-card:hover .atv-cast-avatar {\n  border-color: rgba(255, 255, 255, 0.2);\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);\n  filter: brightness(1.12);\n  transform: scale(1.05);\n}\n\n.atv-cast-name {\n  margin-top: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\n.atv-cast-role {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  margin-top: 4px;\n  overflow: hidden;\n  -webkit-line-clamp: 2;\n  font-size: 13px;\n  font-weight: 400;\n  line-height: 1.35;\n  color: rgba(255, 255, 255, 0.55);\n}\n\n/* ---------- Photos ---------- */\n\n.atv-photos {\n  gap: 12px;\n}\n\n.atv-photo-tile {\n  display: flex;\n  flex: 0 0 400px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  border: none;\n  padding: 0;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-photo-tile.is-portrait {\n  flex: 0 0 240px;\n  aspect-ratio: 3 / 4;\n}\n\n.atv-photo-tile img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-photo-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n\n/* ---------- Recommendations ---------- */\n\n.atv-recs {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));\n  gap: 24px;\n}\n\n.atv-rec-card {\n  cursor: pointer;\n}\n\n.atv-rec-poster {\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n\n.atv-rec-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-rec-card:hover .atv-rec-poster {\n  box-shadow: 0 12px 40px var(--atv-accent-glow);\n  transform: scale(1.05);\n}\n\n.atv-rec-title {\n  margin-top: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  font-size: 15px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n}\n\n/* ---------- Info grid ---------- */\n\n.atv-info-grid {\n  display: grid;\n  grid-template-columns: 200px 1fr;\n  row-gap: 16px;\n  column-gap: 32px;\n}\n\n.atv-info-label {\n  padding-top: 2px;\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.55);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n\n.atv-info-value {\n  font-size: 15px;\n  font-weight: 400;\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  word-break: break-word;\n}\n\n.atv-info-value a {\n  color: var(--atv-text-primary);\n  border-bottom: 1px solid var(--atv-border-medium);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease;\n}\n\n.atv-info-value a:hover {\n  color: var(--atv-accent-bright);\n  border-color: var(--atv-accent-bright);\n}\n\n/* ---------- Streaming ---------- */\n\n.atv-stream-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n\n.atv-stream-card {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  gap: 11px;\n  height: 52px;\n  max-width: 240px;\n  padding: 0 20px 0 14px;\n  border-radius: var(--atv-radius-md);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  color: var(--atv-text-primary);\n  font-size: 20px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  font-family: inherit;\n  -webkit-tap-highlight-color: transparent;\n  cursor: pointer;\n  transition:\n    background 220ms ease,\n    border-color 220ms ease,\n    box-shadow 220ms ease,\n    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n/* Center-glow overlay — subtle brand bloom from card center */\n\n.atv-stream-card::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  border-radius: inherit;\n  pointer-events: none;\n  opacity: 0;\n  transition: opacity 220ms ease;\n  background: radial-gradient(\n    circle at center,\n    var(--atv-stream-brand, var(--atv-accent-bright)) 0%,\n    transparent 70%\n  );\n}\n\n.atv-stream-card:not(.atv-stream-card--combined):hover::after {\n  opacity: 0.18;\n}\n\n.atv-stream-card:hover {\n  background: rgba(255, 255, 255, 0.09);\n  border-color: rgba(255, 255, 255, 0.18);\n  box-shadow:\n    inset 0 1px 0 rgba(255, 255, 255, 0.08),\n    0 12px 26px rgba(0, 0, 0, 0.24);\n  transform: translateY(-2px);\n}\n\n/* ── Combined SVG cards ── */\n\n.atv-stream-card--combined {\n  height: 52px;\n  padding: 0 16px;\n  gap: 0;\n}\n\n.atv-stream-card--combined svg {\n  display: block;\n  height: 32px;\n  width: auto;\n  max-width: 160px;\n  transition: filter 220ms ease;\n}\n\n.atv-stream-card--combined:hover svg {\n  filter: drop-shadow(\n    0 0 14px var(--atv-stream-brand, var(--atv-accent-bright))\n  );\n}\n\n.atv-stream-logo svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n  fill: currentColor;\n}\n\n.atv-stream-vendor-icon {\n  display: block;\n  width: 32px;\n  height: 32px;\n  object-fit: contain;\n  flex: 0 0 auto;\n}\n\n.atv-stream-logo {\n  display: inline-flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 9px;\n  background:\n    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0)),\n    rgba(255, 255, 255, 0.05);\n  box-shadow:\n    inset 0 1px 0 rgba(255, 255, 255, 0.12),\n    0 8px 18px rgba(0, 0, 0, 0.18);\n  color: var(--atv-stream-brand, var(--atv-accent-bright));\n  overflow: hidden;\n}\n\n.atv-stream-logo-fallback {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  font-size: 15px;\n  font-weight: 800;\n  line-height: 1;\n  color: currentColor;\n  text-transform: uppercase;\n}\n\n.atv-stream-name {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  transition: color 220ms ease;\n}\n\n.atv-stream-card:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: 3px;\n}\n\n/* ---------- Comments ---------- */\n\n.atv-comments {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 18px;\n}\n\n.atv-comment-card {\n  display: flex;\n  flex-direction: column;\n  padding: 18px 20px;\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 350ms cubic-bezier(0.22, 1, 0.36, 1),\n    border-color 350ms ease,\n    box-shadow 350ms ease;\n}\n\n.atv-comment-card:hover {\n  border-color: rgba(255, 255, 255, 0.12);\n  transform: translateY(-3px);\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.3),\n    0 0 0 1px rgba(65, 190, 93, 0.04);\n}\n\n.atv-comment-top {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  margin-bottom: 14px;\n}\n\n.atv-comment-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  overflow: hidden;\n  font-size: 15px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n  border: 1.5px solid rgba(255, 255, 255, 0.06);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease,\n    filter 260ms ease;\n}\n\n.atv-comment-card:hover .atv-comment-avatar {\n  border-color: rgba(255, 255, 255, 0.3);\n  filter: brightness(1.15);\n}\n\n.atv-comment-avatar.atv-avatar-loaded {\n  animation: atv-avatar-reveal 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;\n}\n\n@keyframes atv-avatar-reveal {\n  from {\n    filter: blur(6px) brightness(1.25);\n  }\n  to {\n    filter: blur(0) brightness(1);\n  }\n}\n\n.atv-comment-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n.atv-comment-author,\na.atv-comment-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\na.atv-comment-author:hover {\n  color: var(--atv-text-primary);\n  background: none;\n}\n\n.atv-comment-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n  color: var(--atv-rating-gold);\n}\n\n.atv-comment-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-comment-body {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  margin: 0 0 14px;\n  border: none;\n  padding: 0;\n  width: 100%;\n  background: none;\n  font: inherit;\n  font-size: 15px;\n  line-height: 1.5;\n  color: rgba(255, 255, 255, 0.85);\n  text-align: left;\n  cursor: pointer;\n  appearance: none;\n  -webkit-appearance: none;\n  word-break: break-word;\n}\n\n.atv-comment-body-text {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  -webkit-line-clamp: 4;\n  word-break: break-word;\n}\n\n.atv-comment-foot {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-comment-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  padding: 4px 10px;\n  font-family: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: none;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 100px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n\n.atv-comment-votes:hover {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.2);\n  background: rgba(65, 190, 93, 0.04);\n  transform: scale(1.05);\n}\n\n.atv-comment-votes:focus-visible {\n  outline: 2px solid rgba(65, 190, 93, 0.75);\n  outline-offset: 3px;\n}\n\n.atv-comment-votes:active {\n  transform: scale(0.95);\n}\n\n.atv-comment-votes.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.25);\n  background: rgba(65, 190, 93, 0.06);\n}\n\n.atv-comment-votes svg {\n  display: block;\n  width: 13px;\n  height: 13px;\n}\n\n.atv-vote-count {\n  font-variant-numeric: tabular-nums;\n}\n\n/* ---------- Comment Expand Overlay ---------- */\n\n.atv-comment-foot-right {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n}\n\n.atv-comment-expand {\n  display: none;\n  align-items: center;\n  justify-content: center;\n  width: 22px;\n  height: 22px;\n  padding: 0;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  background: rgba(0, 0, 0, 0.3);\n  font: inherit;\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  border-radius: 50%;\n  backdrop-filter: blur(4px);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-comment-card.has-overflow .atv-comment-expand {\n  display: inline-flex;\n}\n\n.atv-comment-expand:hover {\n  color: var(--atv-accent);\n  border-color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.1);\n}\n\n.atv-comment-expand:active {\n  transform: scale(0.9);\n}\n\n.atv-comment-expand svg {\n  display: block;\n  width: 12px;\n  height: 12px;\n}\n\n/* ── Overlay ── */\n\n.atv-comment-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 24px;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  opacity: 0;\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-comment-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-comment-overlay-inner {\n  position: relative;\n  width: 100%;\n  max-width: 580px;\n  max-height: 80vh;\n  overflow-y: auto;\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 20px;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-comment-overlay.is-open .atv-comment-overlay-inner {\n  transform: scale(1) translateY(0);\n}\n\n.atv-modal-close.atv-comment-overlay-close {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n  z-index: 2;\n  width: 32px;\n  height: 32px;\n  background: rgba(255, 255, 255, 0.06);\n  border-color: rgba(255, 255, 255, 0.1);\n  color: rgba(255, 255, 255, 0.6);\n}\n\n.atv-modal-close.atv-comment-overlay-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-modal-close.atv-comment-overlay-close svg {\n  width: 16px;\n  height: 16px;\n}\n\n.atv-comment-overlay-top {\n  display: flex;\n  gap: 14px;\n  align-items: center;\n  padding: 28px 28px 0;\n}\n\n.atv-comment-overlay-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  overflow: hidden;\n  font-size: 18px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n  border: 2px solid var(--atv-border-subtle);\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease;\n}\n\n.atv-comment-overlay-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n\n.atv-comment-overlay-author,\na.atv-comment-overlay-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\na.atv-comment-overlay-author:hover {\n  color: var(--atv-text-primary);\n  background: none;\n}\n\n.atv-comment-overlay-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n\n.atv-comment-overlay-stars svg {\n  display: block;\n  width: 16px;\n  height: 16px;\n}\n\n.atv-comment-overlay-body {\n  padding: 20px 28px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: rgba(255, 255, 255, 0.85);\n  word-break: break-word;\n  white-space: pre-wrap;\n}\n\n.atv-comment-overlay-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 28px 28px;\n}\n\n.atv-comment-overlay-time {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-comment-overlay-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  padding: 6px 14px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: rgba(255, 255, 255, 0.04);\n  font: inherit;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  border-radius: 100px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-comment-overlay-votes:hover {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.2);\n  background: rgba(65, 190, 93, 0.04);\n}\n\n.atv-comment-overlay-votes:focus-visible {\n  outline: 2px solid rgba(65, 190, 93, 0.75);\n  outline-offset: 3px;\n}\n\n.atv-comment-overlay-votes:active {\n  transform: scale(0.95);\n}\n\n.atv-comment-overlay-votes.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.25);\n  background: rgba(65, 190, 93, 0.06);\n}\n\n.atv-comment-overlay-votes svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n/* ---------- Poster Modal ---------- */\n\n.atv-poster-card {\n  cursor: pointer;\n}\n\n.atv-modal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 0;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.78);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(28px) saturate(1.15);\n  backdrop-filter: blur(28px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-modal-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-modal-img {\n  max-width: 90vw;\n  max-height: 90vh;\n  object-fit: contain;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-modal-overlay.is-open .atv-modal-img {\n  transform: scale(1);\n}\n\n.atv-modal-accent-bar {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: 1;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.is-open .atv-modal-accent-bar {\n  transform: scaleX(1);\n}\n\n.atv-modal-close {\n  position: fixed;\n  top: 24px;\n  right: 24px;\n  z-index: 10001;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  padding: 0;\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  background: rgba(255, 255, 255, 0.08);\n  color: #fff;\n  font: inherit;\n  cursor: pointer;\n  border-radius: 50%;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n  touch-action: manipulation;\n  appearance: none;\n  -webkit-appearance: none;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.atv-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n\n.atv-modal-close svg {\n  display: block;\n}\n\n/* ---------- Video modal spinner ---------- */\n\n@keyframes atv-spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n.atv-spinner {\n  width: 32px;\n  height: 32px;\n  border: 3px solid rgba(255, 255, 255, 0.15);\n  border-top-color: var(--atv-accent, #f5c518);\n  border-radius: 50%;\n  animation: atv-spin 800ms linear infinite;\n}\n\n/* ---------- Footer spacer ---------- */\n\n.atv-footer-spacer {\n  height: 64px;\n}\n\n/* ---------- Login Prompt Modal ---------- */\n\ndialog::backdrop {\n  background: transparent;\n}\n\n.atv-login-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  min-height: 100vh;\n  min-height: 100dvh;\n  margin: 0;\n  border: none;\n  padding: max(24px, env(safe-area-inset-top))\n    max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom))\n    max(24px, env(safe-area-inset-left));\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  visibility: hidden;\n  overscroll-behavior: contain;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition:\n    visibility 0s linear 360ms,\n    opacity 360ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-login-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n  visibility: visible;\n  transition-delay: 0s;\n}\n\n.atv-login-modal-inner {\n  position: relative;\n  box-sizing: border-box;\n  width: min(100%, 424px);\n  max-height: min(736px, calc(100dvh - 48px));\n  padding: 30px 22px 22px;\n  overflow: auto;\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  color: var(--atv-text-primary);\n  text-align: center;\n  background: var(--atv-bg-secondary);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 20px;\n  box-shadow:\n    inset 0 1px 0 rgba(255, 255, 255, 0.08),\n    0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n  scrollbar-width: none;\n}\n\n.atv-login-modal-inner::-webkit-scrollbar {\n  display: none;\n}\n\n.atv-login-modal.is-open .atv-login-modal-inner {\n  transform: scale(1) translateY(0);\n}\n\n.atv-modal-close.atv-login-modal-close {\n  position: absolute;\n  top: 12px;\n  right: 12px;\n  z-index: 2;\n  width: 32px;\n  height: 32px;\n  color: rgba(255, 255, 255, 0.6);\n  background: rgba(255, 255, 255, 0.06);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n\n.atv-modal-close.atv-login-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-login-modal-title {\n  margin: 0 42px 6px;\n  font-size: 18px;\n  font-weight: 650;\n  line-height: 1.35;\n  color: var(--atv-text-primary);\n  text-wrap: balance;\n}\n\n.atv-login-modal-desc {\n  max-width: 300px;\n  margin: 0 auto 14px;\n  font-size: 13px;\n  line-height: 1.55;\n  color: var(--atv-text-tertiary);\n  text-wrap: pretty;\n}\n\n.atv-login-modal-status {\n  min-height: 20px;\n  margin: 8px 0 0;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-login-modal-status[hidden] {\n  display: none;\n}\n\n.atv-login-modal-native {\n  position: relative;\n  box-sizing: border-box;\n  width: 100%;\n  margin-top: 10px;\n  padding: 10px;\n  overflow: hidden;\n  border-radius: 16px;\n}\n\n.atv-login-modal-native:empty {\n  min-height: 360px;\n}\n\n.atv-login-modal-native[aria-busy=\"true\"] {\n  min-height: 360px;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      rgba(255, 255, 255, 0.055),\n      transparent\n    ),\n    rgba(255, 255, 255, 0.035);\n  background-size:\n    220% 100%,\n    auto;\n  animation: atv-login-native-loading 1400ms ease-in-out infinite;\n}\n\n.atv-login-modal-native > iframe,\n.atv-login-modal-iframe {\n  display: block !important;\n  box-sizing: border-box !important;\n  width: 340px !important;\n  max-width: 100% !important;\n  height: 448px !important;\n  max-height: calc(100vh - 168px) !important;\n  margin: 0 auto !important;\n  overflow: hidden !important;\n  background: #fff !important;\n  border: 0 !important;\n  border-radius: 10px !important;\n  box-shadow: none !important;\n  /* Cross-origin iframe dark-mode override (first-principles):\n     invert(0.89) maps white #fff → #1c1c1c, which matches\n     --atv-bg-secondary: #1c1c1e within 2 RGB points — no more\n     pure-black void. Text #333 → #bbb, borders #e0 → #343434.\n     hue-rotate(180deg) counter-rotates the color shift from\n     invert so green stays green-ish and blue stays blue-ish.\n     invert(0.89) is the precise value calculated to hit the\n     existing modal surface color while keeping text readable. */\n  filter: invert(0.89) hue-rotate(180deg) !important;\n}\n\n.atv-login-modal-close:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 3px;\n}\n\n@keyframes atv-login-native-loading {\n  from {\n    background-position:\n      160% 0,\n      0 0;\n  }\n  to {\n    background-position:\n      -60% 0,\n      0 0;\n  }\n}\n\n/* ---------- Interest Modal ---------- */\n\n.atv-interest-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 24px;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-interest-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-interest-modal-inner {\n  position: relative;\n  width: 100%;\n  max-width: 380px;\n  max-height: 90vh;\n  overflow-y: auto;\n  background: var(--atv-bg-secondary);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 20px;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-interest-modal.is-open .atv-interest-modal-inner {\n  transform: scale(1) translateY(0);\n}\n\n.atv-interest-modal-header {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px 48px 0;\n}\n\n.atv-interest-modal-header__title {\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  letter-spacing: 0.01em;\n}\n\n.atv-modal-close.atv-interest-modal-close {\n  position: absolute;\n  top: 14px;\n  right: 14px;\n  z-index: 2;\n  width: 32px;\n  height: 32px;\n  color: rgba(255, 255, 255, 0.6);\n  background: rgba(255, 255, 255, 0.06);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n\n.atv-modal-close.atv-interest-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-modal-close.atv-interest-modal-close:active {\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n\n.atv-interest-modal-body {\n  padding: 16px 20px 20px;\n}\n\n.atv-interest-modal-statuses {\n  display: flex;\n  gap: 0;\n  padding: 3px;\n  margin-bottom: 20px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 999px;\n}\n\n.atv-interest-modal-status {\n  flex: 1;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  height: 36px;\n  padding: 0 12px;\n  border: none;\n  background: transparent;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-status:hover {\n  color: var(--atv-text-secondary);\n}\n\n.atv-interest-modal-status.is-active {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n}\n\n.atv-interest-modal-stars {\n  display: flex;\n  gap: 6px;\n  justify-content: center;\n  margin-bottom: 24px;\n}\n\n.atv-interest-modal-star {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  border: none;\n  background: none;\n  color: rgba(255, 255, 255, 0.2);\n  cursor: pointer;\n  transition:\n    color 200ms ease,\n    transform 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-star.is-full {\n  color: var(--atv-rating-gold);\n}\n\n.atv-interest-modal-star:hover {\n  transform: scale(1.15);\n}\n\n.atv-interest-modal-star svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-interest-modal-comment {\n  display: block;\n  width: 100%;\n  min-height: 64px;\n  padding: 10px 14px;\n  margin-bottom: 16px;\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 10px;\n  font-family: inherit;\n  resize: vertical;\n  transition:\n    border-color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  box-sizing: border-box;\n}\n\n.atv-interest-modal-comment::placeholder {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-interest-modal-comment:focus {\n  outline: none;\n  border-color: rgba(255, 255, 255, 0.2);\n  background: rgba(255, 255, 255, 0.06);\n}\n\n.atv-interest-modal-submit {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 44px;\n  padding: 0 24px;\n  margin-bottom: 10px;\n  border: none;\n  background: var(--atv-accent);\n  font: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  color: #fff;\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    background 200ms ease,\n    transform 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  -webkit-font-smoothing: antialiased;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-submit:hover {\n  background: var(--atv-accent-bright);\n}\n\n.atv-interest-modal-submit:active {\n  transform: scale(0.97);\n}\n\n.atv-interest-modal-submit:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n.atv-interest-modal-remove {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 36px;\n  padding: 0 24px;\n  margin-bottom: 4px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: transparent;\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-interest-modal-remove:hover {\n  color: var(--atv-text-secondary);\n  border-color: rgba(255, 255, 255, 0.15);\n  background: rgba(255, 255, 255, 0.04);\n}\n\n.atv-interest-modal-remove:active {\n  background: rgba(255, 255, 255, 0.08);\n}\n\n.atv-interest-modal-error {\n  font-size: 12px;\n  font-weight: 500;\n  color: #ff453a;\n  text-align: center;\n  border-radius: 10px;\n}\n\n.atv-interest-modal-error:empty {\n  display: none;\n}\n\n.atv-interest-modal-error:not(:empty) {\n  padding: 8px 16px;\n  margin-top: 8px;\n  background: rgba(255, 69, 58, 0.08);\n}\n\n/* ---------- Interest Panel (S3 marked state) ---------- */\n\n.atv-interest-panel {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  width: 100%;\n}\n\n.atv-interest-panel-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n.atv-interest-badge {\n  cursor: pointer;\n}\n\n.atv-interest-panel-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n}\n\n.atv-interest-panel-stars svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n}\n\n.atv-interest-panel-date {\n  font-size: 13px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-interest-panel-comment {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  font-size: 14px;\n  line-height: 1.6;\n  color: var(--atv-text-secondary);\n  font-style: italic;\n  padding: 6px 0 2px;\n}\n\n.atv-useful-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-size: 12px;\n  font-style: normal;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ---------- Trailer Tile ---------- */\n\n.atv-trailer-tile {\n  flex: 0 0 400px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  background-size: cover;\n  background-position: center;\n  position: relative;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n}\n\n.atv-trailer-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n\n.atv-trailer-play-overlay {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(0, 0, 0, 0.12);\n  transition: background 300ms ease;\n}\n\n.atv-trailer-tile:hover .atv-trailer-play-overlay {\n  background: rgba(0, 0, 0, 0.2);\n}\n\n.atv-trailer-play-btn {\n  width: 56px;\n  height: 56px;\n  background: rgba(0, 0, 0, 0.6);\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n\n.atv-trailer-play-btn svg {\n  display: block;\n  width: 24px;\n  height: 24px;\n  color: #fff;\n  margin-left: 3px;\n}\n\n.atv-trailer-tile:hover .atv-trailer-play-btn {\n  transform: scale(1.08);\n  box-shadow: 0 0 30px var(--atv-accent-glow);\n}\n\n.atv-trailer-label {\n  position: absolute;\n  bottom: 12px;\n  left: 12px;\n  padding: 4px 10px;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.6);\n  font-size: 12px;\n  font-weight: 500;\n  color: #fff;\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n}\n\n/* ---------- Video Modal ---------- */\n\n.atv-modal-overlay.is-video {\n  background: #000;\n  -webkit-backdrop-filter: none;\n  backdrop-filter: none;\n}\n\n.atv-modal-video {\n  display: block;\n  max-width: 95vw;\n  max-height: 90vh;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-modal-overlay.is-open .atv-modal-video {\n  transform: scale(1);\n}\n\n/* ---------- Reviews ---------- */\n\n.atv-reviews {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));\n  gap: 20px;\n}\n\n.atv-review-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  padding: 22px;\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: var(--atv-radius-md);\n  cursor: pointer;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n  transition:\n    transform 350ms cubic-bezier(0.22, 1, 0.36, 1),\n    border-color 350ms ease,\n    box-shadow 350ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-review-open-button {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  padding: 0;\n  cursor: pointer;\n  background: transparent;\n  border: 0;\n  border-radius: var(--atv-radius-md);\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-review-content {\n  position: relative;\n  z-index: 1;\n  display: contents;\n}\n\n.atv-review-card:hover {\n  border-color: rgba(255, 255, 255, 0.12);\n  transform: translateY(-3px);\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.3),\n    0 0 0 1px rgba(65, 190, 93, 0.04);\n}\n\n.atv-review-card:active {\n  transform: translateY(0);\n  box-shadow: none;\n}\n\n.atv-review-card:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 4px;\n  border-color: rgba(65, 190, 93, 0.45);\n  box-shadow: 0 0 0 5px rgba(65, 190, 93, 0.12);\n}\n\n.atv-review-open-button:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 4px;\n}\n\n.atv-review-top {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-bottom: 12px;\n  pointer-events: none;\n}\n\n.atv-review-avatar {\n  width: 36px;\n  height: 36px;\n  border-radius: 50%;\n  background: var(--atv-accent);\n  background-size: cover;\n  background-position: center;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 14px;\n  font-weight: 600;\n  color: #fff;\n  border: 1.5px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-review-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  min-width: 0;\n  pointer-events: none;\n}\n\n.atv-review-author {\n  position: relative;\n  z-index: 2;\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  text-decoration: none;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  pointer-events: auto;\n}\n\n.atv-review-author:hover {\n  color: var(--atv-accent);\n}\n\n.atv-review-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n  color: var(--atv-rating-gold);\n}\n\n.atv-review-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-review-title {\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.35;\n  letter-spacing: -0.01em;\n  color: #f0f0f0;\n  margin-bottom: 8px;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  pointer-events: none;\n}\n\n.atv-review-excerpt {\n  font-size: 14px;\n  line-height: 1.7;\n  color: rgba(255, 255, 255, 0.72);\n  display: -webkit-box;\n  -webkit-line-clamp: 4;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  margin-bottom: 14px;\n  flex: 1;\n  pointer-events: none;\n}\n\n.atv-review-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding-top: 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n  pointer-events: none;\n}\n\n.atv-review-time {\n  font-size: 12px;\n  font-weight: 400;\n  color: rgba(255, 255, 255, 0.35);\n  letter-spacing: 0.02em;\n}\n\n.atv-review-readmore {\n  opacity: 0;\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-accent);\n  letter-spacing: 0.04em;\n  pointer-events: none;\n  transition:\n    opacity 300ms ease,\n    transform 300ms ease;\n  transform: translateX(-3px);\n}\n\n.atv-review-card:hover .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-card:focus-visible .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-card:has(.atv-review-open-button:focus-visible) {\n  border-color: rgba(65, 190, 93, 0.45);\n  box-shadow: 0 0 0 5px rgba(65, 190, 93, 0.12);\n}\n\n.atv-review-card:has(.atv-review-open-button:focus-visible)\n  .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-actions {\n  position: relative;\n  z-index: 2;\n  display: flex;\n  gap: 6px;\n  margin-left: auto;\n  pointer-events: auto;\n}\n\n.atv-vote-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 5px 12px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: rgba(255, 255, 255, 0.03);\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.55);\n  border-radius: 100px;\n  cursor: pointer;\n  line-height: 1;\n  transition:\n    color 250ms ease,\n    background 250ms ease,\n    border-color 250ms ease;\n  white-space: nowrap;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-vote-btn:hover {\n  border-color: var(--atv-accent);\n  color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.06);\n}\n\n.atv-vote-btn:focus-visible {\n  outline: 2px solid rgba(65, 190, 93, 0.75);\n  outline-offset: 3px;\n}\n\n.atv-vote-btn.is-lg {\n  padding: 8px 20px;\n  font-size: 14px;\n}\n\n.atv-vote-btn svg {\n  display: block;\n  width: 11px;\n  height: 11px;\n  transform-box: fill-box;\n  transform-origin: center;\n}\n\n.atv-vote-btn.down:hover {\n  background: rgba(255, 69, 58, 0.06);\n  border-color: #ff453a;\n  color: #ff453a;\n}\n\n.atv-vote-btn.down svg {\n  transform: rotate(180deg);\n}\n\n.atv-vote-btn.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.2);\n  background: rgba(65, 190, 93, 0.06);\n  cursor: default;\n}\n\n.atv-vote-btn.down.is-voted {\n  color: #ff453a;\n  border-color: rgba(255, 69, 58, 0.22);\n  background: rgba(255, 69, 58, 0.06);\n}\n\n/* ---------- Review Modal ---------- */\n\n.atv-review-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100vw;\n  height: 100vh;\n  margin: 0;\n  padding: 48px;\n  border: none;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-review-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n.atv-review-modal .atv-modal-close {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n  z-index: 2;\n  width: 32px;\n  height: 32px;\n  color: rgba(255, 255, 255, 0.6);\n  background: rgba(255, 255, 255, 0.06);\n  border-color: rgba(255, 255, 255, 0.1);\n}\n\n.atv-review-modal .atv-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n\n.atv-review-modal-scroll {\n  position: relative;\n  width: 100%;\n  max-width: 800px;\n  max-height: 85vh;\n  overflow-y: auto;\n  border-radius: var(--atv-radius-lg);\n  background: #121214;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  padding: 48px 56px 32px;\n  scrollbar-width: thin;\n  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n\n.atv-review-modal.is-open .atv-review-modal-scroll {\n  transform: scale(1) translateY(0);\n}\n\n.atv-review-modal-header {\n  margin-bottom: 16px;\n  padding-bottom: 14px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n\n.atv-review-modal-title {\n  font-size: 24px;\n  font-weight: 600;\n  line-height: 1.32;\n  letter-spacing: -0.01em;\n  color: #f0f0f0;\n  margin-bottom: 4px;\n}\n\n.atv-review-modal-title:focus {\n  outline: none;\n}\n\n.atv-review-modal-byline {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-top: 4px;\n}\n\n.atv-review-modal-avatar {\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  background: var(--atv-accent);\n  background-size: cover;\n  background-position: center;\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 12px;\n  font-weight: 600;\n  color: #fff;\n  border: 1.5px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-review-modal-byline-text {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 13px;\n  line-height: 1;\n}\n\n.atv-review-modal-byline-name {\n  color: var(--atv-text-secondary);\n}\n\n.atv-review-modal-byline-time {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body {\n  color: rgba(255, 255, 255, 0.82);\n  font-size: 16px;\n  line-height: 1.85;\n}\n\n.atv-review-modal-body h2 {\n  font-size: 20px;\n  font-weight: 600;\n  margin-bottom: 16px;\n  line-height: 1.4;\n  color: #f0f0f0;\n}\n\n.atv-review-modal-body h2 a {\n  color: inherit;\n  background: transparent;\n  text-decoration: none;\n}\n\n.atv-review-modal-body h2 a:hover {\n  color: var(--atv-accent);\n  background: transparent;\n}\n\n.atv-review-modal-body p {\n  margin-bottom: 16px;\n}\n\n.atv-review-modal-body blockquote {\n  margin: 20px 0;\n  padding: 16px 20px;\n  border-left: 3px solid var(--atv-accent);\n  border-radius: 0 var(--atv-radius-sm) var(--atv-radius-sm) 0;\n  background: rgba(255, 255, 255, 0.03);\n  color: rgba(255, 255, 255, 0.82);\n}\n\n.atv-review-modal-body blockquote p {\n  margin-bottom: 8px;\n}\n\n.atv-review-modal-body blockquote p:last-child {\n  margin-bottom: 0;\n}\n\n.atv-review-modal-body blockquote cite,\n.atv-review-modal-body blockquote footer {\n  display: block;\n  margin-top: 8px;\n  font-size: 13px;\n  font-weight: 500;\n  font-style: normal;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body blockquote cite::before,\n.atv-review-modal-body blockquote footer::before {\n  content: \"\\2014\\00a0\";\n}\n\n.atv-review-modal-body blockquote blockquote {\n  margin-left: 0;\n  border-left-color: rgba(255, 255, 255, 0.2);\n  background: rgba(255, 255, 255, 0.06);\n}\n\n/* ── Review content images (Douban image-container) ── */\n\n.atv-review-modal-body .image-container {\n  margin: 24px 0;\n  clear: both;\n}\n\n.atv-review-modal-body .image-container.image-float-left {\n  float: left;\n  margin: 8px 24px 8px 0;\n  max-width: 50%;\n}\n\n.atv-review-modal-body .image-container.image-float-right {\n  float: right;\n  margin: 8px 0 8px 24px;\n  max-width: 50%;\n}\n\n.atv-review-modal-body .image-wrapper {\n  overflow: hidden;\n  border-radius: var(--atv-radius-sm);\n  line-height: 0;\n}\n\n.atv-review-modal-body .image-wrapper img {\n  display: block;\n  width: auto;\n  height: auto;\n  max-width: 100%;\n  margin: 0 auto;\n}\n\n.atv-review-modal-body .image-caption-wrapper {\n  margin-top: 8px;\n  text-align: center;\n}\n\n.atv-review-modal-body .image-caption {\n  display: inline-block;\n  font-size: 13px;\n  font-weight: 400;\n  line-height: 1.6;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  font-style: italic;\n}\n\n/* ── Review content links (Douban a.link / generic) ── */\n\n.atv-review-modal-body a:link,\n.atv-review-modal-body a:visited {\n  color: var(--atv-accent);\n  text-decoration: none;\n  background: transparent;\n  border-bottom: 1px solid rgba(65, 190, 93, 0.25);\n  transition:\n    border-color 200ms ease,\n    color 200ms ease;\n  word-break: break-word;\n}\n\n.atv-review-modal-body a:hover,\n.atv-review-modal-body a:active {\n  color: var(--atv-accent-bright);\n  border-bottom-color: var(--atv-accent-bright);\n  background: transparent;\n}\n\n/* ============================================\n   7. Review Content Typography — All Elements\n      Target ALL HTML tags that may appear inside\n      Douban review rich-text content.\n   ============================================ */\n\n/* --- Headings --- */\n\n.atv-review-modal-body h3 {\n  font-size: 18px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--atv-text-primary);\n  margin: 28px 0 12px;\n}\n\n.atv-review-modal-body h4 {\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--atv-text-primary);\n  margin: 24px 0 10px;\n}\n\n.atv-review-modal-body h5,\n.atv-review-modal-body h6 {\n  font-size: 14px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--atv-text-secondary);\n  margin: 20px 0 8px;\n}\n\n/* --- Horizontal Rule --- */\n\n.atv-review-modal-body hr {\n  border: none;\n  border-top: 1px solid var(--atv-border-subtle);\n  margin: 28px 0;\n  height: 0;\n}\n\n/* --- Lists --- */\n\n.atv-review-modal-body ul,\n.atv-review-modal-body ol {\n  margin: 0 0 16px;\n  padding-left: 24px;\n  line-height: 1.7;\n}\n\n.atv-review-modal-body ul {\n  list-style: disc;\n}\n\n.atv-review-modal-body ol {\n  list-style: decimal;\n}\n\n.atv-review-modal-body li {\n  margin-bottom: 6px;\n  line-height: 1.7;\n}\n\n.atv-review-modal-body li:last-child {\n  margin-bottom: 0;\n}\n\n/* --- Inline Text Semantics --- */\n\n.atv-review-modal-body strong,\n.atv-review-modal-body b {\n  font-weight: 700;\n  color: rgba(255, 255, 255, 0.92);\n}\n\n.atv-review-modal-body em,\n.atv-review-modal-body i {\n  font-style: italic;\n}\n\n.atv-review-modal-body small {\n  font-size: 0.85em;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body q {\n  font-style: italic;\n}\n\n.atv-review-modal-body q::before {\n  content: \"\\201C\";\n}\n\n.atv-review-modal-body q::after {\n  content: \"\\201D\";\n}\n\n.atv-review-modal-body u {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n  text-decoration-thickness: 1px;\n}\n\n.atv-review-modal-body s,\n.atv-review-modal-body del {\n  text-decoration: line-through;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body sup {\n  font-size: 0.75em;\n  line-height: 1;\n  vertical-align: super;\n}\n\n.atv-review-modal-body sub {\n  font-size: 0.75em;\n  line-height: 1;\n  vertical-align: sub;\n}\n\n/* --- Code --- */\n\n.atv-review-modal-body code {\n  font-family:\n    \"SF Mono\", Monaco, \"Cascadia Code\", \"JetBrains Mono\", \"Fira Code\", Consolas,\n    monospace;\n  font-size: 0.9em;\n  padding: 2px 6px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 4px;\n  word-break: break-word;\n}\n\n.atv-review-modal-body pre {\n  background: rgba(0, 0, 0, 0.4);\n  border: 1px solid var(--atv-border-subtle);\n  padding: 16px 20px;\n  border-radius: var(--atv-radius-sm);\n  overflow-x: auto;\n  -webkit-overflow-scrolling: touch;\n  line-height: 1.6;\n  margin: 0 0 20px;\n}\n\n.atv-review-modal-body pre code {\n  background: none;\n  padding: 0;\n  font-size: 14px;\n  word-break: normal;\n}\n\n/* --- Tables --- */\n\n.atv-review-modal-body table {\n  width: 100%;\n  border-collapse: collapse;\n  margin: 20px 0;\n  line-height: 1.6;\n}\n\n.atv-review-modal-body thead {\n  border-bottom: 2px solid var(--atv-border-medium);\n}\n\n.atv-review-modal-body th {\n  font-weight: 600;\n  text-align: left;\n  padding: 10px 14px;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\n.atv-review-modal-body td {\n  padding: 10px 14px;\n  border-bottom: 1px solid var(--atv-border-subtle);\n  color: rgba(255, 255, 255, 0.82);\n}\n\n.atv-review-modal-body tbody tr:last-child td {\n  border-bottom: none;\n}\n\n.atv-review-modal-body .review-content,\n.atv-review-modal-body .review-content p,\n.atv-review-modal-body .review-content div,\n.atv-review-modal-body .review-content span {\n  color: rgba(255, 255, 255, 0.82);\n}\n\n.atv-review-modal-body .spoiler-tip {\n  color: #ff9f0a;\n  font-size: 13px;\n  font-weight: 600;\n  margin-bottom: 12px;\n}\n\n.atv-review-modal-body .main-hd {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-bottom: 16px;\n}\n\n.atv-review-modal-body .main-hd a.name {\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-accent);\n  text-decoration: none;\n}\n\n.atv-review-modal-body .main-hd a.name:hover {\n  text-decoration: underline;\n}\n\n.atv-review-modal-footer {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-top: 28px;\n  padding-top: 20px;\n  border-top: 1px solid rgba(255, 255, 255, 0.04);\n}\n\n.atv-review-modal-votes {\n  display: flex;\n  gap: 14px;\n}\n\n.atv-review-modal-link {\n  display: flex;\n  align-items: center;\n}\n\n#atv-douban-root .atv-review-modal-link-a {\n  font-size: 13px;\n  color: rgba(255, 255, 255, 0.5);\n  background: transparent;\n  text-decoration: none;\n  transition: color 200ms ease;\n}\n\n#atv-douban-root .atv-review-modal-link-a:link,\n#atv-douban-root .atv-review-modal-link-a:visited {\n  color: rgba(255, 255, 255, 0.5);\n  background: transparent;\n}\n\n#atv-douban-root .atv-review-modal-link-a:hover,\n#atv-douban-root .atv-review-modal-link-a:active {\n  color: var(--atv-accent);\n  background: transparent;\n}\n\n.atv-review-modal-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n  margin: 0 0 4px;\n  color: var(--atv-rating-gold);\n}\n\n.atv-review-modal-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-review-modal-body.is-skeleton {\n  position: relative;\n  min-height: 140px;\n  color: transparent;\n}\n\n.atv-review-modal-body.is-skeleton::before,\n.atv-review-modal-body.is-skeleton::after {\n  display: block;\n  height: 14px;\n  border-radius: 4px;\n  content: \"\";\n  background: linear-gradient(\n    90deg,\n    rgba(255, 255, 255, 0.04) 25%,\n    rgba(255, 255, 255, 0.1) 50%,\n    rgba(255, 255, 255, 0.04) 75%\n  );\n  background-size: 200% 100%;\n  animation: atv-ratings-shimmer 1.6s ease-in-out infinite;\n}\n\n.atv-review-modal-body.is-skeleton::before {\n  width: 92%;\n  margin-bottom: 14px;\n}\n\n.atv-review-modal-body.is-skeleton::after {\n  width: 68%;\n}\n\n.atv-review-modal-body.is-error {\n  display: flex;\n  min-height: 140px;\n  align-items: center;\n  justify-content: center;\n  color: var(--atv-text-tertiary);\n  text-align: center;\n}\n\n.atv-review-modal-error {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  align-items: center;\n}\n\n.atv-review-modal-error p {\n  margin: 0;\n}\n\n.atv-review-modal-retry {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 34px;\n  padding: 0 18px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(255, 255, 255, 0.04);\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-text-secondary);\n  cursor: pointer;\n  border-radius: 999px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n  appearance: none;\n  -webkit-appearance: none;\n}\n\n.atv-review-modal-retry:hover,\n.atv-review-modal-retry:focus-visible {\n  color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.08);\n  border-color: rgba(65, 190, 93, 0.35);\n}\n\n.atv-review-modal-retry:focus-visible,\n.atv-review-modal .atv-modal-close:focus-visible,\n#atv-douban-root .atv-review-modal-link-a:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 3px;\n}\n\n/* ---------- Responsive ---------- */\n\n@media (max-width: 1024px) {\n  .atv-hero {\n    min-height: 64vh;\n    padding: 104px 24px 48px;\n  }\n  .atv-hero-inner {\n    flex-direction: column;\n    gap: 28px;\n    align-items: flex-start;\n  }\n  .atv-poster-card {\n    width: 220px;\n  }\n  .atv-section {\n    padding: 44px 24px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 160px 1fr;\n    column-gap: 24px;\n  }\n}\n\n@media (max-width: 768px) {\n  .atv-hero {\n    min-height: 56vh;\n    padding: 88px 20px 40px;\n  }\n  .atv-poster-card {\n    width: 180px;\n  }\n  .atv-section {\n    padding: 36px 20px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 1fr;\n    row-gap: 4px;\n  }\n  .atv-info-label {\n    padding-top: 12px;\n  }\n  .atv-recs {\n    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));\n    gap: 18px;\n  }\n  .atv-cast-card {\n    flex-basis: 120px;\n  }\n  .atv-cast-avatar {\n    width: 120px;\n    height: 120px;\n  }\n  .atv-series-card {\n    flex-basis: 120px;\n  }\n  .atv-photo-tile {\n    flex-basis: 280px;\n  }\n  .atv-photo-tile.is-portrait {\n    flex-basis: 170px;\n  }\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n  }\n  .atv-rating-panel {\n    min-width: 0;\n  }\n  .atv-comments {\n    grid-template-columns: 1fr;\n  }\n  .atv-comment-overlay-inner {\n    max-width: 95vw;\n    border-radius: 16px;\n  }\n  .atv-comment-overlay-top {\n    padding: 24px 20px 0;\n  }\n  .atv-comment-overlay-body {\n    padding: 16px 20px;\n    font-size: 14px;\n  }\n  .atv-comment-overlay-foot {\n    padding: 0 20px 24px;\n  }\n  .atv-reviews {\n    grid-template-columns: 1fr;\n  }\n  .atv-review-modal-scroll {\n    padding: 24px 18px 22px;\n    max-width: 100vw;\n    max-height: 92vh;\n    border-radius: 20px 20px 0 0;\n  }\n  .atv-review-modal {\n    align-items: flex-end;\n    padding: 0;\n    overscroll-behavior: contain;\n  }\n  .atv-review-modal .atv-modal-close {\n    top: 14px;\n    right: 14px;\n  }\n  .atv-review-modal-body blockquote {\n    margin: 16px 0;\n    padding: 12px 14px;\n  }\n  .atv-review-modal-body blockquote blockquote {\n    padding: 10px 12px;\n  }\n  .atv-review-modal-body .image-container {\n    margin: 16px 0;\n  }\n  .atv-review-modal-body .image-container.image-float-left,\n  .atv-review-modal-body .image-container.image-float-right {\n    float: none;\n    max-width: 100%;\n    margin: 16px 0;\n  }\n\n  /* Review content typography — responsive */\n  .atv-review-modal-body h3 {\n    margin-top: 22px;\n  }\n  .atv-review-modal-body h4 {\n    margin-top: 18px;\n  }\n  .atv-review-modal-body hr {\n    margin: 22px 0;\n  }\n  .atv-review-modal-body pre {\n    padding: 12px 16px;\n  }\n  .atv-review-modal-body th,\n  .atv-review-modal-body td {\n    padding: 8px 10px;\n  }\n  .atv-login-modal {\n    align-items: flex-end;\n    padding: 16px;\n  }\n  .atv-login-modal-inner {\n    width: 100%;\n    padding: 28px 20px 20px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-trailer-tile,\n  .atv-trailer-tile:hover {\n    transform: none;\n    filter: none;\n  }\n  .atv-trailer-play-overlay {\n    transition: none;\n  }\n  .atv-trailer-play-btn {\n    transition: none;\n  }\n  .atv-trailer-tile:hover .atv-trailer-play-btn {\n    transform: none;\n    box-shadow: none;\n  }\n  .atv-modal-video {\n    transition: none;\n  }\n  .atv-modal-overlay.is-open .atv-modal-video {\n    transform: none;\n  }\n  .atv-comment-avatar.atv-avatar-loaded {\n    animation: none;\n  }\n  .atv-review-card,\n  .atv-review-card:hover,\n  .atv-review-card:active {\n    transform: none;\n    transition: none;\n    box-shadow: none;\n  }\n  .atv-review-modal-scroll {\n    transition: none;\n    transform: none;\n  }\n  .atv-review-modal.is-open .atv-review-modal-scroll {\n    transform: none;\n  }\n  .atv-review-modal {\n    transition: none;\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n  }\n  .atv-review-modal-body.is-skeleton::before,\n  .atv-review-modal-body.is-skeleton::after {\n    animation: none;\n  }\n\n  /* Modal overlay fades */\n  .atv-modal-overlay,\n  .atv-comment-overlay,\n  .atv-interest-modal,\n  .atv-login-modal {\n    transition: none;\n  }\n  .atv-login-modal-inner,\n  .atv-login-modal.is-open .atv-login-modal-inner {\n    transform: none;\n    transition: none;\n  }\n  .atv-login-modal-native[aria-busy=\"true\"] {\n    animation: none;\n  }\n\n  /* Accent edge glow */\n  .atv-modal-accent-bar {\n    transition: none;\n    transform: scaleX(1);\n  }\n}\n\n@media (max-width: 768px) {\n  .atv-trailer-tile {\n    flex-basis: 280px;\n  }\n}\n";
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
	}, n, l$1, u$2, i$2, r$1, o$2, e$1, f$2, c$1, a$1, s$1, h$1, p$1, v$1, y$1, d$1 = {}, w$1 = [], _$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, g = Array.isArray;
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
		"-" == l[0] ? n.setProperty(l, null == u ? "" : u) : n[l] = null == u ? "" : "number" != typeof u || _$1.test(l) ? u : u + "px";
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
	var t, r, u$1, i$1, o$1 = 0, f$1 = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, p = c.__;
	function s(n, t) {
		c.__h && c.__h(r, n, o$1 || t), o$1 = 0;
		var u = r.__H || (r.__H = {
			__: [],
			__h: []
		});
		return n >= u.__.length && u.__.push({}), u.__[n];
	}
	function d(n) {
		return o$1 = 1, y(D, n);
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
	function _(n, u) {
		var i = s(t++, 4);
		!c.__s && C(i.__H, u) && (i.__ = n, i.u = u, r.__h.push(i));
	}
	function A(n) {
		return o$1 = 5, T(function() {
			return { current: n };
		}, []);
	}
	function T(n, r) {
		var u = s(t++, 7);
		return C(u.__H, r) && (u.__ = n(), u.__H = r, u.__h = n), u.__;
	}
	function q(n, t) {
		return o$1 = 8, T(function() {
			return n;
		}, t);
	}
	function x(n) {
		var u = r.context[n.__c], i = s(t++, 9);
		return i.c = n, u ? (i.__ ?? (i.__ = !0, u.sub(r)), u.props.value) : n.__;
	}
	function j() {
		for (var n; n = f$1.shift();) {
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
		i && (u$1 === r ? (i.__h = [], r.__h = [], i.__.some(function(n) {
			n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
		})) : (i.__h.some(z), i.__h.some(B), i.__h = [], t = 0)), u$1 = r;
	}, c.diffed = function(n) {
		v && v(n);
		var t = n.__c;
		t && t.__H && (t.__H.__h.length && (1 !== f$1.push(t) && i$1 === c.requestAnimationFrame || ((i$1 = c.requestAnimationFrame) || w)(j)), t.__H.__.some(function(n) {
			n.u && (n.__H = n.u, n.u = void 0);
		})), u$1 = r = null;
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
	}, f = 0;
	Array.isArray;
	function u(e, t, n, o, i, u) {
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
			__v: --f,
			__i: -1,
			__u: 0,
			__source: i,
			__self: u
		};
		if ("function" == typeof e && (a = e.defaultProps)) for (c in a) void 0 === p[c] && (p[c] = a[c]);
		return l$1.vnode && l$1.vnode(l), l;
	}
	var StickyNav = ({ sections, title }) => {
		const [visible, setVisible] = d(false);
		h(() => {
			const updateVisibility = () => setVisible(window.scrollY > 300);
			window.addEventListener("scroll", updateVisibility, { passive: true });
			updateVisibility();
			return () => window.removeEventListener("scroll", updateVisibility);
		}, []);
		return u("nav", {
			class: `atv-stickynav${visible ? " is-visible" : ""}`,
			children: [u("div", {
				class: "atv-stickynav-title",
				children: title.primary || title.full
			}), u("div", {
				class: "atv-stickynav-jumps",
				children: sections.map((section) => u("a", {
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
			})]
		});
	};
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
	var activeModals = new Map();
	var removeOrphanedModal = (id) => {
		const existing = document.querySelector(`#${id}`);
		const host = existing?.parentElement;
		if (host) {
			R(null, host);
			host.remove();
			return;
		}
		existing?.remove();
	};
	var openImperativeModal = (options) => {
		const trackedModal = activeModals.get(options.id);
		const activeModal = trackedModal?.host.isConnected ? trackedModal : void 0;
		if (trackedModal && !activeModal) activeModals.delete(options.id);
		const previousFocus = activeModal?.previousFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
		activeModal?.close(false);
		removeOrphanedModal(options.id);
		const host = document.createElement("div");
		document.body.append(host);
		let closed = false;
		const close = (restoreFocus) => {
			if (closed) return;
			closed = true;
			options.onClose?.();
			R(null, host);
			host.remove();
			activeModals.delete(options.id);
			if (restoreFocus && previousFocus?.isConnected) previousFocus.focus();
		};
		activeModals.set(options.id, {
			close,
			host,
			previousFocus
		});
		R(options.content(() => close(true)), host);
	};
	var HtmlContent = ({ children, className, html, ...rest }) => u("div", {
		class: className,
		dangerouslySetInnerHTML: html ? { __html: html } : void 0,
		...rest,
		children: html ? null : children
	});
	var IconStarFull = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "currentColor",
			d: "M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
		})
	});
	var IconStarHalf = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: [u("defs", { children: u("linearGradient", {
			id: "atvHalfStar",
			children: [u("stop", {
				offset: "50%",
				"stop-color": "currentColor"
			}), u("stop", {
				offset: "50%",
				"stop-color": "currentColor",
				"stop-opacity": "0.22"
			})]
		}) }), u("path", {
			fill: "url(#atvHalfStar)",
			d: "M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
		})]
	});
	var IconStarEmpty = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "currentColor",
			"fill-opacity": "0.22",
			d: "M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"
		})
	});
	var IconPlay = (props) => u("svg", {
		viewBox: "0 0 14 14",
		width: "14",
		height: "14",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "currentColor",
			d: "M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z"
		})
	});
	var IconCheck = (props) => u("svg", {
		viewBox: "0 0 14 14",
		width: "14",
		height: "14",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M2.5 7.5l3 3 6-7"
		})
	});
	var IconChevron = (props) => u("svg", {
		viewBox: "0 0 12 12",
		width: "10",
		height: "10",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "1.6",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M2.5 4l3.5 4 3.5-4"
		})
	});
	var IconArrow = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "15",
		height: "15",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "1.8",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5"
		})
	});
	var IconThumb = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "13",
		height: "13",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "currentColor",
			d: "M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z"
		})
	});
	var IconVoteTriangle = (props) => u("svg", {
		viewBox: "0 0 12 12",
		width: "12",
		height: "12",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "currentColor",
			d: "M6 2.2 10.4 9H1.6L6 2.2z"
		})
	});
	var IconExpand = (props) => u("svg", {
		viewBox: "0 0 14 14",
		width: "12",
		height: "12",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "1.5",
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			d: "M3 5.5l4 4 4-4"
		})
	});
	var IconTomato = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u("circle", {
			cx: "8",
			cy: "8",
			r: "5.5",
			fill: "currentColor"
		})
	});
	var IconPopcorn = (props) => u("svg", {
		viewBox: "0 0 16 16",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "currentColor",
			d: "M8 2l6 6-6 6-6-6z"
		})
	});
	var IconClose = ({ size = 22, ...props }) => u("svg", {
		viewBox: "0 0 24 24",
		width: size,
		height: size,
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "2",
		"stroke-linecap": "round",
		...props,
		children: u("path", { d: "M6 6l12 12M18 6l-12 12" })
	});
	var IconFilmPlaceholder = (props) => u("svg", {
		viewBox: "0 0 64 96",
		width: "100%",
		height: "100%",
		preserveAspectRatio: "xMidYMid slice",
		"aria-hidden": "true",
		...props,
		children: [
			u("defs", { children: u("linearGradient", {
				id: "atvFilmGrad",
				x1: "0",
				y1: "0",
				x2: "1",
				y2: "1",
				children: [u("stop", {
					offset: "0%",
					"stop-color": "#2c2c2e"
				}), u("stop", {
					offset: "100%",
					"stop-color": "#1c1c1e"
				})]
			}) }),
			u("rect", {
				width: "64",
				height: "96",
				fill: "url(#atvFilmGrad)"
			}),
			u("g", {
				fill: "rgba(255,255,255,0.12)",
				children: [
					u("rect", {
						x: "4",
						y: "6",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "4",
						y: "18",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "4",
						y: "30",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "4",
						y: "42",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "4",
						y: "54",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "4",
						y: "66",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "4",
						y: "78",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "6",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "18",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "30",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "42",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "54",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "66",
						width: "6",
						height: "6",
						rx: "1"
					}),
					u("rect", {
						x: "54",
						y: "78",
						width: "6",
						height: "6",
						rx: "1"
					})
				]
			}),
			u("path", {
				d: "M26 38l14 10-14 10z",
				fill: "rgba(255,255,255,0.28)"
			})
		]
	});
	var LogoDouban = (props) => u("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "豆瓣",
		fill: "#2D963D",
		...props,
		children: u("path", { d: "M.51 3.06h22.98V.755H.51V3.06Zm20.976 2.537v9.608h-2.137l-1.669 5.76H24v2.28H0v-2.28h6.32l-1.67-5.76H2.515V5.597h18.972Zm-5.066 9.608H7.58l1.67 5.76h5.501l1.67-5.76ZM18.367 7.9H5.634v5.025h12.733V7.9Z" })
	});
	var LogoImdb = (props) => u("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "IMDb",
		fill: "#F5C518",
		...props,
		children: u("path", { d: "M22.3781 0H1.6218C.7411.0583.0587.7437.0018 1.5953l-.001 20.783c.0585.8761.7125 1.543 1.5559 1.6191A.337.337 0 0 0 1.6016 24h20.7971a.4579.4579 0 0 0 .0437-.002c.8727-.0768 1.5568-.8271 1.5568-1.7085V1.7098c0-.8914-.696-1.6416-1.584-1.7078A.3294.3294 0 0 0 22.3781 0zm0 .496a1.2144 1.2144 0 0 1 1.1252 1.2139v20.5797c0 .6377-.4875 1.1602-1.1045 1.2145H1.6016c-.5967-.0543-1.0645-.5297-1.1053-1.1258V1.6284C.5371 1.0185 1.0184.5364 1.6217.496h20.7564zM4.7954 8.2603v7.3636H2.8899V8.2603h1.9055zm6.5367 0v7.3636H9.6707v-4.9704l-.6711 4.9704H7.813l-.6986-4.8618-.0066 4.8618h-1.668V8.2603h2.468c.0748.4476.1492.9694.2307 1.5734l.2712 1.8713.4407-3.4447h2.4817zm2.9772 1.3289c.0742.0404.122.108.1417.2034.0279.0953.0345.3118.0345.6442v2.8548c0 .4881-.0345.7867-.0955.8954-.0609.1152-.2304.1695-.5018.1695V9.5211c.204 0 .3457.0205.4211.0681zm-.0211 6.0347c.4543 0 .8006-.0265 1.0245-.0742.2304-.0477.4204-.1357.5694-.2648.1556-.1218.2642-.298.3251-.5219.0611-.2238.1021-.6648.1021-1.3224v-2.5832c0-.6986-.0271-1.1668-.0742-1.4039-.041-.237-.1431-.4543-.3126-.6437-.1695-.1973-.4198-.3324-.7456-.421-.3191-.0808-.8542-.1285-1.7694-.1285h-1.4244v7.3636h2.3051zm5.14-1.7827c0 .3523-.0199.5762-.0544.6708-.033.0947-.1894.1424-.3046.1424-.1086 0-.19-.0477-.2238-.1351-.041-.0887-.0609-.2986-.0609-.6238v-1.9469c0-.3324.0199-.5423.0543-.6237.0338-.0808.1086-.122.2171-.122.1153 0 .2709.0412.3114.1425.041.0947.0609.2986.0609.6032v1.8926zm-2.4747-5.5809v7.3636h1.7157l.1152-.4675c.1556.1894.3251.3324.5152.4271.1828.0881.4608.1357.678.1357.3047 0 .5629-.0748.7802-.237.2165-.1562.3589-.3462.4198-.5628.0543-.2173.0887-.543.0887-.9841v-2.0675c0-.4409-.0139-.7324-.0344-.8681-.0199-.1357-.0742-.2781-.1695-.4204-.1021-.1425-.2437-.251-.4272-.3325-.1834-.0742-.3999-.1152-.6576-.1152-.2172 0-.4952.0477-.6846.1285-.1835.0887-.353.2238-.5086.4007V8.2603h-1.8309z" })
	});
	var LogoMetacritic = (props) => u("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "Metacritic",
		fill: "#FFD500",
		...props,
		children: u("path", { d: "M11.99 0A12 12 0 1 0 24 12v-.014A12 12 0 0 0 11.99 0Zm-.055 2.564a9.399 9.399 0 0 1 9.407 9.389v.01a9.399 9.399 0 1 1-9.408-9.399Zm-1.61 17.198 2.046-2.046-3.94-3.94c-.165-.166-.345-.373-.442-.608-.221-.47-.318-1.203.221-1.742.664-.664 1.548-.387 2.406.47l3.788 3.788 2.046-2.046-3.954-3.954a2.48 2.48 0 0 1-.456-.622c-.263-.539-.25-1.216.235-1.7.677-.678 1.562-.429 2.544.553l3.677 3.677 2.046-2.046-3.982-3.982c-2.018-2.018-3.912-1.949-5.212-.65-.498.499-.802 1.024-.954 1.618a4.026 4.026 0 0 0-.055 1.686l-.027.028c-.996-.414-2.13-.166-3 .705-1.162 1.161-1.12 2.392-.982 3.11l-.042.043-1.009-.816-1.77 1.77a64.1 64.1 0 0 1 2.213 2.1z" })
	});
	var LogoRT = (props) => u("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-label": "Rotten Tomatoes",
		fill: "#FA320A",
		...props,
		children: u("path", { d: "M5.866 0L4.335 1.262l2.082 1.8c-2.629-.989-4.842 1.4-5.012 2.338 1.384-.323 2.24-.422 3.344-.335-7.042 4.634-4.978 13.148-1.434 16.094 5.784 4.612 13.77 3.202 17.91-1.316C27.26 13.363 22.993.65 10.86 2.766c.107-1.17.633-1.503 1.243-1.602-.89-1.493-3.67-.734-4.556 1.374C7.52 2.602 5.866 0 5.866 0zM4.422 7.217H6.9c2.673 0 2.898.012 3.55.202 1.06.307 1.868.973 2.313 1.904.05.106.092.206.13.305l7.623.008.027 2.912-2.745-.024v7.549l-2.982-.016v-7.522l-2.127.016a2.92 2.92 0 0 1-1.056 1.134c-.287.176-.3.19-.254.264.127.2 2.125 3.642 2.125 3.659l-3.39.019-2.013-3.376c-.034-.047-.122-.068-.344-.084l-.297-.02.037 3.48-3.075-.038zm3.016 2.288l.024.338c.014.186.024.729.024 1.206v.867l.582-.025c.32-.013.695-.049.833-.078.694-.146 1.048-.478 1.087-1.018.027-.378-.063-.636-.303-.87-.318-.309-.761-.416-1.733-.418Z" })
	});
	var PlayIcon = (props) => u("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		fill: "none",
		stroke: "white",
		"stroke-width": "2",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		...props,
		children: u("polygon", {
			points: "6 3 20 12 6 21 6 3",
			fill: "white",
			stroke: "none"
		})
	});
	var LogoNetflix = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z" })
	});
	var LogoYouTube = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" })
	});
	var LogoAppleTv = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M20.57 17.735h-1.815l-3.34-9.203h1.633l2.02 5.987c.075.231.273.9.586 2.012l.297-.997.33-1.006 2.094-6.004H24zm-5.344-.066a5.76 5.76 0 0 1-1.55.207c-1.23 0-1.84-.693-1.84-2.087V9.646h-1.063V8.532h1.121V7.081l1.476-.602v2.062h1.707v1.113H13.38v5.805c0 .446.074.75.214.932.14.182.396.264.75.264.207 0 .495-.041.883-.115zm-7.29-5.343c.017 1.764 1.55 2.358 1.567 2.366-.017.042-.248.842-.808 1.658-.487.71-.99 1.418-1.79 1.435-.783.016-1.03-.462-1.93-.462-.89 0-1.17.445-1.913.478-.758.025-1.344-.775-1.838-1.484-.998-1.451-1.765-4.098-.734-5.88.51-.89 1.426-1.451 2.416-1.46.75-.016 1.468.512 1.93.512.461 0 1.327-.627 2.234-.536.38.016 1.452.157 2.136 1.154-.058.033-1.278.743-1.27 2.219M6.468 7.988c.404-.495.685-1.18.61-1.864-.585.025-1.294.388-1.723.883-.38.437-.71 1.138-.619 1.806.652.05 1.328-.338 1.732-.825Z" })
	});
	var LogoHbo = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872Z" })
	});
	var LogoHboMax = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M3.784 8.716c-.655 0-1.32.29-2.173.946v-.78H0v6.236h1.715V11.24c.749-.592 1.091-.78 1.372-.78.333 0 .551.209.551.729v3.928h1.715V11.23c.748-.582 1.081-.769 1.372-.769.333 0 .55.208.55.728v3.928H8.99v-4.53c0-1.403-.8-1.871-1.57-1.871-.654 0-1.32.27-2.192.936-.28-.697-.894-.936-1.444-.936zm8.689 0c-1.705 0-3.118 1.466-3.118 3.284 0 1.82 1.413 3.285 3.118 3.285.842 0 1.57-.312 2.131-.988v.82h1.632V8.883h-1.632v.822c-.561-.676-1.29-.988-2.131-.988zm4.064.166c.707 1.102 1.507 2.09 2.443 3.077a26.593 26.593 0 0 0-2.443 3.16h2.069a13.603 13.603 0 0 1 1.673-2.183 14.067 14.067 0 0 1 1.632 2.182H24a25.142 25.142 0 0 0-2.432-3.16A23.918 23.918 0 0 0 24 8.883h-2.047a14.65 14.65 0 0 1-1.674 2.11 13.357 13.357 0 0 1-1.674-2.11zm-3.804 1.279c1.018 0 1.84.82 1.84 1.84a1.837 1.837 0 0 1-1.84 1.839c-1.019 0-1.84-.82-1.84-1.84 0-1.018.821-1.84 1.84-1.84zm0 .415c-.78 0-1.414.633-1.414 1.423s.634 1.424 1.413 1.424c.78 0 1.414-.634 1.414-1.424s-.634-1.424-1.414-1.424z" })
	});
	var LogoParamountPlus = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M16.347 21.373c.057-.084.151-.314-.025-.74l-.53-1.428c-.073-.182.084-.293.19-.173 0 0 1.004 1.157 1.264 1.64l.495.822c.425.028 1.6.06 2.732.06a3.26 3.26 0 0 1-.316-.364c-1.93-2.392-3.154-3.724-3.166-3.737-.391-.426-.572-.508-.87-.643a4.82 4.82 0 0 1-.138-.065v.364c0 .047-.057.073-.086.022l-2.846-5.001a1.598 1.598 0 0 0-.508-.587l-.277-.194-1.354 3.123c.212 0 .354.216.27.409l-1.25 2.893h1.147c.443 0 .883.087 1.294.255l.302.125s-.913 1.878-.913 2.867c0 .181.028.362.075.534h2.104l-.096-.595s1.266.294 2.502.413M12 2.437c-6.627 0-12 5.373-12 12 0 2.669.873 5.133 2.346 7.126.503-.218.783-.542.983-.791l2.234-2.858a.467.467 0 0 1 .179-.138l.336-.146 3.674-4.659.534-.417 1.094-1.524a.482.482 0 0 1 .101-.102l.478-.347a.34.34 0 0 1 .398-.004l.578.407c.308.216.557.504.726.84l2.322 4.077c.051.09.09.129.182.174.454.227.732.268 1.33.913.277.304 1.495 1.666 3.203 3.784.236.318.538.588.963.783A11.948 11.948 0 0 0 24 14.437c0-6.627-5.373-12-12-12M3.236 15.1l-.778-.253-.48.662v-.818l-.778-.253.778-.253v-.818l.48.662.778-.253-.48.662Zm-.185 2.676-.252.778-.253-.778h-.818l.661-.481-.253-.777.663.48.66-.48-.252.777.662.481Zm.156-6.195.253.778-.661-.48-.663.48.253-.778-.66-.48h.817l.253-.778.252.777h.818Zm1.314-1.76L4.04 9.16l-.778.253.48-.661-.48-.663.778.254.48-.662v.818l.778.253-.777.252Zm2.045-2.862-.253.777-.252-.777h-.818l.662-.48-.253-.778.661.48.661-.48-.252.777.662.48Zm2.577-1.313-.48.661V5.49l-.779-.254.778-.253v-.817l.48.66.78-.253-.481.663.48.66zm3.265-.75.253.778-.661-.48-.662.48.252-.777-.66-.481h.818L12 3.637l.252.778h.818zm2.93.595v.816l-.481-.661-.777.252.48-.662-.48-.662.777.253.48-.66v.817l.779.252zm5.426 8.285.778.253.48-.662v.818l.778.253-.778.253v.818l-.48-.662-.778.253.48-.662zm-3.077-6.04-.253-.777h-.818l.662-.48-.253-.778.662.48.662-.48-.254.778.662.48h-.818zm1.792 2.086v-.818l-.777-.252.777-.253V7.68l.481.662.777-.254-.48.663.48.66-.777-.252zm1.469 1.278.253-.777.254.777h.816l-.66.481.252.778-.662-.48-.661.48.253-.778-.662-.48zm.506 6.676-.253.778-.253-.778h-.817l.662-.481-.253-.777.66.48.663-.48-.253.777.661.481zm-12.08-.615.76-1.588c.024-.048-.032-.108-.067-.067l-.664.668c-.313.329-.847 1.25-.95 1.421l-.808 1.335a.109.109 0 0 1 .1.162l-.739 1.238c-.18.309.145.523.189.452 1.157-1.868 1.832-1.719 1.832-1.719l.387-.897c.022-.047-.001-.1-.05-.12-.12-.05-.316-.27.01-.885z" })
	});
	var LogoTubi = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M16.696 15.272v-.752c.4.548 1.107.917 1.934.917 1.475 0 2.28-.956 2.28-2.865 0-1.714-.893-2.858-2.235-2.858-.851 0-1.55.347-1.979.908v-2.06h-2.674v6.71zm1.57-2.614c0 .827-.337 1.275-.827 1.275-.486 0-.837-.452-.837-1.275s.342-1.28.837-1.28c.495 0 .828.452.828 1.28zM6.94 9.988v3.6c0 1.236.754 1.841 1.955 1.841.959 0 1.625-.396 2.028-1.064v.91h2.597V9.989h-2.675v3.14c0 .493-.346.693-.666.693-.321 0-.568-.192-.568-.655V9.989Zm14.39 0H24v5.276h-2.67ZM6.553 11.136c0 .781-.635 1.415-1.42 1.415-.783 0-1.419-.634-1.419-1.415 0-.782.636-1.415 1.42-1.415.784 0 1.42.633 1.42 1.415zM3.49 9.702v2.668c.005.653.327.924.976.924.225 0 .526-.053.672-.166v1.931c-.49.243-.869.378-1.535.378 0 0-.069 0-.18-.006l-.003.006c-1.614 0-2.51-1.035-2.482-2.686v-.47H0V9.99h.92V8.563h2.569Z" })
	});
	var LogoVimeo = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.8809 1.132l-1.129-1.457a315.06 315.06 0 003.501-3.1279c1.579-1.368 2.765-2.085 3.5539-2.159 1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.5069.5389 2.45 1.1309 3.674 1.7759 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z" })
	});
	var LogoIqiyiCombined = (props) => u("svg", {
		width: "460",
		height: "72",
		viewBox: "0 0 460 72",
		fill: "none",
		...props,
		children: [u("path", {
			d: "M459.147 6.18071H451.607C451.547 6.18463 451.487 6.17624 451.43 6.15606C451.373 6.13588 451.321 6.10432 451.276 6.06333C451.232 6.02233 451.197 5.97275 451.172 5.9176C451.148 5.86246 451.135 5.80292 451.134 5.74261V1.10803C451.135 1.03714 451.122 0.966811 451.095 0.901102C451.069 0.835394 451.029 0.775614 450.979 0.725221C450.93 0.674828 450.87 0.634824 450.805 0.607523C450.739 0.580222 450.669 0.566167 450.598 0.566171H441.156C441.013 0.567689 440.877 0.625447 440.777 0.7269C440.676 0.828354 440.62 0.96531 440.62 1.10803V5.78296C440.608 5.89661 440.553 6.00138 440.466 6.07546C440.379 6.14954 440.267 6.18724 440.153 6.18071H415.614C415.554 6.18463 415.494 6.17624 415.437 6.15606C415.38 6.13588 415.328 6.10432 415.283 6.06333C415.239 6.02233 415.204 5.97275 415.179 5.9176C415.155 5.86246 415.142 5.80292 415.141 5.74261V5.68497C415.139 5.67166 415.139 5.65792 415.141 5.64462V1.10803C415.141 0.96531 415.085 0.828354 414.985 0.7269C414.884 0.625447 414.748 0.567689 414.605 0.566171H405.18C405.037 0.566171 404.899 0.623259 404.797 0.724877C404.696 0.826494 404.639 0.964317 404.639 1.10803V5.78296C404.627 5.89556 404.573 5.99946 404.487 6.0734C404.401 6.14733 404.291 6.18572 404.177 6.18071H396.684C396.622 6.17516 396.56 6.1823 396.502 6.20167C396.443 6.22104 396.39 6.25224 396.344 6.29333C396.298 6.33441 396.261 6.3845 396.235 6.4405C396.209 6.49649 396.195 6.55718 396.194 6.6188V13.7148C396.195 13.8575 396.253 13.9938 396.354 14.0942C396.456 14.1946 396.593 14.2509 396.736 14.2509H404.085C404.5 14.2509 404.598 14.493 404.616 14.6486V20.2805C404.616 20.5802 404.858 20.8223 405.157 20.8223H414.594C414.736 20.8208 414.873 20.763 414.973 20.6616C415.074 20.5601 415.13 20.4232 415.13 20.2805V14.7927C415.128 14.7794 415.128 14.7658 415.13 14.7524V14.6717C415.13 14.516 415.216 14.2394 415.666 14.2336H440.067C440.476 14.2336 440.58 14.4757 440.597 14.6313V20.2632C440.597 20.4059 440.653 20.5428 440.754 20.6443C440.854 20.7457 440.99 20.8035 441.133 20.805H450.569C450.869 20.805 451.111 20.5629 451.111 20.2632V14.6717C451.111 14.516 451.192 14.2394 451.647 14.2336H459.141C459.283 14.2336 459.42 14.1771 459.52 14.0766C459.621 13.976 459.677 13.8397 459.677 13.6975V6.7168C459.677 6.57561 459.622 6.44012 459.522 6.33975C459.423 6.23938 459.288 6.18223 459.147 6.18071ZM255.559 9.63359C255.563 9.74406 255.589 9.85264 255.636 9.95252C255.684 10.0524 255.751 10.1414 255.834 10.2139C255.918 10.2865 256.015 10.341 256.121 10.3741C256.226 10.4071 256.337 10.418 256.447 10.406C261.716 10.406 289.598 9.97945 295.501 9.97945C300.049 9.97945 308.442 9.54712 312.921 8.78622C313.192 8.74011 313.613 8.45765 313.497 7.73133C313.382 7.00502 312.512 2.15715 312.345 1.63835C312.322 1.53223 312.279 1.43174 312.217 1.34295C312.154 1.25416 312.075 1.17892 311.983 1.1218C311.89 1.06467 311.788 1.02684 311.68 1.01061C311.573 0.994366 311.464 1.00005 311.359 1.02732C305.525 1.82651 299.642 2.21177 293.754 2.18021C293.754 2.18021 257.381 2.60677 256.447 2.60677C256.33 2.5961 256.212 2.61042 256.101 2.64881C255.99 2.68719 255.888 2.74875 255.802 2.82941C255.717 2.91007 255.649 3.00799 255.604 3.11669C255.56 3.22538 255.538 3.34237 255.542 3.45991L255.559 9.63359ZM275.055 27.584C275.128 27.5846 275.201 27.6003 275.269 27.63C275.336 27.6597 275.397 27.7028 275.447 27.7568C275.497 27.8107 275.536 27.8744 275.56 27.9438C275.585 28.0132 275.595 28.0869 275.591 28.1604C275.516 28.9501 275.447 29.5093 275.349 30.2644C275.345 30.2967 275.334 30.4489 275.539 30.4489H312.927C313.071 30.4489 313.208 30.506 313.31 30.6076C313.412 30.7092 313.469 30.847 313.469 30.9907V37.591C313.469 37.7312 313.414 37.8658 313.316 37.966C313.218 38.0662 313.084 38.1241 312.944 38.1271H273.965C273.798 38.1271 273.74 38.3288 273.74 38.3288L273.54 39.058C273.335 39.7872 273.115 40.5164 272.881 41.2456C272.872 41.2767 272.835 41.4416 273.083 41.4416H306.459C310.546 41.4416 310.535 45.3614 310.333 46.4682C309.755 49.2941 308.652 51.9865 307.082 54.4058C305.802 56.4521 303.3 59.098 300.994 61.1271C304.246 62.0782 307.572 62.5739 312.806 62.7642C312.884 62.7512 312.965 62.7571 313.041 62.7815C313.117 62.8059 313.186 62.848 313.242 62.9044C313.298 62.9607 313.34 63.0297 313.365 63.1055C313.389 63.1814 313.395 63.262 313.382 63.3406V70.9554C313.382 71.3474 313.117 71.4857 312.806 71.4857C304.807 71.4622 296.872 70.0762 289.339 67.3872C281.228 70.085 271.93 71.601 264.35 71.503C264.096 71.4972 263.583 71.4454 263.583 70.8689V63.3752C263.583 63.2938 263.6 63.2133 263.633 63.1389C263.665 63.0645 263.714 62.9979 263.774 62.9434C263.835 62.889 263.906 62.8479 263.983 62.823C264.061 62.7981 264.142 62.7898 264.223 62.7988C268.906 62.8237 273.574 62.2837 278.127 61.1905C274.995 58.8379 272.31 55.9425 270.201 52.6419C270.154 52.5646 269.407 51.3103 270.61 51.3103H280.537C280.675 51.2945 280.815 51.309 280.948 51.3528C281.08 51.3966 281.201 51.4686 281.303 51.5639C283.477 54.3523 286.301 56.5652 289.529 58.0085L289.823 57.8587L290.221 57.6281C295.132 54.8957 297.311 51.6734 298.245 49.3331C298.343 49.091 298.827 48.2609 297.824 48.2609H270.656C270.27 48.2609 270.184 48.503 270.184 48.503L269.876 49.204C266.571 56.6667 262.367 63.6982 257.358 70.1426C257.262 70.2602 257.125 70.3378 256.975 70.3602C256.825 70.3826 256.671 70.3482 256.545 70.2637C256.387 70.1703 254.609 68.9569 252.825 67.7337L252.469 67.4893C251.326 66.7088 250.187 65.9235 249.051 65.1333C249.051 65.1333 248.625 64.8912 248.982 64.3148C255.502 55.7028 260.303 46.9524 262.817 38.2712C262.851 38.1386 262.684 38.1386 262.684 38.1386H253.121C252.979 38.1386 252.843 38.0821 252.742 37.9816C252.641 37.881 252.585 37.7447 252.585 37.6025V31.0138C252.584 30.9429 252.598 30.8726 252.624 30.8069C252.651 30.7412 252.69 30.6814 252.74 30.631C252.79 30.5806 252.849 30.5406 252.915 30.5133C252.98 30.486 253.05 30.4719 253.121 30.4719H264.321C264.353 30.4754 264.385 30.4665 264.411 30.4473C264.437 30.428 264.454 30.3998 264.46 30.3682V30.397L264.502 30.0465C264.583 29.3686 264.64 28.8129 264.684 28.0912C264.691 27.9791 264.734 27.8722 264.806 27.7857C264.855 27.7219 264.919 27.6705 264.992 27.6355C265.065 27.6005 265.145 27.5828 265.226 27.584H275.055ZM306.384 12.7348C306.457 12.7279 306.53 12.737 306.599 12.7613C306.668 12.7856 306.73 12.8247 306.783 12.8757C306.835 12.9268 306.875 12.9886 306.901 13.0568C306.927 13.1251 306.937 13.1982 306.932 13.2709V17.1792L306.932 17.2213C306.938 17.2703 306.962 17.3154 306.999 17.348C307.036 17.3806 307.084 17.3985 307.134 17.3983H312.541C315.757 17.3983 316.466 19.6406 316.524 22.5689V27.9587C316.517 28.1016 316.457 28.2369 316.356 28.3381C316.254 28.4393 316.119 28.4993 315.976 28.5063H306.488C305.912 28.5063 305.912 27.9298 305.912 27.9298V25.5952C305.912 25.1571 305.808 24.8862 305.231 24.8862H262.165C262.098 24.8823 262.03 24.8922 261.966 24.9153C261.902 24.9384 261.844 24.9742 261.794 25.0205C261.745 25.0669 261.705 25.1228 261.678 25.1849C261.65 25.2471 261.636 25.3141 261.635 25.382V27.5782C261.631 27.7039 261.574 28.1201 261.001 28.1201H251.68C251.596 28.1295 251.511 28.1205 251.431 28.0935C251.351 28.0666 251.278 28.0224 251.217 27.9641C251.156 27.9059 251.109 27.8349 251.078 27.7563C251.047 27.6776 251.035 27.5932 251.04 27.509V18.143C251.046 18.0372 251.073 17.9335 251.12 17.8386C251.167 17.7437 251.233 17.6595 251.314 17.5913C251.395 17.523 251.49 17.4722 251.591 17.442C251.693 17.4117 251.8 17.4028 251.905 17.4155H259.9C259.928 17.4156 259.956 17.4099 259.982 17.3987C260.008 17.3876 260.032 17.3713 260.051 17.3507C260.07 17.3302 260.085 17.306 260.095 17.2795C260.105 17.2529 260.109 17.2247 260.108 17.1965V13.3228C260.108 13.1699 260.168 13.0233 260.276 12.9152C260.384 12.8071 260.531 12.7464 260.684 12.7464H269.527C269.601 12.7348 269.678 12.7403 269.75 12.7626C269.823 12.7848 269.889 12.8232 269.945 12.8748C270 12.9263 270.043 12.9898 270.071 13.0604C270.098 13.1311 270.109 13.207 270.103 13.2825V17.1907L270.104 17.2328C270.11 17.2818 270.133 17.3269 270.171 17.3595C270.208 17.3921 270.255 17.41 270.305 17.4098H278.254C278.282 17.4098 278.31 17.4041 278.336 17.393C278.362 17.3818 278.385 17.3655 278.405 17.345C278.424 17.3245 278.439 17.3002 278.449 17.2737C278.459 17.2472 278.463 17.2189 278.461 17.1907V13.317C278.461 13.1642 278.522 13.0175 278.63 12.9094C278.738 12.8013 278.885 12.7406 279.038 12.7406H288.261C288.335 12.7322 288.41 12.74 288.481 12.7634C288.552 12.7869 288.618 12.8253 288.672 12.8762C288.727 12.9272 288.77 12.9893 288.799 13.0584C288.827 13.1275 288.84 13.202 288.837 13.2767V17.185C288.835 17.2129 288.838 17.241 288.847 17.2675C288.857 17.294 288.871 17.3183 288.89 17.3389C288.909 17.3596 288.932 17.376 288.958 17.3872C288.983 17.3984 289.011 17.4041 289.039 17.404H296.729C296.757 17.4041 296.785 17.3983 296.811 17.3872C296.837 17.3761 296.86 17.3597 296.88 17.3392C296.899 17.3187 296.914 17.2945 296.924 17.2679C296.934 17.2414 296.938 17.2132 296.936 17.185V13.3113C296.936 13.1584 296.997 13.0118 297.105 12.9037C297.213 12.7956 297.36 12.7348 297.513 12.7348H306.384ZM327.073 13.5476H346.389C346.47 13.5476 346.626 13.5476 346.516 13.709C342.135 18.211 334.987 19.8942 328.958 20.8165C328.347 20.9145 327.966 21.0125 327.966 21.7907V27.9587C327.966 28.7196 328.543 28.6043 328.837 28.5697C335.892 27.7684 343.974 25.4742 348.683 22.2692C351.935 20.0556 354.448 18.0842 356.471 15.3519C362.074 23.2607 370.974 27.313 384.797 28.5639C385.063 28.5639 385.599 28.489 385.599 27.9875V21.589C385.599 20.8684 385.195 20.88 384.884 20.8511C377.39 20.0384 369.96 17.5942 366.15 13.709C366.04 13.5649 366.196 13.5419 366.271 13.5419H385.639C385.639 13.5419 386.169 13.5419 386.169 13.0404V5.92131C386.169 5.38522 385.535 5.41404 385.535 5.41404H362.42C362.103 5.41404 362.04 5.18923 362.034 5.07394V0.744868C362.039 0.683462 362.031 0.621737 362.011 0.56352C361.99 0.505304 361.959 0.451838 361.917 0.406438C361.875 0.361037 361.825 0.324671 361.769 0.299594C361.712 0.274517 361.652 0.261264 361.59 0.260657H351.139C351.067 0.258462 350.995 0.272698 350.929 0.302298C350.862 0.331898 350.804 0.376092 350.757 0.431562C350.711 0.487032 350.677 0.552337 350.66 0.622574C350.642 0.692811 350.64 0.766154 350.655 0.837098V5.0797C350.655 5.19499 350.58 5.37945 350.274 5.40828H327.009C326.948 5.40273 326.886 5.40987 326.828 5.42924C326.769 5.44861 326.715 5.47981 326.669 5.5209C326.623 5.56198 326.586 5.61207 326.56 5.66806C326.535 5.72406 326.521 5.78475 326.519 5.84637V13.0634C326.519 13.0634 326.496 13.5476 327.073 13.5476ZM388.521 29.8494C388.663 29.8494 388.8 29.9059 388.9 30.0064C389.001 30.1069 389.057 30.2433 389.057 30.3855V37.4296C389.057 37.5 389.044 37.5697 389.017 37.6347C388.99 37.6998 388.95 37.7589 388.9 37.8087C388.851 37.8584 388.792 37.8979 388.726 37.9249C388.661 37.9518 388.592 37.9657 388.521 37.9657H385.063C384.985 37.9596 384.908 37.9703 384.835 37.9972C384.762 38.024 384.696 38.0663 384.642 38.121C384.587 38.1758 384.545 38.2418 384.518 38.3145C384.491 38.3872 384.48 38.4649 384.486 38.5421C384.498 40.3712 384.514 42.8965 384.525 45.4928L384.527 46.071L384.531 46.9391C384.535 48.0949 384.538 49.2426 384.538 50.3263V51.644C384.536 54.0265 384.522 55.9385 384.486 56.6827C384.163 64.0842 382.757 68.004 376.289 71.307C375.263 71.8662 374.796 71.1629 374.796 71.1629C374.796 71.1629 373.77 69.814 372.665 68.3556L372.427 68.0421C371.275 66.5226 370.11 64.98 369.983 64.7932C369.724 64.4128 370.029 64.0496 370.386 63.8709C373.753 62.2165 374.179 60.4699 374.179 55.478V38.5709C374.186 38.497 374.177 38.4226 374.153 38.3524C374.129 38.2823 374.09 38.2179 374.039 38.1636C373.989 38.1093 373.928 38.0662 373.859 38.037C373.791 38.0079 373.718 37.9934 373.643 37.9945H324.19C324.048 37.9945 323.911 37.9382 323.809 37.8378C323.708 37.7375 323.65 37.6011 323.649 37.4584V30.3855C323.65 30.2428 323.708 30.1064 323.809 30.006C323.911 29.9057 324.048 29.8494 324.19 29.8494H388.521ZM362.178 42.0296C365.352 42.0296 367.93 44.5965 367.942 47.7709V61.9226C367.942 65.1062 365.362 67.687 362.178 67.687H333.811C330.628 67.687 328.047 65.1062 328.047 61.9226V47.794C328.047 44.6103 330.628 42.0296 333.811 42.0296H362.178ZM357.267 48.9642H338.728C338.497 48.9642 338.275 49.0557 338.111 49.2188C337.947 49.3818 337.854 49.6032 337.852 49.8346V59.8243L337.856 59.9108C337.878 60.1266 337.979 60.3267 338.14 60.4717C338.302 60.6167 338.511 60.6962 338.728 60.6947H357.272C357.503 60.6947 357.725 60.603 357.888 60.4398C358.051 60.2766 358.143 60.0552 358.143 59.8243V50.0998L358.137 49.8346L358.132 49.751C358.11 49.5362 358.01 49.3371 357.85 49.1919C357.69 49.0467 357.483 48.9656 357.267 48.9642ZM456.207 62.8449H413.009C412.679 62.8493 412.359 62.7354 412.106 62.5239C411.853 62.3123 411.685 62.0172 411.631 61.692C411.587 61.4151 411.631 61.1314 411.758 60.8811C411.884 60.6308 412.085 60.4265 412.334 60.297L446.344 43.2689L451.209 40.796C452.141 40.3001 453.005 39.6859 453.78 38.9687C454.554 38.2292 455.165 37.3357 455.573 36.3459C455.96 35.3318 456.155 34.2549 456.149 33.1697C456.181 28.874 452.793 25.3301 448.5 25.1687H400.627C400.484 25.1687 400.348 25.2252 400.247 25.3257C400.147 25.4262 400.09 25.5626 400.09 25.7048V33.1985C400.09 33.4925 400.327 33.7317 400.621 33.7346H442.591C442.787 33.7328 442.977 33.8068 443.119 33.941C443.262 34.0752 443.348 34.2594 443.358 34.4551C443.355 34.5891 443.316 34.7199 443.245 34.8335C443.174 34.9472 443.074 35.0395 442.955 35.1008L442.638 35.2737L442.47 35.3659L441.773 35.7348C436.516 38.5421 406.305 53.2587 403.463 55.2589C403.134 55.4607 402.823 55.6739 402.523 55.8872C401.917 56.2966 401.365 56.7808 400.88 57.3283C400.782 57.4379 400.69 57.5474 400.604 57.6627L400.575 57.6973C400.488 57.8023 400.407 57.912 400.333 58.0258L400.298 58.0719C400.217 58.1815 400.148 58.291 400.073 58.4063V58.4524C399.831 58.8351 399.623 59.2382 399.451 59.6572C399.399 59.784 399.347 59.9223 399.295 60.0549L399.26 60.1644C399.22 60.2682 399.191 60.3719 399.157 60.4815L399.116 60.6256C399.116 60.7236 399.064 60.8158 399.041 60.9138C399.018 61.0118 399.041 61.0233 399.001 61.081C398.961 61.1386 398.961 61.2654 398.943 61.3576C398.926 61.4499 398.943 61.4787 398.943 61.5364C398.943 61.594 398.915 61.7266 398.903 61.8188C398.891 61.911 398.903 61.9341 398.903 61.9917C398.903 62.0494 398.903 62.1993 398.874 62.303C398.877 62.3549 398.877 62.4068 398.874 62.4587V63.9286C398.874 63.9805 398.874 64.1073 398.909 64.1937C398.943 64.2802 398.909 64.309 398.938 64.3667C398.966 64.4243 398.938 64.5281 398.978 64.6088C399.018 64.6895 399.007 64.7241 399.018 64.7817L399.07 65.0123L399.122 65.191C399.122 65.2659 399.162 65.3409 399.185 65.41C399.201 65.4706 399.22 65.5305 399.243 65.5887L399.312 65.802L399.381 65.9807C399.381 66.0499 399.433 66.1191 399.462 66.1882L399.537 66.3612C399.537 66.4246 399.595 66.4937 399.629 66.5572C399.664 66.6206 399.681 66.6724 399.71 66.7301C399.739 66.7877 399.779 66.8569 399.808 66.9203C399.837 66.9837 399.871 67.0356 399.906 67.0875L400.01 67.2719L400.114 67.4391L400.223 67.6178L400.333 67.7734L400.454 67.9464L400.575 68.102L400.702 68.2692L400.828 68.4191L400.961 68.5747L401.093 68.7188L401.238 68.8687L401.376 69.007L401.526 69.1511L401.67 69.2837L401.826 69.4163L401.975 69.5431L402.137 69.6699L402.298 69.791L402.465 69.9063L402.627 70.0216L402.8 70.1311L402.973 70.2406L403.146 70.3386L403.324 70.4366L403.503 70.5288L403.687 70.6211L403.872 70.7075L404.062 70.7882L404.247 70.8632L404.443 70.9381L404.633 71.0015L404.835 71.0649L405.031 71.1226L405.232 71.1802L405.434 71.2263L405.636 71.2724L405.843 71.307C405.913 71.307 405.982 71.307 406.051 71.3416H456.27C456.413 71.3416 456.55 71.2853 456.652 71.1849C456.753 71.0846 456.811 70.9482 456.812 70.8055V63.381C456.813 63.3043 456.797 63.2285 456.766 63.1585C456.735 63.0885 456.689 63.026 456.632 62.9752C456.574 62.9244 456.507 62.8864 456.433 62.864C456.36 62.8415 456.283 62.835 456.207 62.8449ZM113.738 70.8747C113.748 71.0352 113.821 71.1854 113.94 71.2931C114.06 71.4008 114.217 71.4575 114.377 71.4511H129.653C129.814 71.4574 129.972 71.4008 130.092 71.2933C130.213 71.1858 130.287 71.0357 130.299 70.8747V2.43384C130.287 2.27284 130.213 2.12277 130.092 2.01524C129.972 1.90772 129.814 1.85113 129.653 1.8574H114.377C114.217 1.8512 114.06 1.90797 113.94 2.01563C113.821 2.12329 113.748 2.27334 113.738 2.43384V70.8747ZM1.41805 70.8747C1.42988 71.0358 1.50383 71.1859 1.6243 71.2935C1.74476 71.401 1.9023 71.4576 2.06366 71.4511H17.3393C17.5001 71.4575 17.657 71.4008 17.7765 71.2931C17.8961 71.1854 17.9688 71.0352 17.9792 70.8747V27.7857C17.9688 27.6252 17.8961 27.475 17.7765 27.3673C17.657 27.2596 17.5001 27.2029 17.3393 27.2093H2.06366C1.90192 27.2014 1.74356 27.2574 1.62277 27.3652C1.50198 27.4731 1.42845 27.6241 1.41805 27.7857V70.8747ZM103.656 59.7033L96.0985 53.6391C95.9468 53.5162 95.8411 53.3455 95.7988 53.1549C95.7519 52.9595 95.7807 52.7535 95.8794 52.5785C104.36 36.6168 99.5318 16.8333 84.6515 6.57326C69.7724 -3.68681 49.5641 -1.16661 37.66 12.4351C25.7565 26.0356 25.9352 46.399 38.0762 59.7886C50.2178 73.1782 70.4665 75.3427 85.1634 64.8226C85.3095 64.7123 85.4876 64.6526 85.6707 64.6526C85.8538 64.6526 86.0319 64.7123 86.1779 64.8226L94.2827 71.3307C94.3499 71.3833 94.4269 71.4222 94.5092 71.4449C94.5915 71.4676 94.6775 71.4738 94.7622 71.4631C94.8469 71.4524 94.9286 71.425 95.0026 71.3824C95.0767 71.3399 95.1415 71.2831 95.1935 71.2154L103.759 60.614C103.866 60.4792 103.914 60.3079 103.895 60.1373C103.875 59.9668 103.789 59.8108 103.656 59.7033ZM68.118 56.4637C57.0677 58.4812 46.3862 50.9125 44.3456 39.6201C42.305 28.3276 49.6489 17.5193 60.7165 15.5191C71.7842 13.5188 82.4311 21.0702 84.489 32.3627C86.5469 43.6551 79.1857 54.4461 68.118 56.4637ZM228.334 1.84011H213.058C212.898 1.8339 212.741 1.89067 212.621 1.99833C212.502 2.106 212.429 2.25605 212.419 2.41655V70.8747C212.429 71.0352 212.502 71.1854 212.621 71.2931C212.741 71.4008 212.898 71.4575 213.058 71.4511H228.334C228.495 71.4573 228.652 71.4006 228.771 71.2929C228.891 71.1852 228.963 71.0352 228.974 70.8747V2.43384C228.971 2.35282 228.952 2.27319 228.918 2.19949C228.885 2.12579 228.837 2.05947 228.777 2.00432C228.718 1.94918 228.648 1.90629 228.572 1.87811C228.496 1.84994 228.415 1.83702 228.334 1.84011ZM9.7015 0.473941C4.34348 0.473941 0 4.81742 0 10.1754C0 15.5335 4.34348 19.8769 9.7015 19.8769C15.0595 19.8769 19.403 15.5335 19.403 10.1754C19.403 8.90142 19.1521 7.63988 18.6645 6.46284C18.177 5.2858 17.4624 4.21631 16.5615 3.31545C15.6606 2.41458 14.5911 1.69997 13.4141 1.21242C12.2371 0.724877 10.9755 0.473941 9.7015 0.473941ZM204.331 1.84011H188.047C187.913 1.83911 187.781 1.87252 187.664 1.93712C187.547 2.00173 187.448 2.09536 187.378 2.20903L172.252 29.0827C172.252 29.0827 172.143 29.2845 171.993 29.2845C171.843 29.2845 171.733 29.0827 171.733 29.0827L156.608 2.20903C156.537 2.09536 156.439 2.00173 156.321 1.93712C156.204 1.87252 156.073 1.83911 155.939 1.84011H139.66C139.531 1.84097 139.404 1.87728 139.293 1.94511C139.183 2.01293 139.093 2.10968 139.034 2.22488C138.974 2.34008 138.948 2.46933 138.956 2.59862C138.965 2.72792 139.009 2.85234 139.084 2.9584L163.294 43.6724C163.525 44.0655 163.647 44.5134 163.646 44.9694V70.7594C163.647 70.9464 163.723 71.1253 163.856 71.257C163.988 71.3888 164.168 71.4627 164.355 71.4627H179.665C179.852 71.4627 180.032 71.3888 180.165 71.257C180.297 71.1253 180.373 70.9464 180.374 70.7594V44.9694C180.373 44.5134 180.495 44.0655 180.726 43.6724L204.936 2.9584C205.013 2.85044 205.058 2.72324 205.065 2.59118C205.073 2.45913 205.044 2.32749 204.981 2.21114C204.918 2.09479 204.824 1.99839 204.709 1.93282C204.594 1.86725 204.463 1.83513 204.331 1.84011Z",
			fill: "url(#iqiyiGrad)"
		}), u("defs", { children: u("linearGradient", {
			id: "iqiyiGrad",
			x1: "0",
			y1: "0.26",
			x2: "459.68",
			y2: "0.26",
			gradientUnits: "userSpaceOnUse",
			children: [u("stop", { "stop-color": "#00DC5A" }), u("stop", {
				offset: "1",
				"stop-color": "#00DC5A"
			})]
		}) })]
	});
	var LogoYoukuCombined = (props) => u("svg", {
		width: "213",
		height: "72",
		viewBox: "0 0 213 72",
		fill: "none",
		...props,
		children: [
			u("path", {
				"fill-rule": "evenodd",
				"clip-rule": "evenodd",
				d: "M209.481 28.0742V28.0682H201.254V19.9466H208.007V19.9405C209.951 19.9405 211.526 18.3641 211.526 16.4196C211.526 14.4752 209.951 12.8981 208.007 12.8981H201.254V7.45862H201.251C201.236 5.48832 199.637 3.89481 197.663 3.89481C195.69 3.89481 194.092 5.48832 194.076 7.45862H194.074V12.8981H190.475C190.694 12.0213 191.112 9.89813 191.112 9.6275C191.112 7.75896 189.597 6.24355 187.73 6.24355C186.14 6.24355 184.815 7.34586 184.454 8.82552C184.454 8.82552 183.533 13.8899 181.541 19.7018C181.541 19.7018 181.363 20.4257 181.363 20.8146C181.363 22.6242 182.828 24.0907 184.636 24.0907C186.069 24.0907 187.273 23.1649 187.717 21.8833C187.717 21.8833 188 21.1209 188.389 19.9466H194.074V28.0682L184.943 28.0742C182.999 28.0742 181.424 29.6507 181.424 31.5951C181.424 33.5396 182.999 35.1166 184.943 35.1166H209.481C211.424 35.1166 213 33.5396 213 31.5951C213 29.6507 211.424 28.0742 209.481 28.0742ZM163.671 19.6783H165.383V13.2894H163.671V19.6783ZM157.673 60.9243C156.804 60.9243 156.101 60.2208 156.101 59.3523V55.0008H173.025C173.025 55.0008 173.018 59.3468 173.018 59.3523C173.018 60.2208 172.314 60.9243 171.446 60.9243H157.673ZM157.799 30.7669C157.799 35.2185 156.337 38.8967 156.101 39.4617V27.6123C156.101 26.7438 156.804 26.0403 157.673 26.0403H157.799V30.7669ZM165.407 41.4221C165.526 43.4237 167.17 45.0145 169.201 45.0145H173.025V48.6388H156.101V46.0464C156.597 45.6833 163.671 40.3324 163.671 30.7669V26.0403H165.384L165.407 41.4221ZM171.454 26.0403C172.321 26.0403 173.023 26.7427 173.025 27.6096V39.3978H172.137C171.65 39.3978 171.255 39.0029 171.255 38.5161V26.0403H171.454ZM173.834 19.6783H171.255V13.2894H175.62V13.2828C177.563 13.2828 179.139 11.7069 179.139 9.76243C179.139 7.81743 177.563 6.24151 175.62 6.24151H153.192C151.249 6.24151 149.673 7.81743 149.673 9.76243C149.673 11.7069 151.249 13.2828 153.192 13.2828C153.24 13.2828 157.799 13.2894 157.799 13.2894V19.6783H155.292C152.214 19.6783 149.721 22.1558 149.681 25.2251H149.673L149.681 61.7428C149.723 64.7494 152.121 67.1724 155.113 67.2687C155.113 67.2687 173.802 67.2863 173.834 67.2863C176.773 67.2863 179.158 65.0211 179.405 62.1449L179.448 25.2454C179.418 22.1662 176.919 19.6783 173.834 19.6783ZM204.707 59.493C204.707 60.2773 204.071 60.9127 203.287 60.9127H191.33C190.546 60.9127 189.91 60.2773 189.91 59.493V46.6706C189.91 45.8857 190.546 45.2498 191.33 45.2498H203.287C204.071 45.2498 204.707 45.8857 204.707 46.6706V59.493ZM206.265 38.8906H188.352C185.713 38.9742 183.597 41.0672 183.463 43.6953V62.4677C183.597 65.0958 185.713 67.1883 188.352 67.273H206.265C208.904 67.1883 211.02 65.0958 211.154 62.4677V43.6953C211.02 41.0672 208.904 38.9742 206.265 38.8906ZM94.5008 4.62836C96.5745 4.65113 98.348 6.2419 98.2913 8.34972C98.2287 10.6754 94.4524 18.8591 92.4507 22.4416V64.3527C92.4507 66.4253 90.7712 68.1057 88.6998 68.1057C86.6283 68.1057 84.9488 66.4253 84.9488 64.3527V33.5687C83.8339 34.9516 83.1192 35.7249 83.1192 35.7249C82.3089 36.5759 81.3358 37.3465 80.0642 37.3586C77.9905 37.3784 76.404 35.7084 76.2737 33.6375C76.1835 32.1996 77.2825 31.0418 77.2825 31.0418C86.6085 20.3553 89.531 11.3316 90.9307 7.33761C90.9307 7.33761 91.8224 4.59998 94.5008 4.62836ZM112.286 3.97979C114.551 3.97979 116.387 5.81643 116.387 8.08266L116.388 21.3847H136.301C138.229 21.3847 139.791 22.9485 139.791 24.877C139.791 26.8055 138.229 28.3693 136.301 28.3693H126.654V57.1928C126.68 58.4976 127.735 59.5487 129.044 59.5515H132.447C133.773 59.5487 134.847 58.4739 134.847 57.1472C134.847 57.1389 135.29 53.0097 135.29 53.0097C135.576 51.3424 137.018 50.0702 138.766 50.0702C140.72 50.0702 142.303 51.6543 142.303 53.6081C142.303 53.678 142.15 59.1664 140.992 61.8034L140.848 62.0745C139.219 65.0292 136.145 67.0927 132.584 67.2886H127.082C122.702 67.2886 119.152 63.7369 119.152 59.354V28.3693H116.336C115.832 50.4044 103.866 63.3231 101.955 65.2491L101.845 65.3591C101.781 65.422 101.737 65.4641 101.715 65.4851L101.699 65.5009L101.667 65.5294C101.43 65.7415 99.8954 67.0651 98.5243 67.0064C96.2615 66.9101 94.4962 65.1687 94.4231 62.9035C94.3762 61.4354 95.5451 60.1194 95.8264 59.8246L95.8865 59.7633C105.924 48.1136 107.815 36.4414 108.128 28.3693H99.0801C97.1526 28.3693 95.5897 26.8055 95.5897 24.877C95.5897 22.9485 97.1526 21.3847 99.0801 21.3847H108.186V8.08266C108.186 5.81643 110.021 3.97979 112.286 3.97979ZM124.984 4.62325C126.002 4.62325 126.907 5.07429 127.536 5.77782L127.545 5.76956C127.545 5.76956 130.106 8.21462 132.883 10.8485L133.301 11.2447C133.65 11.5756 134.001 11.9077 134.348 12.2366C134.358 12.2454 134.368 12.2536 134.377 12.263C134.383 12.269 134.389 12.2745 134.395 12.28C134.986 12.8901 135.354 13.7184 135.354 14.6348C135.354 16.4957 133.846 18.0039 131.987 18.0039C131.124 18.0039 130.346 17.67 129.75 17.1365L129.742 17.1447C129.742 17.1447 127.073 14.8009 124.252 12.124L123.828 11.7202C123.403 11.3145 122.978 10.9035 122.561 10.494C122.558 10.4913 122.555 10.4891 122.552 10.4869C122.548 10.483 122.545 10.4792 122.541 10.4753C121.929 9.85319 121.55 9.00115 121.55 8.06C121.55 6.16121 123.087 4.62325 124.984 4.62325Z",
				fill: "white"
			}),
			u("path", {
				d: "M21.0937 34.6649L23.392 35.9999L51.6 52.3911L21.1541 70.0953C14.4083 74.0156 5.78419 71.6909 1.89135 64.8976C-2.0015 58.1043 0.306984 49.4194 7.05277 45.4991L21.0545 37.359C21.517 37.0853 21.8275 36.5792 21.8275 36C21.8275 35.4374 21.5345 34.9436 21.0937 34.6649Z",
				fill: "url(#youkuGrad1)"
			}),
			u("path", {
				d: "M51.6 19.6034L21.1541 1.90467C14.4083 -2.0156 5.78419 0.309146 1.89135 7.10244C-2.0015 13.8957 0.306984 22.5806 7.05277 26.5009L23.3973 36.0027L51.6 52.3966C64.1333 45.1098 64.1333 26.8902 51.6 19.6034Z",
				fill: "url(#youkuGrad2)"
			}),
			u("defs", { children: [u("linearGradient", {
				id: "youkuGrad1",
				x1: "1454.89",
				y1: "2118.1",
				x2: "3571.47",
				y2: "554.74",
				gradientUnits: "userSpaceOnUse",
				children: [u("stop", { "stop-color": "#FF8000" }), u("stop", {
					offset: "1",
					"stop-color": "#FF6400"
				})]
			}), u("linearGradient", {
				id: "youkuGrad2",
				x1: "1113.55",
				y1: "1683.32",
				x2: "5556.74",
				y2: "4316.43",
				gradientUnits: "userSpaceOnUse",
				children: [
					u("stop", { "stop-color": "#00C1FF" }),
					u("stop", {
						offset: "0.39753",
						"stop-color": "#09B2FF"
					}),
					u("stop", {
						offset: "1",
						"stop-color": "#2C78FF"
					})
				]
			})] })
		]
	});
	var LogoTencentCombined = (props) => u("svg", {
		width: "284",
		height: "72",
		viewBox: "0 0 284 72",
		fill: "none",
		...props,
		children: [u("mask", {
			id: "tencentMask",
			"mask-type": "luminance",
			maskUnits: "userSpaceOnUse",
			x: "2",
			y: "6",
			width: "280",
			height: "63",
			children: u("path", {
				d: "M281.75 6.16H2.25v62.46h279.5V6.16Z",
				fill: "white"
			})
		}), u("g", {
			mask: "url(#tencentMask)",
			children: [
				u("path", {
					d: "M13.8 52.88c1.53 10.3 3.36 18.04 15.28 14.18 11.44-3.68 22.45-10.22 32.11-17.63 3.46-2.97 9.5-7.15 9.62-12.07-.12-4.93-6.16-9.1-9.62-12.07-9.68-7.41-20.67-13.94-32.11-17.63C17.16 3.82 15.33 11.56 13.8 21.85c-1.19 10.31-1.19 20.72 0 31.03Z",
					fill: "#0098FF"
				}),
				u("path", {
					d: "M3.4 23.77c1.3-6.81 3.27-11.75 12.06-14.06-.76 2.67-1.31 5.39-1.66 8.14-1.18 10.31-1.18 20.72 0 31.03.35 2.75.9 5.47 1.66 8.14-8.8 2.3-10.75-2.65-12.06-9.46l-.1-.49-.17-.98c-1.1-8.04-1.1-16.2 0-24.24l.17-.98.1-.5Z",
					fill: "#FF8800"
				}),
				u("path", {
					d: "M15.46 13.71c.6.12 1.25.27 1.96.46 10.67 2.88 20.95 7.98 29.97 13.77 3.22 2.32 8.86 5.58 8.97 9.43-.1 3.85-5.75 7.11-8.97 9.43-9.02 5.79-19.3 10.89-29.97 13.77a44.9 44.9 0 0 1-1.96.46 43.2 43.2 0 0 1-1.66-8.14C12.61 42.58 12.61 32.17 13.8 21.86c.35-2.73.9-5.44 1.64-8.09l.02-.06Z",
					fill: "#43E700"
				}),
				u("path", {
					d: "M21.75 27.58s-.65 1.06-.65 9.8c0 8.75.65 9.75.65 9.75.22 1.09.66 1.43 1.85 1.16 0 0 1.96-.3 9.8-4.29 7.84-3.98 9.15-5.49 9.15-5.49.84-.85 1.07-1.41 0-2.3 0 0-2.15-1.98-9.15-5.6-6.99-3.62-9.8-4.19-9.8-4.19-.96-.27-1.58.04-1.85 1.16Z",
					fill: "white"
				}),
				u("path", {
					"fill-rule": "evenodd",
					"clip-rule": "evenodd",
					d: "M252.64 37.47c-1.33 10.61-5.84 16.19-17.96 17.57l.02 4.59c16.96-1.85 20.82-10.23 22.33-22.16h-4.39Zm3.23 17.69v4.48l.02-.01c6.31-2.18 10.24-5.28 12.38-8.61 2.98 2.5 5.58 5.31 7.81 8.49h5.52c-2.5-3.62-5.52-7-8.57-9.19h-4.34c1.15-2.05 1.65-4.16 1.62-6.19 0-1.16.01-2.36.02-4.08.02-2.17.04-5.17.04-9.98h-3.92c.03 4.2-.09 11.06-.42 15.17-.34 4.51-4.07 7.53-10.17 9.91ZM273.28 28.47v19.77l4.49-.01V27.36c.05-1.47-.15-2.32-.61-2.78-.46-.47-1.26-.67-2.62-.67h-5.03l1.64-4.8h7.7V15.47h-20.96v3.66h8.82l-1.73 4.8H259.1l-.19 24.32h4.12l.18-20.78h9.12c.13-.01.26 0 .38.05.13.04.24.1.34.19.09.1.16.22.2.35.05.13.06.27.05.4ZM237.91 36.06c-.87 3.94-2.08 7.8-3.62 11.52h4.54c1.42-3.74 2.51-7.6 3.27-11.52h-4.19Zm6.91-3.45-1.28 13.6 4.56.03 1.21-13.63h8v-3.79h-7.71v-4.91h6.83v-3.63h-6.83v-5.71h-4.51v14.46h-3.35v-10.02h-4.35v10.02h-2.75v3.8h10.17Z",
					fill: "white"
				}),
				u("path", {
					d: "M217.26 59.42c-.46 0-.9-.18-1.22-.5-.32-.32-.5-.75-.5-1.2V47.72l-.56 1.16c-2.09 4.26-8.29 9.74-14.96 10.75v-4.36c6.17-1.43 10.6-6.16 12.54-11.9 1.46-4.24 1.33-9.47 1.18-15.72-.04-1.64-.09-3.36-.1-5.14h4.66c.05 11.31-.28 17.42-1.64 22.3l-.1.35h3.64v9.81h9.96l-.65 4.43-12.25.02ZM190.54 59.42V38.7c-2.04 2.44-4.32 4.67-6.81 6.66v-5.84c9.34-8.6 10.73-12.23 11.42-14.04.03-.08.06-.16.09-.24.02-.06.03-.11.02-.17 0-.06-.03-.11-.06-.16a.39.39 0 0 0-.13-.1.35.35 0 0 0-.16-.04h-10.4v-3.91h14.8c.24 0 .47.05.69.16.22.1.41.26.55.45.14.19.25.41.3.64.05.24.04.48-.02.71-.97 3.64-5.6 10.97-5.6 10.97v.74h3.62c1.1 1.84 2.5 5.23 3.34 7.32h-4.67c-.68-1.98-1.44-3.93-2.28-5.85v23.43h-4.7ZM222.4 44.4V20.25c0-.26-.1-.51-.3-.7-.18-.18-.43-.29-.7-.29h-12.06v25.03h-4.6V15.63h19.6c.73 0 1.44.29 1.96.81.52.52.81 1.22.81 1.95v26.01h-4.71Z",
					fill: "white"
				}),
				u("path", {
					d: "M146.72 28.09h-10.33v3.95h5.23l-.49 25.7c0 .21.04.43.12.63.08.2.2.39.35.54.15.16.34.28.54.36.2.09.42.13.64.14h9.07v-4.43h-5.44l.32-25.9Zm1.07-3.19h-5c-.59-1.71-1.2-3.46-1.79-5.12-.58-1.66-1.17-3.33-1.74-4.99h4.76l3.77 10.11ZM176.43 54.97l.2-36.64c0-.4-.08-.81-.23-1.19-.15-.38-.38-.72-.67-1.01-.29-.3-.63-.52-1.01-.68-.38-.16-.79-.24-1.2-.24h-23.29v3.95h20.28c.24 0 .48.1.65.27.17.17.27.4.27.65 0 0-.1 31.84-.15 37.68 0 .22.05.43.13.63.08.2.2.38.35.54.15.15.34.28.54.36.2.08.42.12.64.13h9.42l.65-4.44h-6.57Zm-13.57-34.05-.03 13.32h6.8v4.26h-6.82l-.17 20.92h-5.06l.16-20.92h-6.94v-4.26h6.96l.06-13.35 5.04.03Z",
					fill: "white"
				}),
				u("path", {
					d: "M190.99 20.85h4.7l-2.71-6.13h-4.6c.79 1.54 2.24 5.05 2.6 6.13ZM104.69 49.97h18.28v3.45H104.7v-3.45Zm21.33-11.87c2.12 1.21 4.4 2.1 6.79 2.63v-3.99c-2.87-.72-7.21-2.72-8.97-5.13l-.27-.37h8.17v-3.45h-13.02l.08-.35c.05-.22.1-.46.16-.67.14-.54.25-1.09.34-1.64v-.18h10.7v-3.55h-3.03l.12-.37c.6-1.87 1.08-3.78 1.44-5.72h-4.78c-.28 2.01-.71 3.99-1.29 5.94l-.04.15h-2.61v-.31c.09-2.22 0-4.44-.3-6.64h-4.86c.28 2.24.38 4.5.3 6.75v.2h-2.8l-.42-1.07c-.7-1.79-1.3-3.34-1.9-5.02h-4.82l2.3 6.09h-2.26v3.55h9.37l-.07.34c-.15.8-.37 1.6-.66 2.37l-.05.13h-10.06v3.45h8.29l-.38.43c-1.7 1.94-4.83 3.52-8.1 4.48v4.54c1.43-.37 2.82-.88 4.14-1.53l.73-.38h12.63v5.15h-8.39v-3.4h-4.79v6.9h16.87c.18-.02.37 0 .55.07.18.06.34.16.48.28.12.13.2.28.26.45.05.16.07.34.05.52v7.14h-15.34v3.6h20.2c.05-4.52.08-9.66 0-13.43.02-.29-.02-.58-.11-.85-.1-.27-.25-.52-.43-.74-.5-.46-1.38-.55-2.27-.55h-2.36l.09-6.04.34.2Zm-12.77-2.68.5-.46c1.23-1.1 2.35-2.32 3.34-3.65l.07-.1h1.72l.1.14c.85 1.33 1.86 2.55 3 3.65l.46.42-9.19.01Z",
					fill: "white"
				}),
				u("path", {
					d: "M88.74 15.74h9.43c1.55 0 2.45.24 2.84.63.4.38.6 1.02.6 2.02v41.12h-4.67l.17-15.87h-3.97v.2c-.12 5.2-.46 10.48-1.01 15.67h-4.55c.65-5.27 1.03-10.57 1.14-15.88V15.74Zm4.41 24.24h3.97l.08-8.62h-4.07l.02 8.62Zm0-12.22h4.07l.09-6.93c.02-.17 0-.34-.05-.5a1.37 1.37 0 0 0-.25-.45.95.95 0 0 0-.51-.26c-.19-.05-.39-.07-.58-.06h-2.77v8.2Z",
					fill: "white"
				})
			]
		})]
	});
	var LogoBilibiliCombined = (props) => u("svg", {
		width: "140",
		height: "64",
		viewBox: "0 0 140 64",
		fill: "none",
		...props,
		children: u("path", {
			d: "M129.988 57.0979C129.362 57.0979 128.828 57.1479 128.305 57.0879C127.243 56.9659 126.181 56.9899 125.118 56.9579C124.432 56.9399 124.452 56.9399 124.394 56.2761C124.224 54.2507 124.038 52.2273 123.856 50.2039C123.698 48.4264 123.548 46.6469 123.374 44.8714C123.216 43.2439 123.026 41.6204 122.854 39.9949C122.69 38.4673 122.538 36.9377 122.368 35.4122C122.153 33.4919 121.93 31.5725 121.701 29.6539C121.495 27.9584 121.291 26.2588 121.063 24.5653C120.706 21.9396 120.34 19.3151 119.967 16.6916C119.567 13.8964 119.087 11.1152 118.585 8.33805C118.495 7.8402 118.507 7.8222 118.983 7.74223C120.963 7.40432 122.952 7.11641 124.966 7.16039C125.184 7.16639 125.403 7.17039 125.619 7.19838C125.973 7.24237 126.157 7.41432 126.177 7.8262C126.247 9.26178 126.347 10.6974 126.453 12.1309C126.623 14.4803 126.807 16.8296 126.983 19.1769C127.095 20.6885 127.191 22.196 127.305 23.7036C127.487 26.1269 127.679 28.5482 127.863 30.9715C127.975 32.453 128.073 33.9386 128.187 35.4202C128.361 37.5956 128.551 39.7689 128.727 41.9423C128.838 43.3259 128.938 44.7115 129.056 46.0951C129.23 48.1445 129.418 50.1939 129.596 52.2433C129.73 53.8428 129.852 55.4464 129.988 57.0979ZM53.3544 7.18239C53.6443 7.18239 54.0822 7.1504 54.5141 7.19039C55.0639 7.24037 55.1699 7.38233 55.2039 7.93417C55.3618 10.4574 55.5098 12.9827 55.6777 15.508C55.8617 18.2312 56.0636 20.9504 56.2656 23.6696C56.4515 26.1669 56.6374 28.6641 56.8374 31.1614C57.0553 33.9046 57.2973 36.6438 57.5172 39.387C57.6831 41.4884 57.8251 43.5898 57.9971 45.6932C58.161 47.6446 58.353 49.5921 58.5289 51.5415C58.6789 53.219 58.8308 54.8985 58.9768 56.578C59.0228 57.1099 58.9848 57.1439 58.4109 57.1299C56.9094 57.0939 55.4158 56.9179 53.9142 56.9599C53.5703 56.9699 53.4704 56.812 53.4124 56.4861C53.2884 55.7763 53.3084 55.0545 53.2324 54.3367C53.0265 52.4392 52.9085 50.5338 52.7346 48.6323C52.5786 46.9048 52.3907 45.1813 52.2127 43.4558C52.0548 41.8783 51.8988 40.3008 51.7309 38.7212C51.5629 37.1717 51.385 35.6201 51.209 34.0686C51.0471 32.641 50.8891 31.2134 50.7172 29.7858C50.4632 27.6944 50.2113 25.603 49.9354 23.5156C49.6815 21.6002 49.3936 19.6908 49.1236 17.7773C48.7557 15.1781 48.3419 12.5848 47.884 10.0016C47.7793 9.41662 47.6687 8.83276 47.5521 8.25008C47.4921 7.95616 47.5461 7.78621 47.882 7.74023C48.7657 7.62226 49.6475 7.43831 50.5352 7.35234C51.423 7.27036 52.3107 7.10441 53.3544 7.18239ZM116.234 32.3911C117.926 32.3911 117.966 32.4031 118.238 33.9246C118.571 35.8021 118.805 37.6955 119.027 39.589C119.261 41.6064 119.497 43.6238 119.713 45.6432C119.887 47.2687 120.033 48.8983 120.197 50.5238C120.369 52.2273 120.551 53.9248 120.729 55.6263C120.827 56.588 120.919 57.5498 121.029 58.5095C121.061 58.7874 120.977 58.9353 120.703 58.9673C120.125 59.0333 119.551 59.1093 118.975 59.1713C117.92 59.2852 116.862 59.3972 115.804 59.4952C115.258 59.5452 115.222 59.5152 115.12 58.9873C114.193 54.1987 113.263 49.4141 112.343 44.6235C111.731 41.4384 111.136 38.2514 110.536 35.0663C110.455 34.6281 110.381 34.1888 110.312 33.7487C110.272 33.4967 110.34 33.3348 110.626 33.2668C112.531 32.8209 114.457 32.477 116.234 32.3911ZM45.1668 32.3911C46.9763 32.3911 46.9683 32.3971 47.2482 34.0386C47.68 36.5798 47.986 39.1351 48.2599 41.6984C48.5278 44.1856 48.8197 46.6709 49.0816 49.1582C49.2596 50.8597 49.3996 52.5652 49.5655 54.2647C49.6835 55.4744 49.8234 56.68 49.9514 57.8877C49.9674 58.0356 49.9754 58.1836 49.9854 58.3335C50.0114 58.9254 49.9854 58.9733 49.4155 59.0313C48.2859 59.1493 47.1542 59.2473 46.0245 59.3592C45.6147 59.3992 45.2068 59.4592 44.8009 59.4992C44.261 59.5492 44.243 59.5472 44.1371 59.0013C43.7572 57.0839 43.3893 55.1624 43.0174 53.245C42.1257 48.6263 41.2239 44.0117 40.3382 39.393C39.9843 37.5456 39.6804 35.6901 39.3325 33.8406C39.2685 33.5027 39.3165 33.3448 39.6664 33.2628C41.5538 32.8229 43.4533 32.479 45.1668 32.3911ZM69.0498 51.7574V59.5092C69.0498 59.5832 69.0418 59.6591 69.0518 59.7331C69.0898 60.109 68.9519 60.275 68.564 60.259C68.0541 60.237 67.5483 60.251 67.0384 60.263C65.9747 60.283 64.909 60.241 63.8474 60.3629C63.2595 60.4309 63.2715 60.3949 63.2135 59.7751C63.0396 57.8237 62.8496 55.8742 62.6717 53.9228C62.5077 52.1213 62.3598 50.3159 62.1918 48.5144C62.0219 46.6609 61.8319 44.8135 61.66 42.962C61.542 41.7263 61.4381 40.4927 61.3341 39.2571C61.1981 37.6495 61.0722 36.044 60.9302 34.4365C60.8702 33.7587 60.9202 33.6627 61.592 33.5927C63.3252 33.4019 65.0708 33.3477 66.8125 33.4308C67.2464 33.4548 67.6782 33.5387 68.0981 33.6407C68.628 33.7667 68.6859 33.8446 68.7139 34.3985C68.7719 35.5142 68.8299 36.6298 68.8599 37.7475C68.8939 38.9891 68.8659 40.2328 68.9119 41.4744C69.0278 44.8994 69.0098 48.3284 69.0498 51.7574ZM139.975 52.1093V59.4492C139.975 59.5732 139.971 59.6971 139.977 59.8231C140.003 60.145 139.853 60.259 139.547 60.257C138.796 60.251 138.046 60.257 137.296 60.267C136.448 60.275 135.603 60.271 134.757 60.3629C134.199 60.4269 134.195 60.3849 134.145 59.8311C133.915 57.2898 133.673 54.7486 133.441 52.2033C133.229 49.858 133.033 47.5107 132.817 45.1633C132.595 42.7421 132.353 40.3268 132.136 37.9075C132.028 36.6958 131.938 35.4842 131.848 34.2725C131.812 33.7447 131.87 33.6507 132.465 33.6027C133.501 33.5207 134.533 33.3808 135.577 33.3988C136.616 33.4188 137.658 33.3608 138.692 33.5587C139.567 33.7267 139.611 33.7767 139.663 34.7124C139.813 37.4656 139.767 40.2268 139.865 42.98C139.965 45.9111 139.895 48.8423 139.975 52.1093ZM114.469 19.0709C115.08 19.1069 115.562 19.0769 116.042 19.1829C116.348 19.2529 116.502 19.3908 116.532 19.7187C116.676 21.2963 116.832 22.8758 116.99 24.4554C117.116 25.737 117.25 27.0186 117.38 28.3003L117.392 28.3742C117.496 29.182 117.472 29.204 116.686 29.248C115.986 29.286 115.288 29.3479 114.589 29.3899C114.129 29.4179 113.983 29.4959 113.907 28.8261C113.645 26.4628 113.341 24.1055 113.051 21.7442C112.971 21.0805 112.881 20.418 112.783 19.7567C112.725 19.3828 112.871 19.1769 113.221 19.1469C113.681 19.1049 114.141 19.0929 114.469 19.0709ZM43.6312 19.0809C44.1031 19.1069 44.589 19.0709 45.0648 19.1809C45.3367 19.2429 45.4747 19.3569 45.5007 19.6668C45.5587 20.4065 45.6726 21.1443 45.7426 21.8841C45.9646 24.1535 46.1745 26.4248 46.3824 28.6961C46.4264 29.19 46.4164 29.2 45.9546 29.234C45.1348 29.294 44.313 29.3539 43.4913 29.3879C43.0134 29.4099 42.9534 29.3519 42.8934 28.8641C42.6855 27.1926 42.4896 25.5191 42.2896 23.8455C42.1277 22.4659 41.9917 21.0863 41.7958 19.7107C41.7418 19.3309 41.8657 19.2269 42.1697 19.1649C42.6515 19.0669 43.1354 19.0989 43.6312 19.0809ZM68.578 25.3311C68.578 26.7687 68.582 28.2043 68.576 29.6439C68.576 30.2897 68.568 30.2937 67.9262 30.2857C67.1541 30.2897 66.3824 30.2497 65.6148 30.1657C65.119 30.1037 65.109 30.1197 65.095 29.5939C65.045 27.8364 64.993 26.0789 64.957 24.3214C64.931 23.1318 64.917 21.9461 64.8451 20.7564C64.8071 20.1426 64.8411 20.1366 65.4309 20.1286C66.3006 20.1186 67.1684 20.1586 68.0321 20.2906C68.552 20.3706 68.576 20.3706 68.578 20.9464C68.582 22.408 68.582 23.8695 68.582 25.3331H68.578V25.3311ZM139.539 25.3691C139.539 26.8087 139.543 28.2463 139.537 29.6838C139.537 30.2877 139.527 30.2917 138.922 30.2877C138.126 30.2804 137.331 30.243 136.538 30.1757C136.144 30.1457 136.028 29.9798 136.054 29.6219C136.058 29.5719 136.054 29.5219 136.054 29.4719C135.994 26.6967 135.934 23.9235 135.878 21.1483C135.876 21.0004 135.868 20.8524 135.874 20.7025C135.882 20.1426 135.884 20.1286 136.446 20.1326C137.22 20.1366 137.988 20.1766 138.76 20.2526C139.701 20.3466 139.535 20.4625 139.539 21.2063C139.543 22.5919 139.541 23.9815 139.539 25.3691ZM41.6898 28.7441C41.7078 29.5339 41.7078 29.5319 40.952 29.7158C40.4382 29.8418 39.9243 29.9798 39.4065 30.0937C38.9646 30.1937 38.8866 30.1377 38.8106 29.7038C38.2828 26.7607 37.7569 23.8156 37.2331 20.8704C37.1271 20.2606 37.1551 20.2226 37.7549 20.1166C38.4927 19.9867 39.2285 19.8587 39.9663 19.7447C40.4362 19.6708 40.4961 19.6968 40.5901 20.2146C40.7761 21.2603 40.952 22.31 41.09 23.3637C41.3039 25.0312 41.4799 26.7047 41.6718 28.3742C41.6878 28.4962 41.6838 28.6222 41.6898 28.7441ZM108.198 20.2006C109.164 20.0427 110.138 19.8827 111.112 19.7287C111.462 19.6748 111.567 19.8947 111.613 20.2066C111.779 21.3583 111.987 22.5019 112.123 23.6556C112.323 25.3271 112.597 26.9906 112.649 28.6761C112.653 28.8481 112.651 29.024 112.655 29.196C112.665 29.4639 112.531 29.6019 112.283 29.6599C111.623 29.8078 110.964 29.9558 110.306 30.1137C109.99 30.1897 109.884 30.0557 109.832 29.7478C109.634 28.5762 109.406 27.4105 109.204 26.2428C108.862 24.3194 108.53 22.394 108.198 20.4685C108.19 20.3985 108.198 20.3246 108.198 20.2006ZM63.7834 26.9526C63.7554 27.9763 63.8174 28.8681 63.6774 29.7598C63.6354 30.0417 63.5534 30.2237 63.2495 30.2497C62.5977 30.3037 61.9479 30.3557 61.3001 30.4216C60.9862 30.4556 60.8982 30.3197 60.8462 30.0118C60.7003 29.102 60.7263 28.1803 60.6383 27.2666C60.4723 25.5411 60.4024 23.8036 60.2904 22.0721C60.2624 21.6502 60.2204 21.2323 60.1864 20.8104C60.1684 20.5745 60.2624 20.4425 60.5143 20.4325C61.3581 20.3985 62.1978 20.2446 63.0456 20.2746C63.5414 20.2926 63.5834 20.3246 63.6194 20.8244C63.6414 21.1703 63.6354 21.5202 63.6434 21.8681L63.7834 26.9526ZM134.715 25.9609C134.715 27.1526 134.729 28.3442 134.713 29.5359C134.703 30.1557 134.633 30.2097 134.047 30.2637C133.467 30.3177 132.891 30.3617 132.313 30.4236C131.988 30.4576 131.836 30.3617 131.816 29.9878C131.732 28.4042 131.618 26.8207 131.508 25.2391C131.422 23.9275 131.324 22.6179 131.232 21.3083C131.222 21.1583 131.23 21.0084 131.22 20.8604C131.206 20.5985 131.286 20.4445 131.58 20.4345C132.399 20.4065 133.213 20.2486 134.039 20.2786C134.543 20.2966 134.551 20.3046 134.589 20.8284C134.711 22.5359 134.723 24.2474 134.715 25.9609ZM39.2685 47.2607C40.3042 48.4004 40.3562 49.75 40.0143 51.1616C39.6704 52.5732 38.8866 53.7369 37.9369 54.7806C36.3433 56.524 34.4179 57.8117 32.3705 58.9054C28.8455 60.7888 25.1086 62.0404 21.2097 62.7802C18.4046 63.3101 15.5814 63.718 12.7282 63.8739C11.8585 63.9219 10.9907 63.9619 10.121 63.9559C9.49115 63.9559 8.85933 63.9739 8.23151 63.9519C7.69767 63.9319 7.61969 63.8399 7.57571 63.2821C7.41375 61.2807 7.27579 59.2772 7.09785 57.2758C6.88991 54.9565 6.64598 52.6392 6.42204 50.3199C6.25809 48.6423 6.11613 46.9608 5.93618 45.2873C5.72824 43.3159 5.49431 41.3485 5.26638 39.377C5.05844 37.5576 4.8585 35.7341 4.63856 33.9126C4.39263 31.8952 4.13871 29.8818 3.86878 27.8684C3.60459 25.9294 3.32933 23.9919 3.04302 22.0561C2.57759 18.8699 2.07102 15.6899 1.52347 12.5168C1.08039 9.92958 0.587104 7.35118 0.0438953 4.78309C-0.0280837 4.43919 0.075886 4.30123 0.377798 4.17526C3.27096 2.97561 6.15412 1.75397 9.04528 0.548316C9.58312 0.324381 10.135 0.136436 10.7068 0.0304665C11.1027 -0.043512 11.2047 0.0384642 11.1927 0.436349C11.1627 1.45405 11.2047 2.47576 11.1047 3.48946C11.0803 3.7614 11.0669 4.03421 11.0647 4.30722C11.0187 7.95616 10.9747 11.6071 11.0707 15.258C11.1547 18.4571 11.3226 21.6542 11.5086 24.8513C11.6545 27.3745 11.8645 29.8978 12.0804 32.4171C12.2923 34.8863 12.5503 37.3516 12.7922 39.8209C12.8382 40.2908 12.8802 40.3348 13.414 40.2628C14.466 40.1047 15.5274 40.0172 16.5911 40.0009C19.8961 39.9929 23.1472 40.4467 26.3622 41.2085C29.1754 41.8763 31.9126 42.766 34.5359 44.0097C35.8355 44.6255 37.0791 45.3373 38.2128 46.241C38.5987 46.545 38.9426 46.8948 39.2685 47.2607ZM109.696 46.6609C110.976 47.7826 111.442 49.1562 111.078 50.8557C110.776 52.2573 110.092 53.4349 109.18 54.4886C107.717 56.1821 105.939 57.4698 104.016 58.5455C100.245 60.6568 96.2279 62.0285 92.0052 62.8202C89.7004 63.2575 87.3756 63.5818 85.0392 63.7919C83.7156 63.9059 82.386 64.0479 80.9004 63.9559H79.1649C78.827 63.9559 78.6351 63.8499 78.6071 63.448C78.4791 61.6925 78.3311 59.9391 78.1732 58.1856C78.0052 56.3341 77.8193 54.4826 77.6433 52.6312C77.4834 50.9297 77.3354 49.2242 77.1615 47.5227C77.0015 45.9191 76.8176 44.3196 76.6436 42.7181C76.4817 41.2145 76.3257 39.7109 76.1478 38.2094C75.9338 36.3899 75.7079 34.5704 75.482 32.751C75.27 31.0535 75.0601 29.3579 74.8342 27.6624C74.5939 25.8452 74.3407 24.0297 74.0744 22.216C73.7185 19.8627 73.3366 17.5174 72.9607 15.1681C72.4365 11.8412 71.8298 8.52777 71.1412 5.23096C71.1132 5.085 71.0992 4.93504 71.0553 4.79308C70.9513 4.47318 71.0513 4.30322 71.3652 4.17926C74.4383 2.97761 77.4134 1.52803 80.5145 0.384364C80.9204 0.232408 81.3303 0.0624573 81.7681 0.01847C82.162 -0.0215184 82.262 0.042463 82.224 0.462341C82.0161 2.73968 82.136 5.02901 82.0281 7.30835C81.9401 9.16781 81.9501 11.0333 82.0441 12.8947C82.0661 13.3666 82.084 13.8405 82.08 14.3103C82.0561 16.5457 82.174 18.779 82.288 21.0104C82.434 23.9595 82.6479 26.9027 82.8658 29.8478C83.0238 31.9732 83.2297 34.0946 83.4297 36.2179C83.5356 37.3796 83.6496 38.5393 83.7936 39.6949C83.8715 40.3328 83.9035 40.3388 84.5293 40.2548C85.633 40.1048 86.7387 39.9829 87.8544 39.9989C91.7692 40.0488 95.6061 40.6667 99.371 41.7403C101.92 42.4641 104.402 43.3679 106.745 44.6335C107.802 45.1957 108.792 45.8758 109.696 46.6609ZM19.2923 57.6757C20.7399 56.9839 27.7678 51.4915 28.3257 50.5958C24.9147 49.1262 21.4917 47.7606 17.8107 46.6429L19.2923 57.6757ZM99.1171 50.9557C99.2971 50.7617 99.2771 50.6118 99.0331 50.5038C98.5473 50.2819 98.0654 50.0459 97.5735 49.844C94.9483 48.7703 92.3111 47.7306 89.6059 46.8829C89.3699 46.8109 89.128 46.6469 88.8261 46.7869L90.2837 57.6277C90.4996 57.6757 90.5836 57.5757 90.6796 57.5078C93.1368 55.7043 95.6101 53.9228 97.9694 51.9834C98.3673 51.6595 98.7612 51.3336 99.1171 50.9557Z",
			fill: "#FF5588"
		})
	});
	var ModalCloseButton = ({ ariaLabel, className = "atv-modal-close", onClick, size = 22 }) => {
		return u("button", {
			"aria-label": ariaLabel,
			class: className.split(/\s+/u).includes("atv-modal-close") ? className : `atv-modal-close ${className}`,
			onClick,
			type: "button",
			children: u(IconClose, { size })
		});
	};
	var ModalCloseContext = X(null);
	var useModalClose = () => {
		const close = x(ModalCloseContext);
		if (!close) throw new Error("useModalClose must be used inside a ModalShell");
		return close;
	};
	var TRANSITION_DURATION_MS = 400;
	var ModalShell = ({ ariaDescribedBy, ariaLabel, ariaLabelledBy, children, className, id, onClose, surfaceClassName }) => {
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
		return u(ModalCloseContext.Provider, {
			value: handleClose,
			children: u("dialog", {
				"aria-describedby": ariaDescribedBy,
				"aria-label": ariaLabel,
				"aria-labelledby": ariaLabelledBy,
				"aria-modal": "true",
				class: `${className}${openClass}`,
				id,
				open: true,
				ref: overlayRef,
				children: u("div", {
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
	var MODAL_ID$1 = "atv-poster-modal";
	var PosterModalContent = ({ alt, src }) => {
		return u(S, { children: [u(ModalCloseButton, {
			ariaLabel: "关闭海报",
			onClick: useModalClose()
		}), u("img", {
			alt: alt || "",
			class: "atv-modal-img",
			src
		})] });
	};
	var PosterModal = ({ alt, onClose, src }) => u(ModalShell, {
		ariaLabel: "海报预览",
		className: "atv-modal-overlay",
		id: MODAL_ID$1,
		onClose,
		surfaceClassName: "atv-modal-surface",
		children: u(PosterModalContent, {
			alt,
			src
		})
	});
	var MODAL_ID = "atv-video-modal";
	var REDIRECT_DELAY_MS = 1500;
	var TOAST_DURATION_MS = 3e3;
	var extractEmbedUrl = (html) => {
		const ldMatch = html.match(/<script type="application\/ld\+json">(?<json>[\s\S]*?)<\/script>/u);
		if (!ldMatch?.groups) throw new Error("no ld+json");
		const data = JSON.parse(ldMatch.groups.json);
		const embedUrl = data?.embedUrl ?? data?.video?.embedUrl ?? null;
		if (typeof embedUrl !== "string" || !embedUrl) throw new Error("no embedUrl");
		return embedUrl;
	};
	var VideoModalContent = ({ trailer }) => {
		const close = useModalClose();
		const [state, setState] = d({ status: "loading" });
		const [showToast, setShowToast] = d(false);
		h(() => {
			let active = true;
			(async () => {
				try {
					const embedUrl = extractEmbedUrl(await (await fetch(trailer.trailerPageUrl)).text());
					if (active) setState({
						embedUrl,
						status: "loaded"
					});
				} catch {
					if (active) {
						setState({ status: "error" });
						setShowToast(true);
					}
				}
			})();
			return () => {
				active = false;
			};
		}, [trailer.trailerPageUrl]);
		h(() => {
			if (state.status !== "error") return;
			const redirectTimer = window.setTimeout(() => {
				window.open(trailer.trailerPageUrl, "_blank");
				close();
			}, REDIRECT_DELAY_MS);
			const toastTimer = window.setTimeout(() => {
				setShowToast(false);
			}, TOAST_DURATION_MS);
			return () => {
				window.clearTimeout(redirectTimer);
				window.clearTimeout(toastTimer);
			};
		}, [
			close,
			state.status,
			trailer.trailerPageUrl
		]);
		return u(S, { children: [u(ModalCloseButton, {
			ariaLabel: "关闭视频",
			onClick: close
		}), u("div", {
			class: "atv-modal-video-content",
			children: [
				state.status === "loading" ? u("div", {
					class: "atv-modal-loading",
					children: [u("div", { class: "atv-spinner" }), u("span", { children: "加载中..." })]
				}) : null,
				state.status === "loaded" ? u("video", {
					autoplay: true,
					class: "atv-modal-video",
					controls: true,
					playsinline: true,
					src: state.embedUrl
				}) : null,
				showToast ? u("div", {
					class: "atv-modal-toast",
					children: "视频加载失败"
				}) : null
			]
		})] });
	};
	var VideoModal = ({ onClose, trailer }) => u(ModalShell, {
		ariaLabel: trailer.title || "视频预览",
		className: "atv-modal-overlay is-video",
		id: MODAL_ID,
		onClose,
		surfaceClassName: "atv-modal-surface",
		children: u(VideoModalContent, { trailer })
	});
	var $ = (selector, ctx) => (ctx ?? document).querySelector(selector);
	var $$ = (selector, ctx) => [...(ctx ?? document).querySelectorAll(selector)];
	var safeText = (el) => el ? (el.textContent ?? "").trim() : "";
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
	var extractSeriesMoreLink = (doc = document) => {
		const link = doc.querySelector("#series-items .items-swiper-title .pl a");
		return link ? {
			href: link.href,
			text: (link.textContent || "").replaceAll(/[()（）]/gu, "").trim()
		} : void 0;
	};
	var watchSeries = (onSeries, doc = document) => {
		const container = doc.querySelector("#series-items");
		if (!container) return () => void 0;
		const update = () => {
			if (container.querySelector(".items-swiper")) onSeries(extractSeries(doc));
		};
		update();
		const observer = new MutationObserver(update);
		observer.observe(container, {
			childList: true,
			subtree: true
		});
		return () => observer.disconnect();
	};
	var Section = ({ children, id, moreLink, title }) => u("section", {
		class: "atv-section",
		id,
		children: [moreLink ? u("div", {
			class: "atv-section-h-row",
			children: [u("h2", {
				class: "atv-section-h",
				children: title
			}), u("a", {
				class: "atv-section-more",
				href: moreLink.href,
				rel: "noopener",
				target: "_blank",
				children: moreLink.text
			})]
		}) : u("h2", {
			class: "atv-section-h",
			children: title
		}), children]
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
	var Stars = ({ className = "atv-rating-stars", outOfFive = false, score }) => u("span", {
		class: className,
		children: starComponents(score, outOfFive).map((Icon, index) => u(Icon, {}, index))
	});
	var CommentAvatar = ({ className, comment }) => u("div", {
		class: className,
		"data-cid": comment.cid || void 0,
		style: comment.avatar ? { backgroundImage: `url("${comment.avatar}")` } : void 0,
		children: comment.avatar ? null : (comment.name || "?").slice(0, 1).toUpperCase()
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
		return u("button", {
			"aria-label": `有用，${voteState.count} 人觉得有用`,
			"aria-pressed": voteState.voted,
			class: `${className}${voteState.voted ? " is-voted" : ""}`,
			disabled: loading || voteState.voted || !cid,
			onClick: (event) => {
				event.stopPropagation();
				vote();
			},
			type: "button",
			children: [u(IconThumb, {}), u("span", {
				class: "atv-vote-count",
				children: voteState.count
			})]
		});
	};
	var CommentCard = ({ canVote, comment, onOpen, onVote, onVoteStateChange, voteState }) => {
		const bodyRef = A(null);
		const [isOverflowing, setIsOverflowing] = d(false);
		_(() => {
			const body = bodyRef.current;
			if (!body) return;
			const measure = () => {
				setIsOverflowing(body.scrollHeight > body.clientHeight);
			};
			measure();
			const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(measure);
			observer?.observe(body);
			return () => observer?.disconnect();
		}, [comment.content]);
		return u("div", {
			class: `atv-comment-card${isOverflowing ? " has-overflow" : ""}`,
			"data-cid": comment.cid || void 0,
			children: [
				u("div", {
					class: "atv-comment-top",
					children: [u(CommentAvatar, {
						className: "atv-comment-avatar",
						comment
					}), u("div", {
						class: "atv-comment-meta",
						children: [comment.link ? u("a", {
							class: "atv-comment-author",
							href: comment.link,
							rel: "noopener",
							target: "_blank",
							children: comment.name
						}) : u("div", {
							class: "atv-comment-author",
							children: comment.name
						}), comment.stars > 0 ? u(Stars, {
							className: "atv-comment-stars",
							outOfFive: true,
							score: comment.stars
						}) : null]
					})]
				}),
				u("button", {
					class: "atv-comment-body",
					onClick: () => {
						if (isOverflowing) onOpen(comment);
					},
					type: "button",
					children: u("span", {
						class: "atv-comment-body-text",
						ref: bodyRef,
						children: comment.content
					})
				}),
				u("div", {
					class: "atv-comment-foot",
					children: [u("span", { children: comment.time || "" }), u("div", {
						class: "atv-comment-foot-right",
						children: [u("button", {
							"aria-label": "展开短评",
							class: "atv-comment-expand",
							onClick: (event) => {
								event.stopPropagation();
								onOpen(comment);
							},
							type: "button",
							children: u(IconExpand, {})
						}), u(CommentVoteButton, {
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
	};
	var CommentsSection = ({ avatarUrls, canVote, comments, getVoteState, onOpen, onVoteStateChange, onVote, subjectId }) => {
		if (!comments.length) return null;
		return u(Section, {
			id: "atv-comments",
			moreLink: subjectId ? {
				href: `https://movie.douban.com/subject/${subjectId}/comments?status=P`,
				text: "查看全部 →"
			} : void 0,
			title: "热门短评",
			children: u("div", {
				class: "atv-comments",
				children: comments.map((comment) => u(CommentCard, {
					comment: {
						...comment,
						avatar: avatarUrls?.get(comment.link) || comment.avatar
					},
					canVote,
					onOpen,
					onVoteStateChange,
					onVote,
					voteState: getVoteState?.(comment)
				}, comment.cid))
			})
		});
	};
	var CommentModalContent = ({ canVote, comment, onVoteStateChange, onVote, voteState }) => {
		const handleClose = useModalClose();
		return u(S, { children: [
			u("div", { class: "atv-modal-accent-bar atv-comment-overlay-accent" }),
			u(ModalCloseButton, {
				ariaLabel: "关闭短评",
				className: "atv-comment-overlay-close",
				onClick: handleClose,
				size: 16
			}),
			u("div", {
				class: "atv-comment-overlay-top",
				children: [u(CommentAvatar, {
					className: "atv-comment-overlay-avatar",
					comment
				}), u("div", {
					class: "atv-comment-overlay-meta",
					children: [comment.link ? u("a", {
						class: "atv-comment-overlay-author",
						href: comment.link,
						rel: "noopener",
						target: "_blank",
						children: comment.name
					}) : u("div", {
						class: "atv-comment-overlay-author",
						children: comment.name
					}), comment.stars > 0 ? u(Stars, {
						className: "atv-comment-overlay-stars",
						outOfFive: true,
						score: comment.stars
					}) : null]
				})]
			}),
			u("div", {
				class: "atv-comment-overlay-body",
				children: comment.content
			}),
			u("div", {
				class: "atv-comment-overlay-foot",
				children: [u("span", {
					class: "atv-comment-overlay-time",
					children: comment.time || ""
				}), u(CommentVoteButton, {
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
	var CommentModal = ({ canVote, comment, onClose, onVoteStateChange, onVote, voteState }) => u(ModalShell, {
		className: "atv-comment-overlay",
		id: "atv-comment-overlay",
		onClose,
		surfaceClassName: "atv-comment-overlay-inner",
		children: u(CommentModalContent, {
			canVote,
			comment,
			onVoteStateChange,
			onVote,
			voteState
		})
	});
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
	var useAvatarUrls = (comments) => {
		const [urls, setUrls] = d(() => new Map());
		h(() => {
			let active = true;
			const links = comments.map((comment) => comment.link).filter(Boolean);
			if (links.length === 0) {
				setUrls(new Map());
				return () => {
					active = false;
				};
			}
			(async () => {
				const nextUrls = await fetchAvatarUrls(links);
				if (active) setUrls(nextUrls);
			})();
			return () => {
				active = false;
			};
		}, [comments]);
		return urls;
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
	var textValue = (text) => u("div", {
		class: "atv-info-value",
		children: text
	});
	var linkParts = (items) => items.flatMap((item, index) => [index > 0 ? u("span", { children: " / " }, `sep-${index}`) : null, item.href ? u("a", {
		href: item.href,
		rel: "noopener",
		target: "_blank",
		children: item.text
	}, `link-${index}`) : u("span", { children: item.text }, `text-${index}`)]);
	var linksValue = (items) => u("div", {
		class: "atv-info-value",
		children: linkParts(items)
	});
	var imdbValue = (imdb) => u("div", {
		class: "atv-info-value",
		children: RE_IMDB_LINK.test(imdb) ? u("a", {
			href: `https://www.imdb.com/title/${imdb}/`,
			rel: "noopener",
			target: "_blank",
			children: [imdb, u(IconArrow, {})]
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
		label: u("div", {
			class: "atv-info-label",
			style: { color: "var(--atv-rating-gold)" },
			children: award.orgLink ? u("a", {
				href: award.orgLink,
				rel: "noopener",
				style: { color: "inherit" },
				target: "_blank",
				children: award.org
			}) : award.org
		}),
		value: u("div", {
			class: "atv-info-value",
			children: [award.name ? u("div", { children: award.name }) : null, award.person ? u("div", {
				style: {
					color: "var(--atv-text-tertiary)",
					fontSize: "13px",
					marginTop: "2px"
				},
				children: award.personLink ? u("a", {
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
		return u(Section, {
			id: "atv-info",
			title: "详细信息",
			children: u("div", {
				class: "atv-info-grid",
				children: rows.map((row) => u(S, { children: [typeof row.label === "string" ? u("div", {
					class: "atv-info-label",
					children: row.label
				}) : row.label, row.value] }))
			})
		});
	};
	var LOGO_MAP = {
		douban: u(LogoDouban, {}),
		imdb: u(LogoImdb, {}),
		metacritic: u(LogoMetacritic, {}),
		rt: u(LogoRT, {})
	};
	var RatingLogo = ({ name }) => u("div", {
		class: "atv-rating-panel-logo",
		children: LOGO_MAP[name]
	});
	var DoubanRating = ({ rating }) => u("div", {
		class: "atv-rating-panel-douban",
		children: [u(RatingLogo, { name: "douban" }), rating ? u(S, { children: [
			u("div", {
				class: "atv-rating-panel-score",
				children: rating.score.toFixed(1)
			}),
			u(Stars, { score: rating.score }),
			u("div", {
				class: "atv-rating-panel-count",
				children: rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分"
			})
		] }) : u("div", {
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
	var SOURCE_CLASS = {
		imdb: "atv-rating-panel-imdb",
		metacritic: "atv-rating-panel-mc",
		rt: "atv-rating-panel-rt"
	};
	var renderImdbRating = (rating) => u(S, { children: [
		u("div", {
			class: "atv-rating-panel-score",
			children: rating.score.toFixed(1)
		}),
		u(Stars, { score: rating.score }),
		u("div", {
			class: "atv-rating-panel-count",
			children: rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分"
		})
	] });
	var renderMetacriticRating = (rating) => u(S, { children: [
		u("div", {
			class: `atv-rating-panel-score ${scoreClass(rating.score)}`,
			children: String(rating.score)
		}),
		u("div", {
			class: "atv-mc-label-row",
			children: [u("span", {
				class: "atv-mc-bar-track",
				children: u("span", {
					class: `atv-mc-bar-fill ${scoreClass(rating.score)}`,
					style: { width: `${Math.min(100, rating.score)}%` }
				})
			}), u("span", {
				class: "atv-mc-word-label",
				children: mcWordRatingChinese(rating.score)
			})]
		}),
		u("div", {
			class: "atv-rating-panel-count",
			children: rating.reviewCount ? `评价 ${rating.reviewCount.toLocaleString("en-US")}` : "已评分"
		})
	] });
	var RtLabel = ({ className, icon, score, text }) => u("span", {
		class: `atv-rt-label-item ${className} ${isFresh(score) ? "is-fresh" : "is-rotten"}`,
		children: [u("span", {
			class: "atv-rt-score-icon",
			children: icon
		}), u("span", {
			class: "atv-rt-score-label",
			children: text
		})]
	});
	var renderRottenTomatoesRating = (rating) => u(S, { children: [
		u("div", {
			class: "atv-rt-score-row",
			children: [
				u("div", {
					class: `atv-rt-score-value ${isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"}`,
					children: `${rating.criticsScore}%`
				}),
				u("div", { class: "atv-rt-divider" }),
				u("div", {
					class: `atv-rt-score-value ${isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"}`,
					children: `${rating.audienceScore}%`
				})
			]
		}),
		u("div", {
			class: "atv-rt-label-row",
			children: [u(RtLabel, {
				className: "is-critics",
				icon: u(IconTomato, {}),
				score: rating.criticsScore,
				text: "影评人"
			}), u(RtLabel, {
				className: "is-audience",
				icon: u(IconPopcorn, {}),
				score: rating.audienceScore,
				text: "观众"
			})]
		}),
		u("div", {
			class: "atv-rt-count-row",
			children: [u("span", {
				class: "atv-rt-count-value",
				children: `评价 ${rating.criticsCount.toLocaleString("en-US")}`
			}), u("span", {
				class: "atv-rt-count-value",
				children: `评价 ${rating.audienceCount.toLocaleString("en-US")}`
			})]
		})
	] });
	var renderLoadedRating = (props) => {
		switch (props.source) {
			case "imdb": return props.rating ? renderImdbRating(props.rating) : null;
			case "metacritic": return props.rating ? renderMetacriticRating(props.rating) : null;
			case "rt": return props.rating ? renderRottenTomatoesRating(props.rating) : null;
			default: return null;
		}
	};
	var renderExternalRatingContent = (props) => {
		if (props.rating) return renderLoadedRating(props);
		if (props.resolved) return null;
		return u("div", { class: "atv-rating-panel-skeleton" });
	};
	var ExternalRating = (props) => u("div", {
		class: `${SOURCE_CLASS[props.source]} ${ratingStateClass(Boolean(props.rating), props.resolved)}`,
		children: [u(RatingLogo, { name: props.source }), renderExternalRatingContent(props)]
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
	var toRatingSlug = (title, separator) => title.normalize("NFD").replaceAll(/[\u0300-\u036F]/gu, "").toLowerCase().replaceAll(/[^a-z0-9]+/gu, separator).replaceAll(separator === "-" ? /^-|-$/gu : /^_|_$/gu, "");
	var createRatingCacheKey = (slug, separator, season, year) => {
		let key = slug;
		if (year) key = `${key}${separator}${year}`;
		if (season) key = `${key}-s${String(season).padStart(2, "0")}`;
		return key;
	};
	var createRatingFetcher = ({ cache, parse, referer, slugSeparator, urls }) => async (title, isTV, season, year) => {
		if (!title) return null;
		const slug = toRatingSlug(title, slugSeparator);
		if (!slug) return null;
		const key = createRatingCacheKey(slug, slugSeparator, season, year);
		const cached = cache.get(key);
		if (cached) return cached;
		for (const url of urls({
			isTV: Boolean(isTV),
			season,
			slug,
			year
		})) try {
			const rating = parse(await gmGet(url, referer));
			if (rating) {
				cache.set(key, rating);
				return rating;
			}
		} catch {}
		return null;
	};
	var mcCache = createCache("dp:metacritic-cache", 10080 * 60 * 1e3);
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
	var fetchMcRating = createRatingFetcher({
		cache: mcCache,
		parse: parseMcPage,
		referer: "https://www.metacritic.com/",
		slugSeparator: "-",
		urls: ({ isTV, season, slug, year }) => {
			if (isTV) return season ? [`https://www.metacritic.com/tv/${slug}/season-${season}`, `https://www.metacritic.com/tv/${slug}`] : [`https://www.metacritic.com/tv/${slug}`];
			return year ? [`https://www.metacritic.com/movie/${slug}-${year}`, `https://www.metacritic.com/movie/${slug}`] : [`https://www.metacritic.com/movie/${slug}`];
		}
	});
	var rottenCache = createCache("dp:rotten-cache", 10080 * 60 * 1e3);
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
	var fetchRtRating = createRatingFetcher({
		cache: rottenCache,
		parse: parseRtPage,
		referer: "https://www.rottentomatoes.com/",
		slugSeparator: "_",
		urls: ({ isTV, season, slug, year }) => {
			if (isTV) return season ? [`https://www.rottentomatoes.com/tv/${slug}/s${String(season).padStart(2, "0")}`, `https://www.rottentomatoes.com/tv/${slug}`] : [`https://www.rottentomatoes.com/tv/${slug}`];
			return year ? [`https://www.rottentomatoes.com/m/${slug}_${year}`, `https://www.rottentomatoes.com/m/${slug}`] : [`https://www.rottentomatoes.com/m/${slug}`];
		}
	});
	var createDefaultDeps = () => ({
		fetchImdbRating,
		fetchMcRating,
		fetchRtRating
	});
	var fetchImdbFromContext = (ctx, deps) => {
		if (!ctx.imdbId) return Promise.resolve(null);
		return deps.fetchImdbRating(ctx.imdbId, ctx.season);
	};
	var fetchRtFromContext = (ctx, deps) => {
		if (!ctx.englishTitle) return Promise.resolve(null);
		return deps.fetchRtRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
	};
	var fetchMcFromContext = (ctx, deps) => {
		if (!ctx.englishTitle) return Promise.resolve(null);
		return deps.fetchMcRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
	};
	var resolveAll = async (ctx, deps) => {
		const resolvedDeps = deps ?? createDefaultDeps();
		if (ctx.englishTitle) {
			const [imdb, rt, mc] = await Promise.allSettled([
				fetchImdbFromContext(ctx, resolvedDeps),
				fetchRtFromContext(ctx, resolvedDeps),
				fetchMcFromContext(ctx, resolvedDeps)
			]);
			return {
				imdb: imdb.status === "fulfilled" ? imdb.value : null,
				mc: mc.status === "fulfilled" ? mc.value : null,
				rt: rt.status === "fulfilled" ? rt.value : null
			};
		}
		const imdbResult = ctx.imdbId ? await fetchImdbFromContext(ctx, resolvedDeps).catch(() => null) : null;
		if (imdbResult?.title) {
			const fallbackCtx = {
				...ctx,
				englishTitle: imdbResult.title
			};
			const [rt, mc] = await Promise.allSettled([fetchRtFromContext(fallbackCtx, resolvedDeps), fetchMcFromContext(fallbackCtx, resolvedDeps)]);
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
		return u("div", {
			class: "atv-rating-panel",
			children: [u(DoubanRating, { rating: douban }), imdbId ? u(S, { children: [
				u(ExternalRating, {
					rating: external?.imdb?.rating ?? null,
					resolved,
					source: "imdb"
				}),
				u(ExternalRating, {
					rating: external?.mc ?? null,
					resolved,
					source: "metacritic"
				}),
				u(ExternalRating, {
					rating: external?.rt ?? null,
					resolved,
					source: "rt"
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
	var InterestButton = ({ className, label, onClick }) => u("button", {
		class: className,
		onClick,
		type: "button",
		children: [u("span", { children: label === "想看" ? u(IconPlay, {}) : u(IconCheck, {}) }), u("span", { children: label })]
	});
	var HeroActions = ({ callbacks, state }) => {
		if (!state.loggedIn) return u("div", {
			class: "atv-actions",
			children: [
				u(InterestButton, {
					className: "atv-btn atv-btn-primary",
					label: "想看",
					onClick: callbacks.handleWishClick
				}),
				state.hasWatching ? u(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "在看",
					onClick: callbacks.handleWatchingClick
				}) : null,
				u(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "看过",
					onClick: callbacks.handleCollectClick
				})
			]
		});
		if (!state.marked) return u("div", {
			class: "atv-actions",
			children: [
				u(InterestButton, {
					className: "atv-btn atv-btn-primary",
					label: "想看",
					onClick: () => callbacks.handleOpenInterest(state)
				}),
				state.hasWatching ? u(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "在看",
					onClick: () => callbacks.handleOpenInterest(state)
				}) : null,
				u(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "看过",
					onClick: () => callbacks.handleOpenInterest(state)
				})
			]
		});
		const label = INTEREST_LABELS[state.status];
		return u("div", {
			class: "atv-actions",
			children: u("div", {
				class: "atv-interest-panel",
				children: [u("div", {
					class: "atv-interest-panel-header",
					children: [
						u("button", {
							class: "atv-btn atv-btn-primary is-active atv-interest-badge",
							onClick: () => callbacks.handleOpenInterest(state),
							type: "button",
							children: [u("span", { children: u(IconCheck, {}) }), u("span", { children: label })]
						}),
						state.rating > 0 ? u("span", {
							class: "atv-interest-panel-stars",
							children: Array.from({ length: 5 }, (_, index) => index < state.rating ? u(IconStarFull, {}, index) : u(IconStarEmpty, {}, index))
						}) : null,
						state.date ? u("span", {
							class: "atv-interest-panel-date",
							children: state.date
						}) : null
					]
				}), state.comment ? u("div", {
					class: "atv-interest-panel-comment",
					children: [u("span", { children: `"${state.comment}"` }), state.usefulCount ? u("span", {
						class: "atv-useful-badge",
						children: [u(IconThumb, {}), u("span", { children: state.usefulCount.replaceAll(/\D/gu, "") })]
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
	var stillBackground = (still, hdLoaded) => u(S, { children: [u("div", {
		class: "atv-hero-still is-thumb",
		style: { backgroundImage: `url("${still.thumbUrl || still.hdUrl}")` }
	}), u("div", {
		"aria-hidden": "true",
		class: `atv-hero-still is-hd${hdLoaded ? " is-loaded" : ""}`,
		style: { backgroundImage: hdLoaded ? `url("${still.hdUrl || still.thumbUrl}")` : void 0 }
	})] });
	var posterBackground = (poster) => u("div", {
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
		return u("div", {
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
		return u("div", {
			class: "atv-hero-meta",
			children: [metaParts.map((part) => u("span", {
				class: "atv-meta-dot",
				children: part
			}, part)), info.genres.length ? u("span", {
				class: "atv-meta-chips",
				children: info.genres.map((genre) => u("span", {
					class: "atv-chip",
					children: genre
				}, genre))
			}) : null]
		});
	};
	var PosterPlaceholder = () => u("div", {
		class: "atv-poster-placeholder",
		children: u(IconFilmPlaceholder, {})
	});
	var noop$2 = () => void 0;
	var HeroPoster = ({ onOpenPoster = noop$2, poster, title }) => {
		const [failed, setFailed] = d(false);
		return u("button", {
			class: "atv-poster-card",
			onClick: () => {
				if (poster) onOpenPoster(poster, title.primary || "");
			},
			type: "button",
			children: poster && !failed ? u("img", {
				alt: title.primary || "",
				onError: () => setFailed(true),
				src: poster
			}) : u(PosterPlaceholder, {})
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
		return u("div", {
			class: "atv-hero-summary",
			children: [u("p", {
				class: `atv-hero-teaser${expanded ? "" : " is-clamped"}`,
				ref: teaserRef,
				children: text
			}), u("button", {
				class: `atv-hero-more${expanded ? " is-open" : ""}`,
				onClick: () => setExpanded((value) => !value),
				style: { display: showToggle ? void 0 : "none" },
				type: "button",
				children: [u("span", { children: expanded ? "收起" : "展开" }), u(IconChevron, {})]
			})]
		});
	};
	var noop$1 = () => void 0;
	var Hero = ({ callbacks, data, onOpenPoster = noop$1 }) => u("section", {
		class: "atv-hero",
		children: [
			u(HeroBackground, {
				photos: data.photos,
				poster: data.poster,
				subjectId: data.subjectId
			}),
			u("div", { class: "atv-hero-vignette" }),
			u("div", { class: "atv-hero-overlay-x" }),
			u("div", { class: "atv-hero-overlay-y" }),
			u("div", {
				class: "atv-hero-inner-section",
				children: u("div", {
					class: "atv-hero-inner",
					children: [u(HeroPoster, {
						onOpenPoster,
						poster: data.poster,
						title: data.title
					}), u("div", {
						class: "atv-hero-info",
						children: [
							u("h1", {
								class: "atv-hero-title",
								children: data.title.primary || data.title.full
							}),
							data.title.original ? u("div", {
								class: "atv-hero-orig",
								children: data.title.original
							}) : null,
							u(HeroMeta, {
								info: data.info,
								isTV: data.isTV,
								year: data.year
							}),
							u(RatingPanel, {
								douban: data.rating,
								imdbId: data.imdbId,
								isTV: data.isTV
							}),
							u(HeroActions, {
								callbacks,
								state: data.interest
							}),
							data.summary ? u(HeroSummary, { text: data.summary }) : null
						]
					})]
				})
			})
		]
	});
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
		return u(S, { children: [
			u("div", { class: "atv-modal-accent-bar atv-login-modal-accent" }),
			u(ModalCloseButton, {
				ariaLabel: "关闭登录弹窗",
				className: "atv-login-modal-close",
				onClick: handleClose,
				size: 18
			}),
			u("h2", {
				class: "atv-login-modal-title",
				id: "atv-login-modal-title",
				children: "登录豆瓣后继续"
			}),
			u("p", {
				class: "atv-login-modal-desc",
				id: "atv-login-modal-desc",
				children: `登录后才能${action}。`
			}),
			u("p", {
				"aria-live": "polite",
				class: "atv-login-modal-status",
				hidden: !status,
				children: status
			}),
			u("div", {
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
		return u(ModalShell, {
			ariaDescribedBy: "atv-login-modal-desc",
			ariaLabelledBy: "atv-login-modal-title",
			className: "atv-login-modal",
			id: "atv-login-modal",
			onClose,
			surfaceClassName: "atv-login-modal-inner",
			children: u(LoginModalContent, {
				action,
				busy,
				hostRef,
				status
			})
		});
	};
	var CastSection = ({ celebrities }) => celebrities.length ? u(Section, {
		id: "atv-cast",
		title: "演职员",
		children: u("div", {
			class: "atv-carousel atv-cast-carousel",
			children: celebrities.map((person) => {
				const content = u(S, { children: [
					u("div", {
						class: "atv-cast-avatar",
						style: person.avatar ? { backgroundImage: `url("${person.avatar}")` } : void 0
					}),
					u("div", {
						class: "atv-cast-name",
						children: person.name
					}),
					person.role ? u("div", {
						class: "atv-cast-role",
						children: person.role
					}) : null
				] });
				return person.link ? u("a", {
					class: "atv-cast-card",
					href: person.link,
					rel: "noopener",
					target: "_blank",
					children: content
				}, person.link) : u("div", {
					class: "atv-cast-card",
					children: content
				}, person.name);
			})
		})
	}) : null;
	var noop = () => void 0;
	var PhotoTile = ({ onOpenPoster, photo }) => {
		const [displaySrc, setDisplaySrc] = d(photo.hdUrl || photo.thumbUrl);
		const [isPortrait, setIsPortrait] = d(false);
		return u("button", {
			class: `atv-photo-tile${isPortrait ? " is-portrait" : ""}`,
			onClick: () => onOpenPoster(photo.hdUrl || photo.thumbUrl, "剧照"),
			type: "button",
			children: u("img", {
				alt: "剧照",
				loading: "lazy",
				onError: () => {
					if (photo.thumbUrl && displaySrc !== photo.thumbUrl) setDisplaySrc(photo.thumbUrl);
				},
				onLoad: (event) => {
					const img = event.currentTarget;
					if (img.naturalHeight > img.naturalWidth) setIsPortrait(true);
				},
				src: displaySrc
			})
		});
	};
	var PhotosSection = ({ data, onOpenPoster = noop, onOpenVideo = noop }) => data.photos.length || data.trailers.length ? u(Section, {
		id: "atv-photos",
		moreLink: data.subjectId ? {
			href: `https://movie.douban.com/subject/${data.subjectId}/all_photos`,
			text: "查看全部 →"
		} : void 0,
		title: "剧照",
		children: u("div", {
			class: "atv-carousel atv-photos",
			children: [data.trailers.map((trailer) => u("button", {
				class: "atv-photo-tile atv-trailer-tile",
				onClick: () => onOpenVideo(trailer),
				style: {
					backgroundImage: `url("${trailer.thumbUrl}")`,
					backgroundPosition: "center",
					backgroundSize: "cover"
				},
				type: "button",
				children: [u("div", {
					class: "atv-trailer-play-overlay",
					children: u("div", {
						class: "atv-trailer-play-btn",
						children: u(PlayIcon, {})
					})
				}), u("span", {
					class: "atv-trailer-label",
					children: trailer.title || "预告片"
				})]
			}, trailer.trailerPageUrl)), data.photos.map((photo) => u(PhotoTile, {
				onOpenPoster,
				photo
			}, photo.link))]
		})
	}) : null;
	var PosterImage = ({ alt, className, poster }) => {
		const [failed, setFailed] = d(false);
		if (!poster || failed) return u(PosterPlaceholder, {});
		return u("img", {
			alt,
			class: className,
			loading: "lazy",
			onError: () => setFailed(true),
			src: poster
		});
	};
	var RecommendationsSection = ({ recommendations }) => recommendations.length ? u(Section, {
		id: "atv-recs",
		title: "相似作品",
		children: u("div", {
			class: "atv-recs",
			children: recommendations.map((item) => {
				const content = u(S, { children: [u("div", {
					class: "atv-rec-poster",
					children: u(PosterImage, {
						alt: item.title,
						poster: item.poster
					})
				}), u("div", {
					class: "atv-rec-title",
					children: item.title
				})] });
				return item.link ? u("a", {
					class: "atv-rec-card",
					href: item.link,
					rel: "noopener",
					target: "_blank",
					children: content
				}, item.link) : u("div", {
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
	var SeriesSection = ({ items, moreLink }) => items.length ? u(Section, {
		id: "atv-series",
		moreLink,
		title: "同系列作品",
		children: u("div", {
			class: "atv-carousel atv-series-carousel",
			children: items.map((item) => {
				const className = `atv-series-card${item.link && subjectPath(item.link) === window.location.pathname ? " is-active" : ""}`;
				const key = item.link || item.title;
				const content = u(S, { children: [u("div", {
					class: "atv-series-poster",
					children: [u(PosterImage, {
						alt: item.title,
						poster: item.poster
					}), item.rating ? u("span", {
						class: "atv-series-badge",
						children: item.rating
					}) : null]
				}), u("div", {
					class: "atv-series-info",
					children: u("span", {
						class: "atv-series-title",
						children: item.title
					})
				})] });
				return item.link ? u("a", {
					class: className,
					href: item.link,
					rel: "noopener",
					target: "_blank",
					children: content
				}, key) : u("div", {
					class: className,
					children: content
				}, key);
			})
		})
	}) : null;
	var UNKNOWN_PROVIDER_COLOR = "#41be5d";
	var PROVIDERS = [
		{
			Icon: LogoBilibiliCombined,
			aliases: [
				"哔哩哔哩",
				"bilibili",
				"b站",
				"b 站"
			],
			color: "#FF5588",
			combinedSvg: true,
			hosts: ["bilibili.com"],
			key: "bilibili",
			label: "哔哩哔哩"
		},
		{
			Icon: LogoIqiyiCombined,
			aliases: [
				"爱奇艺",
				"iqiyi",
				"iQIYI"
			],
			color: "#00DC5A",
			combinedSvg: true,
			hosts: ["iqiyi.com"],
			key: "iqiyi",
			label: "爱奇艺"
		},
		{
			Icon: LogoTencentCombined,
			aliases: ["腾讯视频", "tencent video"],
			color: "#00A2FF",
			combinedSvg: true,
			hosts: ["v.qq.com"],
			key: "tencent-video",
			label: "腾讯视频"
		},
		{
			Icon: LogoYoukuCombined,
			aliases: ["优酷", "youku"],
			color: "#00A6FF",
			combinedSvg: true,
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
			const { Icon, color, key, label, combinedSvg } = provider;
			return {
				Icon,
				color,
				combinedSvg,
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
	var StreamingLogo = ({ fallbackLabel, Icon, imgSrc }) => {
		if (imgSrc) return u("img", {
			alt: "",
			class: "atv-stream-vendor-icon",
			src: imgSrc
		});
		return u("span", {
			class: "atv-stream-logo",
			"aria-hidden": "true",
			children: Icon ? u(Icon, {}) : u("span", {
				class: "atv-stream-logo-fallback",
				children: fallbackLabel.trim().at(0) || u(IconPlay, {})
			})
		});
	};
	var StreamingSection = ({ streaming }) => streaming.length ? u(Section, {
		id: "atv-stream",
		title: "播放源",
		children: u("div", {
			class: "atv-stream-row",
			children: streaming.map((item) => {
				const provider = resolveStreamingProvider(item);
				const style = { "--atv-stream-brand": provider.color };
				return u("a", {
					class: `atv-stream-card${provider.combinedSvg ? " atv-stream-card--combined" : ""}`,
					"data-provider": provider.key,
					href: item.href,
					rel: "noopener",
					style,
					target: "_blank",
					children: provider.combinedSvg && provider.Icon ? u(provider.Icon, {}) : u(S, { children: [u(StreamingLogo, {
						fallbackLabel: provider.label,
						Icon: provider.Icon,
						imgSrc: item.iconUrl
					}), u("span", {
						class: "atv-stream-name",
						children: item.name
					})] })
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
		return u(S, { children: [u("button", {
			"aria-label": `有用，${voteState.usefulCount} 人觉得有用`,
			"aria-pressed": voteState.voted === "useful",
			class: `atv-vote-btn up${voteState.voted === "useful" ? " is-voted" : ""}${sizeClass}`,
			disabled: !onVote || loading || voteState.voted === "useful",
			onClick: (event) => {
				event.stopPropagation();
				vote("useful");
			},
			type: "button",
			children: [u(IconVoteTriangle, {}), u("span", {
				class: "atv-vote-count",
				children: voteState.usefulCount
			})]
		}), u("button", {
			"aria-label": `没用，${voteState.uselessCount} 人觉得没用`,
			"aria-pressed": voteState.voted === "useless",
			class: `atv-vote-btn down${voteState.voted === "useless" ? " is-voted" : ""}${sizeClass}`,
			disabled: !onVote || loading || voteState.voted === "useless",
			onClick: (event) => {
				event.stopPropagation();
				vote("useless");
			},
			type: "button",
			children: [u(IconVoteTriangle, {}), u("span", {
				class: "atv-vote-count",
				children: voteState.uselessCount
			})]
		})] });
	};
	var ReviewCard = ({ canVote, onOpen, onVote, onVoteStateChange, review, voteState }) => {
		const displayName = reviewDisplayName(review.name);
		return u("article", {
			class: "atv-review-card",
			"data-rid": review.id || void 0,
			children: [u("button", {
				"aria-label": `展开阅读：${review.title}`,
				class: "atv-review-open-button",
				onClick: () => onOpen(review),
				type: "button"
			}), u("div", {
				class: "atv-review-content",
				children: [
					u("div", {
						class: "atv-review-top",
						children: [u("div", {
							class: "atv-review-avatar",
							style: review.avatar ? { backgroundImage: `url("${review.avatar}")` } : void 0,
							children: review.avatar ? null : displayName.slice(0, 1).toUpperCase()
						}), u("div", {
							class: "atv-review-meta",
							children: [review.link ? u("a", {
								class: "atv-review-author",
								href: review.link,
								onClick: (event) => event.stopPropagation(),
								rel: "noopener",
								target: "_blank",
								children: displayName
							}) : u("div", {
								class: "atv-review-author",
								children: displayName
							}), review.stars > 0 ? u(Stars, {
								className: "atv-review-stars",
								outOfFive: true,
								score: review.stars
							}) : null]
						})]
					}),
					u("div", {
						class: "atv-review-title",
						children: review.title
					}),
					u("div", {
						class: "atv-review-excerpt",
						children: review.content
					}),
					u("div", {
						class: "atv-review-foot",
						children: [
							u("span", {
								class: "atv-review-time",
								children: review.time || ""
							}),
							u("span", {
								class: "atv-review-readmore",
								children: "展开阅读"
							}),
							u("div", {
								class: "atv-review-actions",
								"data-rid": review.id || void 0,
								children: u(ReviewVoteButtons, {
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
	var ReviewsSection = ({ canVote, getVoteState, isTV, onOpen, onVoteStateChange, onVote, reviews, subjectId }) => {
		if (!reviews.length) return null;
		return u(Section, {
			id: "atv-reviews",
			moreLink: {
				href: `https://movie.douban.com/subject/${subjectId}/reviews`,
				text: "查看全部 →"
			},
			title: isTV ? "热门剧评" : "热门影评",
			children: u("div", {
				class: "atv-reviews",
				children: reviews.map((review) => u(ReviewCard, {
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
	var stripInlineStyles = (html) => html.replaceAll(/\sstyle="[^"]*"/giu, "");
	var allowedTags = new Set([
		"a",
		"b",
		"blockquote",
		"br",
		"code",
		"div",
		"em",
		"h1",
		"h2",
		"h3",
		"li",
		"ol",
		"p",
		"pre",
		"span",
		"strong",
		"ul"
	]);
	var sanitizeReviewHtml = (html) => {
		const doc = new DOMParser().parseFromString(html, "text/html");
		for (const element of doc.body.querySelectorAll("*")) {
			if (!allowedTags.has(element.tagName.toLowerCase())) {
				element.replaceWith(...element.childNodes);
				continue;
			}
			for (const attribute of element.attributes) if (!(element.tagName.toLowerCase() === "a" && attribute.name === "href" && /^(?:https?:|\/|#)/iu.test(attribute.value.trim()))) element.removeAttribute(attribute.name);
		}
		return doc.body.innerHTML;
	};
	var findNativeReviewContent = (rid) => {
		const numericId = reviewNumericId(rid);
		const fullContent = document.querySelector(`[id="${rid}"]`)?.querySelector(`#review_${numericId}_full .review-content`);
		const text = (fullContent?.textContent ?? "").trim();
		return fullContent && text ? sanitizeReviewHtml(stripInlineStyles(fullContent.innerHTML)) : null;
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
						html: sanitizeReviewHtml(stripInlineStyles(content.innerHTML)),
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
		return u(S, { children: [
			u(ModalCloseButton, {
				ariaLabel: "关闭影评",
				onClick: handleClose
			}),
			u("div", { class: "atv-modal-accent-bar atv-review-modal-accent" }),
			u("div", {
				class: "atv-review-modal-header",
				children: [
					u("div", {
						class: "atv-review-modal-title",
						id: "atv-review-modal-title",
						tabindex: -1,
						children: review.title
					}),
					review.stars > 0 ? u(Stars, {
						className: "atv-review-modal-stars",
						outOfFive: true,
						score: review.stars
					}) : null,
					u("div", {
						class: "atv-review-modal-byline",
						children: [u("div", {
							class: "atv-review-modal-avatar",
							style: review.avatar ? { backgroundImage: `url("${review.avatar}")` } : void 0,
							children: review.avatar ? null : displayName.slice(0, 1).toUpperCase()
						}), u("div", {
							class: "atv-review-modal-byline-text",
							children: [u("span", {
								class: "atv-review-modal-byline-name",
								children: displayName
							}), review.time ? u("span", {
								class: "atv-review-modal-byline-time",
								children: ["· ", review.time]
							}) : null]
						})]
					})
				]
			}),
			u(HtmlContent, {
				"aria-busy": content.status === "loading" ? "true" : "false",
				"aria-live": "polite",
				class: bodyClassName(content.status),
				html: content.html || void 0,
				children: [content.status === "loading" ? "加载中" : null, content.status === "error" ? u("div", {
					class: "atv-review-modal-error",
					children: u("p", { children: "影评内容暂时加载失败" })
				}) : null]
			}),
			u("div", {
				class: "atv-review-modal-footer",
				children: [u("div", {
					class: "atv-review-modal-votes",
					children: u("div", {
						class: "atv-review-actions",
						"data-rid": review.id || void 0,
						children: u(ReviewVoteButtons, {
							canVote,
							onStateChange: onVoteStateChange,
							onVote,
							review,
							size: "large",
							state: voteState
						})
					})
				}), u("div", {
					class: "atv-review-modal-link",
					children: u("a", {
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
	var ReviewModal = ({ canVote, onClose, onVoteStateChange, onVote, review, voteState }) => u(ModalShell, {
		ariaLabelledBy: "atv-review-modal-title",
		className: "atv-review-modal",
		id: "atv-review-modal",
		onClose,
		surfaceClassName: "atv-review-modal-scroll",
		children: u(ReviewModalContent, {
			canVote,
			onVote,
			onVoteStateChange,
			review,
			voteState
		})
	});
	var toInitialStates = (items, strategy) => Object.fromEntries(items.map((item) => [strategy.key(item), strategy.initial(item)]));
	var useVoteState = (items, strategy) => {
		const [states, setStates] = d(() => toInitialStates(items, strategy));
		const getVoteState = (item) => states[strategy.key(item)] ?? strategy.initial(item);
		const setVoteState = (item, state, options) => {
			setStates((current) => ({
				...current,
				[strategy.key(item)]: state
			}));
			if (options?.persist) strategy.persist?.(item, state);
		};
		const mergeVoteState = (item) => strategy.merge(item, getVoteState(item));
		const mergeVoteStates = (nextItems) => nextItems.map(mergeVoteState);
		return {
			getVoteState,
			mergeVoteState,
			mergeVoteStates,
			setVoteState
		};
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
	var commentVoteStrategy = {
		initial: initialCommentVoteState,
		key: commentVoteKey,
		merge: commentWithVoteState
	};
	var reviewVoteStrategy = {
		initial: initialReviewVoteState,
		key: reviewVoteKey,
		merge: reviewWithVoteState,
		persist: persistReviewVoteState
	};
	var SubjectPage = ({ data, deps }) => {
		const [activeComment, setActiveComment] = d(null);
		const [activeReview, setActiveReview] = d(null);
		const [activeMediaModal, setActiveMediaModal] = d(null);
		const [loginAction, setLoginAction] = d(null);
		const [series, setSeries] = d(data.series);
		const commentVotes = useVoteState(data.comments, commentVoteStrategy);
		const avatarUrls = useAvatarUrls(data.comments);
		const reviewVotes = useVoteState(data.reviews, reviewVoteStrategy);
		const handleCommentVoteStateChange = commentVotes.setVoteState;
		const handleReviewVoteStateChange = reviewVotes.setVoteState;
		const canVote = () => {
			if (!data.interest.loggedIn) {
				setLoginAction("给短评点有用");
				return false;
			}
			return deps.canVote?.() ?? true;
		};
		const canReviewVote = () => {
			if (!data.interest.loggedIn) {
				setLoginAction("给影评投票");
				return false;
			}
			return deps.canReviewVote?.() ?? true;
		};
		h(() => watchSeries(setSeries), []);
		return u(S, { children: [
			u(StickyNav, {
				sections: computeNavSections({
					...data,
					series
				}),
				title: data.title
			}),
			u(Hero, {
				callbacks: deps.heroCallbacks,
				data: toHeroData(data),
				onOpenPoster: (src, alt) => setActiveMediaModal({
					alt,
					src,
					type: "poster"
				})
			}),
			u(StreamingSection, { streaming: data.streaming }),
			u(SeriesSection, {
				items: series,
				moreLink: deps.seriesMoreLink ?? extractSeriesMoreLink()
			}),
			u(CastSection, { celebrities: data.celebrities }),
			u(PhotosSection, {
				data: {
					photos: data.photos,
					subjectId: data.subjectId,
					trailers: data.trailers
				},
				onOpenPoster: (src, alt) => setActiveMediaModal({
					alt,
					src,
					type: "poster"
				}),
				onOpenVideo: (trailer) => setActiveMediaModal({
					trailer,
					type: "video"
				})
			}),
			u(CommentsSection, {
				avatarUrls,
				canVote,
				comments: commentVotes.mergeVoteStates(data.comments),
				getVoteState: commentVotes.getVoteState,
				onOpen: setActiveComment,
				onVoteStateChange: handleCommentVoteStateChange,
				onVote: deps.handleVote,
				subjectId: data.subjectId
			}),
			u(ReviewsSection, {
				canVote: canReviewVote,
				getVoteState: reviewVotes.getVoteState,
				isTV: data.isTV,
				onOpen: setActiveReview,
				onVoteStateChange: handleReviewVoteStateChange,
				onVote: deps.handleReviewVote,
				reviews: reviewVotes.mergeVoteStates(data.reviews),
				subjectId: data.subjectId
			}),
			u(RecommendationsSection, { recommendations: data.recommendations }),
			u(DetailsSection, { data: {
				awards: data.awards,
				info: data.info,
				isTV: data.isTV
			} }),
			u("div", { class: "atv-footer-spacer" }),
			activeComment ? u(CommentModal, {
				canVote,
				comment: {
					...commentVotes.mergeVoteState(activeComment),
					avatar: avatarUrls.get(activeComment.link) || activeComment.avatar
				},
				onClose: () => setActiveComment(null),
				onVoteStateChange: handleCommentVoteStateChange,
				onVote: deps.handleVote,
				voteState: commentVotes.getVoteState(activeComment)
			}) : null,
			activeReview ? u(ReviewModal, {
				canVote: canReviewVote,
				onClose: () => setActiveReview(null),
				onVoteStateChange: handleReviewVoteStateChange,
				onVote: deps.handleReviewVote,
				review: reviewVotes.mergeVoteState(activeReview),
				voteState: reviewVotes.getVoteState(activeReview)
			}) : null,
			activeMediaModal?.type === "poster" ? u(PosterModal, {
				alt: activeMediaModal.alt,
				onClose: () => setActiveMediaModal(null),
				src: activeMediaModal.src
			}) : null,
			activeMediaModal?.type === "video" ? u(VideoModal, {
				onClose: () => setActiveMediaModal(null),
				trailer: activeMediaModal.trailer
			}) : null,
			loginAction ? u(LoginModal, {
				action: loginAction,
				onClose: () => setLoginAction(null)
			}) : null
		] });
	};
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
	var findInterestRoot = (doc) => $("#interest_sect_level", doc) || $("#interest_sectl", doc);
	var findInterestAnchors = (doc, root = findInterestRoot(doc)) => root ? $$("a", root) : [];
	var findInterestButtons = (doc) => {
		const result = {
			collect: null,
			do: null,
			wish: null
		};
		const scan = (anchors, doRe, wishRe, collectRe) => {
			for (const anchor of anchors) {
				const text = (anchor.textContent || "").trim();
				if (!result.do && doRe.test(text)) result.do = anchor;
				if (!result.wish && wishRe.test(text)) result.wish = anchor;
				if (!result.collect && collectRe.test(text)) result.collect = anchor;
			}
		};
		scan(findInterestAnchors(doc), RE_DO, RE_WISH, RE_COLLECT);
		if (!result.do || !result.wish || !result.collect) scan($$("#interest_sectl a", doc), RE_DO_EXACT, RE_WISH_EXACT, RE_COLLECT_EXACT);
		return result;
	};
	var isInterestActive = (anchor) => {
		if (!anchor) return false;
		const classes = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
		return RE_INTEREST_ACTIVE.test(classes);
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
			if (s && isInterestActive(a)) status = s;
		}
		return {
			hasWatching,
			status
		};
	};
	var extractInterestState = (doc) => {
		const ck = (doc.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";
		const loggedIn = !!ck;
		const root = findInterestRoot(doc);
		const anchors = findInterestAnchors(doc, root);
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
	var proxyInterestAction = (doc, status) => {
		findInterestButtons(doc)[status]?.click();
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
			const contentCopy = shortContent.cloneNode(true);
			contentCopy.querySelector("a.unfold")?.remove();
			return safeText(contentCopy).replace(/[\s\u00A0]*\(\)[\s\u00A0]*$/u, "").trim();
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
			const iconUrl = a.dataset.pic || void 0;
			out.push({
				href,
				iconUrl,
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
	var StarRatingInput = ({ disabled = false, onChange, rating }) => u("div", {
		class: "atv-interest-modal-stars",
		children: Array.from({ length: 5 }, (_, index) => {
			const value = index + 1;
			const full = value <= rating;
			return u("button", {
				class: `atv-interest-modal-star${full ? " is-full" : ""}`,
				disabled,
				onClick: () => {
					if (!disabled) onChange(value);
				},
				type: "button",
				children: full ? u(IconStarFull, {}) : u(IconStarEmpty, {})
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
		return u(S, { children: [
			u("div", { class: "atv-modal-accent-bar atv-interest-modal-accent" }),
			u("div", {
				class: "atv-interest-modal-header",
				children: [u("span", {
					class: "atv-interest-modal-header__title",
					id: "atv-interest-modal-title",
					children: `${titlePrefix}${INTEREST_LABELS[status]}`
				}), u(ModalCloseButton, {
					ariaLabel: "关闭标记弹窗",
					className: "atv-interest-modal-close",
					onClick: handleClose
				})]
			}),
			u("div", {
				class: "atv-interest-modal-body",
				children: [
					u("div", {
						class: "atv-interest-modal-statuses",
						children: statusEntries(state.hasWatching).map((entry) => u("button", {
							class: `atv-interest-modal-status${entry.value === status ? " is-active" : ""}`,
							"data-value": entry.value,
							disabled: loading,
							onClick: () => setStatus(entry.value),
							type: "button",
							children: entry.label
						}, entry.value))
					}),
					u(StarRatingInput, {
						disabled: loading,
						onChange: setRating,
						rating
					}),
					u("textarea", {
						class: "atv-interest-modal-comment",
						maxLength: 350,
						onInput: (event) => setComment(event.currentTarget.value),
						placeholder: "写一段短评…",
						rows: 3,
						value: comment
					}),
					u("button", {
						class: "atv-interest-modal-submit",
						disabled: loading,
						onClick: () => void save(),
						type: "button",
						children: loading ? "保存中..." : "保存"
					}),
					state.marked ? u("button", {
						class: "atv-interest-modal-remove",
						disabled: loading,
						onClick: () => void remove(),
						type: "button",
						children: "取消标记"
					}) : null,
					u("div", {
						class: "atv-interest-modal-error",
						children: error
					})
				]
			})
		] });
	};
	var InterestForm = ({ callbacks, onClose, state }) => u(ModalShell, {
		ariaLabelledBy: "atv-interest-modal-title",
		className: "atv-interest-modal",
		id: "atv-interest-modal",
		onClose,
		surfaceClassName: "atv-interest-modal-inner",
		children: u(InterestFormContent, {
			callbacks,
			state
		})
	});
	var openInterestModal = (state, callbacks) => {
		openImperativeModal({
			content: (close) => u(InterestForm, {
				callbacks,
				onClose: close,
				state
			}),
			id: "atv-interest-modal"
		});
	};
	var openLoginModal = (options) => {
		options.returnUrl;
		clearNativeLoginMasks();
		openImperativeModal({
			content: (close) => u(LoginModal, {
				action: options.action,
				onClose: close
			}),
			id: "atv-login-modal",
			onClose: clearNativeLoginMasks
		});
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
		const doc = adapters.doc ?? document;
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
				proxyInterestAction(doc, "collect");
			},
			handleOpenInterest: (state) => {
				if (!accountGate.requireLogin("标记这部作品")) return;
				openModal(state, buildModalCallbacks(subjectId, modalAdapters));
			},
			handleWatchingClick: () => {
				if (!accountGate.requireLogin("标记在看")) return;
				proxyInterestAction(doc, "do");
			},
			handleWishClick: () => {
				if (!accountGate.requireLogin("标记想看")) return;
				proxyInterestAction(doc, "wish");
			}
		};
	};
	var setSubjectTitle = (doc, data) => {
		doc.title = `${(data.title.primary || data.title.full) + (data.year ? ` (${data.year})` : "")} · 豆瓣`;
	};
	var buildHeroCallbacks = (subjectId, doc = document, loggedIn = true) => buildInterestMarkingCallbacks(subjectId, {
		doc,
		loggedIn
	});
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
		const root = doc.createElement("div");
		root.id = "atv-douban-root";
		R(u(SubjectPage, {
			data,
			deps: {
				canReviewVote: () => true,
				canVote: () => true,
				handleReviewVote: (rid, type) => postReviewVote(rid, type, data.subjectId),
				handleVote: (cid) => postVote(cid, data.subjectId),
				heroCallbacks: buildHeroCallbacks(data.subjectId, doc, data.interest.loggedIn),
				seriesMoreLink: extractSeriesMoreLink(doc)
			}
		}), root);
		doc.body.insertBefore(root, doc.body.firstChild);
	};
	var mountSubjectPageWhenReady = async () => {
		await _css(styles_default);
		if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountSubjectPage(), { once: true });
		else mountSubjectPage();
	};
	if (isDoubanLoginFrame()) installLoginFrameTheme();
	else mountSubjectPageWhenReady();
})();
