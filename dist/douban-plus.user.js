// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.0.6
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
// @connect      graphql.imdb.com
// @connect      www.rottentomatoes.com
// @connect      www.metacritic.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
	"use strict";
	var s = new Set();
	var _css = async (t) => {
		if (s.has(t)) return;
		s.add(t);
		((c) => {
			if (typeof GM_addStyle === "function") GM_addStyle(c);
			else (document.head || document.documentElement).appendChild(document.createElement("style")).append(c);
		})(t);
	};
	_css(":root {\n  --atv-bg-primary: #000000;\n  --atv-bg-secondary: #1c1c1e;\n  --atv-bg-tertiary: #2c2c2e;\n  --atv-bg-elevated: rgba(255, 255, 255, 0.06);\n  --atv-text-primary: #ffffff;\n  --atv-text-secondary: rgba(255, 255, 255, 0.72);\n  --atv-text-tertiary: rgba(255, 255, 255, 0.45);\n  --atv-accent: #41be5d;\n  --atv-accent-bright: #4cd97a;\n  --atv-accent-glow: rgba(65, 190, 93, 0.35);\n  --atv-rating-gold: #ffb800;\n  --atv-border-subtle: rgba(255, 255, 255, 0.08);\n  --atv-border-medium: rgba(255, 255, 255, 0.16);\n  --atv-radius-sm: 8px;\n  --atv-radius-md: 12px;\n  --atv-radius-lg: 16px;\n  --atv-radius-xl: 24px;\n}\n\nbody > #wrapper {\n  display: none !important;\n}\nbody {\n  padding: 0 !important;\n  margin: 0 !important;\n  background: #000 !important;\n}\n#db-global-nav,\n#db-nav-movie {\n  display: none !important;\n}\n[id^=\"dale_\"],\n[class*=\"dale_\"] {\n  display: none !important;\n}\n\n#atv-douban-root {\n  position: relative;\n  min-height: 100vh;\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  font-feature-settings: \"ss01\", \"cv11\";\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-primary);\n  opacity: 0;\n  animation: atv-fadein 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards;\n}\n\n@keyframes atv-fadein {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@keyframes atv-rise {\n  from {\n    opacity: 0;\n    transform: translateY(14px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n#atv-douban-root *,\n#atv-douban-root *::before,\n#atv-douban-root *::after {\n  box-sizing: border-box;\n}\n#atv-douban-root a {\n  color: inherit;\n  text-decoration: none;\n}\n#atv-douban-root a:hover {\n  background: transparent;\n}\n#atv-douban-root img {\n  display: block;\n  max-width: 100%;\n}\n\n/* ---------- Sticky nav ---------- */\n.atv-stickynav {\n  position: fixed;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: 9999;\n  box-sizing: border-box;\n  display: flex;\n  gap: 24px;\n  align-items: center;\n  justify-content: space-between;\n  height: 56px;\n  padding: 0 max(28px, 5vw);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  pointer-events: none;\n  background: rgba(10, 10, 12, 0.74);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  opacity: 0;\n  -webkit-backdrop-filter: saturate(180%) blur(24px);\n  backdrop-filter: saturate(180%) blur(24px);\n  transform: translateY(-100%);\n  transition:\n    opacity 280ms ease,\n    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-stickynav.is-visible {\n  pointer-events: auto;\n  opacity: 1;\n  transform: none;\n}\n.atv-stickynav-title {\n  flex: 0 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: #fff;\n  white-space: nowrap;\n}\n.atv-stickynav-jumps {\n  display: flex;\n  flex: 0 0 auto;\n  gap: 24px;\n}\n.atv-stickynav-jumps a {\n  position: relative;\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.7);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  cursor: pointer;\n  transition: color 200ms ease;\n}\n.atv-stickynav-jumps a::after {\n  content: \"\";\n  position: absolute;\n  bottom: -4px;\n  left: 50%;\n  width: 0;\n  height: 2px;\n  background: var(--atv-accent);\n  border-radius: 1px;\n  transition:\n    width 250ms ease,\n    left 250ms ease;\n}\n.atv-stickynav-jumps a:hover {\n  color: var(--atv-accent-bright);\n  background: transparent;\n}\n.atv-stickynav-jumps a.is-active {\n  color: var(--atv-accent-bright);\n}\n.atv-stickynav-jumps a.is-active::after {\n  left: 0;\n  width: 100%;\n}\n@media (max-width: 768px) {\n  .atv-stickynav-title {\n    font-size: 14px;\n  }\n  .atv-stickynav-jumps {\n    gap: 14px;\n  }\n  .atv-stickynav-jumps a {\n    font-size: 12px;\n  }\n}\n\n/* ---------- Hero ---------- */\n.atv-hero {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  min-height: 75vh;\n  padding: 132px max(28px, 5vw) 56px;\n  overflow: visible;\n  isolation: isolate;\n}\n.atv-hero-inner-section {\n  flex: 0 0 auto;\n}\n.atv-hero-bg {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -4;\n  height: 75vh;\n  overflow: hidden;\n  background: #000;\n}\n.atv-hero-still {\n  position: absolute;\n  inset: 0;\n  background-repeat: no-repeat;\n  background-position: center 30%;\n  background-size: cover;\n  transform: scale(1.04);\n  backface-visibility: hidden;\n  will-change: transform, opacity;\n}\n.atv-hero-still.is-thumb {\n  filter: blur(12px) saturate(1.12) brightness(0.84);\n  transform: scale(1.14);\n}\n.atv-hero-still.is-hd {\n  opacity: 0;\n  filter: saturate(1.08) brightness(0.88);\n  transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.atv-hero-still.is-hd.is-loaded {\n  opacity: 1;\n  animation: atv-kenburns 22s ease-out forwards;\n}\n.atv-hero-still.is-poster {\n  background-position: center 22%;\n  filter: blur(60px) saturate(1.25) brightness(0.78);\n  transform: scale(1.25);\n}\n@keyframes atv-kenburns {\n  from {\n    transform: scale(1) translate(0, 0);\n  }\n  to {\n    transform: scale(1.1) translate(-1.8%, -1.2%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .atv-hero-still.is-hd.is-loaded {\n    transform: scale(1.04);\n    animation: none;\n  }\n}\n.atv-hero-vignette {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -3;\n  height: 75vh;\n  background: radial-gradient(\n    120% 90% at 70% 30%,\n    transparent 0%,\n    rgba(0, 0, 0, 0.55) 100%\n  );\n}\n.atv-hero-overlay-x {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -2;\n  height: 75vh;\n  background: linear-gradient(\n    to right,\n    rgba(0, 0, 0, 0.96) 0%,\n    rgba(0, 0, 0, 0.82) 32%,\n    rgba(0, 0, 0, 0.5) 62%,\n    rgba(0, 0, 0, 0.35) 100%\n  );\n}\n.atv-hero-overlay-y {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -1;\n  height: 75vh;\n  background: linear-gradient(\n    to bottom,\n    rgba(0, 0, 0, 0.45) 0%,\n    transparent 28%,\n    transparent 55%,\n    #000 100%\n  );\n}\n.atv-hero-inner {\n  display: flex;\n  gap: 56px;\n  align-items: flex-start;\n  width: 100%;\n  max-width: 1100px;\n  margin: 0 auto;\n}\n.atv-poster-card {\n  flex: 0 0 auto;\n  width: 360px;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-lg);\n  box-shadow:\n    0 24px 60px rgba(0, 0, 0, 0.6),\n    0 0 0 1px var(--atv-border-subtle) inset;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-poster-card:hover {\n  transform: scale(1.03);\n}\n.atv-poster-card img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.atv-poster-placeholder {\n  width: 100%;\n  height: 100%;\n}\n\n.atv-hero-info {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n.atv-hero-title {\n  margin: 0 0 8px;\n  font-size: clamp(44px, 5.5vw, 72px);\n  font-weight: 700;\n  line-height: 1.05;\n  color: #fff;\n  letter-spacing: -0.02em;\n  text-shadow:\n    0 2px 20px rgba(0, 0, 0, 0.7),\n    0 0 60px rgba(0, 0, 0, 0.3);\n}\n.atv-hero-orig {\n  margin-bottom: 22px;\n  font-size: clamp(18px, 1.6vw, 22px);\n  font-weight: 400;\n  color: var(--atv-text-secondary);\n  letter-spacing: -0.01em;\n  opacity: 0.85;\n}\n.atv-hero-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: center;\n  margin-bottom: 24px;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}\n.atv-meta-dot {\n  display: inline-flex;\n  align-items: center;\n}\n.atv-meta-dot + .atv-meta-dot::before {\n  margin-right: 14px;\n  color: var(--atv-text-tertiary);\n  content: \"·\";\n}\n.atv-meta-chips {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n.atv-chip {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 11px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: none;\n  letter-spacing: 0.02em;\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: 999px;\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n\n/* ── Ratings Panel ──────────────────────────────── */\n/* Unified card presenting Douban + IMDb + RT side by side */\n\n.atv-rating-panel {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0;\n  align-items: stretch;\n  width: fit-content;\n  min-width: 320px;\n  margin-bottom: 28px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: var(--atv-radius-md);\n}\n\n.atv-rating-panel-douban,\n.atv-rating-panel-imdb,\n.atv-rating-panel-rt,\n.atv-rating-panel-mc {\n  flex: 1;\n  display: grid;\n  grid-template-rows: 28px 44px 20px 1fr;\n  justify-items: center;\n  align-items: center;\n  padding: 16px 24px 14px;\n  text-align: center;\n  transition: background 200ms ease;\n}\n.atv-rating-panel-douban:hover,\n.atv-rating-panel-imdb:hover,\n.atv-rating-panel-rt:hover,\n.atv-rating-panel-mc:hover {\n  background: rgba(255, 255, 255, 0.03);\n}\n\n.atv-rating-panel-douban {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-imdb {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-mc {\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.atv-rating-panel-logo {\n  display: inline-flex;\n  align-items: center;\n  align-self: center;\n  opacity: 0.85;\n  transition: opacity 200ms ease;\n}\n.atv-rating-panel-logo:hover {\n  opacity: 1;\n}\n.atv-rating-panel-logo svg {\n  display: block;\n}\n\n.atv-rating-panel .atv-rating-panel-score {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 38px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n  color: var(--atv-text-primary);\n}\n\n/* ── MC Score color by range ────────────────────── */\n\n.atv-rating-panel-score.is-high {\n  color: #3bb33b;\n}\n.atv-rating-panel-score.is-medium {\n  color: #ffb800;\n}\n.atv-rating-panel-score.is-low {\n  color: #fa320a;\n}\n\n/* ── MC label row (score bar + Chinese word label) ── */\n\n.atv-mc-label-row {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.atv-mc-bar-track {\n  display: inline-block;\n  width: 40px;\n  height: 4px;\n  border-radius: 2px;\n  background: rgba(255, 255, 255, 0.1);\n  overflow: hidden;\n  flex-shrink: 0;\n}\n\n.atv-mc-bar-fill {\n  display: block;\n  height: 100%;\n  border-radius: 2px;\n}\n\n.atv-mc-bar-fill.is-high {\n  background: #3bb33b;\n}\n.atv-mc-bar-fill.is-medium {\n  background: #ffb800;\n}\n.atv-mc-bar-fill.is-low {\n  background: #fa320a;\n}\n\n.atv-mc-word-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  line-height: 1;\n}\n\n.atv-rating-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n.atv-rating-stars svg {\n  display: block;\n}\n\n/* ── RT Score Row (values side by side) ─────────── */\n\n.atv-rt-score-row,\n.atv-rt-label-row,\n.atv-rt-count-row {\n  display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  gap: 8px;\n  align-items: center;\n  width: 100%;\n}\n\n.atv-rt-score-value {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 30px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n}\n\n.atv-rt-score-value.is-fresh {\n  color: var(--atv-text-primary);\n}\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:first-child {\n  color: rgba(255, 107, 91, 0.85);\n}\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:last-child {\n  color: rgba(255, 167, 38, 0.85);\n}\n\n.atv-rt-score-row > .atv-rt-score-value:first-child {\n  justify-self: center;\n  text-align: right;\n}\n.atv-rt-score-row > .atv-rt-score-value:last-child {\n  justify-self: center;\n  text-align: left;\n}\n\n/* ── RT Label Row (icons + text) ────────────────── */\n\n.atv-rt-label-row {\n  gap: 8px;\n}\n\n.atv-rt-label-item {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:first-child {\n  justify-self: center;\n}\n.atv-rt-label-row > .atv-rt-label-item:last-child {\n  justify-self: center;\n}\n\n.atv-rt-label-row {\n  grid-template-columns: 1fr 1fr;\n}\n\n.atv-rt-score-icon {\n  display: inline-flex;\n  width: 16px;\n  height: 16px;\n  color: var(--atv-text-tertiary);\n  opacity: 0.7;\n}\n.atv-rt-score-icon svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-rt-label-item.is-critics.is-fresh .atv-rt-score-icon {\n  color: #ff6b5b;\n  opacity: 1;\n}\n.atv-rt-label-item.is-critics.is-rotten .atv-rt-score-icon {\n  color: #50b85e;\n  opacity: 0.6;\n}\n.atv-rt-label-item.is-audience.is-fresh .atv-rt-score-icon {\n  color: #ffb800;\n  opacity: 1;\n}\n.atv-rt-label-item.is-audience.is-rotten .atv-rt-score-icon {\n  color: #888;\n  opacity: 0.6;\n}\n\n.atv-rt-score-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── Shared count text (Douban / IMDb) ──────────── */\n\n.atv-rating-panel-count {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── RT Count Row (e.g. 评价 300 | 50,000) ──────── */\n\n.atv-rt-count-row {\n  gap: 8px;\n}\n\n.atv-rt-count-value {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n.atv-rt-count-row > .atv-rt-count-value:first-child {\n  justify-self: center;\n}\n.atv-rt-count-row > .atv-rt-count-value:last-child {\n  justify-self: center;\n}\n\n.atv-rt-count-row {\n  grid-template-columns: 1fr 1fr;\n}\n\n/* ── RT Divider ─────────────────────────────────── */\n\n.atv-rt-divider {\n  width: 1px;\n  align-self: stretch;\n  margin: 2px 0;\n  background: rgba(255, 255, 255, 0.12);\n  flex-shrink: 0;\n}\n\n@media (max-width: 768px) {\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n    grid-template-rows: 24px 38px 18px 1fr;\n  }\n  .atv-rt-score-value {\n    font-size: 26px;\n  }\n  .atv-rt-score-icon {\n    width: 14px;\n    height: 14px;\n  }\n  .atv-rt-score-label {\n    font-size: 10px;\n  }\n  .atv-mc-bar-track {\n    width: 32px;\n  }\n  .atv-mc-word-label {\n    font-size: 10px;\n  }\n  .atv-rating-panel {\n    min-width: 0;\n  }\n}\n\n.atv-rating-empty {\n  font-size: 13px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.03em;\n  padding: 10px 0;\n}\n\n/* ── Skeleton (loading) ─────────────────────────── */\n\n.atv-rating-panel-imdb.is-loading,\n.atv-rating-panel-rt.is-loading,\n.atv-rating-panel-mc.is-loading {\n  transition: opacity 400ms ease;\n}\n.atv-rating-panel-imdb.is-empty,\n.atv-rating-panel-rt.is-empty,\n.atv-rating-panel-mc.is-empty {\n  display: none;\n}\n\n.atv-rating-panel-skeleton {\n  width: 120px;\n  height: 22px;\n  border-radius: 4px;\n  background: linear-gradient(\n    90deg,\n    rgba(255, 255, 255, 0.04) 25%,\n    rgba(255, 255, 255, 0.1) 50%,\n    rgba(255, 255, 255, 0.04) 75%\n  );\n  background-size: 200% 100%;\n  animation: atv-ratings-shimmer 1.6s ease-in-out infinite;\n}\n\n@keyframes atv-ratings-shimmer {\n  0% {\n    background-position: 200% 0;\n  }\n  100% {\n    background-position: -200% 0;\n  }\n}\n\n.atv-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-bottom: 26px;\n}\n.atv-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  height: 44px;\n  padding: 0 22px;\n  border-radius: 999px;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  border: none;\n  cursor: pointer;\n  transition:\n    transform 200ms ease,\n    background 200ms ease,\n    box-shadow 200ms ease,\n    color 200ms ease;\n  font-family: inherit;\n  -webkit-tap-highlight-color: transparent;\n}\n.atv-btn-primary {\n  color: #fff;\n  background: var(--atv-accent);\n  box-shadow: 0 8px 24px var(--atv-accent-glow);\n}\n.atv-btn-primary:hover {\n  background: var(--atv-accent-bright);\n  transform: translateY(-1px);\n}\n.atv-btn-secondary {\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n.atv-btn-secondary:hover {\n  background: rgba(255, 255, 255, 0.12);\n  transform: translateY(-1px);\n}\n.atv-btn.is-active {\n  color: #fff;\n  background: var(--atv-accent);\n  border-color: transparent;\n  box-shadow: 0 6px 20px var(--atv-accent-glow);\n}\n\n.atv-hero-summary {\n  margin-top: 16px;\n}\n.atv-hero-teaser {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  max-width: 660px;\n  margin: 0 0 12px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: var(--atv-text-secondary);\n  word-break: break-word;\n  white-space: pre-wrap;\n  overflow: hidden;\n}\n.atv-hero-teaser.is-clamped {\n  -webkit-line-clamp: 3;\n}\n.atv-hero-more {\n  display: inline-flex;\n  gap: 6px;\n  align-items: center;\n  padding: 0;\n  font-family: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-accent-bright);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: none;\n  border: none;\n}\n.atv-hero-more:hover {\n  color: var(--atv-accent);\n}\n.atv-hero-more svg {\n  transition: transform 220ms ease;\n}\n.atv-hero-more.is-open svg {\n  transform: rotate(180deg);\n}\n\n/* ---------- Section ---------- */\n.atv-section {\n  max-width: 1280px;\n  padding: 52px max(28px, 5vw);\n  margin: 0 auto;\n  scroll-margin-top: 64px;\n  animation: atv-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;\n}\n.atv-section + .atv-section {\n  padding-top: 0;\n}\n.atv-section-h {\n  position: relative;\n  display: flex;\n  align-items: center;\n  padding-left: 16px;\n  margin: 0 0 24px;\n  font-size: 24px;\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}\n.atv-section-h::before {\n  position: absolute;\n  top: 50%;\n  left: 0;\n  width: 4px;\n  height: 24px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 2px;\n  transform: translateY(-50%);\n}\n.atv-section-h-row {\n  display: flex;\n  gap: 16px;\n  align-items: baseline;\n  justify-content: space-between;\n  margin-bottom: 24px;\n}\n.atv-section-h-row .atv-section-h {\n  margin-bottom: 0;\n}\n.atv-section-more {\n  flex: 0 0 auto;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  transition: color 200ms ease;\n}\n.atv-section-more:hover {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Carousel ---------- */\n.atv-carousel {\n  display: flex;\n  gap: 16px;\n  overflow-x: auto;\n  scroll-snap-type: x mandatory;\n  scroll-behavior: smooth;\n  padding: 4px 4px 16px;\n  margin: 0 -4px;\n}\n.atv-carousel::-webkit-scrollbar {\n  display: none;\n}\n.atv-carousel {\n  scrollbar-width: none;\n}\n\n/* ---------- Page scrollbar ---------- */\n:root {\n  color-scheme: dark;\n}\n::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n}\n::-webkit-scrollbar-track {\n  background: #1c1c1e;\n}\n::-webkit-scrollbar-thumb {\n  background: #3a3a3c;\n  border-radius: 3px;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: #48484a;\n}\n::-webkit-scrollbar-corner {\n  background: transparent;\n}\n* {\n  scrollbar-color: #3a3a3c #1c1c1e;\n  scrollbar-width: thin;\n}\n\n/* ---------- Series ---------- */\n.atv-series-carousel {\n  mask-image: linear-gradient(to right, #000 97%, transparent 100%);\n  -webkit-mask-image: linear-gradient(to right, #000 97%, transparent 100%);\n}\n.atv-series-card {\n  flex: 0 0 158px;\n  min-width: 0;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-series-card:hover {\n  transform: translateY(-4px);\n}\n/* ── Active season (user is currently on this season's page) ── */\n.atv-series-card.is-active .atv-series-poster {\n  box-shadow:\n    inset 0 0 0 2px var(--atv-accent),\n    0 0 20px var(--atv-accent-glow);\n}\n.atv-series-card.is-active .atv-series-info::after {\n  width: 20px;\n  opacity: 1;\n}\n/* ── Poster ── */\n.atv-series-poster {\n  position: relative;\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 400ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 400ms ease;\n}\n.atv-series-card:hover .atv-series-poster {\n  box-shadow:\n    0 16px 48px rgba(0, 0, 0, 0.6),\n    0 0 0 1px rgba(255, 255, 255, 0.06);\n  transform: scale(1.06);\n}\n/* Poster bottom gradient overlay (Apple TV+ style depth) */\n.atv-series-poster::after {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 45%;\n  content: \"\";\n  background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 100%);\n  pointer-events: none;\n}\n.atv-series-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n}\n/* ── Rating badge (overlay on poster top-right) ── */\n.atv-series-badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  z-index: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 28px;\n  height: 22px;\n  padding: 0 7px;\n  font-size: 11px;\n  font-weight: 700;\n  line-height: 1;\n  color: #fff;\n  letter-spacing: 0.02em;\n  background: rgba(0, 0, 0, 0.65);\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  border-radius: 20px;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    background 300ms ease;\n}\n.atv-series-card:hover .atv-series-badge {\n  background: rgba(0, 0, 0, 0.8);\n  transform: translateY(-1px) scale(1.05);\n}\n/* ── Info row ── */\n.atv-series-info {\n  position: relative;\n  margin-top: 10px;\n}\n.atv-series-info::after {\n  display: block;\n  width: 0;\n  height: 2px;\n  margin-top: 4px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 1px;\n  opacity: 0;\n  transition:\n    width 400ms cubic-bezier(0.22, 1, 0.36, 1),\n    opacity 400ms ease;\n}\n.atv-series-card:hover .atv-series-info::after {\n  width: 100%;\n  opacity: 1;\n}\n.atv-series-title {\n  display: block;\n  overflow: hidden;\n  font-size: 14px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  letter-spacing: 0.01em;\n  transition: color 300ms ease;\n}\n.atv-series-card:hover .atv-series-title {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Cast ---------- */\n.atv-cast-carousel {\n  mask-image: linear-gradient(to right, #000 90%, transparent 100%);\n  -webkit-mask-image: linear-gradient(to right, #000 90%, transparent 100%);\n}\n.atv-cast-card {\n  flex: 0 0 160px;\n  min-width: 0;\n  text-align: center;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-cast-card:hover {\n  transform: translateY(-3px);\n}\n.atv-cast-avatar {\n  width: 160px;\n  height: 160px;\n  background-color: var(--atv-bg-tertiary);\n  background-position: center top;\n  background-size: cover;\n  border: 2px solid transparent;\n  border-radius: 50%;\n  transition:\n    transform 300ms ease,\n    border-color 300ms ease,\n    box-shadow 300ms ease,\n    filter 300ms ease;\n}\n.atv-cast-card:hover .atv-cast-avatar {\n  border-color: rgba(255, 255, 255, 0.2);\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);\n  filter: brightness(1.12);\n  transform: scale(1.05);\n}\n.atv-cast-name {\n  margin-top: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n.atv-cast-role {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  margin-top: 4px;\n  overflow: hidden;\n  -webkit-line-clamp: 2;\n  font-size: 13px;\n  font-weight: 400;\n  line-height: 1.35;\n  color: rgba(255, 255, 255, 0.55);\n}\n\n/* ---------- Photos ---------- */\n.atv-photos {\n  gap: 12px;\n}\n.atv-photo-tile {\n  flex: 0 0 400px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n}\n.atv-photo-tile.is-portrait {\n  flex: 0 0 240px;\n  aspect-ratio: 3 / 4;\n}\n.atv-photo-tile img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.atv-photo-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n\n/* ---------- Recommendations ---------- */\n.atv-recs {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));\n  gap: 24px;\n}\n.atv-rec-card {\n  cursor: pointer;\n}\n.atv-rec-poster {\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n.atv-rec-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.atv-rec-card:hover .atv-rec-poster {\n  box-shadow: 0 12px 40px var(--atv-accent-glow);\n  transform: scale(1.05);\n}\n.atv-rec-title {\n  margin-top: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  font-size: 15px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n}\n\n/* ---------- Info grid ---------- */\n.atv-info-grid {\n  display: grid;\n  grid-template-columns: 200px 1fr;\n  row-gap: 16px;\n  column-gap: 32px;\n}\n.atv-info-label {\n  padding-top: 2px;\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.55);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n.atv-info-value {\n  font-size: 15px;\n  font-weight: 400;\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  word-break: break-word;\n}\n.atv-info-value a {\n  color: var(--atv-text-primary);\n  border-bottom: 1px solid var(--atv-border-medium);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease;\n}\n.atv-info-value a:hover {\n  color: var(--atv-accent-bright);\n  border-color: var(--atv-accent-bright);\n}\n\n/* ---------- Streaming ---------- */\n.atv-stream-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.atv-stream-card {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  height: 52px;\n  padding: 0 20px;\n  border-radius: var(--atv-radius-md);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  color: var(--atv-text-primary);\n  font-size: 15px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  font-family: inherit;\n  -webkit-tap-highlight-color: transparent;\n  cursor: pointer;\n  transition:\n    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),\n    background 220ms ease,\n    border-color 220ms ease,\n    box-shadow 220ms ease;\n}\n.atv-stream-card:hover {\n  background: rgba(65, 190, 93, 0.14);\n  border-color: var(--atv-accent);\n  box-shadow: 0 10px 28px var(--atv-accent-glow);\n  transform: translateY(-2px);\n}\n.atv-stream-card .atv-stream-arrow {\n  display: inline-flex;\n  color: var(--atv-accent-bright);\n  transition: transform 220ms ease;\n}\n.atv-stream-card:hover .atv-stream-arrow {\n  transform: translateX(3px);\n}\n\n/* ---------- Comments ---------- */\n.atv-comments {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 18px;\n}\n.atv-comment-card {\n  display: flex;\n  flex-direction: column;\n  padding: 16px 18px;\n  background: var(--atv-bg-secondary);\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),\n    border-color 260ms ease;\n}\n.atv-comment-card:hover {\n  border-color: var(--atv-border-medium);\n  transform: translateY(-2px);\n}\n.atv-comment-top {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  margin-bottom: 14px;\n}\n.atv-comment-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 40px;\n  height: 40px;\n  overflow: hidden;\n  font-size: 17px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n  border: 1.5px solid var(--atv-border-subtle);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease,\n    filter 260ms ease;\n}\n.atv-comment-card:hover .atv-comment-avatar {\n  border-color: rgba(255, 255, 255, 0.3);\n  filter: brightness(1.15);\n}\n.atv-comment-avatar.atv-avatar-loaded {\n  animation: atv-avatar-reveal 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;\n}\n@keyframes atv-avatar-reveal {\n  from {\n    filter: blur(6px) brightness(1.25);\n  }\n  to {\n    filter: blur(0) brightness(1);\n  }\n}\n.atv-comment-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n.atv-comment-author,\na.atv-comment-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\na.atv-comment-author:hover {\n  color: var(--atv-text-primary);\n  background: none;\n}\n.atv-comment-stars {\n  display: inline-flex;\n  gap: 1px;\n  color: var(--atv-rating-gold);\n}\n.atv-comment-stars svg {\n  display: block;\n}\n.atv-comment-body {\n  position: relative;\n  display: -webkit-box;\n  flex: 1 1 auto;\n  -webkit-box-orient: vertical;\n  margin: 0 0 14px;\n  overflow: hidden;\n  -webkit-line-clamp: 4;\n  font-size: 15px;\n  line-height: 1.5;\n  color: rgba(255, 255, 255, 0.85);\n  word-break: break-word;\n}\n.atv-comment-foot {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n.atv-comment-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  padding: 4px 8px;\n  font-family: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: none;\n  border: 1px solid transparent;\n  border-radius: 6px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n.atv-comment-votes:hover {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.18);\n  transform: scale(1.05);\n}\n.atv-comment-votes:active {\n  transform: scale(0.95);\n}\n.atv-comment-votes.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.25);\n  background: rgba(65, 190, 93, 0.06);\n}\n.atv-comment-votes svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n/* ---------- Comment Expand Overlay ---------- */\n.atv-comment-foot-right {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n}\n.atv-comment-expand {\n  display: none;\n  align-items: center;\n  justify-content: center;\n  width: 22px;\n  height: 22px;\n  padding: 0;\n  font-family: inherit;\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 50%;\n  backdrop-filter: blur(4px);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 200ms ease;\n}\n.atv-comment-card.has-overflow .atv-comment-expand {\n  display: inline-flex;\n}\n.atv-comment-expand:hover {\n  color: var(--atv-accent);\n  border-color: var(--atv-accent);\n  background: rgba(65, 190, 93, 0.1);\n}\n.atv-comment-expand:active {\n  transform: scale(0.9);\n}\n.atv-comment-expand svg {\n  display: block;\n  width: 12px;\n  height: 12px;\n}\n\n/* ── Overlay ── */\n.atv-comment-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  opacity: 0;\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-comment-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n.atv-comment-overlay-inner {\n  position: relative;\n  width: 100%;\n  max-width: 580px;\n  max-height: 80vh;\n  overflow-y: auto;\n  background: var(--atv-bg-secondary);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 20px;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-comment-overlay.is-open .atv-comment-overlay-inner {\n  transform: scale(1) translateY(0);\n}\n.atv-comment-overlay-accent {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 1;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-comment-overlay.is-open .atv-comment-overlay-accent {\n  transform: scaleX(1);\n}\n.atv-comment-overlay-close {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  color: rgba(255, 255, 255, 0.6);\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.06);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 50%;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n}\n.atv-comment-overlay-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n.atv-comment-overlay-close svg {\n  display: block;\n  width: 16px;\n  height: 16px;\n}\n.atv-comment-overlay-top {\n  display: flex;\n  gap: 14px;\n  align-items: center;\n  padding: 28px 28px 0;\n}\n.atv-comment-overlay-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  overflow: hidden;\n  font-size: 18px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n  border: 2px solid var(--atv-border-subtle);\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease;\n}\n.atv-comment-overlay-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  min-width: 0;\n}\n.atv-comment-overlay-author,\na.atv-comment-overlay-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\na.atv-comment-overlay-author:hover {\n  color: var(--atv-text-primary);\n  background: none;\n}\n.atv-comment-overlay-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n.atv-comment-overlay-stars svg {\n  display: block;\n  width: 15px;\n  height: 15px;\n}\n.atv-comment-overlay-body {\n  padding: 20px 28px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: rgba(255, 255, 255, 0.85);\n  word-break: break-word;\n  white-space: pre-wrap;\n}\n.atv-comment-overlay-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 28px 28px;\n}\n.atv-comment-overlay-time {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n.atv-comment-overlay-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  padding: 6px 12px;\n  font-family: inherit;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 8px;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform 200ms ease;\n}\n.atv-comment-overlay-votes:hover {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.18);\n  background: rgba(65, 190, 93, 0.04);\n}\n.atv-comment-overlay-votes:active {\n  transform: scale(0.95);\n}\n.atv-comment-overlay-votes.is-voted {\n  color: var(--atv-accent);\n  border-color: rgba(65, 190, 93, 0.25);\n  background: rgba(65, 190, 93, 0.06);\n}\n.atv-comment-overlay-votes svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n/* ---------- Poster Modal ---------- */\n.atv-poster-card {\n  cursor: pointer;\n}\n.atv-modal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.78);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(28px) saturate(1.15);\n  backdrop-filter: blur(28px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-modal-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n.atv-modal-img {\n  max-width: 90vw;\n  max-height: 90vh;\n  object-fit: contain;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-modal-overlay.is-open .atv-modal-img {\n  transform: scale(1);\n}\n.atv-modal-close {\n  position: fixed;\n  top: 24px;\n  right: 24px;\n  z-index: 10001;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  color: #fff;\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  border-radius: 50%;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n}\n.atv-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n.atv-modal-close svg {\n  display: block;\n}\n\n/* ---------- Footer spacer ---------- */\n.atv-footer-spacer {\n  height: 64px;\n}\n\n/* ---------- Interest Modal ---------- */\n.atv-interest-modal {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.72);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(24px) saturate(1.15);\n  backdrop-filter: blur(24px) saturate(1.15);\n  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-interest-modal.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n.atv-interest-modal-inner {\n  position: relative;\n  width: 100%;\n  max-width: 380px;\n  max-height: 90vh;\n  overflow-y: auto;\n  background: var(--atv-bg-secondary);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 20px;\n  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);\n  transform: scale(0.92) translateY(8px);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-interest-modal.is-open .atv-interest-modal-inner {\n  transform: scale(1) translateY(0);\n}\n.atv-interest-modal-accent {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 1;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-interest-modal.is-open .atv-interest-modal-accent {\n  transform: scaleX(1);\n}\n.atv-interest-modal-header {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px 48px 0;\n}\n.atv-interest-modal-header__title {\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  letter-spacing: 0.01em;\n}\n.atv-interest-modal-close {\n  position: absolute;\n  top: 14px;\n  right: 14px;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  color: rgba(255, 255, 255, 0.6);\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.06);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 50%;\n  font-family: inherit;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n}\n.atv-interest-modal-close:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n.atv-interest-modal-close:active {\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n.atv-interest-modal-close svg {\n  display: block;\n}\n.atv-interest-modal-body {\n  padding: 16px 20px 20px;\n}\n.atv-interest-modal-statuses {\n  display: flex;\n  gap: 0;\n  padding: 3px;\n  margin-bottom: 20px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 999px;\n}\n.atv-interest-modal-status {\n  flex: 1;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  height: 36px;\n  padding: 0 12px;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  border: none;\n  border-radius: 999px;\n  background: transparent;\n  font-family: inherit;\n  transition:\n    color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n}\n.atv-interest-modal-status:hover {\n  color: var(--atv-text-secondary);\n}\n.atv-interest-modal-status.is-active {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.12);\n}\n.atv-interest-modal-stars {\n  display: flex;\n  gap: 6px;\n  justify-content: center;\n  margin-bottom: 24px;\n}\n.atv-interest-modal-star {\n  width: 28px;\n  height: 28px;\n  color: rgba(255, 255, 255, 0.2);\n  cursor: pointer;\n  transition:\n    color 200ms ease,\n    transform 200ms ease;\n}\n.atv-interest-modal-star.is-full {\n  color: var(--atv-rating-gold);\n}\n.atv-interest-modal-star:hover {\n  transform: scale(1.15);\n}\n.atv-interest-modal-star svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n.atv-interest-modal-comment {\n  display: block;\n  width: 100%;\n  min-height: 64px;\n  padding: 10px 14px;\n  margin-bottom: 16px;\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 10px;\n  font-family: inherit;\n  resize: vertical;\n  transition:\n    border-color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  box-sizing: border-box;\n}\n.atv-interest-modal-comment::placeholder {\n  color: var(--atv-text-tertiary);\n}\n.atv-interest-modal-comment:focus {\n  outline: none;\n  border-color: rgba(255, 255, 255, 0.2);\n  background: rgba(255, 255, 255, 0.06);\n}\n.atv-interest-modal-submit {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 44px;\n  padding: 0 24px;\n  margin-bottom: 10px;\n  font-size: 14px;\n  font-weight: 600;\n  color: #fff;\n  letter-spacing: 0.01em;\n  cursor: pointer;\n  background: var(--atv-accent);\n  border: none;\n  border-radius: 999px;\n  font-family: inherit;\n  transition:\n    background 200ms ease,\n    transform 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n  -webkit-font-smoothing: antialiased;\n}\n.atv-interest-modal-submit:hover {\n  background: var(--atv-accent-bright);\n}\n.atv-interest-modal-submit:active {\n  transform: scale(0.97);\n}\n.atv-interest-modal-submit:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.atv-interest-modal-remove {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 36px;\n  padding: 0 24px;\n  margin-bottom: 4px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: transparent;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 999px;\n  font-family: inherit;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n  -webkit-tap-highlight-color: transparent;\n}\n.atv-interest-modal-remove:hover {\n  color: var(--atv-text-secondary);\n  border-color: rgba(255, 255, 255, 0.15);\n  background: rgba(255, 255, 255, 0.04);\n}\n.atv-interest-modal-remove:active {\n  background: rgba(255, 255, 255, 0.08);\n}\n.atv-interest-modal-error {\n  font-size: 12px;\n  font-weight: 500;\n  color: #ff453a;\n  text-align: center;\n  border-radius: 10px;\n}\n\n.atv-interest-modal-error:empty {\n  display: none;\n}\n\n.atv-interest-modal-error:not(:empty) {\n  padding: 8px 16px;\n  margin-top: 8px;\n  background: rgba(255, 69, 58, 0.08);\n}\n\n/* ---------- Interest Panel (S3 marked state) ---------- */\n\n.atv-interest-panel {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  width: 100%;\n}\n\n.atv-interest-panel-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n.atv-interest-badge {\n  cursor: pointer;\n}\n\n.atv-interest-panel-stars {\n  display: inline-flex;\n  gap: 2px;\n  align-items: center;\n}\n\n.atv-interest-panel-stars svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n}\n\n.atv-interest-panel-date {\n  font-size: 13px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n\n.atv-interest-panel-comment {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  font-size: 14px;\n  line-height: 1.6;\n  color: var(--atv-text-secondary);\n  font-style: italic;\n  padding: 6px 0 2px;\n}\n\n.atv-useful-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-size: 12px;\n  font-style: normal;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ---------- Trailer Tile ---------- */\n.atv-trailer-tile {\n  flex: 0 0 400px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  background-size: cover;\n  background-position: center;\n  position: relative;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n}\n.atv-trailer-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n.atv-trailer-play-overlay {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(0, 0, 0, 0.12);\n  transition: background 300ms ease;\n}\n.atv-trailer-tile:hover .atv-trailer-play-overlay {\n  background: rgba(0, 0, 0, 0.2);\n}\n.atv-trailer-play-btn {\n  width: 56px;\n  height: 56px;\n  background: rgba(0, 0, 0, 0.6);\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n.atv-trailer-play-btn svg {\n  display: block;\n  width: 24px;\n  height: 24px;\n  color: #fff;\n  margin-left: 3px;\n}\n.atv-trailer-tile:hover .atv-trailer-play-btn {\n  transform: scale(1.08);\n  box-shadow: 0 0 30px var(--atv-accent-glow);\n}\n.atv-trailer-label {\n  position: absolute;\n  bottom: 12px;\n  left: 12px;\n  padding: 4px 10px;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.6);\n  font-size: 12px;\n  font-weight: 500;\n  color: #fff;\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n}\n\n/* ---------- Video Modal ---------- */\n.atv-modal-overlay.is-video {\n  background: #000;\n  -webkit-backdrop-filter: none;\n  backdrop-filter: none;\n}\n.atv-modal-video {\n  display: block;\n  max-width: 95vw;\n  max-height: 90vh;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-modal-overlay.is-open .atv-modal-video {\n  transform: scale(1);\n}\n\n/* ---------- Responsive ---------- */\n@media (max-width: 1024px) {\n  .atv-hero {\n    min-height: 64vh;\n    padding: 104px 24px 48px;\n  }\n  .atv-hero-inner {\n    flex-direction: column;\n    gap: 28px;\n    align-items: flex-start;\n  }\n  .atv-poster-card {\n    width: 220px;\n  }\n  .atv-section {\n    padding: 44px 24px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 160px 1fr;\n    column-gap: 24px;\n  }\n}\n@media (max-width: 768px) {\n  .atv-hero {\n    min-height: 56vh;\n    padding: 88px 20px 40px;\n  }\n  .atv-poster-card {\n    width: 180px;\n  }\n  .atv-section {\n    padding: 36px 20px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 1fr;\n    row-gap: 4px;\n  }\n  .atv-info-label {\n    padding-top: 12px;\n  }\n  .atv-recs {\n    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));\n    gap: 18px;\n  }\n  .atv-cast-card {\n    flex-basis: 120px;\n  }\n  .atv-cast-avatar {\n    width: 120px;\n    height: 120px;\n  }\n  .atv-series-card {\n    flex-basis: 120px;\n  }\n  .atv-photo-tile {\n    flex-basis: 280px;\n  }\n  .atv-photo-tile.is-portrait {\n    flex-basis: 170px;\n  }\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n  }\n  .atv-rating-panel {\n    min-width: 0;\n  }\n  .atv-comments {\n    grid-template-columns: 1fr;\n  }\n  .atv-comment-overlay-inner {\n    max-width: 95vw;\n    border-radius: 16px;\n  }\n  .atv-comment-overlay-top {\n    padding: 24px 20px 0;\n  }\n  .atv-comment-overlay-body {\n    padding: 16px 20px;\n    font-size: 14px;\n  }\n  .atv-comment-overlay-foot {\n    padding: 0 20px 24px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .atv-trailer-tile,\n  .atv-trailer-tile:hover {\n    transform: none;\n    filter: none;\n  }\n  .atv-trailer-play-overlay {\n    transition: none;\n  }\n  .atv-trailer-play-btn {\n    transition: none;\n  }\n  .atv-trailer-tile:hover .atv-trailer-play-btn {\n    transform: none;\n    box-shadow: none;\n  }\n  .atv-modal-video {\n    transition: none;\n  }\n  .atv-modal-overlay.is-open .atv-modal-video {\n    transform: none;\n  }\n  .atv-comment-avatar.atv-avatar-loaded {\n    animation: none;\n  }\n\n  /* Modal overlay fades */\n  .atv-modal-overlay,\n  .atv-comment-overlay,\n  .atv-interest-modal {\n    transition: none;\n  }\n\n  /* Accent edge glow */\n  .atv-comment-overlay-accent,\n  .atv-interest-modal-accent {\n    transition: none;\n  }\n\n  /* Ensure accent glows are visible even without animation */\n  .atv-comment-overlay.is-open .atv-comment-overlay-accent,\n  .atv-interest-modal.is-open .atv-interest-modal-accent {\n    transform: scaleX(1);\n  }\n}\n@media (max-width: 768px) {\n  .atv-trailer-tile {\n    flex-basis: 280px;\n  }\n}\n");
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
	var RE_SLASH_SEP = /\s*\/\s*/gu;
	var RE_WS_GLOBAL = /\s+/gu;
	var RE_COLON_WS = /[:：\s]/gu;
	var RE_YEAR_TRAIL = /\(\d{4}\)\s*$/u;
	var RE_WS = /\s+/u;
	var RE_YEAR = /(?<year>\d{4})/u;
	var RE_NON_DIGIT = /\D/gu;
	var RE_WS_NL = /\s+\n/gu;
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
	var ICON_STAR_FULL = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z\"/></svg>";
	var ICON_STAR_HALF = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><defs><linearGradient id=\"atvHalfStar\"><stop offset=\"50%\" stop-color=\"currentColor\"/><stop offset=\"50%\" stop-color=\"currentColor\" stop-opacity=\"0.22\"/></linearGradient></defs><path fill=\"url(#atvHalfStar)\" d=\"M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z\"/></svg>";
	var ICON_STAR_EMPTY = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" fill-opacity=\"0.22\" d=\"M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z\"/></svg>";
	var LOGO_DOUBAN = "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-label=\"豆瓣\" fill=\"#2D963D\"><path d=\"M.51 3.06h22.98V.755H.51V3.06Zm20.976 2.537v9.608h-2.137l-1.669 5.76H24v2.28H0v-2.28h6.32l-1.67-5.76H2.515V5.597h18.972Zm-5.066 9.608H7.58l1.67 5.76h5.501l1.67-5.76ZM18.367 7.9H5.634v5.025h12.733V7.9Z\"/></svg>";
	var LOGO_IMDB = "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-label=\"IMDb\" fill=\"#F5C518\"><path d=\"M22.3781 0H1.6218C.7411.0583.0587.7437.0018 1.5953l-.001 20.783c.0585.8761.7125 1.543 1.5559 1.6191A.337.337 0 0 0 1.6016 24h20.7971a.4579.4579 0 0 0 .0437-.002c.8727-.0768 1.5568-.8271 1.5568-1.7085V1.7098c0-.8914-.696-1.6416-1.584-1.7078A.3294.3294 0 0 0 22.3781 0zm0 .496a1.2144 1.2144 0 0 1 1.1252 1.2139v20.5797c0 .6377-.4875 1.1602-1.1045 1.2145H1.6016c-.5967-.0543-1.0645-.5297-1.1053-1.1258V1.6284C.5371 1.0185 1.0184.5364 1.6217.496h20.7564zM4.7954 8.2603v7.3636H2.8899V8.2603h1.9055zm6.5367 0v7.3636H9.6707v-4.9704l-.6711 4.9704H7.813l-.6986-4.8618-.0066 4.8618h-1.668V8.2603h2.468c.0748.4476.1492.9694.2307 1.5734l.2712 1.8713.4407-3.4447h2.4817zm2.9772 1.3289c.0742.0404.122.108.1417.2034.0279.0953.0345.3118.0345.6442v2.8548c0 .4881-.0345.7867-.0955.8954-.0609.1152-.2304.1695-.5018.1695V9.5211c.204 0 .3457.0205.4211.0681zm-.0211 6.0347c.4543 0 .8006-.0265 1.0245-.0742.2304-.0477.4204-.1357.5694-.2648.1556-.1218.2642-.298.3251-.5219.0611-.2238.1021-.6648.1021-1.3224v-2.5832c0-.6986-.0271-1.1668-.0742-1.4039-.041-.237-.1431-.4543-.3126-.6437-.1695-.1973-.4198-.3324-.7456-.421-.3191-.0808-.8542-.1285-1.7694-.1285h-1.4244v7.3636h2.3051zm5.14-1.7827c0 .3523-.0199.5762-.0544.6708-.033.0947-.1894.1424-.3046.1424-.1086 0-.19-.0477-.2238-.1351-.041-.0887-.0609-.2986-.0609-.6238v-1.9469c0-.3324.0199-.5423.0543-.6237.0338-.0808.1086-.122.2171-.122.1153 0 .2709.0412.3114.1425.041.0947.0609.2986.0609.6032v1.8926zm-2.4747-5.5809v7.3636h1.7157l.1152-.4675c.1556.1894.3251.3324.5152.4271.1828.0881.4608.1357.678.1357.3047 0 .5629-.0748.7802-.237.2165-.1562.3589-.3462.4198-.5628.0543-.2173.0887-.543.0887-.9841v-2.0675c0-.4409-.0139-.7324-.0344-.8681-.0199-.1357-.0742-.2781-.1695-.4204-.1021-.1425-.2437-.251-.4272-.3325-.1834-.0742-.3999-.1152-.6576-.1152-.2172 0-.4952.0477-.6846.1285-.1835.0887-.353.2238-.5086.4007V8.2603h-1.8309z\"/></svg>";
	var LOGO_METACRITIC = "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-label=\"Metacritic\" fill=\"#FFD500\"><path d=\"M11.99 0A12 12 0 1 0 24 12v-.014A12 12 0 0 0 11.99 0Zm-.055 2.564a9.399 9.399 0 0 1 9.407 9.389v.01a9.399 9.399 0 1 1-9.408-9.399Zm-1.61 17.198 2.046-2.046-3.94-3.94c-.165-.166-.345-.373-.442-.608-.221-.47-.318-1.203.221-1.742.664-.664 1.548-.387 2.406.47l3.788 3.788 2.046-2.046-3.954-3.954a2.48 2.48 0 0 1-.456-.622c-.263-.539-.25-1.216.235-1.7.677-.678 1.562-.429 2.544.553l3.677 3.677 2.046-2.046-3.982-3.982c-2.018-2.018-3.912-1.949-5.212-.65-.498.499-.802 1.024-.954 1.618a4.026 4.026 0 0 0-.055 1.686l-.027.028c-.996-.414-2.13-.166-3 .705-1.162 1.161-1.12 2.392-.982 3.11l-.042.043-1.009-.816-1.77 1.77a64.1 64.1 0 0 1 2.213 2.1z\"/></svg>";
	var LOGO_RT = "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-label=\"Rotten Tomatoes\" fill=\"#FA320A\"><path d=\"M5.866 0L4.335 1.262l2.082 1.8c-2.629-.989-4.842 1.4-5.012 2.338 1.384-.323 2.24-.422 3.344-.335-7.042 4.634-4.978 13.148-1.434 16.094 5.784 4.612 13.77 3.202 17.91-1.316C27.26 13.363 22.993.65 10.86 2.766c.107-1.17.633-1.503 1.243-1.602-.89-1.493-3.67-.734-4.556 1.374C7.52 2.602 5.866 0 5.866 0zM4.422 7.217H6.9c2.673 0 2.898.012 3.55.202 1.06.307 1.868.973 2.313 1.904.05.106.092.206.13.305l7.623.008.027 2.912-2.745-.024v7.549l-2.982-.016v-7.522l-2.127.016a2.92 2.92 0 0 1-1.056 1.134c-.287.176-.3.19-.254.264.127.2 2.125 3.642 2.125 3.659l-3.39.019-2.013-3.376c-.034-.047-.122-.068-.344-.084l-.297-.02.037 3.48-3.075-.038zm3.016 2.288l.024.338c.014.186.024.729.024 1.206v.867l.582-.025c.32-.013.695-.049.833-.078.694-.146 1.048-.478 1.087-1.018.027-.378-.063-.636-.303-.87-.318-.309-.761-.416-1.733-.418Z\"/></svg>";
	var ICON_PLAY = "<svg viewBox=\"0 0 14 14\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z\"/></svg>";
	var ICON_CHECK = "<svg viewBox=\"0 0 14 14\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.5 7.5l3 3 6-7\"/></svg>";
	var ICON_CHEVRON = "<svg viewBox=\"0 0 12 12\" width=\"10\" height=\"10\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.5 4l3.5 4 3.5-4\"/></svg>";
	var ICON_ARROW = "<svg viewBox=\"0 0 16 16\" width=\"15\" height=\"15\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5\"/></svg>";
	var ICON_THUMB = "<svg viewBox=\"0 0 16 16\" width=\"13\" height=\"13\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z\"/></svg>";
	var ICON_EXPAND = "<svg viewBox=\"0 0 14 14\" width=\"12\" height=\"12\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 5.5l4 4 4-4\"/></svg>";
	var ICON_TOMATO = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><circle cx=\"8\" cy=\"8\" r=\"5.5\" fill=\"currentColor\"/></svg>";
	var ICON_POPCORN = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M8 2l6 6-6 6-6-6z\"/></svg>";
	var ICON_FILM_PLACEHOLDER = "<svg viewBox=\"0 0 64 96\" width=\"100%\" height=\"100%\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"atvFilmGrad\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#2c2c2e\"/><stop offset=\"100%\" stop-color=\"#1c1c1e\"/></linearGradient></defs><rect width=\"64\" height=\"96\" fill=\"url(#atvFilmGrad)\"/><g fill=\"rgba(255,255,255,0.12)\"><rect x=\"4\" y=\"6\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"18\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"30\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"42\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"54\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"66\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"78\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"6\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"18\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"30\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"42\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"54\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"66\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"78\" width=\"6\" height=\"6\" rx=\"1\"/></g><path d=\"M26 38l14 10-14 10z\" fill=\"rgba(255,255,255,0.28)\"/></svg>";
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
	var renderStars = (score, opts) => {
		const o = opts || {};
		const wrap = el("span", { className: o.className || "atv-rating-stars" });
		const out = o.outOfFive ? score : score / 2;
		for (let i = 1; i <= 5; i += 1) {
			let svg;
			if (out >= i - .25) svg = ICON_STAR_FULL;
			else if (out >= i - .75) svg = ICON_STAR_HALF;
			else svg = ICON_STAR_EMPTY;
			wrap.append(el("span", { html: svg }));
		}
		return wrap;
	};
	var renderStarRating = (starEls, rating) => {
		for (let idx = 0; idx < 5; idx += 1) {
			const full = idx < rating;
			starEls[idx].innerHTML = full ? ICON_STAR_FULL : ICON_STAR_EMPTY;
			starEls[idx].classList.toggle("is-full", full);
		}
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
		const icon = options.closeIcon ?? CLOSE_SVG;
		const closeBtn = el("button", {
			attrs: { type: "button" },
			className: "atv-modal-close",
			html: options.closeSize ? icon.replace(`width="22"`, `width="${options.closeSize}"`).replace(`height="22"`, `height="${options.closeSize}"`) : icon
		});
		overlay.append(closeBtn);
		let dismissed = false;
		const dismiss = () => {
			if (dismissed || !overlay.isConnected) return;
			dismissed = true;
			overlay.classList.remove("is-open");
			document.body.style.overflow = "";
			options.onClose?.();
			setTimeout(() => {
				overlay.remove();
			}, 350);
		};
		closeBtn.addEventListener("click", dismiss);
		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) dismiss();
		});
		const keyHandler = (e) => {
			if (e.key === "Escape") {
				dismiss();
				document.removeEventListener("keydown", keyHandler);
			}
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
	var INTEREST_LABELS = {
		collect: "看过",
		do: "在看",
		none: "未标记",
		wish: "想看"
	};
	var buildStarRating = (initialRating) => {
		const container = el("div", { className: "atv-interest-modal-stars" });
		const starEls = [];
		let rating = initialRating;
		let loading = false;
		const update = (n) => {
			renderStarRating(starEls, n);
		};
		const createStar = (position) => {
			const idx = position;
			const full = idx <= rating;
			const star = el("span", {
				className: `atv-interest-modal-star${full ? " is-full" : ""}`,
				html: full ? ICON_STAR_FULL : ICON_STAR_EMPTY
			});
			star.addEventListener("click", () => {
				if (loading) return;
				rating = idx;
				update(idx);
			});
			star.addEventListener("mouseenter", () => update(idx));
			starEls.push(star);
			container.append(star);
		};
		for (let idx = 1; idx <= 5; idx += 1) createStar(idx);
		container.addEventListener("mouseleave", () => {
			update(rating);
		});
		const setRating = (n) => {
			rating = n;
			update(n);
		};
		const currentRating = () => rating;
		const setIsLoading = (v) => {
			loading = v;
		};
		return {
			container,
			currentRating,
			setIsLoading,
			setRating
		};
	};
	var buildInterestModalContent = (state) => {
		const overlay = el("div", {
			className: "atv-interest-modal",
			id: "atv-interest-modal"
		});
		const errorEl = el("div", { className: "atv-interest-modal-error" });
		const titleSpan = el("span", {
			className: "atv-interest-modal-header__title",
			text: state.marked && state.status !== "none" ? `修改${INTEREST_LABELS[state.status]}` : "标记想看"
		});
		const closeBtn = el("button", {
			attrs: { type: "button" },
			className: "atv-interest-modal-close",
			html: "<svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M6 6l12 12M18 6l-12 12\"/></svg>"
		});
		const header = el("div", { className: "atv-interest-modal-header" }, [titleSpan, closeBtn]);
		const initStatus = state.marked && state.status !== "none" ? state.status : "wish";
		const statusEntries = [
			{
				label: "想看",
				value: "wish"
			},
			...state.hasWatching ? [{
				label: "在看",
				value: "do"
			}] : [],
			{
				label: "看过",
				value: "collect"
			}
		];
		const statusBtns = [];
		const statusContainer = el("div", { className: "atv-interest-modal-statuses" });
		for (const entry of statusEntries) {
			const btn = el("button", {
				attrs: {
					"data-value": entry.value,
					type: "button"
				},
				className: `atv-interest-modal-status${entry.value === initStatus ? " is-active" : ""}`,
				text: entry.label
			});
			statusBtns.push(btn);
			statusContainer.append(btn);
		}
		const starRating = buildStarRating(state.rating || 0);
		const commentTextarea = el("textarea", {
			attrs: {
				maxlength: "350",
				placeholder: "写一段短评…",
				rows: "3"
			},
			className: "atv-interest-modal-comment",
			text: state.comment || ""
		});
		const submitBtn = el("button", {
			attrs: { type: "button" },
			className: "atv-interest-modal-submit",
			text: "保存"
		});
		const removeBtn = state.marked ? el("button", {
			attrs: { type: "button" },
			className: "atv-interest-modal-remove",
			text: "取消标记"
		}) : null;
		const body = el("div", { className: "atv-interest-modal-body" }, [
			statusContainer,
			starRating.container,
			commentTextarea,
			submitBtn
		]);
		if (removeBtn) body.append(removeBtn);
		body.append(errorEl);
		const inner = el("div", { className: "atv-interest-modal-inner" }, [
			el("div", { className: "atv-interest-modal-accent" }),
			header,
			body
		]);
		overlay.append(inner);
		return {
			closeBtn,
			commentTextarea,
			errorEl,
			form: { status: initStatus },
			overlay,
			removeBtn,
			starRating,
			statusBtns,
			statusContainer,
			submitBtn,
			titleSpan
		};
	};
	var openInterestModal = (state, callbacks) => {
		const content = buildInterestModalContent(state);
		const loading = { loading: false };
		const children = [];
		while (content.overlay.firstElementChild) {
			const child = content.overlay.firstElementChild;
			child.remove();
			children.push(child);
		}
		const { dismiss } = createOverlay({
			className: "atv-interest-modal",
			content: children,
			id: "atv-interest-modal"
		});
		for (const btn of content.statusBtns) {
			const value = btn.dataset.value;
			btn.addEventListener("click", () => {
				if (loading.loading) return;
				content.form.status = value;
				for (const b of content.statusBtns) b.classList.toggle("is-active", b === btn);
				const prefix = state.marked ? "修改" : "标记";
				content.titleSpan.textContent = `${prefix}${INTEREST_LABELS[value]}`;
			});
		}
		content.submitBtn.addEventListener("click", async () => {
			if (loading.loading) return;
			loading.loading = true;
			content.starRating.setIsLoading(true);
			content.submitBtn.textContent = "保存中...";
			content.submitBtn.disabled = true;
			content.errorEl.textContent = "";
			const result = await callbacks.onSave({
				comment: content.commentTextarea.value.trim(),
				rating: content.starRating.currentRating(),
				status: content.form.status
			});
			if (result.ok) dismiss();
			else {
				loading.loading = false;
				content.starRating.setIsLoading(false);
				content.submitBtn.textContent = "保存";
				content.submitBtn.disabled = false;
				content.errorEl.textContent = result.error || "操作失败";
			}
		});
		const { removeBtn } = content;
		if (removeBtn) removeBtn.addEventListener("click", async () => {
			if (loading.loading) return;
			loading.loading = true;
			content.starRating.setIsLoading(true);
			content.submitBtn.disabled = true;
			removeBtn.disabled = true;
			content.errorEl.textContent = "";
			const result = await callbacks.onRemove(state.status);
			if (result.ok) dismiss();
			else {
				loading.loading = false;
				content.starRating.setIsLoading(false);
				content.submitBtn.disabled = false;
				removeBtn.disabled = false;
				content.errorEl.textContent = result.error || "取消标记失败";
			}
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
	var buildVoteBtn = ({ cid, count: initialCount, voted: initialVoted, className, onVote }) => {
		let count = initialCount;
		let voted = initialVoted;
		const countSpan = el("span", { text: String(count) });
		const btn = el("button", {
			attrs: { type: "button" },
			className
		}, [el("span", { html: ICON_THUMB }), countSpan]);
		if (voted) btn.classList.add("is-voted");
		const animateBtn = () => {
			btn.style.transform = "scale(1.2)";
			requestAnimationFrame(() => {
				btn.style.transform = "";
			});
		};
		btn.addEventListener("click", async () => {
			if (voted || !cid) return;
			voted = true;
			count += 1;
			countSpan.textContent = String(count);
			btn.classList.add("is-voted");
			animateBtn();
			const result = await onVote(cid);
			if (result.ok && result.count !== void 0) {
				({count} = result);
				countSpan.textContent = String(count);
			} else {
				voted = false;
				count -= 1;
				countSpan.textContent = String(count);
				btn.classList.remove("is-voted");
			}
		});
		btn.setVoteState = (newVoted, newCount) => {
			voted = newVoted;
			count = newCount;
			countSpan.textContent = String(count);
			btn.classList.toggle("is-voted", voted);
		};
		return btn;
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
	var hashStr = (str) => {
		let h = 0;
		for (let i = 0; i < str.length; i += 1) h = (h * 31 + (str.codePointAt(i) ?? 0)) % 1000000007;
		return h;
	};
	var pickStill = (photos, seed) => {
		if (!photos?.length) return null;
		return photos[hashStr(String(seed || "")) % photos.length];
	};
	var buildHeroBg = (data) => {
		const bg = el("div", { className: "atv-hero-bg" });
		const still = pickStill(data.photos, data.subjectId);
		if (still?.hdUrl) {
			const thumb = el("div", { className: "atv-hero-still is-thumb" });
			thumb.style.backgroundImage = `url("${still.thumbUrl || still.hdUrl}")`;
			bg.append(thumb);
			const hd = el("div", { className: "atv-hero-still is-hd" });
			hd.setAttribute("aria-hidden", "true");
			bg.append(hd);
			const loader = new Image();
			loader.addEventListener("load", () => {
				hd.style.backgroundImage = `url("${still.hdUrl}")`;
				requestAnimationFrame(() => hd.classList.add("is-loaded"));
			}, { once: true });
			loader.addEventListener("error", (e) => {
				console.error("[Hero] HD still FAILED:", still.hdUrl, e);
				if (still.thumbUrl && still.thumbUrl !== still.hdUrl) {
					hd.style.backgroundImage = `url("${still.thumbUrl}")`;
					requestAnimationFrame(() => hd.classList.add("is-loaded"));
				}
			}, { once: true });
			loader.src = still.hdUrl;
			return bg;
		}
		if (data.poster) {
			const poster = el("div", { className: "atv-hero-still is-poster" });
			poster.style.backgroundImage = `url("${data.poster}")`;
			bg.append(poster);
			return bg;
		}
		bg.style.background = "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)";
		return bg;
	};
	var buildPosterCard = (data) => {
		const card = el("div", { className: "atv-poster-card" });
		if (data.poster) {
			const img = el("img", {
				alt: data.title.primary || "",
				src: data.poster
			});
			img.addEventListener("error", (e) => {
				console.error("[buildHero] Poster card img FAILED:", data.poster, e);
				card.innerHTML = "";
				const ph = el("div", {
					className: "atv-poster-placeholder",
					html: ICON_FILM_PLACEHOLDER
				});
				card.append(ph);
			});
			card.append(img);
		} else card.append(el("div", {
			className: "atv-poster-placeholder",
			html: ICON_FILM_PLACEHOLDER
		}));
		card.addEventListener("click", () => {
			if (data.poster) openPosterModal(data.poster, data.title.primary || "");
		});
		return card;
	};
	var buildMeta = (data) => {
		const meta = el("div", { className: "atv-hero-meta" });
		const metaParts = [];
		if (data.year) metaParts.push(data.year);
		if (data.isTV) {
			const seg = [];
			if (data.info.seasons) seg.push(data.info.seasons + (RE_SEASON_SUFFIX.test(data.info.seasons) ? "季" : ""));
			if (data.info.episodes) seg.push(data.info.episodes + (RE_SEASON_SUFFIX.test(data.info.episodes) ? "集" : ""));
			if (seg.length) metaParts.push(seg.join(" · "));
			else if (data.info.episodeRuntime) metaParts.push(data.info.episodeRuntime);
		} else if (data.info.runtime) metaParts.push(data.info.runtime);
		if (data.info.country) metaParts.push(data.info.country);
		for (const part of metaParts) meta.append(el("span", {
			className: "atv-meta-dot",
			text: part
		}));
		if (data.info.genres?.length) {
			const chips = el("span", { className: "atv-meta-chips" });
			for (const g of data.info.genres) chips.append(el("span", {
				className: "atv-chip",
				text: g
			}));
			meta.append(chips);
		}
		return meta;
	};
	var makeInterestBtn = (text, cls, onClick) => {
		const btn = el("button", {
			attrs: { type: "button" },
			className: cls
		}, [el("span", { html: text === "想看" ? ICON_PLAY : ICON_CHECK }), el("span", { text })]);
		btn.addEventListener("click", onClick);
		return btn;
	};
	var addWatchingBtn = (actions, onClick) => {
		const btn = makeInterestBtn("在看", "atv-btn atv-btn-secondary", onClick);
		const seenBtn = actions.lastElementChild;
		if (seenBtn) seenBtn.before(btn);
		else actions.append(btn);
	};
	var buildActions = (state, callbacks) => {
		const actions = el("div", { className: "atv-actions" });
		if (!state.loggedIn) {
			actions.append(makeInterestBtn("想看", "atv-btn atv-btn-primary", callbacks.onWishClick));
			actions.append(makeInterestBtn("看过", "atv-btn atv-btn-secondary", callbacks.onCollectClick));
			if (state.hasWatching) addWatchingBtn(actions, callbacks.onWatchingClick);
			return actions;
		}
		if (!state.marked) {
			actions.append(makeInterestBtn("想看", "atv-btn atv-btn-primary", () => callbacks.onOpenInterest(state)));
			actions.append(makeInterestBtn("看过", "atv-btn atv-btn-secondary", () => callbacks.onOpenInterest(state)));
			if (state.hasWatching) addWatchingBtn(actions, () => callbacks.onOpenInterest(state));
			return actions;
		}
		const label = INTEREST_LABELS[state.status];
		const header = el("div", { className: "atv-interest-panel-header" });
		header.append(el("button", {
			attrs: { type: "button" },
			className: [
				"atv-btn",
				"atv-btn-primary",
				"is-active",
				"atv-interest-badge"
			],
			onclick: () => callbacks.onOpenInterest(state)
		}, [el("span", { html: ICON_CHECK }), el("span", { text: label })]));
		if (state.rating > 0) {
			const starHtml = Array.from({ length: 5 }, (_, i) => i < state.rating ? ICON_STAR_FULL : ICON_STAR_EMPTY).join("");
			header.append(el("span", {
				className: "atv-interest-panel-stars",
				html: starHtml
			}));
		}
		if (state.date) header.append(el("span", {
			className: "atv-interest-panel-date",
			text: state.date
		}));
		const panel = el("div", { className: "atv-interest-panel" }, [header]);
		if (state.comment) {
			const commentChildren = [el("span", { text: `"${state.comment}"` })];
			if (state.usefulCount) {
				const num = state.usefulCount.replaceAll(/\D/gu, "");
				commentChildren.push(el("span", { className: "atv-useful-badge" }, [el("span", { html: ICON_THUMB }), el("span", { text: num })]));
			}
			panel.append(el("div", { className: "atv-interest-panel-comment" }, commentChildren));
		}
		actions.append(panel);
		return actions;
	};
	var buildSummary = (text) => {
		if (!text) return null;
		const summary = el("div", { className: "atv-hero-summary" });
		const teaser = el("p", {
			className: "atv-hero-teaser is-clamped",
			text
		});
		summary.append(teaser);
		const more = el("button", {
			attrs: { type: "button" },
			className: "atv-hero-more"
		});
		const moreLabel = el("span", { text: "展开" });
		more.append(moreLabel);
		more.append(el("span", { html: ICON_CHEVRON }));
		more.addEventListener("click", () => {
			const open = !teaser.classList.toggle("is-clamped");
			more.classList.toggle("is-open", open);
			moreLabel.textContent = open ? "收起" : "展开";
		});
		requestAnimationFrame(() => {
			if (!(teaser.scrollHeight - teaser.clientHeight > 4)) more.style.display = "none";
		});
		summary.append(more);
		return summary;
	};
	var buildImdbRating = (rating) => {
		const section = el("div", { className: "atv-rating-panel-imdb" });
		section.append(el("div", {
			className: "atv-rating-panel-logo",
			html: LOGO_IMDB
		}));
		if (!rating) {
			section.classList.add("is-loading");
			section.append(el("div", { className: "atv-rating-panel-skeleton" }));
			return section;
		}
		section.classList.add("is-loaded");
		section.append(el("div", {
			className: "atv-rating-panel-score",
			text: rating.score.toFixed(1)
		}));
		section.append(renderStars(rating.score));
		const countTxt = rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分";
		section.append(el("div", {
			className: "atv-rating-panel-count",
			text: countTxt
		}));
		return section;
	};
	var mcWordRatingChinese = (score) => {
		if (score >= 81) return "普遍赞誉";
		if (score >= 61) return "大体好评";
		if (score >= 40) return "褒贬不一";
		if (score >= 20) return "大体差评";
		return "普遍差评";
	};
	var scoreClass = (score) => {
		if (score >= 61) return "is-high";
		if (score >= 40) return "is-medium";
		return "is-low";
	};
	var buildMcRating = (rating) => {
		const section = el("div", { className: "atv-rating-panel-mc" });
		section.append(el("div", {
			className: "atv-rating-panel-logo",
			html: LOGO_METACRITIC
		}));
		if (!rating) {
			section.classList.add("is-loading");
			section.append(el("div", { className: "atv-rating-panel-skeleton" }));
			return section;
		}
		section.classList.add("is-loaded");
		section.append(el("div", {
			className: `atv-rating-panel-score ${scoreClass(rating.score)}`,
			text: String(rating.score)
		}));
		const barWidth = Math.min(100, rating.score);
		section.append(el("div", { className: "atv-mc-label-row" }, [el("span", { className: "atv-mc-bar-track" }, [el("span", {
			className: `atv-mc-bar-fill ${scoreClass(rating.score)}`,
			style: { width: `${barWidth}%` }
		})]), el("span", {
			className: "atv-mc-word-label",
			text: mcWordRatingChinese(rating.score)
		})]));
		const countTxt = rating.reviewCount ? `评价 ${rating.reviewCount.toLocaleString("en-US")}` : "已评分";
		section.append(el("div", {
			className: "atv-rating-panel-count",
			text: countTxt
		}));
		return section;
	};
	var isFresh = (score) => score >= 60;
	var buildLabel = (score, iconSvg, text, cls) => {
		const item = el("span", { className: `atv-rt-label-item ${cls}` });
		item.classList.add(isFresh(score) ? "is-fresh" : "is-rotten");
		item.append(el("span", {
			className: "atv-rt-score-icon",
			html: iconSvg
		}), el("span", {
			className: "atv-rt-score-label",
			text
		}));
		return item;
	};
	var buildRtRating = (rating) => {
		const section = el("div", { className: "atv-rating-panel-rt" });
		section.append(el("div", {
			className: "atv-rating-panel-logo",
			html: LOGO_RT
		}));
		if (!rating) {
			section.classList.add("is-loading");
			section.append(el("div", { className: "atv-rating-panel-skeleton" }));
			return section;
		}
		section.classList.add("is-loaded");
		const scoreRow = el("div", { className: "atv-rt-score-row" });
		scoreRow.append(el("div", {
			className: `atv-rt-score-value ${isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"}`,
			text: `${String(rating.criticsScore)}%`
		}), el("div", { className: "atv-rt-divider" }), el("div", {
			className: `atv-rt-score-value ${isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"}`,
			text: `${String(rating.audienceScore)}%`
		}));
		section.append(scoreRow);
		const labelRow = el("div", { className: "atv-rt-label-row" });
		labelRow.append(buildLabel(rating.criticsScore, ICON_TOMATO, "影评人", "is-critics"), buildLabel(rating.audienceScore, ICON_POPCORN, "观众", "is-audience"));
		section.append(labelRow);
		const criticsCountStr = rating.criticsCount.toLocaleString("en-US");
		const audienceCountStr = rating.audienceCount.toLocaleString("en-US");
		const countRow = el("div", { className: "atv-rt-count-row" });
		countRow.append(el("span", {
			className: "atv-rt-count-value",
			text: `评价 ${criticsCountStr}`
		}), el("span", {
			className: "atv-rt-count-value",
			text: `评价 ${audienceCountStr}`
		}));
		section.append(countRow);
		return section;
	};
	var buildRatingPanel = (rating, imdbId) => {
		if (!rating && !imdbId) return null;
		const panel = el("div", { className: "atv-rating-panel" });
		const douban = el("div", { className: "atv-rating-panel-douban" });
		douban.append(el("div", {
			className: "atv-rating-panel-logo",
			html: LOGO_DOUBAN
		}));
		if (rating) {
			douban.append(el("div", {
				className: "atv-rating-panel-score",
				text: rating.score.toFixed(1)
			}));
			douban.append(renderStars(rating.score));
			const countTxt = rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分";
			douban.append(el("div", {
				className: "atv-rating-panel-count",
				text: countTxt
			}));
		} else douban.append(el("div", {
			className: "atv-rating-empty",
			text: "暂无评分"
		}));
		panel.append(douban);
		if (imdbId) panel.append(buildImdbRating(null));
		if (imdbId) panel.append(buildMcRating(null));
		if (imdbId) panel.append(buildRtRating(null));
		return panel;
	};
	var buildHero = (data, callbacks) => {
		const hero = el("section", { className: "atv-hero" });
		hero.append(buildHeroBg(data));
		hero.append(el("div", { className: "atv-hero-vignette" }));
		hero.append(el("div", { className: "atv-hero-overlay-x" }));
		hero.append(el("div", { className: "atv-hero-overlay-y" }));
		const innerSection = el("div", { className: "atv-hero-inner-section" });
		const inner = el("div", { className: "atv-hero-inner" });
		inner.append(buildPosterCard(data));
		const info = el("div", { className: "atv-hero-info" });
		const title = el("h1", {
			className: "atv-hero-title",
			text: data.title.primary || data.title.full
		});
		info.append(title);
		if (data.title.original) info.append(el("div", {
			className: "atv-hero-orig",
			text: data.title.original
		}));
		info.append(buildMeta(data));
		const panel = buildRatingPanel(data.rating, data.imdbId);
		if (panel) info.append(panel);
		info.append(buildActions(data.interest, callbacks));
		const summary = buildSummary(data.summary);
		if (summary) info.append(summary);
		inner.append(info);
		innerSection.append(inner);
		hero.append(innerSection);
		return hero;
	};
	var buildSectionHeader = (text) => el("h2", {
		className: "atv-section-h",
		text
	});
	var buildSectionHeaderRow = (text, moreText, moreHref) => {
		const row = el("div", { className: "atv-section-h-row" });
		row.append(buildSectionHeader(text));
		if (moreText && moreHref) row.append(el("a", {
			className: "atv-section-more",
			href: moreHref,
			rel: "noopener",
			target: "_blank",
			text: moreText
		}));
		return row;
	};
	var buildSection = (id, headerText, content, options) => {
		const sec = el("section", {
			className: "atv-section",
			id
		});
		if (options?.moreLink) sec.append(buildSectionHeaderRow(headerText, options.moreLink.text, options.moreLink.href));
		else sec.append(buildSectionHeader(headerText));
		sec.append(content);
		return sec;
	};
	var buildStreaming = (streaming) => {
		if (!streaming?.length) return null;
		const row = el("div", { className: "atv-stream-row" });
		for (const s of streaming) {
			const card = el("a", {
				className: "atv-stream-card",
				href: s.href,
				rel: "noopener",
				target: "_blank"
			});
			card.append(el("span", { text: s.name }));
			card.append(el("span", {
				className: "atv-stream-arrow",
				html: ICON_ARROW
			}));
			row.append(card);
		}
		return buildSection("atv-stream", "在哪儿看", row);
	};
	var openCommentOverlay = (comment, onVote, cardVoteBtns) => {
		const inner = el("div", { className: "atv-comment-overlay-inner" });
		const accent = el("div", { className: "atv-comment-overlay-accent" });
		inner.append(accent);
		const top = el("div", { className: "atv-comment-overlay-top" });
		const avatar = el("div", {
			attrs: comment.cid ? { "data-cid": comment.cid } : void 0,
			className: "atv-comment-overlay-avatar"
		});
		if (comment.avatar) avatar.style.backgroundImage = `url("${comment.avatar}")`;
		else avatar.textContent = (comment.name || "?").slice(0, 1).toUpperCase();
		top.append(avatar);
		const meta = el("div", { className: "atv-comment-overlay-meta" });
		const author = el(comment.link ? "a" : "div", {
			className: "atv-comment-overlay-author",
			href: comment.link || void 0,
			rel: comment.link ? "noopener" : void 0,
			target: comment.link ? "_blank" : void 0,
			text: comment.name
		});
		meta.append(author);
		if (comment.stars > 0) meta.append(renderStars(comment.stars, {
			className: "atv-comment-overlay-stars",
			outOfFive: true
		}));
		top.append(meta);
		inner.append(top);
		const body = el("div", {
			className: "atv-comment-overlay-body",
			text: comment.content
		});
		inner.append(body);
		const foot = el("div", { className: "atv-comment-overlay-foot" });
		foot.append(el("span", {
			className: "atv-comment-overlay-time",
			text: comment.time || ""
		}));
		const voteBtn = buildVoteBtn({
			cid: comment.cid,
			className: "atv-comment-overlay-votes",
			count: comment.votes,
			onVote: async (cid) => {
				const result = await onVote(cid);
				if (result.ok && result.count !== void 0) {
					comment.voted = true;
					comment.votes = result.count;
					const cardBtn = cardVoteBtns.get(cid);
					if (cardBtn) cardBtn.setVoteState(true, result.count);
				}
				return result;
			},
			voted: comment.voted
		});
		foot.append(voteBtn);
		inner.append(foot);
		createOverlay({
			className: "atv-comment-overlay",
			closeSize: 16,
			content: [inner],
			id: "atv-comment-overlay"
		});
	};
	var buildComments = (data, onVote) => {
		if (!data.comments?.length) return null;
		const grid = el("div", { className: "atv-comments" });
		const pending = [];
		const cardVoteBtns = new Map();
		for (const c of data.comments) {
			const card = el("div", {
				attrs: c.cid ? { "data-cid": c.cid } : void 0,
				className: "atv-comment-card"
			});
			const top = el("div", { className: "atv-comment-top" });
			const avatar = el("div", { className: "atv-comment-avatar" });
			if (c.avatar) avatar.style.backgroundImage = `url("${c.avatar}")`;
			else avatar.textContent = (c.name || "?").slice(0, 1).toUpperCase();
			top.append(avatar);
			const metaCol = el("div", { className: "atv-comment-meta" });
			const author = el(c.link ? "a" : "div", {
				className: "atv-comment-author",
				href: c.link || void 0,
				rel: c.link ? "noopener" : void 0,
				target: c.link ? "_blank" : void 0,
				text: c.name
			});
			metaCol.append(author);
			if (c.stars > 0) metaCol.append(renderStars(c.stars, {
				className: "atv-comment-stars",
				outOfFive: true
			}));
			top.append(metaCol);
			card.append(top);
			const body = el("div", {
				className: "atv-comment-body",
				text: c.content
			});
			card.append(body);
			const foot = el("div", { className: "atv-comment-foot" });
			foot.append(el("span", { text: c.time || "" }));
			const footRight = el("div", { className: "atv-comment-foot-right" });
			const expandBtn = el("button", {
				attrs: { type: "button" },
				className: "atv-comment-expand",
				html: ICON_EXPAND
			});
			const cardVoteBtn = buildVoteBtn({
				cid: c.cid,
				className: "atv-comment-votes",
				count: c.votes,
				onVote: async (cid) => {
					const result = await onVote(cid);
					if (result.ok && result.count !== void 0) {
						c.voted = true;
						c.votes = result.count;
					}
					return result;
				},
				voted: c.voted
			});
			cardVoteBtns.set(c.cid, cardVoteBtn);
			footRight.append(expandBtn, cardVoteBtn);
			foot.append(footRight);
			card.append(foot);
			const showOverlay = () => {
				openCommentOverlay(c, onVote, cardVoteBtns);
			};
			expandBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				showOverlay();
			});
			body.addEventListener("click", () => {
				if (body.scrollHeight > body.clientHeight) showOverlay();
			});
			grid.append(card);
			pending.push({
				body,
				card
			});
		}
		setTimeout(() => {
			requestAnimationFrame(() => {
				for (const { card, body: b } of pending) if (b.scrollHeight > b.clientHeight) card.classList.add("has-overflow");
			});
		}, 0);
		const allHref = data.subjectId ? `https://movie.douban.com/subject/${data.subjectId}/comments?status=P` : "";
		return buildSection("atv-comments", "热门短评", grid, { moreLink: allHref ? {
			href: allHref,
			text: "查看全部 →"
		} : void 0 });
	};
	var buildCast = (celebrities) => {
		if (!celebrities?.length) return null;
		const carousel = el("div", { className: "atv-carousel atv-cast-carousel" });
		for (const c of celebrities) {
			const card = el(c.link ? "a" : "div", {
				className: "atv-cast-card",
				href: c.link || void 0,
				rel: c.link ? "noopener" : void 0,
				target: c.link ? "_blank" : void 0
			});
			const av = el("div", { className: "atv-cast-avatar" });
			if (c.avatar) av.style.backgroundImage = `url("${c.avatar}")`;
			card.append(av);
			card.append(el("div", {
				className: "atv-cast-name",
				text: c.name
			}));
			if (c.role) card.append(el("div", {
				className: "atv-cast-role",
				text: c.role
			}));
			carousel.append(card);
		}
		return buildSection("atv-cast", "演职员", carousel);
	};
	var buildPhotos = (data) => {
		if (!data.photos?.length && !data.trailers?.length) return null;
		const carousel = el("div", { className: "atv-carousel atv-photos" });
		for (const t of data.trailers) {
			const tile = el("div", { className: "atv-photo-tile atv-trailer-tile" });
			tile.style.backgroundImage = `url("${t.thumbUrl}")`;
			tile.style.backgroundSize = "cover";
			tile.style.backgroundPosition = "center";
			tile.addEventListener("click", () => openVideoModal(t));
			const playOverlay = el("div", { className: "atv-trailer-play-overlay" });
			const playBtn = el("div", { className: "atv-trailer-play-btn" });
			playBtn.innerHTML = "<svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"6 3 20 12 6 21 6 3\" fill=\"white\" stroke=\"none\"/></svg>";
			playOverlay.append(playBtn);
			tile.append(playOverlay);
			const label = el("span", {
				className: "atv-trailer-label",
				text: t.title || "预告片"
			});
			tile.append(label);
			carousel.append(tile);
		}
		for (const p of data.photos) {
			const tile = el("div", { className: "atv-photo-tile" });
			tile.addEventListener("click", () => {
				openPosterModal(p.hdUrl || p.thumbUrl, "剧照");
			});
			const img = el("img", {
				alt: "剧照",
				src: p.hdUrl || p.thumbUrl
			});
			img.loading = "lazy";
			img.addEventListener("error", () => {
				if (p.thumbUrl && img.src !== p.thumbUrl) img.src = p.thumbUrl;
			}, { once: true });
			img.addEventListener("load", () => {
				if (img.naturalHeight > img.naturalWidth) tile.classList.add("is-portrait");
			}, { once: true });
			tile.append(img);
			carousel.append(tile);
		}
		const allHref = data.subjectId ? `https://movie.douban.com/subject/${data.subjectId}/all_photos` : "";
		return buildSection("atv-photos", "剧照", carousel, { moreLink: allHref ? {
			href: allHref,
			text: "查看全部 →"
		} : void 0 });
	};
	var buildRecs = (recommendations) => {
		if (!recommendations?.length) return null;
		const grid = el("div", { className: "atv-recs" });
		for (const r of recommendations) {
			const card = el(r.link ? "a" : "div", { className: "atv-rec-card" });
			if (r.link && card instanceof HTMLAnchorElement) {
				card.href = r.link;
				card.target = "_blank";
				card.rel = "noopener";
			}
			const posterWrap = el("div", { className: "atv-rec-poster" });
			if (r.poster) {
				const img = el("img", {
					alt: r.title,
					src: r.poster
				});
				img.loading = "lazy";
				img.addEventListener("error", () => {
					posterWrap.innerHTML = "";
					posterWrap.append(el("div", {
						className: "atv-poster-placeholder",
						html: ICON_FILM_PLACEHOLDER
					}));
				}, { once: true });
				posterWrap.append(img);
			} else posterWrap.append(el("div", {
				className: "atv-poster-placeholder",
				html: ICON_FILM_PLACEHOLDER
			}));
			card.append(posterWrap);
			card.append(el("div", {
				className: "atv-rec-title",
				text: r.title
			}));
			grid.append(card);
		}
		return buildSection("atv-recs", "相似作品", grid);
	};
	var linksValue = (arr) => {
		const wrap = el("div", { className: "atv-info-value" });
		for (let i = 0; i < arr.length; i += 1) {
			const it = arr[i];
			if (i > 0) wrap.append(el("span", { text: " / " }));
			if (it.href) wrap.append(el("a", {
				href: it.href,
				rel: "noopener",
				target: "_blank",
				text: it.text
			}));
			else wrap.append(el("span", { text: it.text }));
		}
		return wrap;
	};
	var textValue = (txt) => el("div", {
		className: "atv-info-value",
		text: txt
	});
	var buildImdbRow = (imdb) => {
		const wrap = el("div", { className: "atv-info-value" });
		if (RE_IMDB_LINK.test(imdb)) wrap.append(el("a", {
			href: `https://www.imdb.com/title/${imdb}/`,
			rel: "noopener",
			target: "_blank",
			text: imdb
		}, [el("span", { html: ICON_ARROW })]));
		else wrap.textContent = imdb;
		return wrap;
	};
	var addTimeRows = (isTV, info, addRow) => {
		if (isTV) {
			if (info.firstAired) addRow("首播", textValue(info.firstAired));
			else if (info.releaseDate) addRow("首播", textValue(info.releaseDate));
			if (info.seasons) addRow("季数", textValue(info.seasons));
			if (info.episodes) addRow("集数", textValue(info.episodes));
			if (info.episodeRuntime) addRow("单集片长", textValue(info.episodeRuntime));
		} else {
			if (info.releaseDate) addRow("上映日期", textValue(info.releaseDate));
			if (info.runtime) addRow("片长", textValue(info.runtime));
		}
	};
	var buildAwards = (awards, grid) => {
		for (const a of awards) {
			const value = el("div", { className: "atv-info-value" });
			if (a.name) value.append(el("div", { text: a.name }));
			if (a.person) {
				const personLine = el("div", { attrs: { style: "font-size:13px;color:var(--atv-text-tertiary);margin-top:2px" } });
				if (a.personLink) personLine.append(el("a", {
					href: a.personLink,
					rel: "noopener",
					target: "_blank",
					text: a.person
				}));
				else personLine.textContent = a.person;
				value.append(personLine);
			}
			const label = el("div", {
				attrs: { style: "color:var(--atv-rating-gold)" },
				className: "atv-info-label"
			});
			if (a.orgLink) label.append(el("a", {
				attrs: { style: "color:inherit" },
				href: a.orgLink,
				rel: "noopener",
				target: "_blank",
				text: a.org
			}));
			else label.textContent = a.org;
			grid.append(label);
			grid.append(value);
		}
	};
	var buildDetails = (data) => {
		const grid = el("div", { className: "atv-info-grid" });
		const addRow = (label, valueNode) => {
			grid.append(el("div", {
				className: "atv-info-label",
				text: label
			}));
			grid.append(valueNode);
		};
		const { info } = data;
		if (info.director?.length) addRow("导演", linksValue(info.director));
		if (info.writers?.length) addRow("编剧", linksValue(info.writers));
		if (info.cast?.length) addRow("主演", linksValue(info.cast));
		if (info.genres?.length) addRow("类型", textValue(info.genres.join(" / ")));
		if (info.country) addRow("制片国家/地区", textValue(info.country));
		if (info.language) addRow("语言", textValue(info.language));
		addTimeRows(data.isTV, info, addRow);
		if (info.aliases) addRow("又名", textValue(info.aliases));
		if (info.imdb) addRow("IMDb", buildImdbRow(info.imdb));
		if (data.awards?.length) buildAwards(data.awards, grid);
		if (!grid.children.length) return null;
		return buildSection("atv-info", "详细信息", grid);
	};
	var buildStickyNav = (data) => {
		const nav = el("nav", { className: "atv-stickynav" });
		nav.append(el("div", {
			className: "atv-stickynav-title",
			text: data.title.primary || data.title.full
		}));
		const wrap = el("div", { className: "atv-stickynav-jumps" });
		for (const j of data.sections) {
			const a = el("a", {
				href: `#${j.id}`,
				text: j.label
			});
			a.addEventListener("click", (e) => {
				e.preventDefault();
				const t = document.querySelector(`#${j.id}`);
				if (t) t.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			});
			wrap.append(a);
		}
		nav.append(wrap);
		return nav;
	};
	var subjectPath = (url) => {
		try {
			return new URL(url).pathname;
		} catch {
			return "";
		}
	};
	var buildSeries = (items, options) => {
		if (!items?.length) return null;
		const currentPath = window.location.pathname;
		const carousel = el("div", { className: "atv-carousel atv-series-carousel" });
		for (const s of items) {
			const isActive = s.link && subjectPath(s.link) === currentPath;
			const card = el(s.link ? "a" : "div", { className: ["atv-series-card", isActive ? "is-active" : ""].filter(Boolean) });
			if (s.link && card instanceof HTMLAnchorElement) {
				card.href = s.link;
				card.target = "_blank";
				card.rel = "noopener";
			}
			const posterWrap = el("div", { className: "atv-series-poster" });
			if (s.poster) {
				const img = el("img", {
					alt: s.title,
					src: s.poster
				});
				img.loading = "lazy";
				img.addEventListener("error", () => {
					posterWrap.innerHTML = "";
					posterWrap.append(el("div", {
						className: "atv-poster-placeholder",
						html: ICON_FILM_PLACEHOLDER
					}));
				}, { once: true });
				posterWrap.append(img);
			} else posterWrap.append(el("div", {
				className: "atv-poster-placeholder",
				html: ICON_FILM_PLACEHOLDER
			}));
			if (s.rating) posterWrap.append(el("span", {
				className: "atv-series-badge",
				text: s.rating
			}));
			card.append(posterWrap);
			const infoRow = el("div", { className: "atv-series-info" });
			infoRow.append(el("span", {
				className: "atv-series-title",
				text: s.title
			}));
			card.append(infoRow);
			carousel.append(card);
		}
		return buildSection("atv-series", "同系列作品", carousel, { moreLink: options?.moreLink });
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
		if (data.recommendations.length > 0) sections.push({
			id: "atv-recs",
			label: "相似作品"
		});
		sections.push({
			id: "atv-info",
			label: "详情"
		});
		return sections;
	};
	var buildApp = (data, deps) => {
		const root = el("div", { id: "atv-douban-root" });
		const stickyNav = buildStickyNav({
			sections: computeNavSections(data),
			title: {
				full: data.title.full,
				primary: data.title.primary
			}
		});
		root.append(buildHero({
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
		}, deps.heroCallbacks));
		const streaming = buildStreaming(data.streaming);
		if (streaming) root.append(streaming);
		const series = buildSeries(data.series, { moreLink: deps.seriesMoreLink });
		if (series) root.append(series);
		const cast = buildCast(data.celebrities);
		if (cast) root.append(cast);
		const photos = buildPhotos({
			photos: data.photos,
			subjectId: data.subjectId,
			trailers: data.trailers
		});
		if (photos) root.append(photos);
		const comments = buildComments({
			comments: data.comments,
			subjectId: data.subjectId
		}, deps.onVote);
		if (comments) root.append(comments);
		const recs = buildRecs(data.recommendations);
		if (recs) root.append(recs);
		const details = buildDetails({
			awards: data.awards,
			info: data.info,
			isTV: data.isTV
		});
		if (details) root.append(details);
		root.append(el("div", { className: "atv-footer-spacer" }));
		return {
			root,
			stickyNav
		};
	};
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
		return /^\d+$/u.test(d) ? Number.parseInt(d, 10) : cn.indexOf(d) + 1;
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
	var extractRating$1 = (doc) => {
		const raw = safeText($("strong.rating_num", doc) || $("strong[property=\"v:average\"]", doc));
		const score = raw ? Number.parseFloat(raw) : NaN;
		if (!score || Number.isNaN(score) || score <= 0) return null;
		const votesEl = $("span[property=\"v:votes\"]", doc) || $(".rating_people span", doc);
		return {
			count: votesEl ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0 : 0,
			score
		};
	};
	var extractSummary = (doc) => {
		const summary = $("span[property=\"v:summary\"]", doc);
		if (!summary) return null;
		let txt = (summary.textContent || "").trim();
		txt = txt.replace(RE_WS_NL, "\n").replace(RE_HSPACE, " ").replace(RE_NL_MULTI, "\n\n").trim();
		return txt || null;
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
			stars: rm ? Number.parseInt(rm[1], 10) / 10 : 0
		};
	};
	var extractTime = (item) => {
		const timeEl = $(".comment-time", item);
		return timeEl ? timeEl.getAttribute("title") || safeText(timeEl) : "";
	};
	var extractVotes = (item) => {
		const votesEl = $(".vote-count", item) ?? $(".votes", item);
		return votesEl ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0 : 0;
	};
	var extractAvatar = (item) => {
		const img = $(".avatar img", item);
		if (!img) return "";
		return encodeURI(img.src || img.dataset.original || img.dataset.src || "");
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
			const voted = !item.querySelector(".j.vote-comment");
			out.push({
				avatar: extractAvatar(item),
				cid: item.dataset.cid ?? "",
				content,
				link: authorEl?.href ?? "",
				name,
				ratingWord,
				stars,
				time: extractTime(item),
				voted,
				votes: extractVotes(item)
			});
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
		const rating = ratingInput ? Number.parseInt(ratingInput.value, 10) : 0;
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
		const arabic = Number.parseInt(s, 10);
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
	var applyImdbResult = (result) => {
		const section = document.querySelector(".atv-rating-panel-imdb");
		if (!section) return;
		if (result?.rating) {
			const loaded = buildImdbRating(result.rating);
			section.replaceWith(loaded);
		} else {
			section.classList.remove("is-loading");
			section.classList.add("is-empty");
		}
	};
	var applyRtResult = (rating) => {
		const section = document.querySelector(".atv-rating-panel-rt");
		if (!section) return;
		if (rating) {
			const loaded = buildRtRating(rating);
			section.replaceWith(loaded);
		} else {
			section.classList.remove("is-loading");
			section.classList.add("is-empty");
		}
	};
	var applyMcResult = (rating) => {
		const section = document.querySelector(".atv-rating-panel-mc");
		if (!section) return;
		if (rating) {
			const loaded = buildMcRating(rating);
			section.replaceWith(loaded);
		} else {
			section.classList.remove("is-loading");
			section.classList.add("is-empty");
		}
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
	var resolveImdb = (ctx) => {
		if (!ctx.imdbId) return Promise.resolve(null);
		return fetchImdbRating(ctx.imdbId, ctx.season);
	};
	var mcCache = createCache("dp:metacritic-cache", 10080 * 60 * 1e3);
	var toMcSlug = (title) => {
		return title.normalize("NFD").replaceAll(/[\u0300-\u036F]/gu, "").toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-").replaceAll(/^-|-$/gu, "");
	};
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
			const score = Number.parseInt(String(rating.ratingValue), 10);
			const reviewCount = Number.parseInt(String(rating.reviewCount), 10);
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
	var toSlug = (title) => {
		return title.normalize("NFD").replaceAll(/[\u0300-\u036F]/gu, "").toLowerCase().replaceAll(/[^a-z0-9]+/gu, "_").replaceAll(/^_|_$/gu, "");
	};
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
		const criticsScore = typeof criticsRaw === "string" ? Number.parseInt(criticsRaw, 10) : criticsRaw;
		const audienceScore = typeof audienceRaw === "string" ? Number.parseInt(audienceRaw, 10) : audienceRaw;
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
	var extractSeriesMoreLink = () => {
		const linkEl = document.querySelector("#series-items .items-swiper-title .pl a");
		if (!linkEl) return;
		return {
			href: linkEl.href,
			text: (linkEl.textContent || "").replaceAll(/[()（）]/gu, "").trim()
		};
	};
	var watchSeries = (root, stickyNav) => {
		const container = document.querySelector("#series-items");
		if (!container) return;
		if (container.querySelector(".items-swiper")) return;
		if (root.querySelector("#atv-series")) return;
		const observer = new MutationObserver(() => {
			if (!container.querySelector(".items-swiper")) return;
			observer.disconnect();
			const items = extractSeries(document);
			if (items.length === 0) return;
			const series = buildSeries(items, { moreLink: extractSeriesMoreLink() });
			if (!series) return;
			const ref = root.querySelector("#atv-stream");
			if (ref) ref.after(series);
			else if (root.firstElementChild) root.firstElementChild.after(series);
			const wrap = stickyNav.querySelector(".atv-stickynav-jumps");
			if (!wrap) return;
			if (wrap.querySelector("a[href=\"#atv-series\"]")) return;
			const a = el("a", {
				href: "#atv-series",
				text: "同系列"
			});
			a.addEventListener("click", (e) => {
				e.preventDefault();
				document.querySelector("#atv-series")?.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			});
			const streamLink = wrap.querySelector("a[href=\"#atv-stream\"]");
			if (streamLink) streamLink.after(a);
			else wrap.prepend(a);
		});
		observer.observe(container, {
			childList: true,
			subtree: true
		});
	};
	var resolveAllRatings = async (imdbId, isTV) => {
		const results = await resolveAll(buildContext(imdbId, isTV, document));
		applyImdbResult(results.imdb);
		applyRtResult(results.rt);
		applyMcResult(results.mc);
	};
	var buildHeroCallbacks = (subjectId) => {
		const interestBtns = findInterestButtons(document);
		return {
			onCollectClick: () => interestBtns.collect?.click(),
			onOpenInterest: (state) => {
				openInterestModal(state, {
					onRemove: async (status) => {
						const result = await removeInterest(subjectId, status);
						if (result.ok) location.reload();
						return result;
					},
					onSave: async (form) => {
						const result = await postInterest(subjectId, form.status, {
							comment: form.comment,
							rating: form.rating > 0 ? form.rating : void 0
						});
						if (result.ok) location.reload();
						return result;
					}
				});
			},
			onWatchingClick: () => interestBtns.do?.click(),
			onWishClick: () => interestBtns.wish?.click()
		};
	};
	var trackActiveSection = (nav) => {
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
				const sectionEl = document.querySelector(`#${id}`);
				if (!sectionEl) continue;
				const rect = sectionEl.getBoundingClientRect();
				const visibleTop = Math.max(rect.top, 56);
				const visibleBottom = Math.min(rect.bottom, window.innerHeight * .55);
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
			const sectionEl = document.querySelector(`#${id}`);
			if (sectionEl) observer.observe(sectionEl);
		}
	};
	var render = () => {
		if (document.querySelector("#atv-douban-root")) return;
		if (!document.querySelector("#content h1")) {
			console.warn("[ATV-Douban] 未找到内容区域，跳过渲染");
			return;
		}
		let data;
		try {
			const info = extractInfo(document);
			const isTV = !!(info.episodes || info.seasons || info.episodeRuntime || info.firstAired);
			data = {
				awards: extractAwards(document),
				celebrities: extractCelebrities(document),
				comments: extractComments(document),
				info,
				interest: extractInterestState(document),
				isTV,
				photos: extractPhotos(document),
				poster: extractPoster(document),
				rating: extractRating$1(document),
				recommendations: extractRecommendations(document),
				series: extractSeries(document),
				streaming: extractStreaming(document),
				subjectId: extractSubjectId(document),
				summary: extractSummary(document),
				title: extractTitle(document),
				trailers: extractTrailers(document),
				year: extractYear(document)
			};
		} catch (error) {
			console.warn("[ATV-Douban] 数据提取失败：", error);
			return;
		}
		document.title = `${(data.title.primary || data.title.full) + (data.year ? ` (${data.year})` : "")} · 豆瓣`;
		const { root, stickyNav } = buildApp(data, {
			heroCallbacks: buildHeroCallbacks(data.subjectId),
			onVote: (cid) => postVote(cid, data.subjectId),
			seriesMoreLink: extractSeriesMoreLink()
		});
		if (data.comments.length > 0) {
			const links = data.comments.map((c) => c.link);
			(async () => {
				applyCommentAvatars(await fetchAvatarUrls(links), data.comments);
			})();
		}
		document.body.insertBefore(root, document.body.firstChild);
		document.body.append(stickyNav);
		const reveal = () => {
			const y = window.scrollY || window.pageYOffset || 0;
			stickyNav.classList.toggle("is-visible", y > 300);
		};
		window.addEventListener("scroll", reveal, { passive: true });
		reveal();
		trackActiveSection(stickyNav);
		const imdbId = data.info.imdb || null;
		if (imdbId) resolveAllRatings(imdbId, data.isTV);
		watchSeries(root, stickyNav);
	};
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
	else render();
})();
