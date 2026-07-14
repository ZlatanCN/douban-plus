// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.3.0
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
	var styles_default = "/* ATV stylesheet manifest.\n   Keep this file as the single CSS entry imported from main.ts.\n   Files are ordered to preserve the original cascade from the former giant stylesheet.\n   Do not wrap these imports in @layer: this userscript runs inside Douban pages,\n   and unlayered host author CSS would outrank layered ATV normal declarations. */\n\n:root {\n  --atv-bg-primary: #000;\n  --atv-bg-secondary: #1c1c1e;\n  --atv-bg-tertiary: #2c2c2e;\n  --atv-bg-elevated: rgb(255 255 255 / 6%);\n  --atv-text-primary: #fff;\n  --atv-text-secondary: rgb(255 255 255 / 72%);\n  --atv-text-tertiary: rgb(255 255 255 / 45%);\n  --atv-accent: #41be5d;\n  --atv-accent-bright: #4cd97a;\n  --atv-accent-glow: rgb(65 190 93 / 35%);\n  --atv-rating-gold: #ffb800;\n  --atv-border-subtle: rgb(255 255 255 / 8%);\n  --atv-border-medium: rgb(255 255 255 / 16%);\n  --atv-radius-sm: 8px;\n  --atv-radius-md: 12px;\n  --atv-radius-lg: 16px;\n  --atv-radius-xl: 24px;\n  --atv-ease-out: cubic-bezier(0.23, 1, 0.32, 1);\n  --atv-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);\n  --atv-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);\n  --atv-duration-press: 160ms;\n  --atv-duration-hover: 160ms;\n  --atv-duration-overlay: 200ms;\n  --atv-duration-modal-backdrop: 400ms;\n  --atv-duration-modal-surface: 350ms;\n}\n\nbody > #wrapper {\n  display: none !important;\n}\n\nbody {\n  padding: 0 !important;\n  margin: 0 !important;\n  background: #000 !important;\n}\n\n#db-global-nav,\n#db-nav-movie {\n  display: none !important;\n}\n\n[id^=\"dale_\"],\n[class*=\"dale_\"] {\n  display: none !important;\n}\n\n#atv-douban-root {\n  position: relative;\n  min-height: 100vh;\n  animation: atv-fadein 200ms var(--atv-ease-out) forwards;\n  background: var(--atv-bg-primary);\n  color: var(--atv-text-primary);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  font-feature-settings: \"ss01\", \"cv11\";\n  line-height: 1.5;\n  opacity: 0;\n}\n\n@keyframes atv-fadein {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n\n#atv-douban-root *,\n#atv-douban-root *::before,\n#atv-douban-root *::after {\n  box-sizing: border-box;\n}\n\n#atv-douban-root a {\n  color: inherit;\n  text-decoration: none;\n}\n\n#atv-douban-root a:hover {\n  background: transparent;\n}\n\n#atv-douban-root img {\n  display: block;\n  max-width: 100%;\n}\n\n/* ---------- Sticky nav ---------- */\n\n.atv-stickynav {\n  position: fixed;\n  z-index: 9999;\n  top: 0;\n  right: 0;\n  left: 0;\n  display: flex;\n  height: 56px;\n  box-sizing: border-box;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 max(28px, 5vw);\n  border-bottom: 1px solid rgb(255 255 255 / 6%);\n  background: rgb(10 10 12 / 95%);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  gap: 24px;\n  opacity: 0;\n  pointer-events: none;\n  transform: translateY(-100%);\n  transition:\n    opacity 280ms ease,\n    transform 280ms var(--atv-ease-out);\n}\n\n/* Frosted glass effect only when NOT actively scrolling — Apple-style.\n   The backdrop-filter forces per-frame compositing; dropping it during\n   scroll eliminates the main source of scroll jank. */\n\n.atv-stickynav.is-visible:not(.is-scrolling) {\n  -webkit-backdrop-filter: saturate(180%) blur(24px);\n  backdrop-filter: saturate(180%) blur(24px);\n  background: rgb(10 10 12 / 74%);\n}\n\n.atv-stickynav.is-visible {\n  opacity: 1;\n  pointer-events: auto;\n  transform: none;\n}\n\n.atv-stickynav-title {\n  overflow: hidden;\n  min-width: 0;\n  flex: 0 1 auto;\n  color: #fff;\n  font-size: 16px;\n  font-weight: 600;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.atv-stickynav-jumps {\n  display: flex;\n  flex: 0 0 auto;\n  gap: 24px;\n}\n\n.atv-stickynav-jumps a {\n  position: relative;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  transition: color 200ms ease;\n  white-space: nowrap;\n}\n\n#atv-douban-root .atv-stickynav-jumps a {\n  color: rgb(255 255 255 / 70%);\n}\n\n.atv-stickynav-jumps a::after {\n  position: absolute;\n  bottom: -4px;\n  left: 0;\n  width: 100%;\n  height: 2px;\n  border-radius: 1px;\n  background: var(--atv-accent);\n  content: \"\";\n  transform: scaleX(0);\n  transform-origin: center;\n  transition: transform var(--atv-duration-hover) ease;\n}\n\n.atv-stickynav.is-scrolling .atv-stickynav-jumps a::after {\n  transition: none;\n}\n\n#atv-douban-root .atv-stickynav-jumps a:hover {\n  background: transparent;\n  color: var(--atv-accent-bright);\n}\n\n#atv-douban-root .atv-stickynav-jumps a.is-active {\n  color: var(--atv-accent-bright);\n}\n\n.atv-stickynav-jumps a.is-active::after {\n  transform: scaleX(1);\n}\n\n@media (width <= 768px) {\n  .atv-stickynav-title {\n    font-size: 14px;\n  }\n\n  .atv-stickynav-jumps {\n    gap: 14px;\n  }\n\n  .atv-stickynav-jumps a {\n    font-size: 12px;\n  }\n}\n\n/* ---------- Subject switcher ---------- */\n\n.atv-stickynav-subject-switcher {\n  position: relative;\n  flex: 0 0 auto;\n  margin-left: auto;\n}\n\n.atv-subject-switcher-trigger,\n.atv-subject-switcher-close,\n.atv-subject-search-fallback,\n.atv-subject-suggestion {\n  border: 0;\n  appearance: none;\n  color: inherit;\n  cursor: pointer;\n  font: inherit;\n}\n\n.atv-subject-switcher-trigger {\n  display: inline-flex;\n  height: 34px;\n  align-items: center;\n  padding: 0 13px;\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: 999px;\n  background: rgb(255 255 255 / 7%);\n  color: var(--atv-text-secondary);\n  font-size: 13px;\n  font-weight: 600;\n  gap: 7px;\n  letter-spacing: 0.01em;\n  transition:\n    background var(--atv-duration-hover) ease,\n    border-color var(--atv-duration-hover) ease,\n    color var(--atv-duration-hover) ease;\n}\n\n.atv-subject-switcher-trigger:hover,\n.atv-subject-switcher-trigger:focus-visible {\n  border-color: rgb(255 255 255 / 22%);\n  background: rgb(255 255 255 / 12%);\n  color: var(--atv-text-primary);\n  outline: none;\n}\n\n.atv-subject-switcher-expanded {\n  position: relative;\n  display: flex;\n  width: min(44vw, 520px);\n  height: 38px;\n  align-items: center;\n  border: 1px solid rgb(255 255 255 / 22%);\n  border-radius: 999px;\n  background: rgb(255 255 255 / 10%);\n  box-shadow: 0 12px 32px rgb(0 0 0 / 28%);\n}\n\n.atv-stickynav.has-subject-switcher-open .atv-stickynav-jumps {\n  display: none;\n}\n\n.atv-stickynav.has-subject-switcher-open .atv-stickynav-subject-switcher {\n  position: absolute;\n  left: 50%;\n  margin: 0;\n  transform: translateX(-50%);\n}\n\n.atv-stickynav.has-subject-switcher-open .atv-subject-switcher-expanded {\n  width: min(56vw, 620px);\n}\n\n.atv-subject-switcher-search-icon {\n  display: inline-flex;\n  flex: 0 0 auto;\n  margin-left: 13px;\n  color: var(--atv-text-tertiary);\n}\n\n.atv-subject-switcher-input {\n  width: 100%;\n  min-width: 0;\n  height: 100%;\n  padding: 0 8px;\n  border: 0;\n  background: transparent;\n  color: var(--atv-text-primary);\n  font: inherit;\n  font-size: 14px;\n  outline: 0;\n}\n\n.atv-subject-switcher-input::placeholder {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-subject-switcher-close {\n  height: 24px;\n  padding: 0 9px;\n  border-radius: 999px;\n  margin-right: 6px;\n  background: rgb(255 255 255 / 10%);\n  color: var(--atv-text-tertiary);\n  font-size: 10px;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n}\n\n.atv-subject-switcher-close:hover,\n.atv-subject-switcher-close:focus-visible {\n  background: rgb(255 255 255 / 18%);\n  color: var(--atv-text-primary);\n  outline: none;\n}\n\n.atv-subject-suggestion-rail {\n  position: absolute;\n  top: calc(100% + 10px);\n  right: 0;\n  overflow: hidden;\n  width: 100%;\n  border: 1px solid rgb(255 255 255 / 12%);\n  border-radius: var(--atv-radius-md);\n  background: rgb(21 21 23 / 96%);\n  box-shadow: 0 24px 56px rgb(0 0 0 / 48%);\n}\n\n.atv-subject-suggestion {\n  position: relative;\n  display: flex;\n  width: 100%;\n  min-height: 70px;\n  align-items: center;\n  padding: 8px 18px 8px 9px;\n  background: transparent;\n  text-align: left;\n  transition: background var(--atv-duration-hover) ease;\n}\n\n.atv-subject-suggestion + .atv-subject-suggestion {\n  border-top: 1px solid rgb(255 255 255 / 7%);\n}\n\n.atv-subject-suggestion:hover,\n.atv-subject-suggestion.is-active {\n  background: rgb(255 255 255 / 8%);\n}\n\n.atv-subject-suggestion:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: -2px;\n}\n\n.atv-subject-suggestion-poster {\n  position: relative;\n  overflow: hidden;\n  width: 36px;\n  height: 54px;\n  flex: 0 0 auto;\n  border-radius: 4px;\n  background: var(--atv-bg-tertiary);\n}\n\n.atv-subject-suggestion-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-subject-suggestion-copy {\n  display: grid;\n  min-width: 0;\n  margin-left: 12px;\n  gap: 4px;\n}\n\n.atv-subject-suggestion-title,\n.atv-subject-suggestion-original,\n.atv-subject-suggestion-metadata {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.atv-subject-suggestion-title {\n  color: var(--atv-text-primary);\n  font-size: 14px;\n  font-weight: 650;\n  letter-spacing: 0.01em;\n}\n\n.atv-subject-suggestion-metadata {\n  margin-left: 7px;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  font-weight: 500;\n}\n\n.atv-subject-suggestion-original {\n  color: var(--atv-text-secondary);\n  font-size: 12px;\n}\n\n.atv-subject-suggestion-marker {\n  position: absolute;\n  top: 11px;\n  bottom: 11px;\n  left: 52px;\n  width: 2px;\n  border-radius: 2px;\n  background: var(--atv-accent-bright);\n  box-shadow: 0 0 12px var(--atv-accent-glow);\n  opacity: 0;\n  transform: scaleY(0.3);\n  transform-origin: center;\n  transition:\n    opacity var(--atv-duration-hover) ease,\n    transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n.atv-subject-suggestion-rail.is-keyboard-navigating .atv-subject-suggestion,\n.atv-subject-suggestion-rail.is-keyboard-navigating\n  .atv-subject-suggestion-marker {\n  transition: none;\n}\n\n.atv-subject-suggestion.is-active .atv-subject-suggestion-marker {\n  opacity: 1;\n  transform: scaleY(1);\n}\n\n.atv-subject-suggestion-skeletons {\n  display: grid;\n  padding: 9px;\n  gap: 7px;\n}\n\n.atv-subject-suggestion-skeletons span {\n  display: block;\n  height: 54px;\n  border-radius: 6px;\n  background: rgb(255 255 255 / 6%);\n}\n\n.atv-subject-search-fallback {\n  display: block;\n  width: 100%;\n  padding: 15px 18px;\n  background: transparent;\n  color: var(--atv-text-secondary);\n  font-size: 13px;\n  text-align: left;\n}\n\n.atv-subject-search-fallback:hover,\n.atv-subject-search-fallback:focus-visible {\n  background: rgb(255 255 255 / 8%);\n  color: var(--atv-text-primary);\n  outline: none;\n}\n\n@media (width <= 768px) {\n  .atv-subject-switcher-expanded {\n    width: min(78vw, 520px);\n  }\n\n  .atv-subject-switcher.is-open .atv-subject-suggestion-rail {\n    right: -8px;\n    width: calc(100vw - 24px);\n  }\n\n  .atv-stickynav.has-subject-switcher-open .atv-stickynav-title {\n    display: none;\n  }\n\n  .atv-stickynav.has-subject-switcher-open .atv-stickynav-subject-switcher {\n    position: relative;\n    left: auto;\n    width: 100%;\n    margin: 0;\n    transform: none;\n  }\n\n  .atv-stickynav.has-subject-switcher-open .atv-subject-switcher-expanded {\n    width: 100%;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-subject-suggestion-marker {\n    transition: none;\n  }\n}\n\n/* ---------- Hero ---------- */\n\n.atv-hero {\n  position: relative;\n  display: flex;\n  overflow: visible;\n  min-height: 75vh;\n  flex-direction: column;\n  padding: 132px max(28px, 5vw) 56px;\n  isolation: isolate;\n}\n\n.atv-hero-inner-section {\n  flex: 0 0 auto;\n}\n\n.atv-hero-bg {\n  position: absolute;\n  z-index: -4;\n  top: 0;\n  right: 0;\n  left: 0;\n  overflow: hidden;\n  height: 75vh;\n  background: #000;\n}\n\n.atv-hero-still {\n  position: absolute;\n  backface-visibility: hidden;\n  background-position: center 30%;\n  background-repeat: no-repeat;\n  background-size: cover;\n  inset: 0;\n  transform: scale(1.04);\n}\n\n.atv-hero-still.is-thumb {\n  filter: blur(12px) saturate(1.12) brightness(0.84);\n  transform: scale(1.14);\n}\n\n.atv-hero-still.is-hd {\n  filter: saturate(1.08) brightness(0.88);\n  opacity: 0;\n  transition: opacity 300ms var(--atv-ease-out);\n}\n\n.atv-hero-still.is-hd.is-loaded {\n  animation: atv-kenburns 22s linear forwards;\n  opacity: 1;\n}\n\n.atv-hero-still.is-poster {\n  background-position: center 22%;\n  filter: blur(60px) saturate(1.25) brightness(0.78);\n  transform: scale(1.25);\n}\n\n@keyframes atv-kenburns {\n  from {\n    transform: scale(1) translate(0, 0);\n  }\n\n  to {\n    transform: scale(1.1) translate(-1.8%, -1.2%);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-hero-still.is-hd {\n    transition: opacity 200ms ease;\n  }\n\n  .atv-hero-still.is-hd.is-loaded {\n    animation: none;\n    transform: scale(1.04);\n  }\n}\n\n.atv-hero-vignette {\n  position: absolute;\n  z-index: -3;\n  top: 0;\n  right: 0;\n  left: 0;\n  height: 75vh;\n  background: radial-gradient(\n    120% 90% at 70% 30%,\n    transparent 0%,\n    rgb(0 0 0 / 55%) 100%\n  );\n}\n\n.atv-hero-overlay-x {\n  position: absolute;\n  z-index: -2;\n  top: 0;\n  right: 0;\n  left: 0;\n  height: 75vh;\n  background: linear-gradient(\n    to right,\n    rgb(0 0 0 / 96%) 0%,\n    rgb(0 0 0 / 82%) 32%,\n    rgb(0 0 0 / 50%) 62%,\n    rgb(0 0 0 / 35%) 100%\n  );\n}\n\n.atv-hero-overlay-y {\n  position: absolute;\n  z-index: -1;\n  top: 0;\n  right: 0;\n  left: 0;\n  height: 75vh;\n  background: linear-gradient(\n    to bottom,\n    rgb(0 0 0 / 45%) 0%,\n    transparent 28%,\n    transparent 55%,\n    #000 100%\n  );\n}\n\n.atv-hero-inner {\n  display: flex;\n  width: 100%;\n  max-width: 1100px;\n  align-items: flex-start;\n  margin: 0 auto;\n  gap: 56px;\n}\n\n.atv-poster-card {\n  display: flex;\n  overflow: hidden;\n  width: 360px;\n  flex: 0 0 auto;\n  padding: 0;\n  border: none;\n  border-radius: var(--atv-radius-lg);\n  appearance: none;\n  aspect-ratio: 2 / 3;\n  background: var(--atv-bg-tertiary);\n  box-shadow:\n    0 24px 60px rgb(0 0 0 / 60%),\n    0 0 0 1px var(--atv-border-subtle) inset;\n  transition: transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n.atv-poster-card img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-poster-placeholder {\n  width: 100%;\n  height: 100%;\n}\n\n.atv-hero-info {\n  min-width: 0;\n  flex: 1 1 auto;\n}\n\n.atv-hero-title {\n  margin: 0 0 8px;\n  color: #fff;\n  font-size: clamp(44px, 5.5vw, 72px);\n  font-weight: 700;\n  letter-spacing: -0.02em;\n  line-height: 1.05;\n  text-shadow:\n    0 2px 20px rgb(0 0 0 / 70%),\n    0 0 60px rgb(0 0 0 / 30%);\n}\n\n.atv-hero-orig {\n  margin-bottom: 22px;\n  color: var(--atv-text-secondary);\n  font-size: clamp(18px, 1.6vw, 22px);\n  font-weight: 400;\n  letter-spacing: -0.01em;\n  opacity: 0.85;\n}\n\n.atv-hero-meta {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  margin-bottom: 24px;\n  color: var(--atv-text-secondary);\n  font-size: 13px;\n  font-weight: 500;\n  gap: 10px 14px;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n}\n\n.atv-first-broadcast-platform {\n  display: inline-flex;\n  align-items: center;\n}\n\n.atv-first-broadcast-platform-mark {\n  display: inline-flex;\n  width: 32px;\n  height: 32px;\n  align-items: center;\n  justify-content: center;\n  border: 1px solid rgb(255 255 255 / 13%);\n  border-radius: 9px;\n  background: rgb(255 255 255 / 8%);\n  color: #fff;\n}\n\n.atv-first-broadcast-platform-mark.is-catalog svg {\n  width: 22px;\n  height: 22px;\n  fill: currentcolor;\n}\n\n.atv-first-broadcast-platform-mark.is-intrinsic svg {\n  width: 22px;\n  height: 22px;\n  fill: initial;\n}\n\n.atv-first-broadcast-platform-mark.is-wordmark {\n  width: 68px;\n}\n\n.atv-first-broadcast-platform-mark.is-wordmark svg {\n  width: 52px;\n  height: 20px;\n}\n\n.atv-first-broadcast-platform-mark.is-surface-paper {\n  border-color: rgb(255 255 255 / 34%);\n  background: #d9dce3;\n  box-shadow: inset 0 1px 0 rgb(255 255 255 / 56%);\n}\n\n.atv-first-broadcast-platform.is-unknown {\n  color: var(--atv-text-tertiary);\n  font-size: 11px;\n  letter-spacing: 0.08em;\n  text-transform: none;\n}\n\n.atv-screen-reader-only {\n  position: absolute;\n  overflow: hidden;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  border: 0;\n  margin: -1px;\n  clip-path: inset(50%);\n  white-space: nowrap;\n}\n\n.atv-meta-dot {\n  display: inline-flex;\n  align-items: center;\n}\n\n.atv-meta-dot + .atv-meta-dot::before {\n  margin-right: 14px;\n  color: var(--atv-text-tertiary);\n  content: \"·\";\n}\n\n.atv-meta-chips {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.atv-chip {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 11px;\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: 999px;\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  background: var(--atv-bg-elevated);\n  color: var(--atv-text-secondary);\n  font-size: 12px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  text-transform: none;\n}\n\n/* ── Ratings Panel ──────────────────────────────── */\n\n/* Unified card presenting Douban + IMDb + RT side by side */\n\n.atv-rating-panel {\n  display: flex;\n  width: fit-content;\n  min-width: 320px;\n  flex-wrap: wrap;\n  align-items: stretch;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: var(--atv-radius-md);\n  margin-bottom: 28px;\n  gap: 0;\n}\n\n.atv-rating-panel-douban,\n.atv-rating-panel-imdb,\n.atv-rating-panel-rt,\n.atv-rating-panel-mc {\n  display: grid;\n  flex: 1;\n  padding: 16px 24px 14px;\n  grid-template-rows: 28px 44px 20px 1fr;\n  place-items: center center;\n  text-align: center;\n  transition: background 200ms ease;\n}\n\n.atv-rating-panel-douban:hover,\n.atv-rating-panel-imdb:hover,\n.atv-rating-panel-rt:hover,\n.atv-rating-panel-mc:hover {\n  background: rgb(255 255 255 / 3%);\n}\n\n.atv-rating-panel-douban {\n  border-right: 1px solid rgb(255 255 255 / 6%);\n}\n\n.atv-rating-panel-imdb {\n  border-right: 1px solid rgb(255 255 255 / 6%);\n}\n\n.atv-rating-panel-mc {\n  border-right: 1px solid rgb(255 255 255 / 6%);\n}\n\n.atv-rating-panel-logo {\n  display: inline-flex;\n  align-items: center;\n  align-self: center;\n  opacity: 0.85;\n  transition: opacity 200ms ease;\n}\n\n.atv-rating-panel-logo:hover {\n  opacity: 1;\n}\n\n.atv-rating-panel-logo svg {\n  display: block;\n}\n\n.atv-rating-panel .atv-rating-panel-score {\n  color: var(--atv-text-primary);\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 38px;\n  font-weight: 700;\n  letter-spacing: -0.03em;\n  line-height: 1;\n}\n\n/* ── MC Score color by range ────────────────────── */\n\n.atv-rating-panel-score.is-high {\n  color: #3bb33b;\n}\n\n.atv-rating-panel-score.is-medium {\n  color: #ffb800;\n}\n\n.atv-rating-panel-score.is-low {\n  color: #fa320a;\n}\n\n/* ── MC label row (score bar + Chinese word label) ── */\n\n.atv-mc-label-row {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.atv-mc-bar-track {\n  display: inline-block;\n  overflow: hidden;\n  width: 40px;\n  height: 4px;\n  flex-shrink: 0;\n  border-radius: 2px;\n  background: rgb(255 255 255 / 10%);\n}\n\n.atv-mc-bar-fill {\n  display: block;\n  height: 100%;\n  border-radius: 2px;\n}\n\n.atv-mc-bar-fill.is-high {\n  background: #3bb33b;\n}\n\n.atv-mc-bar-fill.is-medium {\n  background: #ffb800;\n}\n\n.atv-mc-bar-fill.is-low {\n  background: #fa320a;\n}\n\n.atv-mc-word-label {\n  color: var(--atv-text-tertiary);\n  font-size: 11px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  line-height: 1;\n  white-space: nowrap;\n}\n\n.atv-rating-stars {\n  display: inline-flex;\n  color: var(--atv-rating-gold);\n  gap: 2px;\n}\n\n.atv-rating-stars svg {\n  display: block;\n}\n\n/* ── RT Score Row (values side by side) ─────────── */\n\n.atv-rt-score-row,\n.atv-rt-label-row,\n.atv-rt-count-row {\n  display: grid;\n  width: 100%;\n  align-items: center;\n  gap: 8px;\n  grid-template-columns: 1fr auto 1fr;\n}\n\n.atv-rt-score-value {\n  font-family:\n    \"SF Pro Display\",\n    -apple-system,\n    BlinkMacSystemFont,\n    system-ui,\n    sans-serif;\n  font-size: 30px;\n  font-weight: 700;\n  letter-spacing: -0.03em;\n  line-height: 1;\n}\n\n.atv-rt-score-value.is-fresh {\n  color: var(--atv-text-primary);\n}\n\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:first-child {\n  color: rgb(255 107 91 / 85%);\n}\n\n.atv-rt-score-row > .atv-rt-score-value.is-rotten:last-child {\n  color: rgb(255 167 38 / 85%);\n}\n\n.atv-rt-score-row > .atv-rt-score-value:first-child {\n  justify-self: center;\n  text-align: right;\n}\n\n.atv-rt-score-row > .atv-rt-score-value:last-child {\n  justify-self: center;\n  text-align: left;\n}\n\n/* ── RT Label Row (icons + text) ────────────────── */\n\n.atv-rt-label-row {\n  gap: 8px;\n  grid-template-columns: 1fr 1fr;\n}\n\n.atv-rt-label-item {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:first-child {\n  justify-self: center;\n}\n\n.atv-rt-label-row > .atv-rt-label-item:last-child {\n  justify-self: center;\n}\n\n.atv-rt-score-icon {\n  display: inline-flex;\n  width: 16px;\n  height: 16px;\n  color: var(--atv-text-tertiary);\n  opacity: 0.7;\n}\n\n.atv-rt-score-icon svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-rt-label-item.is-critics.is-fresh .atv-rt-score-icon {\n  color: #ff6b5b;\n  opacity: 1;\n}\n\n.atv-rt-label-item.is-critics.is-rotten .atv-rt-score-icon {\n  color: #50b85e;\n  opacity: 0.6;\n}\n\n.atv-rt-label-item.is-audience.is-fresh .atv-rt-score-icon {\n  color: #ffb800;\n  opacity: 1;\n}\n\n.atv-rt-label-item.is-audience.is-rotten .atv-rt-score-icon {\n  color: #888;\n  opacity: 0.6;\n}\n\n.atv-rt-score-label {\n  color: var(--atv-text-tertiary);\n  font-size: 11px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── Shared count text (Douban / IMDb) ──────────── */\n\n.atv-rating-panel-count {\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ── RT Count Row (e.g. 评价 300 | 50,000) ──────── */\n\n.atv-rt-count-row {\n  gap: 8px;\n  grid-template-columns: 1fr 1fr;\n}\n\n.atv-rt-count-value {\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n.atv-rt-count-row > .atv-rt-count-value:first-child {\n  justify-self: center;\n}\n\n.atv-rt-count-row > .atv-rt-count-value:last-child {\n  justify-self: center;\n}\n\n/* ── RT Divider ─────────────────────────────────── */\n\n.atv-rt-divider {\n  width: 1px;\n  flex-shrink: 0;\n  align-self: stretch;\n  margin: 2px 0;\n  background: rgb(255 255 255 / 12%);\n}\n\n@media (width <= 768px) {\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n    grid-template-rows: 24px 38px 18px 1fr;\n  }\n\n  .atv-rt-score-value {\n    font-size: 26px;\n  }\n\n  .atv-rt-score-icon {\n    width: 14px;\n    height: 14px;\n  }\n\n  .atv-rt-score-label {\n    font-size: 10px;\n  }\n\n  .atv-mc-bar-track {\n    width: 32px;\n  }\n\n  .atv-mc-word-label {\n    font-size: 10px;\n  }\n\n  .atv-rating-panel {\n    min-width: 0;\n  }\n}\n\n.atv-rating-empty {\n  padding: 10px 0;\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  letter-spacing: 0.03em;\n}\n\n/* ── Skeleton (loading) ─────────────────────────── */\n\n.atv-rating-panel-skeleton {\n  width: 120px;\n  height: 22px;\n  border-radius: 4px;\n  background: rgb(255 255 255 / 6%);\n}\n\n.atv-actions {\n  display: flex;\n  flex-wrap: wrap;\n  margin-bottom: 26px;\n  gap: 12px;\n}\n\n.atv-btn {\n  display: inline-flex;\n  height: 44px;\n  align-items: center;\n  padding: 0 22px;\n  border: none;\n  border-radius: 999px;\n  appearance: none;\n  background: none;\n  color: inherit;\n  cursor: pointer;\n  font-family: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  gap: 8px;\n  letter-spacing: 0.01em;\n  -webkit-tap-highlight-color: transparent;\n  transition:\n    transform var(--atv-duration-press) var(--atv-ease-out),\n    background 200ms ease,\n    box-shadow 200ms ease,\n    color 200ms ease;\n}\n\n.atv-btn:active {\n  transform: scale(0.97);\n}\n\n.atv-btn-primary {\n  background: var(--atv-accent);\n  box-shadow: 0 8px 24px var(--atv-accent-glow);\n  color: #fff;\n}\n\n.atv-btn-secondary {\n  border: 1px solid var(--atv-border-medium);\n  backdrop-filter: blur(10px);\n  background: var(--atv-bg-elevated);\n  color: var(--atv-text-primary);\n}\n\n.atv-btn.is-active {\n  border-color: transparent;\n  background: var(--atv-accent);\n  box-shadow: 0 6px 20px var(--atv-accent-glow);\n  color: #fff;\n}\n\n.atv-hero-summary {\n  margin-top: 16px;\n}\n\n.atv-hero-teaser {\n  display: -webkit-box;\n  overflow: hidden;\n  max-width: 660px;\n  margin: 0 0 12px;\n  -webkit-box-orient: vertical;\n  color: var(--atv-text-secondary);\n  font-size: 15px;\n  line-height: 1.75;\n  overflow-wrap: break-word;\n  white-space: pre-wrap;\n}\n\n.atv-hero-teaser.is-clamped {\n  -webkit-line-clamp: 3;\n}\n\n.atv-hero-more {\n  display: inline-flex;\n  align-items: center;\n  padding: 0;\n  border: none;\n  appearance: none;\n  background: none;\n  color: var(--atv-accent-bright);\n  cursor: pointer;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  gap: 6px;\n  letter-spacing: 0.02em;\n}\n\n.atv-hero-more:hover {\n  color: var(--atv-accent);\n}\n\n.atv-hero-more svg {\n  transition: transform 220ms ease;\n}\n\n.atv-hero-more.is-open svg {\n  transform: rotate(180deg);\n}\n\n/* ---------- Section ---------- */\n\n.atv-section {\n  max-width: 1280px;\n  padding: 52px max(28px, 5vw);\n  margin: 0 auto;\n  contain-intrinsic-size: auto 400px;\n  content-visibility: auto;\n  scroll-margin-top: 64px;\n}\n\n.atv-section + .atv-section {\n  padding-top: 0;\n}\n\n.atv-section-h {\n  position: relative;\n  display: flex;\n  align-items: center;\n  padding-left: 16px;\n  margin: 0 0 24px;\n  font-size: 24px;\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}\n\n.atv-section-h::before {\n  position: absolute;\n  top: 50%;\n  left: 0;\n  width: 4px;\n  height: 24px;\n  border-radius: 2px;\n  background: var(--atv-accent);\n  content: \"\";\n  transform: translateY(-50%);\n}\n\n.atv-section-h-row {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  margin-bottom: 24px;\n  gap: 16px;\n}\n\n.atv-section-h-row .atv-section-h {\n  margin-bottom: 0;\n}\n\n.atv-section-more {\n  flex: 0 0 auto;\n  color: var(--atv-text-tertiary);\n  font-size: 14px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  transition: color 200ms ease;\n  white-space: nowrap;\n}\n\n.atv-section-more:hover {\n  color: var(--atv-accent-bright);\n}\n\n.atv-section-more:focus-visible {\n  color: var(--atv-accent-bright);\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: 3px;\n}\n\n/* ---------- Carousel ---------- */\n\n.atv-carousel {\n  display: flex;\n  padding: 4px 4px 16px;\n  margin: 0 -4px;\n  contain: paint layout;\n  gap: 16px;\n  overflow-x: auto;\n  scroll-behavior: smooth;\n  scroll-snap-type: x mandatory;\n  scrollbar-width: none;\n}\n\n.atv-carousel::-webkit-scrollbar {\n  display: none;\n}\n\n/* ---------- Page scrollbar ---------- */\n\n:root {\n  color-scheme: dark;\n}\n\n::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n}\n\n::-webkit-scrollbar-track {\n  background: #1c1c1e;\n}\n\n::-webkit-scrollbar-thumb {\n  border-radius: 3px;\n  background: #3a3a3c;\n}\n\n::-webkit-scrollbar-thumb:hover {\n  background: #48484a;\n}\n\n::-webkit-scrollbar-corner {\n  background: transparent;\n}\n\n* {\n  scrollbar-color: #3a3a3c #1c1c1e;\n  scrollbar-width: thin;\n}\n\n/* ---------- Series ---------- */\n\n.atv-series-card {\n  min-width: 0;\n  flex: 0 0 158px;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n/* ── Active season (user is currently on this season's page) ── */\n\n.atv-series-card.is-active .atv-series-poster {\n  box-shadow:\n    inset 0 0 0 2px var(--atv-accent),\n    0 0 20px var(--atv-accent-glow);\n}\n\n.atv-series-card.is-active .atv-series-info::after {\n  width: 20px;\n  opacity: 1;\n}\n\n/* ── Poster ── */\n\n.atv-series-poster {\n  position: relative;\n  overflow: hidden;\n  width: 100%;\n  border-radius: var(--atv-radius-sm);\n  aspect-ratio: 2 / 3;\n  background: var(--atv-bg-tertiary);\n}\n\n/* Poster bottom gradient overlay (Apple TV+ style depth) */\n\n.atv-series-poster::after {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 45%;\n  background: linear-gradient(to top, rgb(0 0 0 / 55%) 0%, transparent 100%);\n  content: \"\";\n  pointer-events: none;\n}\n\n.atv-series-poster img {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n/* ── Rating badge (overlay on poster top-right) ── */\n\n.atv-series-badge {\n  position: absolute;\n  z-index: 1;\n  top: 8px;\n  right: 8px;\n  display: flex;\n  min-width: 28px;\n  height: 22px;\n  align-items: center;\n  justify-content: center;\n  padding: 0 7px;\n  border-radius: 20px;\n  backdrop-filter: blur(4px);\n  background: rgb(0 0 0 / 65%);\n  color: #fff;\n  font-size: 11px;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n  line-height: 1;\n}\n\n/* ── Info row ── */\n\n.atv-series-info {\n  position: relative;\n  margin-top: 10px;\n}\n\n.atv-series-info::after {\n  display: block;\n  width: 100%;\n  height: 2px;\n  border-radius: 1px;\n  margin-top: 4px;\n  background: var(--atv-accent);\n  content: \"\";\n  opacity: 0;\n  transform: scaleX(0);\n  transform-origin: left;\n  transition: opacity var(--atv-duration-hover) ease;\n}\n\n.atv-series-title {\n  display: block;\n  overflow: hidden;\n  color: var(--atv-text-primary);\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  line-height: 1.3;\n  text-overflow: ellipsis;\n  transition: color 300ms ease;\n  white-space: nowrap;\n}\n\n/* ---------- Cast ---------- */\n\n.atv-cast-card {\n  min-width: 0;\n  flex: 0 0 160px;\n  cursor: pointer;\n  scroll-snap-align: start;\n  text-align: center;\n  transition: transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n.atv-cast-avatar {\n  width: 160px;\n  height: 160px;\n  border: 2px solid transparent;\n  border-radius: 50%;\n  background-color: var(--atv-bg-tertiary);\n  background-position: center top;\n  background-size: cover;\n}\n\n.atv-cast-name {\n  overflow: hidden;\n  margin-top: 16px;\n  color: var(--atv-text-primary);\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.3;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.atv-cast-role {\n  display: -webkit-box;\n  overflow: hidden;\n  margin-top: 4px;\n  -webkit-box-orient: vertical;\n  color: rgb(255 255 255 / 55%);\n  font-size: 13px;\n  font-weight: 400;\n  -webkit-line-clamp: 2;\n  line-height: 1.35;\n}\n\n/* ---------- Photos ---------- */\n\n.atv-photos {\n  gap: 12px;\n}\n\n.atv-photo-tile {\n  display: flex;\n  overflow: hidden;\n  flex: 0 0 400px;\n  padding: 0;\n  border: none;\n  border-radius: var(--atv-radius-md);\n  appearance: none;\n  aspect-ratio: 16 / 9;\n  background: var(--atv-bg-tertiary);\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n.atv-photo-tile.is-portrait {\n  flex: 0 0 240px;\n  aspect-ratio: 3 / 4;\n}\n\n.atv-photo-tile img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n/* ---------- Recommendations ---------- */\n\n.atv-recs {\n  display: grid;\n  gap: 24px;\n  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));\n}\n\n.atv-rec-card {\n  cursor: pointer;\n}\n\n.atv-rec-poster {\n  overflow: hidden;\n  width: 100%;\n  border-radius: var(--atv-radius-sm);\n  aspect-ratio: 2 / 3;\n  background: var(--atv-bg-tertiary);\n  transition: transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n.atv-rec-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n@media (hover: hover) and (pointer: fine) {\n  .atv-series-card:hover,\n  .atv-cast-card:hover {\n    transform: translateY(-2px);\n  }\n\n  .atv-series-card:hover .atv-series-title {\n    color: var(--atv-accent-bright);\n  }\n\n  .atv-photo-tile:hover,\n  .atv-rec-card:hover .atv-rec-poster {\n    transform: scale(1.02);\n  }\n}\n\n.atv-rec-title {\n  display: -webkit-box;\n  overflow: hidden;\n  margin-top: 12px;\n  -webkit-box-orient: vertical;\n  color: var(--atv-text-primary);\n  font-size: 15px;\n  font-weight: 600;\n  -webkit-line-clamp: 2;\n  text-overflow: ellipsis;\n}\n\n/* ---------- Info grid ---------- */\n\n.atv-info-grid {\n  display: grid;\n  gap: 16px 32px;\n  grid-template-columns: 200px 1fr;\n}\n\n.atv-info-label {\n  padding-top: 2px;\n  color: rgb(255 255 255 / 55%);\n  font-size: 14px;\n  font-weight: 500;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n}\n\n.atv-info-value {\n  color: var(--atv-text-primary);\n  font-size: 15px;\n  font-weight: 400;\n  line-height: 1.5;\n  overflow-wrap: break-word;\n}\n\n.atv-info-value a {\n  border-bottom: 1px solid var(--atv-border-medium);\n  color: var(--atv-text-primary);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease;\n}\n\n.atv-info-value a:hover {\n  border-color: var(--atv-accent-bright);\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Streaming ---------- */\n\n.atv-stream-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n\n.atv-stream-card {\n  --atv-stream-brand: var(--atv-accent-bright);\n\n  position: relative;\n  display: inline-flex;\n  max-width: 240px;\n  height: 52px;\n  align-items: center;\n  padding: 0 20px 0 14px;\n  border: 1px solid var(--atv-border-medium);\n  border-radius: var(--atv-radius-md);\n  background: var(--atv-bg-elevated);\n  color: var(--atv-text-primary);\n  cursor: pointer;\n  font-family: inherit;\n  font-size: 20px;\n  font-weight: 600;\n  gap: 11px;\n  letter-spacing: 0.01em;\n  -webkit-tap-highlight-color: transparent;\n  transition:\n    background 220ms ease,\n    border-color 220ms ease,\n    transform 220ms var(--atv-ease-out);\n}\n\n/* Center-glow overlay — subtle brand bloom from card center */\n\n.atv-stream-card::after {\n  position: absolute;\n  border-radius: inherit;\n  background: radial-gradient(\n    circle at center,\n    var(--atv-stream-brand, var(--atv-accent-bright)) 0%,\n    transparent 70%\n  );\n  content: \"\";\n  inset: 0;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 220ms ease;\n}\n\n/* ── Combined SVG cards ── */\n\n.atv-stream-card-combined {\n  height: 52px;\n  padding: 0 16px;\n  gap: 0;\n}\n\n.atv-stream-card-combined svg {\n  display: block;\n  width: auto;\n  max-width: 160px;\n  height: 32px;\n}\n\n.atv-stream-logo.is-catalog svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n  fill: currentcolor;\n}\n\n.atv-stream-logo.is-intrinsic svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n  fill: initial;\n}\n\n.atv-stream-vendor-icon {\n  display: block;\n  width: 32px;\n  height: 32px;\n  flex: 0 0 auto;\n  object-fit: contain;\n}\n\n.atv-stream-logo {\n  display: inline-flex;\n  overflow: hidden;\n  width: 32px;\n  height: 32px;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 9px;\n  background:\n    linear-gradient(180deg, rgb(255 255 255 / 12%), rgb(255 255 255 / 0%)),\n    rgb(255 255 255 / 5%);\n  box-shadow:\n    inset 0 1px 0 rgb(255 255 255 / 12%),\n    0 8px 18px rgb(0 0 0 / 18%);\n  color: var(--atv-stream-brand, var(--atv-accent-bright));\n}\n\n.atv-stream-logo.is-surface-paper {\n  border-color: rgb(255 255 255 / 34%);\n  background: #d9dce3;\n  box-shadow:\n    inset 0 1px 0 rgb(255 255 255 / 56%),\n    0 8px 18px rgb(0 0 0 / 18%);\n}\n\n.atv-stream-logo-fallback {\n  display: inline-flex;\n  width: 100%;\n  height: 100%;\n  align-items: center;\n  justify-content: center;\n  color: currentcolor;\n  font-size: 15px;\n  font-weight: 800;\n  line-height: 1;\n  text-transform: uppercase;\n}\n\n.atv-stream-name {\n  overflow: hidden;\n  min-width: 0;\n  text-overflow: ellipsis;\n  transition: color 220ms ease;\n  white-space: nowrap;\n}\n\n.atv-stream-card:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: 3px;\n}\n\n/* ---------- Comments ---------- */\n\n.atv-comments {\n  display: grid;\n  gap: 18px;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n}\n\n.atv-comment-card {\n  display: flex;\n  flex-direction: column;\n  padding: 18px 20px;\n  border: 1px solid rgb(255 255 255 / 6%);\n  border-radius: var(--atv-radius-md);\n  background: #121214;\n  transition:\n    transform var(--atv-duration-hover) var(--atv-ease-out),\n    border-color var(--atv-duration-hover) ease;\n}\n\n.atv-comment-top {\n  display: flex;\n  align-items: center;\n  margin-bottom: 14px;\n  gap: 12px;\n}\n\n.atv-comment-avatar {\n  display: flex;\n  overflow: hidden;\n  width: 36px;\n  height: 36px;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  border: 1.5px solid rgb(255 255 255 / 6%);\n  border-radius: 50%;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  box-shadow: 0 1px 3px rgb(0 0 0 / 12%);\n  color: #fff;\n  font-size: 15px;\n  font-weight: 600;\n  transition: border-color 260ms ease;\n}\n\n.atv-comment-meta {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.atv-comment-author,\na.atv-comment-author {\n  overflow: hidden;\n  color: var(--atv-text-primary);\n  font-size: 14px;\n  font-weight: 600;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\na.atv-comment-author:hover {\n  background: none;\n  color: var(--atv-text-primary);\n}\n\n.atv-comment-stars {\n  display: inline-flex;\n  align-items: center;\n  color: var(--atv-rating-gold);\n  gap: 2px;\n}\n\n.atv-comment-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-comment-body {\n  position: relative;\n  display: flex;\n  width: 100%;\n  flex: 1 1 auto;\n  flex-direction: column;\n  padding: 0;\n  border: none;\n  margin: 0 0 14px;\n  appearance: none;\n  background: none;\n  color: rgb(255 255 255 / 85%);\n  cursor: pointer;\n  font: inherit;\n  font-size: 15px;\n  line-height: 1.5;\n  overflow-wrap: break-word;\n  text-align: left;\n}\n\n.atv-comment-body-text {\n  display: -webkit-box;\n  overflow: hidden;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 4;\n  overflow-wrap: break-word;\n}\n\n.atv-comment-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  font-weight: 500;\n  gap: 12px;\n  letter-spacing: 0.02em;\n}\n\n.atv-comment-votes {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 10px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 100px;\n  background: none;\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  font-family: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  gap: 5px;\n  letter-spacing: 0.02em;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform var(--atv-duration-press) var(--atv-ease-out);\n}\n\n.atv-comment-votes:hover {\n  border-color: rgb(65 190 93 / 20%);\n  background: rgb(65 190 93 / 4%);\n  color: var(--atv-accent);\n}\n\n.atv-comment-votes:focus-visible {\n  outline: 2px solid rgb(65 190 93 / 75%);\n  outline-offset: 3px;\n}\n\n.atv-comment-votes:active {\n  transform: scale(0.97);\n}\n\n.atv-comment-votes.is-voted {\n  border-color: rgb(65 190 93 / 25%);\n  background: rgb(65 190 93 / 6%);\n  color: var(--atv-accent);\n}\n\n.atv-comment-votes svg {\n  display: block;\n  width: 13px;\n  height: 13px;\n}\n\n.atv-vote-count {\n  font-variant-numeric: tabular-nums;\n}\n\n/* ---------- Comment Expand Overlay ---------- */\n\n.atv-comment-foot-right {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.atv-comment-expand {\n  display: none;\n  width: 22px;\n  height: 22px;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border: 1px solid rgb(255 255 255 / 6%);\n  border-radius: 50%;\n  appearance: none;\n  backdrop-filter: blur(4px);\n  background: rgb(0 0 0 / 30%);\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  font: inherit;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform var(--atv-duration-press) var(--atv-ease-out);\n}\n\n.atv-comment-card.has-overflow .atv-comment-expand {\n  display: inline-flex;\n}\n\n.atv-comment-expand:hover {\n  border-color: var(--atv-accent);\n  background: rgb(65 190 93 / 10%);\n  color: var(--atv-accent);\n}\n\n.atv-comment-expand:active {\n  transform: scale(0.97);\n}\n\n.atv-comment-expand svg {\n  display: block;\n  width: 12px;\n  height: 12px;\n}\n\n/* ── Overlay ── */\n\n.atv-comment-overlay {\n  position: fixed;\n  z-index: 10000;\n  display: flex;\n  width: 100vw;\n  height: 100vh;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  border: none;\n  margin: 0;\n  background: rgb(0 0 0 / 72%);\n  inset: 0;\n}\n\n.atv-comment-overlay-inner {\n  position: relative;\n  width: 100%;\n  max-width: 580px;\n  max-height: 80vh;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 20px;\n  background: #121214;\n  box-shadow: 0 24px 80px rgb(0 0 0 / 55%);\n  overflow-y: auto;\n}\n\n.atv-modal-close.atv-comment-overlay-close {\n  position: absolute;\n  z-index: 2;\n  top: 16px;\n  right: 16px;\n  width: 32px;\n  height: 32px;\n  border-color: rgb(255 255 255 / 10%);\n  background: rgb(255 255 255 / 6%);\n  color: rgb(255 255 255 / 60%);\n}\n\n.atv-modal-close.atv-comment-overlay-close:hover {\n  border-color: rgb(255 255 255 / 20%);\n  background: rgb(255 255 255 / 12%);\n  color: #fff;\n}\n\n.atv-modal-close.atv-comment-overlay-close svg {\n  width: 16px;\n  height: 16px;\n}\n\n.atv-comment-overlay-top {\n  display: flex;\n  align-items: center;\n  padding: 28px 28px 0;\n  gap: 14px;\n}\n\n.atv-comment-overlay-avatar {\n  display: flex;\n  overflow: hidden;\n  width: 44px;\n  height: 44px;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  border: 2px solid var(--atv-border-subtle);\n  border-radius: 50%;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  box-shadow: 0 2px 6px rgb(0 0 0 / 15%);\n  color: #fff;\n  font-size: 18px;\n  font-weight: 600;\n  transition:\n    border-color 260ms ease,\n    box-shadow 260ms ease;\n}\n\n.atv-comment-overlay-meta {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.atv-comment-overlay-author,\na.atv-comment-overlay-author {\n  overflow: hidden;\n  color: var(--atv-text-primary);\n  font-size: 16px;\n  font-weight: 600;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\na.atv-comment-overlay-author:hover {\n  background: none;\n  color: var(--atv-text-primary);\n}\n\n.atv-comment-overlay-stars {\n  display: inline-flex;\n  color: var(--atv-rating-gold);\n  gap: 2px;\n}\n\n.atv-comment-overlay-stars svg {\n  display: block;\n  width: 16px;\n  height: 16px;\n}\n\n.atv-comment-overlay-body {\n  padding: 20px 28px;\n  color: rgb(255 255 255 / 85%);\n  font-size: 15px;\n  line-height: 1.75;\n  overflow-wrap: break-word;\n  white-space: pre-wrap;\n}\n\n.atv-comment-overlay-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 28px 28px;\n}\n\n.atv-comment-overlay-time {\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n}\n\n.atv-comment-overlay-votes {\n  display: inline-flex;\n  align-items: center;\n  padding: 6px 14px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 100px;\n  appearance: none;\n  background: rgb(255 255 255 / 4%);\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 500;\n  gap: 5px;\n  letter-spacing: 0.02em;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease,\n    transform var(--atv-duration-press) var(--atv-ease-out);\n}\n\n.atv-comment-overlay-votes:hover {\n  border-color: rgb(65 190 93 / 20%);\n  background: rgb(65 190 93 / 4%);\n  color: var(--atv-accent);\n}\n\n.atv-comment-overlay-votes:focus-visible {\n  outline: 2px solid rgb(65 190 93 / 75%);\n  outline-offset: 3px;\n}\n\n.atv-comment-overlay-votes:active {\n  transform: scale(0.97);\n}\n\n.atv-comment-overlay-votes.is-voted {\n  border-color: rgb(65 190 93 / 25%);\n  background: rgb(65 190 93 / 6%);\n  color: var(--atv-accent);\n}\n\n.atv-comment-overlay-votes svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n/* ---------- Poster Modal ---------- */\n\n.atv-poster-card {\n  cursor: pointer;\n}\n\n.atv-modal-overlay,\n.atv-comment-overlay,\n.atv-interest-modal,\n.atv-login-modal,\n.atv-review-modal {\n  -webkit-backdrop-filter: blur(16px) saturate(1.15);\n  backdrop-filter: blur(16px) saturate(1.15);\n}\n\n.atv-modal-overlay {\n  position: fixed;\n  z-index: 10000;\n  display: flex;\n  width: 100vw;\n  height: 100vh;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border: none;\n  margin: 0;\n  background: rgb(0 0 0 / 78%);\n  inset: 0;\n}\n\n.atv-modal-img {\n  max-width: 90vw;\n  max-height: 90vh;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgb(0 0 0 / 75%);\n  object-fit: contain;\n}\n\n.atv-modal-accent-bar {\n  position: absolute;\n  z-index: 1;\n  top: 0;\n  right: 0;\n  left: 0;\n  height: 3px;\n  background: linear-gradient(\n    to right,\n    transparent,\n    var(--atv-accent) 15%,\n    var(--atv-accent) 85%,\n    transparent\n  );\n  opacity: 1;\n}\n\n.atv-modal-close {\n  position: fixed;\n  z-index: 10001;\n  top: 24px;\n  right: 24px;\n  display: flex;\n  width: 44px;\n  height: 44px;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border: 1px solid rgb(255 255 255 / 18%);\n  border-radius: 50%;\n  appearance: none;\n  background: rgb(255 255 255 / 8%);\n  color: #fff;\n  cursor: pointer;\n  font: inherit;\n  -webkit-tap-highlight-color: transparent;\n  touch-action: manipulation;\n  transition:\n    color 200ms ease,\n    background 200ms ease,\n    border-color 200ms ease;\n}\n\n.atv-modal-close:hover {\n  border-color: rgb(255 255 255 / 30%);\n  background: rgb(255 255 255 / 16%);\n  color: #fff;\n}\n\n.atv-modal-close svg {\n  display: block;\n}\n\n/* ---------- Video modal spinner ---------- */\n\n@keyframes atv-spin {\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n.atv-spinner {\n  width: 32px;\n  height: 32px;\n  border: 3px solid rgb(255 255 255 / 20%);\n  border-radius: 50%;\n  border-top-color: #41be5d;\n  animation: atv-spin 0.8s linear infinite;\n}\n\n.atv-modal-loading {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  color: #fff;\n  font-size: 15px;\n  gap: 16px;\n}\n\n/* ---------- Footer spacer ---------- */\n\n.atv-footer-spacer {\n  height: 64px;\n}\n\n/* ---------- Login Prompt Modal ---------- */\n\ndialog::backdrop {\n  background: transparent;\n}\n\n.atv-login-modal {\n  position: fixed;\n  z-index: 10000;\n  display: flex;\n  width: 100vw;\n  min-height: 100vh;\n  align-items: center;\n  justify-content: center;\n  padding: max(24px, env(safe-area-inset-top))\n    max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom))\n    max(24px, env(safe-area-inset-left));\n  border: none;\n  margin: 0;\n  background: rgb(0 0 0 / 72%);\n  inset: 0;\n  overscroll-behavior: contain;\n}\n\n.atv-login-modal-inner {\n  position: relative;\n  overflow: auto;\n  width: min(100%, 424px);\n  max-height: min(736px, calc(100dvh - 48px));\n  box-sizing: border-box;\n  padding: 30px 22px 22px;\n  border: 1px solid rgb(255 255 255 / 10%);\n  border-radius: 20px;\n  background: var(--atv-bg-secondary);\n  box-shadow:\n    inset 0 1px 0 rgb(255 255 255 / 8%),\n    0 24px 80px rgb(0 0 0 / 55%);\n  color: var(--atv-text-primary);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  scrollbar-width: none;\n  text-align: center;\n}\n\n.atv-login-modal-inner::-webkit-scrollbar {\n  display: none;\n}\n\n.atv-modal-close.atv-login-modal-close {\n  position: absolute;\n  z-index: 2;\n  top: 12px;\n  right: 12px;\n  width: 32px;\n  height: 32px;\n  border-color: rgb(255 255 255 / 10%);\n  background: rgb(255 255 255 / 6%);\n  color: rgb(255 255 255 / 60%);\n}\n\n.atv-modal-close.atv-login-modal-close:hover {\n  border-color: rgb(255 255 255 / 20%);\n  background: rgb(255 255 255 / 12%);\n  color: #fff;\n}\n\n.atv-login-modal-title {\n  margin: 0 42px 6px;\n  color: var(--atv-text-primary);\n  font-size: 18px;\n  font-weight: 650;\n  line-height: 1.35;\n  text-wrap: balance;\n}\n\n.atv-login-modal-desc {\n  max-width: 300px;\n  margin: 0 auto 14px;\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  line-height: 1.55;\n  text-wrap: pretty;\n}\n\n.atv-login-modal-status {\n  min-height: 20px;\n  margin: 8px 0 0;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.atv-login-modal-status[hidden] {\n  display: none;\n}\n\n.atv-login-modal-native {\n  position: relative;\n  overflow: hidden;\n  width: 100%;\n  box-sizing: border-box;\n  padding: 10px;\n  border-radius: 16px;\n  margin-top: 10px;\n}\n\n.atv-login-modal-native::before {\n  position: absolute;\n  z-index: 2;\n  border-radius: 10px;\n  background: rgb(255 255 255 / 3.5%);\n  content: \"\";\n  inset: 10px;\n  opacity: 1;\n  pointer-events: none;\n  transition: opacity 200ms ease;\n}\n\n.atv-login-modal-native:empty {\n  min-height: 360px;\n}\n\n.atv-login-modal-native[aria-busy=\"true\"] {\n  min-height: 360px;\n}\n\n.atv-login-modal-native.is-ready::before {\n  opacity: 0;\n}\n\n.atv-login-modal-native > iframe,\n.atv-login-modal-iframe {\n  position: relative;\n  z-index: 1;\n  display: block !important;\n  overflow: hidden !important;\n  width: 340px !important;\n  max-width: 100% !important;\n  height: 448px !important;\n  max-height: calc(100vh - 168px) !important;\n  box-sizing: border-box !important;\n  border: 0 !important;\n  border-radius: 10px !important;\n  margin: 0 auto !important;\n  background: #fff !important;\n  box-shadow: none !important;\n\n  /* Cross-origin iframe dark-mode override (first-principles):\n     invert(0.89) maps white #fff → #1c1c1c, which matches\n     --atv-bg-secondary: #1c1c1e within 2 RGB points — no more\n     pure-black void. Text #333 → #bbb, borders #e0 → #343434.\n     hue-rotate(180deg) counter-rotates the color shift from\n     invert so green stays green-ish and blue stays blue-ish.\n     invert(0.89) is the precise value calculated to hit the\n     existing modal surface color while keeping text readable. */\n  filter: invert(0.89) hue-rotate(180deg) !important;\n  opacity: 0;\n  transition: opacity 200ms ease;\n}\n\n.atv-login-modal-native.is-ready > iframe {\n  opacity: 1;\n}\n\n.atv-login-modal-close:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 3px;\n}\n\n/* ---------- Interest Modal ---------- */\n\n.atv-interest-modal {\n  position: fixed;\n  z-index: 10000;\n  display: flex;\n  width: 100vw;\n  height: 100vh;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  border: none;\n  margin: 0;\n  background: rgb(0 0 0 / 72%);\n  inset: 0;\n}\n\n.atv-interest-modal-inner {\n  position: relative;\n  width: 100%;\n  max-width: 380px;\n  max-height: 90vh;\n  border: 1px solid rgb(255 255 255 / 10%);\n  border-radius: 20px;\n  background: var(--atv-bg-secondary);\n  box-shadow: 0 24px 80px rgb(0 0 0 / 55%);\n  overflow-y: auto;\n}\n\n.atv-interest-modal-header {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px 48px 0;\n}\n\n.atv-interest-modal-header-title {\n  color: var(--atv-text-primary);\n  font-size: 16px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n}\n\n.atv-modal-close.atv-interest-modal-close {\n  position: absolute;\n  z-index: 2;\n  top: 14px;\n  right: 14px;\n  width: 32px;\n  height: 32px;\n  border-color: rgb(255 255 255 / 10%);\n  background: rgb(255 255 255 / 6%);\n  color: rgb(255 255 255 / 60%);\n}\n\n.atv-modal-close.atv-interest-modal-close:hover {\n  border-color: rgb(255 255 255 / 20%);\n  background: rgb(255 255 255 / 12%);\n  color: #fff;\n}\n\n.atv-modal-close.atv-interest-modal-close:active {\n  border-color: rgb(255 255 255 / 30%);\n  background: rgb(255 255 255 / 16%);\n}\n\n.atv-interest-modal-body {\n  padding: 16px 20px 20px;\n}\n\n.atv-interest-modal-statuses {\n  position: relative;\n  display: grid;\n  padding: 3px;\n  border-radius: 999px;\n  margin-bottom: 20px;\n  background: rgb(255 255 255 / 6%);\n  gap: 0;\n  grid-template-columns: repeat(var(--atv-interest-status-count), 1fr);\n}\n\n.atv-interest-modal-status-indicator {\n  position: absolute;\n  top: 3px;\n  bottom: 3px;\n  left: 3px;\n  width: calc((100% - 6px) / var(--atv-interest-status-count));\n  border-radius: 999px;\n  background: rgb(255 255 255 / 12%);\n  pointer-events: none;\n  transform: translateX(calc(var(--atv-interest-status-index) * 100%));\n  transition: transform 200ms var(--atv-ease-in-out);\n}\n\n.atv-interest-modal-status {\n  position: relative;\n  z-index: 1;\n  display: inline-flex;\n  height: 36px;\n  flex: 1;\n  align-items: center;\n  justify-content: center;\n  padding: 0 12px;\n  border: none;\n  border-radius: 999px;\n  appearance: none;\n  background: transparent;\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  -webkit-tap-highlight-color: transparent;\n  transition: color 200ms ease;\n}\n\n.atv-interest-modal-status:hover {\n  color: var(--atv-text-secondary);\n}\n\n.atv-interest-modal-status.is-active {\n  color: #fff;\n}\n\n.atv-interest-modal-stars {\n  display: flex;\n  justify-content: center;\n  margin-bottom: 24px;\n  gap: 6px;\n}\n\n.atv-interest-modal-star {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  border: none;\n  appearance: none;\n  background: none;\n  color: rgb(255 255 255 / 20%);\n  cursor: pointer;\n  transition:\n    color 200ms ease,\n    transform 200ms ease;\n}\n\n.atv-interest-modal-star.is-full {\n  color: var(--atv-rating-gold);\n}\n\n.atv-interest-modal-star svg {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.atv-interest-modal-comment {\n  display: block;\n  width: 100%;\n  min-height: 64px;\n  box-sizing: border-box;\n  padding: 10px 14px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 10px;\n  margin-bottom: 16px;\n  background: rgb(255 255 255 / 4%);\n  color: var(--atv-text-primary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 1.5;\n  resize: vertical;\n  -webkit-tap-highlight-color: transparent;\n  transition:\n    border-color 200ms ease,\n    background 200ms ease;\n}\n\n.atv-interest-modal-comment::placeholder {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-interest-modal-comment:focus {\n  border-color: rgb(255 255 255 / 20%);\n  background: rgb(255 255 255 / 6%);\n  outline: none;\n}\n\n.atv-interest-modal-submit {\n  display: flex;\n  width: 100%;\n  height: 44px;\n  align-items: center;\n  justify-content: center;\n  padding: 0 24px;\n  border: none;\n  border-radius: 999px;\n  margin-bottom: 10px;\n  appearance: none;\n  background: var(--atv-accent);\n  color: #fff;\n  cursor: pointer;\n  font: inherit;\n  font-size: 14px;\n  -webkit-font-smoothing: antialiased;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  -webkit-tap-highlight-color: transparent;\n  transition:\n    background 200ms ease,\n    transform var(--atv-duration-press) var(--atv-ease-out);\n}\n\n.atv-interest-modal-submit:hover {\n  background: var(--atv-accent-bright);\n}\n\n.atv-interest-modal-submit:active {\n  transform: scale(0.97);\n}\n\n.atv-interest-modal-submit:disabled {\n  cursor: not-allowed;\n  opacity: 0.5;\n}\n\n.atv-interest-modal-remove {\n  display: flex;\n  width: 100%;\n  height: 36px;\n  align-items: center;\n  justify-content: center;\n  padding: 0 24px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 999px;\n  margin-bottom: 4px;\n  appearance: none;\n  background: transparent;\n  color: var(--atv-text-tertiary);\n  cursor: pointer;\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  -webkit-tap-highlight-color: transparent;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n}\n\n.atv-interest-modal-remove:hover {\n  border-color: rgb(255 255 255 / 15%);\n  background: rgb(255 255 255 / 4%);\n  color: var(--atv-text-secondary);\n}\n\n.atv-interest-modal-remove:active {\n  background: rgb(255 255 255 / 8%);\n}\n\n.atv-interest-modal-error {\n  border-radius: 10px;\n  color: #ff453a;\n  font-size: 12px;\n  font-weight: 500;\n  text-align: center;\n}\n\n.atv-interest-modal-error:empty {\n  display: none;\n}\n\n.atv-interest-modal-error:not(:empty) {\n  padding: 8px 16px;\n  margin-top: 8px;\n  background: rgb(255 69 58 / 8%);\n}\n\n/* ---------- Interest Panel (S3 marked state) ---------- */\n\n.atv-interest-panel {\n  display: flex;\n  width: 100%;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.atv-interest-panel-header {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 12px;\n}\n\n.atv-interest-badge {\n  cursor: pointer;\n}\n\n.atv-interest-panel-stars {\n  display: inline-flex;\n  align-items: center;\n  gap: 2px;\n}\n\n.atv-interest-panel-stars svg {\n  display: block;\n  width: 18px;\n  height: 18px;\n}\n\n.atv-interest-panel-date {\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  letter-spacing: 0.02em;\n}\n\n.atv-interest-panel-comment {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  padding: 6px 0 2px;\n  color: var(--atv-text-secondary);\n  font-size: 14px;\n  font-style: italic;\n  gap: 8px;\n  line-height: 1.6;\n}\n\n.atv-useful-badge {\n  display: inline-flex;\n  align-items: center;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  font-style: normal;\n  gap: 3px;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n\n/* ---------- Trailer Tile ---------- */\n\n.atv-trailer-tile {\n  position: relative;\n  overflow: hidden;\n  flex: 0 0 400px;\n  border-radius: var(--atv-radius-md);\n  aspect-ratio: 16 / 9;\n  background: var(--atv-bg-tertiary);\n  background-position: center;\n  background-size: cover;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform var(--atv-duration-hover) var(--atv-ease-out);\n}\n\n.atv-trailer-play-overlay {\n  position: absolute;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgb(0 0 0 / 12%);\n  inset: 0;\n}\n\n.atv-trailer-play-btn {\n  display: flex;\n  width: 56px;\n  height: 56px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  background: rgb(0 0 0 / 60%);\n}\n\n.atv-trailer-play-btn svg {\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin-left: 3px;\n  color: #fff;\n}\n\n.atv-trailer-label {\n  position: absolute;\n  bottom: 12px;\n  left: 12px;\n  padding: 4px 10px;\n  border-radius: 6px;\n  backdrop-filter: blur(4px);\n  background: rgb(0 0 0 / 60%);\n  color: #fff;\n  font-size: 12px;\n  font-weight: 500;\n}\n\n@media (hover: hover) and (pointer: fine) {\n  .atv-trailer-tile:hover {\n    transform: scale(1.02);\n  }\n}\n\n/* ---------- Video Modal ---------- */\n\n.atv-modal-overlay.is-video {\n  backdrop-filter: none;\n  background: #000;\n}\n\n.atv-modal-video {\n  display: block;\n  max-width: 95vw;\n  max-height: 90vh;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgb(0 0 0 / 75%);\n}\n\n/* ---------- Reviews ---------- */\n\n.atv-reviews {\n  display: grid;\n  gap: 20px;\n  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));\n}\n\n.atv-review-card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  padding: 22px;\n  border: 1px solid rgb(255 255 255 / 6%);\n  border-radius: var(--atv-radius-md);\n  appearance: none;\n  background: #121214;\n  color: inherit;\n  cursor: pointer;\n  font: inherit;\n  -webkit-tap-highlight-color: transparent;\n  text-align: left;\n  touch-action: manipulation;\n  transition:\n    transform var(--atv-duration-hover) var(--atv-ease-out),\n    border-color var(--atv-duration-hover) ease;\n}\n\n.atv-review-open-button {\n  position: absolute;\n  z-index: 0;\n  padding: 0;\n  border: 0;\n  border-radius: var(--atv-radius-md);\n  appearance: none;\n  background: transparent;\n  cursor: pointer;\n  inset: 0;\n}\n\n.atv-review-content {\n  position: relative;\n  z-index: 1;\n  display: contents;\n}\n\n.atv-review-card:active {\n  box-shadow: none;\n  transform: translateY(0);\n}\n\n.atv-review-card:focus-visible {\n  border-color: rgb(65 190 93 / 45%);\n  box-shadow: 0 0 0 5px rgb(65 190 93 / 12%);\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 4px;\n}\n\n.atv-review-open-button:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 4px;\n}\n\n.atv-review-top {\n  display: flex;\n  align-items: center;\n  margin-bottom: 12px;\n  gap: 10px;\n  pointer-events: none;\n}\n\n.atv-review-avatar {\n  display: flex;\n  width: 36px;\n  height: 36px;\n  flex-shrink: 0;\n  align-items: center;\n  justify-content: center;\n  border: 1.5px solid rgb(255 255 255 / 6%);\n  border-radius: 50%;\n  background: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  color: #fff;\n  font-size: 14px;\n  font-weight: 600;\n}\n\n.atv-review-meta {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 3px;\n  pointer-events: none;\n}\n\n.atv-review-author {\n  position: relative;\n  z-index: 2;\n  overflow: hidden;\n  color: var(--atv-text-primary);\n  font-size: 14px;\n  font-weight: 600;\n  pointer-events: auto;\n  text-decoration: none;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.atv-review-author:hover {\n  color: var(--atv-accent);\n}\n\n.atv-review-stars {\n  display: inline-flex;\n  align-items: center;\n  color: var(--atv-rating-gold);\n  gap: 2px;\n}\n\n.atv-review-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-review-title {\n  display: -webkit-box;\n  overflow: hidden;\n  margin-bottom: 8px;\n  -webkit-box-orient: vertical;\n  color: #f0f0f0;\n  font-size: 16px;\n  font-weight: 600;\n  letter-spacing: -0.01em;\n  -webkit-line-clamp: 2;\n  line-height: 1.35;\n  pointer-events: none;\n}\n\n.atv-review-excerpt {\n  display: -webkit-box;\n  overflow: hidden;\n  flex: 1;\n  margin-bottom: 14px;\n  -webkit-box-orient: vertical;\n  color: rgb(255 255 255 / 72%);\n  font-size: 14px;\n  -webkit-line-clamp: 4;\n  line-height: 1.7;\n  pointer-events: none;\n}\n\n.atv-review-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding-top: 14px;\n  border-top: 1px solid rgb(255 255 255 / 5%);\n  gap: 8px;\n  pointer-events: none;\n}\n\n.atv-review-time {\n  color: rgb(255 255 255 / 35%);\n  font-size: 12px;\n  font-weight: 400;\n  letter-spacing: 0.02em;\n}\n\n.atv-review-readmore {\n  color: var(--atv-accent);\n  font-size: 11px;\n  font-weight: 500;\n  letter-spacing: 0.04em;\n  opacity: 0;\n  pointer-events: none;\n  transform: translateX(-3px);\n  transition:\n    opacity 300ms ease,\n    transform 300ms ease;\n}\n\n.atv-review-card:focus-visible .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-card:has(.atv-review-open-button:focus-visible) {\n  border-color: rgb(65 190 93 / 45%);\n  box-shadow: 0 0 0 5px rgb(65 190 93 / 12%);\n}\n\n.atv-review-card:has(.atv-review-open-button:focus-visible)\n  .atv-review-readmore {\n  opacity: 0.7;\n  transform: translateX(0);\n}\n\n.atv-review-actions {\n  position: relative;\n  z-index: 2;\n  display: flex;\n  margin-left: auto;\n  gap: 6px;\n  pointer-events: auto;\n}\n\n.atv-vote-btn {\n  display: inline-flex;\n  align-items: center;\n  padding: 5px 12px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 100px;\n  appearance: none;\n  background: rgb(255 255 255 / 3%);\n  color: rgb(255 255 255 / 55%);\n  cursor: pointer;\n  font: inherit;\n  font-size: 12px;\n  font-weight: 500;\n  gap: 5px;\n  line-height: 1;\n  transition:\n    color 250ms ease,\n    background 250ms ease,\n    border-color 250ms ease,\n    transform var(--atv-duration-press) var(--atv-ease-out);\n  white-space: nowrap;\n}\n\n.atv-vote-btn:hover {\n  border-color: var(--atv-accent);\n  background: rgb(65 190 93 / 6%);\n  color: var(--atv-accent);\n}\n\n.atv-vote-btn:focus-visible {\n  outline: 2px solid rgb(65 190 93 / 75%);\n  outline-offset: 3px;\n}\n\n.atv-vote-btn:active {\n  transform: scale(0.97);\n}\n\n.atv-vote-btn.is-lg {\n  padding: 8px 20px;\n  font-size: 14px;\n}\n\n.atv-vote-btn svg {\n  display: block;\n  width: 11px;\n  height: 11px;\n  transform-box: fill-box;\n  transform-origin: center;\n}\n\n.atv-vote-btn.down:hover {\n  border-color: #ff453a;\n  background: rgb(255 69 58 / 6%);\n  color: #ff453a;\n}\n\n.atv-vote-btn.down svg {\n  transform: rotate(180deg);\n}\n\n.atv-vote-btn.is-voted {\n  border-color: rgb(65 190 93 / 20%);\n  background: rgb(65 190 93 / 6%);\n  color: var(--atv-accent);\n  cursor: default;\n}\n\n.atv-vote-btn.down.is-voted {\n  border-color: rgb(255 69 58 / 22%);\n  background: rgb(255 69 58 / 6%);\n  color: #ff453a;\n}\n\n/* ---------- Review Modal ---------- */\n\n.atv-review-modal {\n  position: fixed;\n  z-index: 10000;\n  display: flex;\n  width: 100vw;\n  height: 100vh;\n  align-items: center;\n  justify-content: center;\n  padding: 48px;\n  border: none;\n  margin: 0;\n  background: rgb(0 0 0 / 72%);\n  inset: 0;\n}\n\n.atv-review-modal .atv-modal-close {\n  position: absolute;\n  z-index: 2;\n  top: 16px;\n  right: 16px;\n  width: 32px;\n  height: 32px;\n  border-color: rgb(255 255 255 / 10%);\n  background: rgb(255 255 255 / 6%);\n  color: rgb(255 255 255 / 60%);\n}\n\n.atv-review-modal .atv-modal-close:hover {\n  border-color: rgb(255 255 255 / 20%);\n  background: rgb(255 255 255 / 12%);\n  color: #fff;\n}\n\n.atv-review-modal-scroll {\n  position: relative;\n  width: 100%;\n  max-width: 800px;\n  max-height: 85vh;\n  padding: 48px 56px 32px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: var(--atv-radius-lg);\n  background: #121214;\n  box-shadow: 0 24px 80px rgb(0 0 0 / 55%);\n  overflow-y: auto;\n  scrollbar-color: rgb(255 255 255 / 12%) transparent;\n  scrollbar-width: thin;\n}\n\n.atv-review-modal-header {\n  padding-bottom: 14px;\n  border-bottom: 1px solid rgb(255 255 255 / 5%);\n  margin-bottom: 16px;\n}\n\n.atv-review-modal-title {\n  margin-bottom: 4px;\n  color: #f0f0f0;\n  font-size: 24px;\n  font-weight: 600;\n  letter-spacing: -0.01em;\n  line-height: 1.32;\n}\n\n.atv-review-modal-title:focus {\n  outline: none;\n}\n\n.atv-review-modal-byline {\n  display: flex;\n  align-items: center;\n  margin-top: 4px;\n  gap: 10px;\n}\n\n.atv-review-modal-avatar {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  flex-shrink: 0;\n  align-items: center;\n  justify-content: center;\n  border: 1.5px solid rgb(255 255 255 / 6%);\n  border-radius: 50%;\n  background: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  color: #fff;\n  font-size: 12px;\n  font-weight: 600;\n}\n\n.atv-review-modal-byline-text {\n  display: flex;\n  align-items: center;\n  font-size: 13px;\n  gap: 4px;\n  line-height: 1;\n}\n\n.atv-review-modal-byline-name {\n  color: var(--atv-text-secondary);\n}\n\n.atv-review-modal-byline-time {\n  color: var(--atv-text-tertiary);\n}\n\n.atv-review-modal-body {\n  color: rgb(255 255 255 / 82%);\n  font-size: 16px;\n  line-height: 1.85;\n}\n\n.atv-review-modal-body h2 {\n  margin-bottom: 16px;\n  color: #f0f0f0;\n  font-size: 20px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.atv-review-modal-body h2 a {\n  background: transparent;\n  color: inherit;\n  text-decoration: none;\n}\n\n.atv-review-modal-body h2 a:hover {\n  background: transparent;\n  color: var(--atv-accent);\n}\n\n.atv-review-modal-body p {\n  margin-bottom: 16px;\n}\n\n.atv-review-modal-body blockquote {\n  padding: 16px 20px;\n  border-radius: 0 var(--atv-radius-sm) var(--atv-radius-sm) 0;\n  border-left: 3px solid var(--atv-accent);\n  margin: 20px 0;\n  background: rgb(255 255 255 / 3%);\n  color: rgb(255 255 255 / 82%);\n}\n\n.atv-review-modal-body blockquote p {\n  margin-bottom: 8px;\n}\n\n.atv-review-modal-body blockquote p:last-child {\n  margin-bottom: 0;\n}\n\n.atv-review-modal-body blockquote cite,\n.atv-review-modal-body blockquote footer {\n  display: block;\n  margin-top: 8px;\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  font-style: normal;\n  font-weight: 500;\n}\n\n.atv-review-modal-body blockquote cite::before,\n.atv-review-modal-body blockquote footer::before {\n  content: \"\\2014\\00a0\";\n}\n\n.atv-review-modal-body blockquote blockquote {\n  border-left-color: rgb(255 255 255 / 20%);\n  margin-left: 0;\n  background: rgb(255 255 255 / 6%);\n}\n\n/* ---------- Group discussions ---------- */\n\n.atv-discussion-board {\n  overflow: hidden;\n  border: 1px solid rgb(255 255 255 / 7%);\n  border-radius: var(--atv-radius-lg);\n  background: #121214;\n}\n\n.atv-discussion-row {\n  position: relative;\n  display: grid;\n  overflow: hidden;\n  min-height: 66px;\n  align-items: center;\n  padding: 16px 22px;\n  border-bottom: 1px solid rgb(255 255 255 / 6%);\n  gap: 3px 24px;\n  grid-template-columns: minmax(0, 1fr) minmax(106px, max-content) 17px;\n  grid-template-rows: auto auto;\n  isolation: isolate;\n}\n\n.atv-discussion-row:last-child {\n  border-bottom: 0;\n}\n\n.atv-discussion-row::before {\n  position: absolute;\n  top: 14px;\n  bottom: 14px;\n  left: 0;\n  width: 3px;\n  border-radius: 0 3px 3px 0;\n  background: var(--atv-accent);\n  content: \"\";\n  opacity: 0;\n  transform: scaleY(0.35);\n  transition:\n    opacity 180ms ease,\n    transform 220ms var(--atv-ease-out);\n}\n\n.atv-discussion-topic-link {\n  position: absolute;\n  z-index: 1;\n  border-radius: inherit;\n  inset: 0;\n}\n\n.atv-discussion-topic-link:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: -3px;\n}\n\n.atv-discussion-title {\n  position: relative;\n  z-index: 2;\n  overflow: hidden;\n  margin: 0;\n  color: rgb(255 255 255 / 90%);\n  font-size: 16px;\n  font-weight: 600;\n  grid-column: 1;\n  grid-row: 1;\n  letter-spacing: -0.01em;\n  line-height: 1.45;\n  pointer-events: none;\n  text-overflow: ellipsis;\n  transition: color 180ms ease;\n  white-space: nowrap;\n}\n\n.atv-discussion-copy {\n  display: contents;\n  pointer-events: none;\n}\n\n.atv-discussion-meta {\n  display: contents;\n}\n\n.atv-discussion-author {\n  position: relative;\n  z-index: 2;\n  display: block;\n  overflow: hidden;\n  width: fit-content;\n  max-width: 100%;\n  margin-top: 4px;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  grid-column: 1;\n  grid-row: 2;\n  line-height: 1.35;\n  pointer-events: auto;\n  text-decoration: none;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\na.atv-discussion-author:hover {\n  text-decoration: underline;\n}\n\na.atv-discussion-author:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: 2px;\n  text-decoration: underline;\n}\n\n.atv-discussion-activity {\n  position: relative;\n  z-index: 2;\n  display: grid;\n  min-width: 106px;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  gap: 3px;\n  grid-column: 2;\n  grid-row: 1 / span 2;\n  line-height: 1.35;\n  pointer-events: none;\n  text-align: right;\n  transition: color 180ms ease;\n}\n\n.atv-discussion-time {\n  display: grid;\n  font-variant-numeric: tabular-nums;\n  gap: 1px;\n  white-space: nowrap;\n}\n\n.atv-discussion-footer {\n  margin-top: 14px;\n  text-align: right;\n}\n\n.atv-discussion-footer a {\n  color: var(--atv-text-secondary);\n  font-size: 13px;\n  text-decoration: none;\n  transition: color 180ms ease;\n}\n\n.atv-discussion-footer a:hover,\n.atv-discussion-footer a:focus-visible {\n  color: var(--atv-accent-bright);\n  text-decoration: underline;\n}\n\n.atv-discussion-footer a:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: 3px;\n}\n\n.atv-discussion-arrow {\n  position: relative;\n  z-index: 2;\n  color: var(--atv-accent-bright);\n  font-size: 17px;\n  grid-column: 3;\n  grid-row: 1 / span 2;\n  opacity: 0.35;\n  pointer-events: none;\n  transform: translate(-3px, 3px);\n  transition:\n    opacity 180ms ease,\n    transform 220ms var(--atv-ease-out);\n}\n\n.atv-discussion-row:has(.atv-discussion-topic-link:focus-visible)::before,\n.atv-discussion-row:has(.atv-discussion-author:focus-visible)::before {\n  opacity: 1;\n  transform: scaleY(1);\n}\n\n.atv-discussion-row:hover .atv-discussion-title,\n.atv-discussion-row:has(.atv-discussion-topic-link:focus-visible)\n  .atv-discussion-title,\n.atv-discussion-row:has(.atv-discussion-author:focus-visible)\n  .atv-discussion-title {\n  color: #fff;\n}\n\n.atv-discussion-row:hover .atv-discussion-activity,\n.atv-discussion-row:has(.atv-discussion-topic-link:focus-visible)\n  .atv-discussion-activity,\n.atv-discussion-row:has(.atv-discussion-author:focus-visible)\n  .atv-discussion-activity {\n  color: var(--atv-accent-bright);\n}\n\n.atv-discussion-row:has(.atv-discussion-topic-link:focus-visible)\n  .atv-discussion-arrow,\n.atv-discussion-row:has(.atv-discussion-author:focus-visible)\n  .atv-discussion-arrow {\n  opacity: 1;\n  transform: none;\n}\n\n@media (width <= 768px) {\n  .atv-discussion-row {\n    min-height: 0;\n    align-items: start;\n    padding: 14px 16px;\n    gap: 6px 14px;\n    grid-template-columns: minmax(0, 1fr) 17px;\n    grid-template-rows: auto;\n  }\n\n  .atv-discussion-copy {\n    position: relative;\n    z-index: 2;\n    display: block;\n    min-width: 0;\n    grid-column: 1;\n    pointer-events: none;\n  }\n\n  .atv-discussion-title {\n    overflow-wrap: anywhere;\n    text-overflow: clip;\n    white-space: normal;\n  }\n\n  .atv-discussion-meta {\n    display: flex;\n    min-width: 0;\n    flex-wrap: wrap;\n    align-items: center;\n    margin-top: 6px;\n    color: var(--atv-text-tertiary);\n    font-size: 12px;\n    gap: 8px;\n    line-height: 1.35;\n  }\n\n  .atv-discussion-author {\n    min-width: 0;\n    max-width: 100%;\n    flex: 0 1 auto;\n    margin-top: 0;\n  }\n\n  .atv-discussion-activity {\n    display: flex;\n    min-width: 0;\n    align-items: center;\n    color: inherit;\n    font-size: inherit;\n    gap: 8px;\n    line-height: inherit;\n    text-align: left;\n  }\n\n  .atv-discussion-author + .atv-discussion-activity::before {\n    width: 1px;\n    height: 1em;\n    background: rgb(255 255 255 / 18%);\n    content: \"\";\n  }\n\n  .atv-discussion-time {\n    display: inline-flex;\n    gap: 3px;\n  }\n\n  .atv-discussion-arrow {\n    align-self: center;\n    grid-column: 2;\n    grid-row: 1;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-discussion-row::before,\n  .atv-discussion-title,\n  .atv-discussion-activity,\n  .atv-discussion-arrow,\n  .atv-discussion-footer a {\n    transition: none;\n  }\n\n  .atv-discussion-row::before,\n  .atv-discussion-arrow {\n    transform: none;\n  }\n}\n\n/* ── Review content images (Douban image-container) ── */\n\n.atv-review-modal-body .image-container {\n  margin: 24px 0;\n  clear: both;\n}\n\n.atv-review-modal-body .image-container.image-float-left {\n  max-width: 50%;\n  margin: 8px 24px 8px 0;\n  float: left;\n}\n\n.atv-review-modal-body .image-container.image-float-right {\n  max-width: 50%;\n  margin: 8px 0 8px 24px;\n  float: right;\n}\n\n.atv-review-modal-body .image-wrapper {\n  overflow: hidden;\n  border-radius: var(--atv-radius-sm);\n  line-height: 0;\n}\n\n.atv-review-modal-body .image-wrapper img {\n  display: block;\n  width: auto;\n  max-width: 100%;\n  height: auto;\n  margin: 0 auto;\n}\n\n.atv-review-modal-body .image-caption-wrapper {\n  margin-top: 8px;\n  text-align: center;\n}\n\n.atv-review-modal-body .image-caption {\n  display: inline-block;\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  font-style: italic;\n  font-weight: 400;\n  letter-spacing: 0.02em;\n  line-height: 1.6;\n}\n\n/* ── Review content subject reference (Douban subject-container) ── */\n\n.atv-review-modal-body .subject-container {\n  overflow: hidden;\n  padding-left: 2px;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: var(--atv-radius-md);\n  border-left: 2px solid var(--atv-accent);\n  margin: 24px 0;\n  background: linear-gradient(\n    105deg,\n    rgb(65 190 93 / 7%),\n    rgb(18 18 20 / 94%) 42%\n  );\n}\n\n.atv-review-modal-body .subject-wrapper > a,\n.atv-review-modal-body .subject-wrapper > a:link,\n.atv-review-modal-body .subject-wrapper > a:visited {\n  display: grid;\n  padding: 12px;\n  border-bottom: 0;\n  background: transparent;\n  color: inherit;\n  gap: 12px;\n  grid-template-columns: 56px minmax(0, 1fr);\n  text-decoration: none;\n  transition: none;\n}\n\n.atv-review-modal-body .subject-wrapper > a:hover,\n.atv-review-modal-body .subject-wrapper > a:active {\n  border-bottom: 0;\n  background: rgb(255 255 255 / 3%);\n  color: inherit;\n}\n\n.atv-review-modal-body .subject-wrapper > a:focus-visible {\n  outline: 2px solid var(--atv-accent-bright);\n  outline-offset: -2px;\n}\n\n.atv-review-modal-body .subject-cover {\n  overflow: hidden;\n  width: 56px;\n  height: 84px;\n  border-radius: 5px;\n  background: var(--atv-bg-tertiary);\n  box-shadow: 0 8px 20px rgb(0 0 0 / 30%);\n}\n\n.atv-review-modal-body .subject-cover img {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.atv-review-modal-body .subject-info {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  justify-content: center;\n}\n\n.atv-review-modal-body .subject-title {\n  display: flex;\n  min-width: 0;\n  flex-wrap: wrap;\n  align-items: baseline;\n  color: var(--atv-text-primary);\n  font-size: 16px;\n  font-weight: 650;\n  gap: 4px;\n  letter-spacing: 0.01em;\n  line-height: 1.35;\n}\n\n.atv-review-modal-body .title-tail {\n  color: var(--atv-text-tertiary);\n  font-size: 13px;\n  font-weight: 500;\n}\n\n.atv-review-modal-body .subject-rating {\n  display: flex;\n  align-items: center;\n  margin-top: 7px;\n  gap: 1px;\n  line-height: 1;\n}\n\n.atv-review-modal-body .rating-star1::before,\n.atv-review-modal-body .rating-star2::before,\n.atv-review-modal-body .rating-star0::before {\n  content: \"★\";\n  font-size: 13px;\n}\n\n.atv-review-modal-body .rating-star1::before {\n  color: var(--atv-rating-gold);\n}\n\n.atv-review-modal-body .rating-star2::before {\n  background: linear-gradient(\n    90deg,\n    var(--atv-rating-gold) 50%,\n    rgb(255 255 255 / 18%) 50%\n  );\n  -webkit-background-clip: text;\n  background-clip: text;\n  color: transparent;\n}\n\n.atv-review-modal-body .rating-star0::before {\n  color: rgb(255 255 255 / 18%);\n}\n\n.atv-review-modal-body .rating-score {\n  margin-left: 6px;\n  color: var(--atv-text-secondary);\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n  font-weight: 600;\n}\n\n.atv-review-modal-body .subject-summary {\n  margin-top: 7px;\n  color: var(--atv-text-tertiary);\n  font-size: 12px;\n  line-height: 1.55;\n}\n\n.atv-review-modal-body .subject-caption-wrapper {\n  padding: 0 12px 12px 80px;\n}\n\n.atv-review-modal-body .subject-caption {\n  color: var(--atv-text-secondary);\n  font-size: 12px;\n  font-style: italic;\n  line-height: 1.55;\n}\n\n/* ── Review content links (Douban a.link / generic) ── */\n\n.atv-review-modal-body a:link,\n.atv-review-modal-body a:visited {\n  border-bottom: 1px solid rgb(65 190 93 / 25%);\n  background: transparent;\n  color: var(--atv-accent);\n  overflow-wrap: break-word;\n  text-decoration: none;\n  transition:\n    border-color 200ms ease,\n    color 200ms ease;\n}\n\n.atv-review-modal-body a:hover,\n.atv-review-modal-body a:active {\n  border-bottom-color: var(--atv-accent-bright);\n  background: transparent;\n  color: var(--atv-accent-bright);\n}\n\n/* ============================================\n   7. Review Content Typography — All Elements\n      Target ALL HTML tags that may appear inside\n      Douban review rich-text content.\n   ============================================ */\n\n/* --- Headings --- */\n\n.atv-review-modal-body h3 {\n  margin: 28px 0 12px;\n  color: var(--atv-text-primary);\n  font-size: 18px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.atv-review-modal-body h4 {\n  margin: 24px 0 10px;\n  color: var(--atv-text-primary);\n  font-size: 16px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n.atv-review-modal-body h5,\n.atv-review-modal-body h6 {\n  margin: 20px 0 8px;\n  color: var(--atv-text-secondary);\n  font-size: 14px;\n  font-weight: 600;\n  line-height: 1.4;\n}\n\n/* --- Horizontal Rule --- */\n\n.atv-review-modal-body hr {\n  height: 0;\n  border: none;\n  border-top: 1px solid var(--atv-border-subtle);\n  margin: 28px 0;\n}\n\n/* --- Lists --- */\n\n.atv-review-modal-body ul,\n.atv-review-modal-body ol {\n  padding-left: 24px;\n  margin: 0 0 16px;\n  line-height: 1.7;\n}\n\n.atv-review-modal-body ul {\n  list-style: disc;\n}\n\n.atv-review-modal-body ol {\n  list-style: decimal;\n}\n\n.atv-review-modal-body li {\n  margin-bottom: 6px;\n  line-height: 1.7;\n}\n\n.atv-review-modal-body li:last-child {\n  margin-bottom: 0;\n}\n\n/* --- Inline Text Semantics --- */\n\n.atv-review-modal-body strong,\n.atv-review-modal-body b {\n  color: rgb(255 255 255 / 92%);\n  font-weight: 700;\n}\n\n.atv-review-modal-body em,\n.atv-review-modal-body i {\n  font-style: italic;\n}\n\n.atv-review-modal-body small {\n  color: var(--atv-text-tertiary);\n  font-size: 0.85em;\n}\n\n.atv-review-modal-body q {\n  font-style: italic;\n}\n\n.atv-review-modal-body q::before {\n  content: \"\\201C\";\n}\n\n.atv-review-modal-body q::after {\n  content: \"\\201D\";\n}\n\n.atv-review-modal-body u {\n  text-decoration: underline;\n  text-decoration-thickness: 1px;\n  text-underline-offset: 2px;\n}\n\n.atv-review-modal-body s,\n.atv-review-modal-body del {\n  color: var(--atv-text-tertiary);\n  text-decoration: line-through;\n}\n\n.atv-review-modal-body sup {\n  font-size: 0.75em;\n  line-height: 1;\n  vertical-align: super;\n}\n\n.atv-review-modal-body sub {\n  font-size: 0.75em;\n  line-height: 1;\n  vertical-align: sub;\n}\n\n/* --- Code --- */\n\n.atv-review-modal-body code {\n  padding: 2px 6px;\n  border-radius: 4px;\n  background: rgb(255 255 255 / 6%);\n  font-family:\n    \"SF Mono\", Monaco, \"Cascadia Code\", \"JetBrains Mono\", \"Fira Code\", Consolas,\n    monospace;\n  font-size: 0.9em;\n  overflow-wrap: break-word;\n}\n\n.atv-review-modal-body pre {\n  padding: 16px 20px;\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: var(--atv-radius-sm);\n  margin: 0 0 20px;\n  background: rgb(0 0 0 / 40%);\n  line-height: 1.6;\n  -webkit-overflow-scrolling: touch;\n  overflow-x: auto;\n}\n\n.atv-review-modal-body pre code {\n  padding: 0;\n  background: none;\n  font-size: 14px;\n  word-break: normal;\n}\n\n/* --- Tables --- */\n\n.atv-review-modal-body table {\n  width: 100%;\n  margin: 20px 0;\n  border-collapse: collapse;\n  line-height: 1.6;\n}\n\n.atv-review-modal-body thead {\n  border-bottom: 2px solid var(--atv-border-medium);\n}\n\n.atv-review-modal-body th {\n  padding: 10px 14px;\n  color: var(--atv-text-primary);\n  font-weight: 600;\n  text-align: left;\n  white-space: nowrap;\n}\n\n.atv-review-modal-body td {\n  padding: 10px 14px;\n  border-bottom: 1px solid var(--atv-border-subtle);\n  color: rgb(255 255 255 / 82%);\n}\n\n.atv-review-modal-body tbody tr:last-child td {\n  border-bottom: none;\n}\n\n.atv-review-modal-body .review-content,\n.atv-review-modal-body .review-content p,\n.atv-review-modal-body .review-content div,\n.atv-review-modal-body .review-content span {\n  color: rgb(255 255 255 / 82%);\n}\n\n.atv-review-modal-body .spoiler-tip {\n  margin-bottom: 12px;\n  color: #ff9f0a;\n  font-size: 13px;\n  font-weight: 600;\n}\n\n.atv-review-modal-body .main-hd {\n  display: flex;\n  align-items: center;\n  margin-bottom: 16px;\n  gap: 10px;\n}\n\n.atv-review-modal-body .main-hd a.name {\n  color: var(--atv-accent);\n  font-size: 14px;\n  font-weight: 500;\n  text-decoration: none;\n}\n\n.atv-review-modal-body .main-hd a.name:hover {\n  text-decoration: underline;\n}\n\n.atv-review-modal-footer {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding-top: 20px;\n  border-top: 1px solid rgb(255 255 255 / 4%);\n  margin-top: 28px;\n}\n\n.atv-review-modal-votes {\n  display: flex;\n  gap: 14px;\n}\n\n.atv-review-modal-link {\n  display: flex;\n  align-items: center;\n}\n\n#atv-douban-root .atv-review-modal-link-a {\n  background: transparent;\n  color: rgb(255 255 255 / 50%);\n  font-size: 13px;\n  text-decoration: none;\n  transition: color 200ms ease;\n}\n\n#atv-douban-root .atv-review-modal-link-a:link,\n#atv-douban-root .atv-review-modal-link-a:visited {\n  background: transparent;\n  color: rgb(255 255 255 / 50%);\n}\n\n#atv-douban-root .atv-review-modal-link-a:hover,\n#atv-douban-root .atv-review-modal-link-a:active {\n  background: transparent;\n  color: var(--atv-accent);\n}\n\n.atv-review-modal-stars {\n  display: inline-flex;\n  align-items: center;\n  margin: 0 0 4px;\n  color: var(--atv-rating-gold);\n  gap: 2px;\n}\n\n.atv-review-modal-stars svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n\n.atv-review-modal-body.is-skeleton {\n  position: relative;\n  min-height: 140px;\n  color: transparent;\n}\n\n.atv-review-modal-body.is-skeleton::before,\n.atv-review-modal-body.is-skeleton::after {\n  display: block;\n  height: 14px;\n  border-radius: 4px;\n  background: rgb(255 255 255 / 6%);\n  content: \"\";\n}\n\n.atv-review-modal-body.is-skeleton::before {\n  width: 92%;\n  margin-bottom: 14px;\n}\n\n.atv-review-modal-body.is-skeleton::after {\n  width: 68%;\n}\n\n.atv-review-modal-body.is-error {\n  display: flex;\n  min-height: 140px;\n  align-items: center;\n  justify-content: center;\n  color: var(--atv-text-tertiary);\n  text-align: center;\n}\n\n.atv-review-modal-error {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 14px;\n}\n\n.atv-review-modal-error p {\n  margin: 0;\n}\n\n.atv-review-modal-retry {\n  display: inline-flex;\n  min-height: 34px;\n  align-items: center;\n  justify-content: center;\n  padding: 0 18px;\n  border: 1px solid rgb(255 255 255 / 10%);\n  border-radius: 999px;\n  appearance: none;\n  background: rgb(255 255 255 / 4%);\n  color: var(--atv-text-secondary);\n  cursor: pointer;\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  transition:\n    color 200ms ease,\n    border-color 200ms ease,\n    background 200ms ease;\n}\n\n.atv-review-modal-retry:hover,\n.atv-review-modal-retry:focus-visible {\n  border-color: rgb(65 190 93 / 35%);\n  background: rgb(65 190 93 / 8%);\n  color: var(--atv-accent);\n}\n\n.atv-review-modal-retry:focus-visible,\n.atv-review-modal .atv-modal-close:focus-visible,\n#atv-douban-root .atv-review-modal-link-a:focus-visible {\n  outline: 2px solid var(--atv-accent);\n  outline-offset: 3px;\n}\n\n/* ---------- Responsive ---------- */\n\n@media (width <= 1024px) {\n  .atv-hero {\n    min-height: 64vh;\n    padding: 104px 24px 48px;\n  }\n\n  .atv-hero-inner {\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 28px;\n  }\n\n  .atv-poster-card {\n    width: 220px;\n  }\n\n  .atv-section {\n    padding: 44px 24px;\n  }\n\n  .atv-info-grid {\n    column-gap: 24px;\n    grid-template-columns: 160px 1fr;\n  }\n}\n\n@media (width <= 768px) {\n  .atv-hero {\n    min-height: 56vh;\n    padding: 88px 20px 40px;\n  }\n\n  .atv-poster-card {\n    width: 180px;\n  }\n\n  .atv-section {\n    padding: 36px 20px;\n  }\n\n  .atv-info-grid {\n    grid-template-columns: 1fr;\n    row-gap: 4px;\n  }\n\n  .atv-info-label {\n    padding-top: 12px;\n  }\n\n  .atv-recs {\n    gap: 18px;\n    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));\n  }\n\n  .atv-cast-card {\n    flex-basis: 120px;\n  }\n\n  .atv-cast-avatar {\n    width: 120px;\n    height: 120px;\n  }\n\n  .atv-series-card {\n    flex-basis: 120px;\n  }\n\n  .atv-photo-tile {\n    flex-basis: 280px;\n  }\n\n  .atv-photo-tile.is-portrait {\n    flex-basis: 170px;\n  }\n\n  .atv-rating-panel .atv-rating-panel-score {\n    font-size: 32px;\n  }\n\n  .atv-rating-panel-douban,\n  .atv-rating-panel-imdb,\n  .atv-rating-panel-rt,\n  .atv-rating-panel-mc {\n    padding: 12px 14px 10px;\n  }\n\n  .atv-rating-panel {\n    min-width: 0;\n  }\n\n  .atv-comments {\n    grid-template-columns: 1fr;\n  }\n\n  .atv-comment-overlay-inner {\n    max-width: 95vw;\n    border-radius: 16px;\n  }\n\n  .atv-comment-overlay-top {\n    padding: 24px 20px 0;\n  }\n\n  .atv-comment-overlay-body {\n    padding: 16px 20px;\n    font-size: 14px;\n  }\n\n  .atv-comment-overlay-foot {\n    padding: 0 20px 24px;\n  }\n\n  .atv-reviews {\n    grid-template-columns: 1fr;\n  }\n\n  .atv-review-modal-scroll {\n    max-width: 100vw;\n    max-height: 92vh;\n    padding: 24px 18px 22px;\n    border-radius: 20px 20px 0 0;\n  }\n\n  .atv-review-modal {\n    align-items: flex-end;\n    padding: 0;\n    overscroll-behavior: contain;\n  }\n\n  .atv-review-modal .atv-modal-close {\n    top: 14px;\n    right: 14px;\n  }\n\n  .atv-review-modal-body blockquote {\n    padding: 12px 14px;\n    margin: 16px 0;\n  }\n\n  .atv-review-modal-body blockquote blockquote {\n    padding: 10px 12px;\n  }\n\n  .atv-review-modal-body .image-container {\n    margin: 16px 0;\n  }\n\n  .atv-review-modal-body .image-container.image-float-left,\n  .atv-review-modal-body .image-container.image-float-right {\n    max-width: 100%;\n    margin: 16px 0;\n    float: none;\n  }\n\n  .atv-review-modal-body .subject-wrapper > a {\n    padding: 10px;\n    gap: 10px;\n    grid-template-columns: 44px minmax(0, 1fr);\n  }\n\n  .atv-review-modal-body .subject-cover {\n    width: 44px;\n    height: 66px;\n  }\n\n  .atv-review-modal-body .subject-title {\n    font-size: 15px;\n  }\n\n  .atv-review-modal-body .subject-caption-wrapper {\n    padding: 0 10px 10px 66px;\n  }\n\n  /* Review content typography — responsive */\n  .atv-review-modal-body h3 {\n    margin-top: 22px;\n  }\n\n  .atv-review-modal-body h4 {\n    margin-top: 18px;\n  }\n\n  .atv-review-modal-body hr {\n    margin: 22px 0;\n  }\n\n  .atv-review-modal-body pre {\n    padding: 12px 16px;\n  }\n\n  .atv-review-modal-body th,\n  .atv-review-modal-body td {\n    padding: 8px 10px;\n  }\n\n  .atv-login-modal {\n    align-items: flex-end;\n    padding: 16px;\n  }\n\n  .atv-login-modal-inner {\n    width: 100%;\n    padding: 28px 20px 20px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-section {\n    animation: none;\n  }\n\n  .atv-trailer-tile,\n  .atv-trailer-tile:hover {\n    filter: none;\n    transform: none;\n  }\n\n  .atv-trailer-play-overlay {\n    transition: none;\n  }\n\n  .atv-trailer-play-btn {\n    transition: none;\n  }\n\n  .atv-trailer-tile:hover .atv-trailer-play-btn {\n    box-shadow: none;\n    transform: none;\n  }\n\n  .atv-modal-overlay.is-open .atv-modal-video {\n    transform: none;\n  }\n\n  .atv-review-card,\n  .atv-review-card:hover,\n  .atv-review-card:active {\n    box-shadow: none;\n    transform: none;\n    transition: none;\n  }\n\n  .atv-review-modal-scroll {\n    transform: none;\n    transition: none;\n  }\n\n  .atv-review-modal.is-open .atv-review-modal-scroll {\n    transform: none;\n  }\n\n  .atv-review-modal {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n    transition: none;\n  }\n\n  /* Modal overlay fades */\n  .atv-modal-overlay,\n  .atv-comment-overlay,\n  .atv-interest-modal,\n  .atv-login-modal {\n    transition: none;\n  }\n\n  .atv-login-modal-inner,\n  .atv-login-modal.is-open .atv-login-modal-inner {\n    transform: none;\n    transition: none;\n  }\n\n  /* Accent edge glow */\n  .atv-modal-accent-bar {\n    transform: scaleX(1);\n    transition: none;\n  }\n}\n\n@media (width <= 768px) {\n  .atv-trailer-tile {\n    flex-basis: 280px;\n  }\n}\n\n/* Cross-experience motion policy: pointer capability and motion preferences. */\n\n@media (hover: hover) and (pointer: fine) {\n  .atv-btn-primary:hover {\n    background: var(--atv-accent-bright);\n    transform: translateY(-1px);\n  }\n\n  .atv-btn-secondary:hover {\n    background: rgb(255 255 255 / 12%);\n    transform: translateY(-1px);\n  }\n\n  .atv-poster-card:hover {\n    transform: scale(1.03);\n  }\n\n  .atv-comment-card:hover {\n    border-color: rgb(255 255 255 / 12%);\n    transform: translateY(-2px);\n  }\n\n  .atv-review-card:hover {\n    border-color: rgb(255 255 255 / 12%);\n    transform: translateY(-2px);\n  }\n\n  .atv-review-card:hover .atv-review-readmore {\n    opacity: 0.7;\n    transform: translateX(0);\n  }\n\n  .atv-stream-card:not(.atv-stream-card-combined):hover::after {\n    opacity: 0.18;\n  }\n\n  .atv-stream-card:hover {\n    border-color: rgb(255 255 255 / 18%);\n    background: rgb(255 255 255 / 9%);\n    transform: translateY(-2px);\n  }\n\n  .atv-interest-modal-star:hover {\n    transform: scale(1.15);\n  }\n\n  .atv-discussion-row:hover::before {\n    opacity: 1;\n    transform: scaleY(1);\n  }\n\n  .atv-discussion-row:hover .atv-discussion-arrow {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n.atv-hero-teaser-content {\n  display: block;\n  animation: atv-summary-content-in 200ms var(--atv-ease-out) both;\n}\n\n.atv-rating-panel-imdb.is-loaded,\n.atv-rating-panel-rt.is-loaded,\n.atv-rating-panel-mc.is-loaded {\n  animation: atv-rating-content-in 200ms var(--atv-ease-out) both;\n}\n\n.atv-rating-panel-imdb,\n.atv-rating-panel-rt,\n.atv-rating-panel-mc {\n  transition:\n    opacity 200ms var(--atv-ease-out),\n    transform 200ms var(--atv-ease-out);\n}\n\n.atv-rating-panel-imdb.is-exiting,\n.atv-rating-panel-rt.is-exiting,\n.atv-rating-panel-mc.is-exiting {\n  opacity: 0;\n  transform: translateY(-4px);\n}\n\n.atv-review-modal-body.is-loaded,\n.atv-review-modal-body.is-error {\n  animation: atv-review-content-in 200ms var(--atv-ease-out) both;\n}\n\n@keyframes atv-summary-content-in {\n  from {\n    opacity: 0;\n    transform: translateY(4px);\n  }\n\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@keyframes atv-rating-content-in {\n  from {\n    opacity: 0;\n    transform: translateY(4px);\n  }\n\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@keyframes atv-review-content-in {\n  from {\n    opacity: 0;\n    transform: translateY(4px);\n  }\n\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@keyframes atv-content-fade {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .atv-carousel {\n    scroll-behavior: auto;\n  }\n\n  .atv-spinner {\n    animation: none;\n  }\n\n  .atv-rating-panel-imdb.is-loaded,\n  .atv-rating-panel-rt.is-loaded,\n  .atv-rating-panel-mc.is-loaded,\n  .atv-review-modal-body.is-loaded,\n  .atv-review-modal-body.is-error,\n  .atv-hero-teaser-content {\n    animation: atv-content-fade 200ms ease both;\n    transform: none;\n  }\n\n  .atv-rating-panel-imdb.is-exiting,\n  .atv-rating-panel-rt.is-exiting,\n  .atv-rating-panel-mc.is-exiting {\n    transform: none;\n  }\n\n  .atv-modal-accent-bar {\n    opacity: 1;\n  }\n\n  .atv-btn-primary:hover,\n  .atv-btn-secondary:hover,\n  .atv-btn:active,\n  .atv-poster-card:hover,\n  .atv-comment-card:hover,\n  .atv-comment-votes:active,\n  .atv-comment-overlay-votes:active,\n  .atv-comment-expand:active,\n  .atv-review-card:hover,\n  .atv-review-card:hover .atv-review-readmore,\n  .atv-review-card:focus-visible .atv-review-readmore,\n  .atv-review-card:has(.atv-review-open-button:focus-visible)\n    .atv-review-readmore,\n  .atv-vote-btn:active,\n  .atv-stream-card:hover,\n  .atv-interest-modal-star:hover,\n  .atv-interest-modal-submit:active,\n  .atv-discussion-row:hover::before,\n  .atv-discussion-row:has(.atv-discussion-topic-link:focus-visible)::before,\n  .atv-discussion-row:has(.atv-discussion-author:focus-visible)::before,\n  .atv-series-card:hover,\n  .atv-cast-card:hover,\n  .atv-photo-tile:hover,\n  .atv-rec-card:hover .atv-rec-poster,\n  .atv-trailer-tile:hover,\n  .atv-stickynav,\n  .atv-stickynav.is-visible,\n  .atv-hero-more.is-open svg {\n    transform: none;\n  }\n\n  .atv-interest-modal-status-indicator {\n    opacity: 0;\n    transform: none;\n  }\n\n  .atv-interest-modal-status.is-active {\n    background: rgb(255 255 255 / 12%);\n  }\n}\n\n/* ---------- Accessibility: reduced transparency ---------- */\n\n@media (prefers-reduced-transparency: reduce) {\n  .atv-stickynav.is-visible:not(.is-scrolling) {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n    background: #0a0a0c;\n  }\n\n  .atv-modal-overlay,\n  .atv-comment-overlay,\n  .atv-interest-modal,\n  .atv-login-modal,\n  .atv-review-modal {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n    background: rgb(0 0 0 / 90%);\n  }\n\n  .atv-btn-secondary {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n  }\n\n  .atv-chip {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n  }\n\n  .atv-series-badge {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n    background: rgb(0 0 0 / 80%);\n  }\n\n  .atv-trailer-label {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n    background: rgb(0 0 0 / 80%);\n  }\n\n  .atv-comment-expand {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n  }\n}\n\n/* ---------- Accessibility: high contrast ---------- */\n\n@media (prefers-contrast: more) {\n  .atv-modal-overlay,\n  .atv-comment-overlay,\n  .atv-interest-modal,\n  .atv-login-modal,\n  .atv-review-modal {\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n    background: rgb(0 0 0 / 92%);\n  }\n\n  .atv-comment-card,\n  .atv-review-card,\n  .atv-stream-card,\n  .atv-chip,\n  .atv-comment-votes {\n    border-color: rgb(255 255 255 / 25%);\n  }\n\n  .atv-discussion-row {\n    border-bottom-color: rgb(255 255 255 / 25%);\n  }\n\n  .atv-chip {\n    color: var(--atv-text-primary);\n  }\n\n  .atv-comment-expand {\n    border-color: rgb(255 255 255 / 25%);\n    background: rgb(0 0 0 / 50%);\n  }\n\n  .atv-btn-secondary {\n    border-color: rgb(255 255 255 / 30%);\n    background: rgb(255 255 255 / 12%);\n  }\n\n  .atv-series-badge {\n    background: rgb(0 0 0 / 85%);\n  }\n\n  .atv-trailer-label {\n    background: rgb(0 0 0 / 85%);\n  }\n}\n\n/* ---------- Card press states ---------- */\n\n.atv-discussion-row {\n  transition: transform var(--atv-duration-press) var(--atv-ease-out);\n}\n\n.atv-poster-card:active {\n  transform: scale(0.97);\n}\n\n.atv-stream-card:active {\n  transform: scale(0.97);\n}\n\n.atv-photo-tile:active {\n  transform: scale(0.97);\n}\n\n.atv-cast-card:active {\n  transform: scale(0.97);\n}\n\n.atv-series-card:active {\n  transform: scale(0.97);\n}\n\n.atv-comment-card:active {\n  transform: scale(0.97);\n}\n\n.atv-discussion-row:active {\n  transform: scale(0.97);\n}\n";
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
	}, n, l$1, u$2, i$2, r$1, o$2, e$1, f$2, c$1, a$1, s$1, h$1, p$1, v$1, y$1, d$1 = {}, w$1 = [], _$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, g$1 = Array.isArray;
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
		for (n.__k = new Array(i), r = 0; r < i; r++) null != (o = l[r]) && "boolean" != typeof o && "function" != typeof o ? ("string" == typeof o || "number" == typeof o || "bigint" == typeof o || o.constructor == String ? o = n.__k[r] = x$1(null, o, null, null, null) : g$1(o) ? o = n.__k[r] = x$1(S, { children: o }, null, null, null) : void 0 === o.constructor && o.__b > 0 ? o = n.__k[r] = x$1(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : n.__k[r] = o, f = r + h, o.__ = n, o.__b = n.__b + 1, e = null, -1 != (c = o.__i = O(o, u, f, s)) && (s--, (e = u[c]) && (e.__u |= 2)), null == e || null == e.__v ? (-1 == c && (i > a ? h-- : i < a && h++), "function" != typeof o.type && (o.__u |= 4)) : c != f && (c == f - 1 ? h-- : c == f + 1 ? h++ : (c > f ? h-- : h++, o.__u |= 4))) : n.__k[r] = null;
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
				p.state = p.__s, null != p.getChildContext && (i = m$1(m$1({}, i), p.getChildContext())), M && !v && null != p.getSnapshotBeforeUpdate && (_ = p.getSnapshotBeforeUpdate(y, d)), H = null != s && s.type === S && null == s.key ? E(s.props.children) : s, f = L(n, g$1(H) ? H : [H], u, t, i, r, o, e, f, c, a), p.base = u.__e, u.__u &= -161, p.__h.length && e.push(p), k && (p.__E = p.__ = null);
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
		return "object" != typeof n || null == n || n.__b > 0 ? n : g$1(n) ? n.map(E) : void 0 !== n.constructor ? null : m$1({}, n);
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
			else if (p && (u.innerHTML = ""), L("template" == t.type ? u.content : u, g$1(v) ? v : [v], t, i, r, "foreignObject" == x ? "http://www.w3.org/1999/xhtml" : o, e, f, e ? e[0] : i.__k && $$1(i, 0), c, a), null != e) for (s = e.length; s--;) b(e[s]);
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
	var RE_INTEREST_ACTIVE = /done|active|on\b|j_a\b/u;
	var RE_IMDB_LINK = /^tt\d+$/u;
	var RE_SEASON_SUFFIX = /\d$/u;
	var RE_SEASON_EP = /^第[一二三四五六七八九十百\d]+[季集]\s*/u;
	var RE_PLAY_SOURCES = /sources\[(?<sourceId>\d+)\]\s*=\s*\[\s*\{play_link:\s*"(?<playLink>[^"]+)"/gu;
	var RE_SOURCES_SCRIPT = /\bsources\s*\[/u;
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
	var MAX_DISCUSSION_TOPICS = 10;
	var DOUBAN_ORIGIN = "https://www.douban.com/";
	var TOPIC_PATH = /^\/(?:group\/topic\/\d+|subject\/\d+\/discussion\/\d+)\/?$/u;
	var DISCUSSION_COLLECTION_PATH = /^\/subject\/\d+\/discussion\/?$/u;
	var COLLECTION_PATH = /^\/(?:group\/\d+|subject\/\d+\/discussion)\/?$/u;
	var START_DISCUSSION_PATH = /^\/(?:group\/\d+|subject\/\d+\/discussion\/create|register)\/?$/u;
	var AUTHOR_PROFILE_PATH = /^\/people\/[^/]+\/?$/u;
	var DISCUSSION_TIMESTAMP = /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2})(?::(?<seconds>\d{2}))?$/u;
	var isTrackingParameter = (fragment) => {
		const [rawKey] = fragment.split("=", 1);
		try {
			return decodeURIComponent(rawKey.replaceAll("+", " ")) === "_spm_id";
		} catch {
			return false;
		}
	};
	var removeTrackingParameter = (search) => {
		if (!search) return "";
		const remaining = search.slice(1).split("&").filter((fragment) => !isTrackingParameter(fragment));
		return remaining.length ? `?${remaining.join("&")}` : "";
	};
	var toSafeDoubanUrl = (rawHref) => {
		try {
			const url = new URL(rawHref, DOUBAN_ORIGIN);
			if (url.protocol !== "http:" && url.protocol !== "https:" || !url.hostname.endsWith(".douban.com") || url.port || url.username || url.password) return;
			return url;
		} catch {
			return;
		}
	};
	var normalizeTopicHref = (rawHref) => {
		const url = toSafeDoubanUrl(rawHref);
		if (!url || !TOPIC_PATH.test(url.pathname)) return "";
		const search = removeTrackingParameter(url.search);
		return `${url.origin}${url.pathname}${search}${url.hash}`;
	};
	var normalizeDoubanHref = (rawHref, path) => {
		const url = toSafeDoubanUrl(rawHref);
		return url && path.test(url.pathname) ? url.href : "";
	};
	var extractAuthor = (authorCell) => {
		const link = authorCell?.querySelector("a");
		const name = safeText(link ?? authorCell).replace(/^来自\s*/u, "");
		if (!name) return;
		const rawHref = link?.getAttribute("href")?.trim() ?? "";
		const href = rawHref ? normalizeDoubanHref(rawHref, AUTHOR_PROFILE_PATH) : "";
		return href ? {
			href,
			name
		} : { name };
	};
	var extractReplies = (repliesCell) => {
		if (!repliesCell) return;
		const text = safeText(repliesCell);
		if (!text) return 0;
		const match = /^(?<replies>\d+)\s*回应$/u.exec(text);
		if (match?.groups) return Number(match.groups.replies);
		const bare = Number(text);
		return Number.isSafeInteger(bare) ? bare : void 0;
	};
	var isValidDiscussionTimestamp = (dateTime) => {
		const value = new Date(`${dateTime}Z`);
		return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, dateTime.length) === dateTime;
	};
	var extractActivity = (activityCell) => {
		const raw = safeText(activityCell);
		if (!raw) return;
		const match = DISCUSSION_TIMESTAMP.exec(raw);
		if (!match?.groups) return { raw };
		const { date, seconds, time } = match.groups;
		const dateTime = `${date}T${time}${seconds ? `:${seconds}` : ""}`;
		return isValidDiscussionTimestamp(dateTime) ? {
			date,
			dateTime,
			raw,
			time
		} : { raw };
	};
	var extractTopics = (container) => {
		const topics = [];
		for (const row of $$("table tr", container)) {
			if (row.closest(".mv-hot-discussion-list")) continue;
			const link = row.cells[0]?.querySelector("a");
			const title = safeText(link);
			const rawHref = link?.getAttribute("href")?.trim() ?? "";
			const href = rawHref ? normalizeTopicHref(rawHref) : "";
			if (title && href) {
				const author = extractAuthor(row.cells[1]);
				const replies = extractReplies(row.cells[2]);
				const activity = extractActivity(row.cells[3]);
				topics.push({
					...activity ? { activity } : {},
					...author ? { author } : {},
					href,
					...replies === void 0 ? {} : { replies },
					title
				});
				if (topics.length === MAX_DISCUSSION_TOPICS) break;
			}
		}
		return topics;
	};
	var extractStartDiscussionHref = (container) => {
		const rawHref = container.querySelector(".hd-ops .comment_btn, .mod-hd .comment_btn")?.getAttribute("href")?.trim() ?? "";
		return rawHref ? normalizeDoubanHref(rawHref, START_DISCUSSION_PATH) : "";
	};
	var linkHref = (link, path) => {
		const rawHref = link?.getAttribute("href")?.trim() ?? "";
		return rawHref ? normalizeDoubanHref(rawHref, path) : "";
	};
	var extractLinkTotal = (link) => {
		const totalMatch = /全部\s*(?<total>\d+|\d{1,3}(?:,\d{3})+)\s*条/u.exec(safeText(link));
		const total = totalMatch?.groups ? Number(totalMatch.groups.total.replaceAll(",", "")) : NaN;
		return Number.isSafeInteger(total) ? total : void 0;
	};
	var extractAllDiscussions = (container) => {
		const pLink = container.querySelector("p a");
		const pHref = linkHref(pLink, COLLECTION_PATH);
		if (pHref) {
			const total = extractLinkTotal(pLink);
			return total === void 0 ? { href: pHref } : {
				href: pHref,
				total
			};
		}
		const h2Href = linkHref(container.querySelector("h2 .pl a"), DISCUSSION_COLLECTION_PATH);
		if (h2Href) return { href: h2Href };
		const listLink = container.querySelector(".mv-discussion-list a");
		const listHref = linkHref(listLink, DISCUSSION_COLLECTION_PATH);
		if (listHref) {
			const total = extractLinkTotal(listLink);
			return total === void 0 ? { href: listHref } : {
				href: listHref,
				total
			};
		}
	};
	var findModDiscussion = (doc) => {
		for (const mod of $$(".mod", doc)) if (mod.querySelector(".mv-discussion-list")) return mod;
		return null;
	};
	var extractFromContainer = (container) => {
		const topics = extractTopics(container);
		const startDiscussionHref = extractStartDiscussionHref(container);
		const allDiscussions = extractAllDiscussions(container);
		return {
			...allDiscussions ? { allDiscussions } : {},
			...startDiscussionHref ? { startDiscussionHref } : {},
			topics
		};
	};
	var extractDiscussions = (doc) => {
		const primary = doc.querySelector(".section-discussion");
		if (primary) return extractFromContainer(primary);
		const mod = findModDiscussion(doc);
		if (mod) return extractFromContainer(mod);
		return { topics: [] };
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
	var extractVisibleSummary = (doc) => {
		const container = doc.querySelector("#link-report-intra");
		if (!container) return extractSummary(doc);
		return normalizeSummaryText([...container.children].find((child) => child instanceof HTMLElement && !child.classList.contains("pl") && child.style.display !== "none")?.textContent || "").replace(/\s*\(展开全部\)\s*$/u, "") || extractSummary(doc);
	};
	var expandNativeSummary = (doc = document) => {
		const before = extractVisibleSummary(doc);
		const trigger = doc.querySelector("a.a_show_full");
		if (!trigger) return Promise.resolve(before);
		trigger.click();
		const after = extractVisibleSummary(doc);
		return Promise.resolve(after || before);
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
	var isRealUrl = (href) => RE_HTTP.test(href);
	var parseLegacyPlaySources = (doc) => {
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
		const sourcesMap = parseLegacyPlaySources(doc);
		const playBtns = $$("a.playBtn", doc);
		for (const a of playBtns) {
			const name = (a.dataset.cn || a.textContent || "").trim();
			if (!name || seen.has(name)) continue;
			let { href } = a;
			if (!isRealUrl(href)) {
				const sourceId = a.dataset.source;
				const mappedHref = sourceId ? sourcesMap[sourceId] : void 0;
				if (!mappedHref || !isRealUrl(mappedHref)) continue;
				href = mappedHref;
			}
			seen.add(name);
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
			if (!name || seen.has(name) || !isRealUrl(a.href)) continue;
			seen.add(name);
			out.push({
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
			discussions: extractDiscussions(doc),
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
	function g() {
		var n = s(t++, 11);
		if (!n.__) {
			for (var u = r.__v; null !== u && !u.__m && null !== u.__;) u = u.__;
			var i = u.__m || (u.__m = [0, 0]);
			n.__ = "P" + i[0] + "-" + i[1]++;
		}
		return n.__;
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
	var SECTION_COPY = {
		cast: {
			navLabel: "演职员",
			sectionTitle: "演职员"
		},
		comments: {
			navLabel: "短评",
			sectionTitle: "热门短评"
		},
		details: {
			navLabel: "详情",
			sectionTitle: "详细信息"
		},
		discussions: {
			navLabel: "小组讨论",
			sectionTitle: "小组讨论"
		},
		media: {
			navLabel: "影像",
			sectionTitle: "影像"
		},
		movieReviews: {
			navLabel: "影评",
			sectionTitle: "热门影评"
		},
		recommendations: {
			navLabel: "相似作品",
			sectionTitle: "相似作品"
		},
		series: {
			navLabel: "同系列",
			sectionTitle: "同系列作品"
		},
		streaming: {
			navLabel: "观看平台",
			sectionTitle: "观看平台"
		},
		tvReviews: {
			navLabel: "剧评",
			sectionTitle: "热门剧评"
		}
	};
	var getSubjectSectionCopy = (section) => SECTION_COPY[section];
	var computeNavSections = (data) => {
		const sections = [];
		if (data.streaming.length > 0) sections.push({
			id: "atv-stream",
			label: getSubjectSectionCopy("streaming").navLabel
		});
		if (data.series.length > 0) sections.push({
			id: "atv-series",
			label: getSubjectSectionCopy("series").navLabel
		});
		if (data.celebrities.length > 0) sections.push({
			id: "atv-cast",
			label: getSubjectSectionCopy("cast").navLabel
		});
		if (data.photos.length > 0 || data.trailers.length > 0) sections.push({
			id: "atv-photos",
			label: getSubjectSectionCopy("media").navLabel
		});
		if (data.comments.length > 0) sections.push({
			id: "atv-comments",
			label: getSubjectSectionCopy("comments").navLabel
		});
		if (data.reviews.length > 0) sections.push({
			id: "atv-reviews",
			label: getSubjectSectionCopy(data.isTV ? "tvReviews" : "movieReviews").navLabel
		});
		if (data.discussions.topics.length > 0) sections.push({
			id: "atv-discussions",
			label: getSubjectSectionCopy("discussions").navLabel
		});
		if (data.recommendations.length > 0) sections.push({
			id: "atv-recs",
			label: getSubjectSectionCopy("recommendations").navLabel
		});
		sections.push({
			id: "atv-info",
			label: getSubjectSectionCopy("details").navLabel
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
	var StickyNav = ({ activeSectionId = "", onJump, scrolling = false, sections, subjectSwitcherOpen = false, subjectSwitcher, title, visible = false }) => u("nav", {
		class: `atv-stickynav${visible ? " is-visible" : ""}${scrolling ? " is-scrolling" : ""}${subjectSwitcherOpen ? " has-subject-switcher-open" : ""}`,
		children: [
			u("div", {
				class: "atv-stickynav-title",
				children: subjectSwitcherOpen ? "上一部" : title.primary || title.full
			}),
			subjectSwitcher ? u("div", {
				class: "atv-stickynav-subject-switcher",
				children: subjectSwitcher
			}) : null,
			u("div", {
				class: "atv-stickynav-jumps",
				children: sections.map((section) => u("a", {
					class: activeSectionId === section.id ? "is-active" : void 0,
					href: `#${section.id}`,
					onClick: (event) => {
						event.preventDefault();
						onJump(section.id);
					},
					children: section.label
				}, section.id))
			})
		]
	});
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
	var LogoNetflix = (props) => {
		const id = g();
		const leftGradient = `${id}-netflix-left`;
		const rightGradient = `${id}-netflix-right`;
		const leftFill = `${id}-netflix-left-fill`;
		const rightFill = `${id}-netflix-right-fill`;
		return u("svg", {
			"aria-hidden": "true",
			viewBox: "0 0 551.111 1000",
			xmlnsXlink: "http://www.w3.org/1999/xlink",
			...props,
			children: [
				u("defs", { children: [
					u("linearGradient", {
						id: leftGradient,
						children: [
							u("stop", {
								offset: "0",
								"stop-color": "#b1060f"
							}),
							u("stop", {
								offset: ".625",
								"stop-color": "#7b010c"
							}),
							u("stop", {
								offset: "1",
								"stop-color": "#b1060f",
								"stop-opacity": "0"
							})
						]
					}),
					u("linearGradient", {
						id: rightGradient,
						children: [
							u("stop", {
								offset: "0",
								"stop-color": "#b1060f"
							}),
							u("stop", {
								offset: ".546",
								"stop-color": "#7b010c"
							}),
							u("stop", {
								offset: "1",
								"stop-color": "#e50914",
								"stop-opacity": "0"
							})
						]
					}),
					u("linearGradient", {
						id: leftFill,
						gradientUnits: "userSpaceOnUse",
						x1: "78.234",
						x2: "221.663",
						xlinkHref: `#${rightGradient}`,
						y1: "423.767",
						y2: "365.092"
					}),
					u("linearGradient", {
						id: rightFill,
						gradientUnits: "userSpaceOnUse",
						x1: "456.365",
						x2: "309.676",
						xlinkHref: `#${leftGradient}`,
						y1: "521.56",
						y2: "583.495"
					})
				] }),
				u("path", {
					d: "M-1.152-1.152 2.305 1002.67c73.273-14.111 130.892-12.569 195.924-18.44V0Z",
					fill: `url(#${leftFill})`
				}),
				u("path", {
					d: "M353.816 0h199.381l2.305 1000.365-202.839-33.422z",
					fill: `url(#${rightFill})`
				}),
				u("path", {
					d: "M1.152 0c4.61 11.525 345.749 981.925 345.749 981.925 56.056-.4 131.219 8.754 205.144 17.288L197.077 0Z",
					fill: "#e50914"
				})
			]
		});
	};
	var LogoHulu = (props) => u("svg", {
		"aria-hidden": "true",
		fill: "none",
		viewBox: "0 0 251 83",
		...props,
		children: u("path", {
			d: "M153.602 82.4612H173.519V0.015625H153.602V82.4612ZM118.632 58.9549C118.632 61.8498 116.201 64.2815 113.306 64.2815H101.726C98.8314 64.2815 96.3998 61.8498 96.3998 58.9549C96.3998 57.797 96.3998 25.722 96.3998 25.722H76.4831V60.5761C76.4831 74.8188 85.6309 82.3454 99.063 82.3454H118.516C130.906 82.3454 138.433 73.4292 138.433 60.5761V25.722H118.516C118.632 25.722 118.632 57.9128 118.632 58.9549ZM230.605 25.722C230.605 25.722 230.605 57.9128 230.605 58.9549C230.605 61.8498 228.174 64.2815 225.279 64.2815H213.699C210.805 64.2815 208.373 61.8498 208.373 58.9549C208.373 57.797 208.373 25.722 208.373 25.722H188.456V60.5761C188.456 74.8188 197.604 82.3454 211.036 82.3454H230.49C242.88 82.3454 250.406 73.4292 250.406 60.5761V25.722H230.605ZM39.7763 25.722C39.7763 25.722 29.4706 25.722 27.039 25.722C22.523 25.722 20.3229 26.8799 20.3229 26.8799V0.015625H0.40625V82.3454H20.2071V49.2282C20.2071 46.3334 22.6388 43.9017 25.5336 43.9017H37.1131C40.0079 43.9017 42.4396 46.3334 42.4396 49.2282V82.4612H62.3562V46.5649C62.3562 31.5117 52.2821 25.722 39.7763 25.722Z",
			fill: "#1CE783"
		})
	});
	var LogoNbc = (props) => u("svg", {
		"aria-hidden": "true",
		viewBox: "0 0 215.84 124.97",
		...props,
		children: u("g", {
			transform: "matrix(1.01979 0 0 1.01979 .1181 -12.4393)",
			children: [
				u("path", {
					d: "m131.298 12.198c-8.885 0-17.259 5.015-20.293 13.022-1.207 3.185-1.708 6.37-1.457 9.765h9.217c3.815 0 6.132 1.973 6.132 3.306-9.656 3.774-13.52 8.887-12.955 12.907l8.549 60.802 30.176-69.493c2.028-4.66 2.448-8.573.991-14.264-1.372-5.361-4.644-10.614-11.881-14.103-2.532-1.15-5.726-1.942-8.479-1.942z",
					fill: "#6e55dc"
				}),
				u("path", {
					d: "m80.089 12.198c-2.752 0-5.946.63-8.479 1.78-7.237 3.488-10.673 8.905-12.045 14.266-1.456 5.691-.516 10.597 1.155 14.427l30.259 69.33 10.85-75.555c.54-3.766.105-7.689-1.298-11.226-3.158-7.959-10.995-13.022-20.442-13.022z",
					fill: "#ef1541"
				}),
				u("path", {
					d: "m27.128 46.132c-2.356 1.422-4.73 3.683-6.218 6.033-4.138 6.54-4.456 14.062-2.894 18.891 1.662 5.136 4.932 8.729 9.013 11.464l61.253 41.05-29.759-67.75c-1.53-3.483-4.213-6.614-7.318-8.813-6.869-4.865-16.703-5.325-24.077-.875z",
					fill: "#ff7112"
				}),
				u("path", {
					d: "m1.697 104.45c-1.22 2.467-1.88 5.693-1.807 8.473.203 7.737 2.86 13.025 8.112 17.164 3.213 2.532 8.956 4.647 13.869 4.648l71.389.005-59.411-39.787c-2.034-1.362-6.416-3.743-12.186-3.786-4.852-.036-9.186 1.592-12.635 4.256-4.468 3.451-6.015 6.367-7.331 9.027z",
					fill: "#fccc12"
				}),
				u("path", {
					d: "m184.233 46.132c2.356 1.422 4.73 3.683 6.218 6.033 4.138 6.54 4.456 14.062 2.894 18.891-1.662 5.136-4.932 8.729-9.013 11.464l-61.253 41.05 29.759-67.75c1.53-3.483 4.213-6.614 7.318-8.813 6.869-4.865 16.703-5.325 24.077-.875z",
					fill: "#069de0"
				}),
				u("path", {
					d: "m209.724 104.45c1.22 2.467 1.88 5.693 1.807 8.473-.203 7.737-2.86 13.025-8.112 17.164-3.213 2.532-8.956 4.647-13.869 4.648l-71.554.005 59.493-39.787c2.035-1.361 6.466-3.786 12.534-3.786 4.852 0 9.103 1.592 12.553 4.256 4.467 3.451 5.833 6.367 7.148 9.027z",
					fill: "#05ac3f"
				})
			]
		})
	});
	var LogoAmc = (props) => u("svg", {
		"aria-hidden": "true",
		viewBox: "0 0 221 125",
		...props,
		children: u("g", {
			transform: "translate(-124.24576,-766.40339)",
			children: u("g", {
				transform: "matrix(7.3665737,0,0,7.3665737,-791.0189,-5675.1775)",
				children: [
					u("g", {
						transform: "matrix(1.0330919,0,0,-1.0330919,140.58752,879.41646)",
						children: u("path", { d: "M 0,0 C 0,0 -1.148,-4.311 -1.244,-4.771 L -2.496,0 L -4.865,0 L -4.865,-6.618 L -3.314,-6.618 L -3.314,-1.751 L -1.957,-6.618 L -0.527,-6.618 C -0.527,-6.618 0.795,-1.904 0.828,-1.762 L 0.828,-6.618 L 2.385,-6.618 L 2.385,0 L 0,0 z" })
					}),
					u("g", {
						transform: "matrix(1.0330919,0,0,-1.0330919,133.08346,883.64366)",
						children: u("path", { d: "M 0,0 C 0,-0.196 0,-0.39 -0.092,-0.585 C -0.262,-0.976 -0.824,-1.341 -1.621,-1.341 C -2.248,-1.341 -2.68,-1.081 -2.68,-0.572 C -2.68,0.116 -2.031,0.271 -1.469,0.342 C -0.762,0.429 0,0.455 0,0.455 L 0,0 z M 1.568,-1.47 L 1.568,1.979 C 1.568,2.682 1.555,3.294 0.783,3.762 C 0.209,4.101 -0.549,4.179 -1.178,4.179 C -1.596,4.179 -3.15,4.179 -3.779,3.046 C -3.982,2.677 -4.012,2.408 -4.039,2.093 L -4.039,2.091 L -2.432,2.093 C -2.43,2.238 -2.41,2.387 -2.275,2.552 C -2.117,2.76 -1.766,2.968 -1.111,2.968 C 0.178,2.968 -0.012,1.674 -0.012,1.674 C -0.012,1.674 -0.656,1.666 -2.027,1.497 C -2.66,1.419 -3.66,1.172 -4.131,0.235 C -4.264,-0.027 -4.342,-0.326 -4.342,-0.65 C -4.342,-1.77 -3.451,-2.682 -1.975,-2.682 C -1.074,-2.682 -0.379,-2.304 -0.041,-2.018 C -0.041,-2.109 -0.014,-2.37 0,-2.526 L 1.596,-2.526 C 1.568,-1.47 1.568,-1.965 1.568,-1.47" })
					}),
					u("g", {
						transform: "matrix(1.0330919,0,0,-1.0330919,150.16574,883.59784)",
						children: u("path", { d: "M 0,0 L -1.521,-0.002 C -1.568,-0.185 -1.885,-1.379 -3.07,-1.379 C -3.086,-1.379 -3.275,-1.379 -3.295,-1.378 C -4.166,-1.351 -4.879,-0.629 -4.879,0.795 C -4.879,1.888 -4.33,2.87 -3.281,2.895 L -3.07,2.895 C -1.986,2.895 -1.605,1.765 -1.582,1.696 L -0.064,1.691 C -0.359,3.102 -1.467,4.254 -3.145,4.254 C -5.027,4.254 -6.365,2.707 -6.365,0.748 C -6.365,-1.493 -4.943,-2.766 -3.184,-2.766 C -1.223,-2.766 -0.207,-1.273 0,0" })
					}),
					u("path", { d: "M 152.75278,889.94049 L 125.76533,889.94049 L 125.76533,875.89457 L 152.75278,875.89457 L 152.75278,889.94049 z M 124.24564,891.40232 L 154.24564,891.40232 L 154.24564,874.43378 L 124.24564,874.43378 L 124.24564,891.40232 z" })
				]
			})
		})
	});
	var LogoDisneyPlus = (props) => u("svg", {
		"aria-hidden": "true",
		viewBox: "0 0 64 64",
		...props,
		children: u("path", {
			fill: "currentColor",
			transform: "translate(38,11)",
			d: "M0 0 C1.3921875 0.60134766 1.3921875 0.60134766 2.8125 1.21484375 C11.56889431 5.50597448 21.69367914 13.02146173 26 22 C26.96072448 26.6574252 26.98172251 31.04951501 24.81640625 35.3515625 C20.40729049 40.99776829 14.92832836 43.57624666 8 45 C2.54906569 45.45424453 -2.71529883 45.53668616 -8 44 C-8 44.66 -8 45.32 -8 46 C-9.65 46 -11.3 46 -13 46 C-13.495 43.525 -13.495 43.525 -14 41 C-14.845625 40.79375 -15.69125 40.5875 -16.5625 40.375 C-21.95019437 38.21992225 -25.79243342 34.81134987 -29 30 C-29.0625 27.5625 -29.0625 27.5625 -28 25 C-23.34315146 21.64706905 -19.66970184 20.4628328 -14 20 C-14.04125 18.9275 -14.0825 17.855 -14.125 16.75 C-14.0114175 13.34252515 -13.78726636 11.79260369 -12 9 C-9 10 -9 10 -8 12 C-7.95977609 14.3329866 -7.95679753 16.66706666 -8 19 C-7.030625 18.938125 -6.06125 18.87625 -5.0625 18.8125 C0.71379389 18.82424043 5.98582654 20.51334816 10.625 23.9375 C12 26 12 26 11.875 28.125 C11 30 11 30 9 32 C6.375 32.125 6.375 32.125 4 32 C4.33 30.68 4.66 29.36 5 28 C1.0186217 26.6728739 -2.85045227 26.93084087 -7 27 C-7 30.96 -7 34.92 -7 39 C5.85931116 38.8678016 5.85931116 38.8678016 17 33.25 C18.50330091 29.86757294 18.49071674 27.68037558 18 24 C14.42102235 14.81757249 5.84541891 10.094413 -2.75 6.25 C-11.70685142 2.75267271 -21.33757211 0.25673632 -31 1 C-31.99 1.495 -31.99 1.495 -33 2 C-33 2.66 -33 3.32 -33 4 C-34.65 3.67 -36.3 3.34 -38 3 C-37.75 0.625 -37.75 0.625 -37 -2 C-27.41334426 -8.16463702 -9.56841669 -4.1471806 0 0 Z M-27 28 C-23.59843301 33.3241918 -19.69029074 34.74061985 -14 37 C-14 33.37 -14 29.74 -14 26 C-18.82360189 25.80705592 -22.49646738 26.24252386 -27 28 Z"
		})
	});
	var LogoDiscoveryPlus = (props) => u("svg", {
		width: "237",
		height: "200",
		viewBox: "0 0 237 200",
		fill: "none",
		...props,
		children: [
			u("path", {
				d: "M236.931 100.017C236.931 128.105 225.992 153.805 206.142 172.378C187.088 190.187 161.745 200 134.785 200H72.643C54.3365 199.834 36.7319 192.934 23.189 180.615C8.229 167.032 0 148.118 0 127.376C0.0968097 109.555 6.70239 92.3826 18.5741 79.0904C30.4458 65.7982 46.7655 57.3021 64.463 55.2003L64.521 0.000281379H134.785C161.3 -0.0615793 186.824 10.0786 206.067 28.3203C215.855 37.5153 223.645 48.6258 228.955 60.9607C234.265 73.2956 236.98 86.5912 236.931 100.02",
				fill: "white"
			}),
			u("mask", {
				id: "mask0_3_4",
				"mask-type": "luminance",
				maskUnits: "userSpaceOnUse",
				x: "7",
				y: "63",
				width: "130",
				height: "130",
				children: u("path", {
					d: "M13.938 100.427C20.7047 85.933 32.6158 74.4702 47.359 68.2643C55.2796 64.9284 63.7876 63.2107 72.382 63.2123C88.3781 63.2121 103.804 69.1559 115.664 79.8896C127.524 90.6233 134.972 105.381 136.563 121.298C138.154 137.215 133.773 153.155 124.272 166.023C114.771 178.892 100.827 187.771 85.1473 190.937C69.4676 194.102 53.171 191.329 39.4214 183.154C25.6717 174.98 15.4501 161.988 10.741 146.701C6.03191 131.413 7.1713 114.922 13.938 100.427Z",
					fill: "white"
				})
			}),
			u("g", {
				mask: "url(#mask0_3_4)",
				children: [u("mask", {
					id: "mask1_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "8",
					y: "63",
					width: "129",
					height: "129",
					children: u("path", {
						d: "M136.67 63.2133H8.096V191.787H136.67V63.2133Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask1_3_4)",
					children: u("rect", {
						x: "7.85201",
						y: "62.8003",
						width: "129.12",
						height: "129.12",
						fill: "url(#pattern0_3_4)"
					})
				})]
			}),
			u("mask", {
				id: "mask2_3_4",
				"mask-type": "luminance",
				maskUnits: "userSpaceOnUse",
				x: "72",
				y: "8",
				width: "157",
				height: "184",
				children: u("path", {
					d: "M107.03 8.45928H72.53V54.8513C77.2934 54.8507 82.0451 55.3233 86.715 56.2623C105.583 60.0953 122.167 71.2403 132.844 87.2623C133.137 87.6989 133.426 88.1396 133.709 88.5843C140.961 99.9714 144.887 113.159 145.043 126.658C145.199 140.158 141.58 153.432 134.593 164.984C127.722 176.317 117.91 185.578 106.2 191.784H134.523C142.274 191.788 149.998 190.887 157.54 189.1C165.778 187.156 173.723 184.13 181.167 180.1C188.736 176.003 195.691 170.863 201.83 164.83C203.508 163.18 205.13 161.456 206.697 159.658C212.651 152.848 217.502 145.149 221.076 136.839C225.868 125.501 228.335 113.315 228.329 101.005C228.329 100.724 228.329 100.444 228.329 100.162C228.378 88.3438 226.085 76.6326 221.583 65.705C217.081 54.7774 210.46 44.8498 202.1 36.4953C201.874 36.2693 201.647 36.0443 201.419 35.8203C185.222 19.9109 163.885 10.2956 141.238 8.70028C139.002 8.54228 136.763 8.46328 134.522 8.46328L107.03 8.45928Z",
					fill: "white"
				})
			}),
			u("g", {
				mask: "url(#mask2_3_4)",
				children: [u("mask", {
					id: "mask3_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "72",
					y: "8",
					width: "157",
					height: "184",
					children: u("path", {
						d: "M228.332 8.46028H72.529V191.787H228.332V8.46028Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask3_3_4)",
					children: u("rect", {
						x: "72.172",
						y: "8.08028",
						width: "156.48",
						height: "183.84",
						fill: "url(#pattern1_3_4)"
					})
				})]
			}),
			u("g", {
				opacity: "0.5",
				"mix-blend-mode": "overlay",
				children: [u("mask", {
					id: "mask4_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "72",
					y: "8",
					width: "7",
					height: "47",
					children: u("path", {
						d: "M72.529 54.8513V8.45728H78.411V49.3493L72.529 54.8513Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask4_3_4)",
					children: [u("mask", {
						id: "mask5_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "72",
						y: "8",
						width: "7",
						height: "47",
						children: u("path", {
							d: "M78.412 8.45728H72.529V54.8513H78.412V8.45728Z",
							fill: "url(#paint0_linear_3_4)"
						})
					}), u("g", {
						mask: "url(#mask5_3_4)",
						children: u("path", {
							d: "M78.412 8.45728H72.529V54.8513H78.412V8.45728Z",
							fill: "url(#paint1_linear_3_4)"
						})
					})]
				})]
			}),
			u("g", {
				opacity: "0.07",
				children: [u("mask", {
					id: "mask6_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "150",
					y: "13",
					width: "66",
					height: "133",
					children: u("path", {
						d: "M209.059 83.1203C209.059 122.648 187.278 145.542 187.278 145.542C187.278 145.542 215.169 129.342 215.169 84.7133C215.169 34.6443 171.869 13.2623 150.09 13.2623C177.849 18.8403 209.059 45.4003 209.059 83.1203Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask6_3_4)",
					children: [u("mask", {
						id: "mask7_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "140",
						y: "3",
						width: "85",
						height: "152",
						children: [u("mask", {
							id: "mask8_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "140",
							y: "3",
							width: "85",
							height: "152",
							children: u("path", {
								d: "M224.572 3.86028H140.687V154.946H224.572V3.86028Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask8_3_4)",
							children: u("rect", {
								x: "140.332",
								y: "3.76028",
								width: "84.48",
								height: "151.2",
								fill: "url(#pattern2_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask7_3_4)",
						children: [u("mask", {
							id: "mask9_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "140",
							y: "3",
							width: "85",
							height: "152",
							children: [
								u("path", {
									d: "M216.17 12.2623H149.09V146.542H216.17V12.2623Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask10_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "140",
									y: "3",
									width: "85",
									height: "152",
									children: u("path", {
										d: "M224.572 3.86028H140.687V154.946H224.572V3.86028Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask10_3_4)",
									children: u("rect", {
										x: "140.332",
										y: "3.76028",
										width: "84.48",
										height: "151.2",
										fill: "url(#pattern3_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask9_3_4)",
							children: [u("mask", {
								id: "mask11_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "150",
								y: "13",
								width: "66",
								height: "133",
								children: u("path", {
									d: "M215.169 13.2633H150.09V145.543H215.169V13.2633Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask11_3_4)",
								children: [u("mask", {
									id: "mask12_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "140",
									y: "3",
									width: "85",
									height: "152",
									children: [u("mask", {
										id: "mask13_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "140",
										y: "3",
										width: "85",
										height: "152",
										children: u("path", {
											d: "M224.572 3.86028H140.687V154.946H224.572V3.86028Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask13_3_4)",
										children: u("rect", {
											x: "140.332",
											y: "3.76028",
											width: "84.48",
											height: "151.2",
											fill: "url(#pattern4_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask12_3_4)",
									children: u("rect", {
										x: "149.932",
										y: "12.8803",
										width: "65.28",
										height: "132.96",
										fill: "url(#pattern5_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("g", {
				opacity: "0.05",
				children: [u("mask", {
					id: "mask14_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "148",
					y: "18",
					width: "53",
					height: "128",
					children: u("path", {
						d: "M174.867 145.542H167.3C167.3 145.542 148.972 37.1683 148.972 18.0433C178.567 26.0753 200.767 57.8873 200.767 87.1053C200.767 112.207 194.567 129.605 174.867 145.542Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask14_3_4)",
					children: [u("mask", {
						id: "mask15_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "139",
						y: "8",
						width: "72",
						height: "147",
						children: [u("mask", {
							id: "mask16_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "139",
							y: "8",
							width: "72",
							height: "147",
							children: u("path", {
								d: "M210.169 8.64028H139.566V154.946H210.169V8.64028Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask16_3_4)",
							children: u("rect", {
								x: "139.372",
								y: "8.56028",
								width: "71.04",
								height: "146.4",
								fill: "url(#pattern6_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask15_3_4)",
						children: [u("mask", {
							id: "mask17_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "139",
							y: "8",
							width: "72",
							height: "147",
							children: [
								u("path", {
									d: "M201.766 17.0433H147.971V146.543H201.766V17.0433Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask18_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "139",
									y: "8",
									width: "72",
									height: "147",
									children: u("path", {
										d: "M210.169 8.64028H139.566V154.946H210.169V8.64028Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask18_3_4)",
									children: u("rect", {
										x: "139.372",
										y: "8.56028",
										width: "71.04",
										height: "146.4",
										fill: "url(#pattern7_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask17_3_4)",
							children: [u("mask", {
								id: "mask19_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "148",
								y: "18",
								width: "53",
								height: "128",
								children: u("path", {
									d: "M200.766 18.0433H148.971V145.543H200.766V18.0433Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask19_3_4)",
								children: [u("mask", {
									id: "mask20_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "139",
									y: "8",
									width: "72",
									height: "147",
									children: [u("mask", {
										id: "mask21_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "139",
										y: "8",
										width: "72",
										height: "147",
										children: u("path", {
											d: "M210.169 8.64028H139.566V154.946H210.169V8.64028Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask21_3_4)",
										children: u("rect", {
											x: "139.372",
											y: "8.56028",
											width: "71.04",
											height: "146.4",
											fill: "url(#pattern8_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask20_3_4)",
									children: u("rect", {
										x: "148.492",
										y: "17.6803",
										width: "52.32",
										height: "128.16",
										fill: "url(#pattern9_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("mask", {
				id: "mask22_3_4",
				"mask-type": "luminance",
				maskUnits: "userSpaceOnUse",
				x: "8",
				y: "63",
				width: "129",
				height: "129",
				children: u("path", {
					d: "M18.9351 163.216C11.8709 152.645 8.1002 140.215 8.1 127.5C8.09973 110.451 14.872 94.0999 26.9271 82.0436C38.9822 69.9874 55.3327 63.2136 72.382 63.2123C85.0969 63.2113 97.5266 66.9808 108.099 74.0441C118.672 81.1074 126.912 91.1473 131.779 102.894C136.645 114.641 137.919 127.567 135.439 140.038C132.96 152.508 126.837 163.964 117.847 172.955C108.856 181.946 97.4017 188.069 84.9312 190.551C72.4607 193.032 59.5345 191.759 47.7873 186.893C36.0401 182.028 25.9994 173.788 18.9351 163.216Z",
					fill: "white"
				})
			}),
			u("g", {
				mask: "url(#mask22_3_4)",
				children: [u("mask", {
					id: "mask23_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "-15",
					y: "40",
					width: "175",
					height: "175",
					children: [u("mask", {
						id: "mask24_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "-15",
						y: "40",
						width: "175",
						height: "175",
						children: u("path", {
							d: "M132.414 40.2152L-14.9031 67.4683L12.3501 214.786L159.667 187.533L132.414 40.2152Z",
							fill: "white"
						})
					}), u("g", {
						mask: "url(#mask24_3_4)",
						children: u("rect", {
							x: "-14.948",
							y: "40.0003",
							width: "174.72",
							height: "174.96",
							fill: "url(#pattern10_3_4)"
						})
					})]
				}), u("g", {
					mask: "url(#mask23_3_4)",
					children: [u("mask", {
						id: "mask25_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "-16",
						y: "39",
						width: "177",
						height: "177",
						children: [
							u("path", {
								d: "M160.669 39.2143H-15.902V215.785H160.669V39.2143Z",
								fill: "black"
							}),
							u("mask", {
								id: "mask26_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "-15",
								y: "40",
								width: "175",
								height: "175",
								children: u("path", {
									d: "M132.414 40.2152L-14.9031 67.4683L12.3501 214.786L159.667 187.533L132.414 40.2152Z",
									fill: "white"
								})
							}),
							u("g", {
								mask: "url(#mask26_3_4)",
								children: u("rect", {
									x: "-14.948",
									y: "40.0003",
									width: "174.72",
									height: "174.96",
									fill: "url(#pattern11_3_4)"
								})
							})
						]
					}), u("g", {
						mask: "url(#mask25_3_4)",
						children: [u("mask", {
							id: "mask27_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "-15",
							y: "40",
							width: "175",
							height: "175",
							children: u("path", {
								d: "M132.414 40.2152L-14.9031 67.4683L12.3501 214.786L159.667 187.533L132.414 40.2152Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask27_3_4)",
							children: [u("mask", {
								id: "mask28_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "-15",
								y: "40",
								width: "175",
								height: "175",
								children: [u("mask", {
									id: "mask29_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "-15",
									y: "40",
									width: "175",
									height: "175",
									children: u("path", {
										d: "M132.414 40.2152L-14.9031 67.4683L12.3501 214.786L159.667 187.533L132.414 40.2152Z",
										fill: "white"
									})
								}), u("g", {
									mask: "url(#mask29_3_4)",
									children: u("rect", {
										x: "-14.948",
										y: "40.0003",
										width: "174.72",
										height: "174.96",
										fill: "url(#pattern12_3_4)"
									})
								})]
							}), u("g", {
								mask: "url(#mask28_3_4)",
								children: u("rect", {
									x: "-14.948",
									y: "40.0003",
									width: "174.72",
									height: "174.96",
									fill: "url(#pattern13_3_4)"
								})
							})]
						})]
					})]
				})]
			}),
			u("g", {
				"mix-blend-mode": "overlay",
				opacity: "0.25",
				children: [u("mask", {
					id: "mask30_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "8",
					y: "63",
					width: "129",
					height: "129",
					children: u("path", {
						d: "M125.835 163.216C132.899 152.644 136.67 140.215 136.67 127.5C136.67 119.058 135.007 110.698 131.777 102.898C128.546 95.0983 123.81 88.0112 117.841 82.0415C111.871 76.0718 104.784 71.3364 96.9841 68.1056C89.1843 64.8749 80.8245 63.2122 72.382 63.2123C59.6673 63.2125 47.2382 66.983 36.6664 74.047C26.0946 81.111 17.855 91.1513 12.9894 102.898C8.12376 114.645 6.85074 127.571 9.3313 140.041C11.8119 152.512 17.9346 163.966 26.9252 172.957C35.9159 181.948 47.3706 188.07 59.841 190.551C72.3113 193.032 85.2372 191.759 96.9841 186.893C108.731 182.027 118.771 173.788 125.835 163.216Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask30_3_4)",
					children: [u("mask", {
						id: "mask31_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "8",
						y: "63",
						width: "129",
						height: "129",
						children: u("path", {
							d: "M136.67 63.2133H8.096V191.787H136.67V63.2133Z",
							fill: "url(#paint2_radial_3_4)"
						})
					}), u("g", {
						mask: "url(#mask31_3_4)",
						children: u("path", {
							d: "M136.67 63.2123H8.096V191.786H136.67V63.2123Z",
							fill: "url(#paint3_radial_3_4)"
						})
					})]
				})]
			}),
			u("g", {
				opacity: "0.25",
				children: [u("mask", {
					id: "mask32_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "50",
					y: "70",
					width: "85",
					height: "72",
					children: u("path", {
						d: "M50.041 85.1963C50.041 85.1963 51.893 80.7093 58.53 76.6643C63.974 73.3453 72.636 70.3233 86.165 70.3233C99.841 70.3233 113.962 78.6803 122.733 90.8653C133.04 105.183 137.076 122.473 132.205 137.26L121.582 141.334C116.747 120.659 103.878 107.857 85.213 101.905C76.3342 99.226 67.1041 97.8919 57.83 97.9473L50.041 85.1963Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask32_3_4)",
					children: [u("mask", {
						id: "mask33_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "40",
						y: "60",
						width: "104",
						height: "91",
						children: [u("mask", {
							id: "mask34_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "40",
							y: "60",
							width: "104",
							height: "91",
							children: u("path", {
								d: "M143.637 60.9203H40.636V150.737H143.637V60.9203Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask34_3_4)",
							children: u("rect", {
								x: "40.492",
								y: "60.8803",
								width: "103.2",
								height: "90.24",
								fill: "url(#pattern14_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask33_3_4)",
						children: [u("mask", {
							id: "mask35_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "40",
							y: "60",
							width: "104",
							height: "91",
							children: [
								u("path", {
									d: "M138.076 69.3233H49.041V142.334H138.076V69.3233Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask36_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "40",
									y: "60",
									width: "104",
									height: "91",
									children: u("path", {
										d: "M143.637 60.9203H40.636V150.737H143.637V60.9203Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask36_3_4)",
									children: u("rect", {
										x: "40.492",
										y: "60.8803",
										width: "103.2",
										height: "90.24",
										fill: "url(#pattern15_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask35_3_4)",
							children: [u("mask", {
								id: "mask37_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "50",
								y: "70",
								width: "88",
								height: "72",
								children: u("path", {
									d: "M137.076 70.3233H50.041V141.334H137.076V70.3233Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask37_3_4)",
								children: [u("mask", {
									id: "mask38_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "40",
									y: "60",
									width: "104",
									height: "91",
									children: [u("mask", {
										id: "mask39_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "40",
										y: "60",
										width: "104",
										height: "91",
										children: u("path", {
											d: "M143.637 60.9203H40.636V150.737H143.637V60.9203Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask39_3_4)",
										children: u("rect", {
											x: "40.492",
											y: "60.8803",
											width: "103.2",
											height: "90.24",
											fill: "url(#pattern16_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask38_3_4)",
									children: u("rect", {
										x: "49.612",
										y: "70.0003",
										width: "87.84",
										height: "71.52",
										fill: "url(#pattern17_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("mask", {
				id: "mask40_3_4",
				"mask-type": "luminance",
				maskUnits: "userSpaceOnUse",
				x: "14",
				y: "71",
				width: "34",
				height: "40",
				children: u("path", {
					d: "M36 76.9313C37.6542 75.8465 39.3679 74.8553 41.133 73.9623C42.9663 73.0358 44.8476 72.2077 46.769 71.4813C47.4141 73.1222 47.7143 74.8783 47.651 76.6403C45.461 78.3643 43.644 81.2113 41.551 83.1113C39.4617 85.0079 37.4513 87.0163 35.52 89.1363C33.5887 91.2563 31.732 93.4943 29.95 95.8503C28.7453 97.4476 27.5723 99.0976 26.431 100.8C25.2897 102.503 24.184 104.261 23.114 106.073C22.185 107.643 18.796 110.107 17.085 110.251C16.8247 110.255 16.5648 110.23 16.31 110.176C15.7547 109.917 15.1765 109.71 14.583 109.558C14.9449 106.948 15.5725 104.381 16.456 101.898C17.1644 99.7258 18.0535 97.6164 19.114 95.5923C20.2199 93.5231 21.4585 91.5276 22.822 89.6183C24.1583 87.7453 25.621 85.9658 27.2 84.2923C28.5089 82.9074 29.8976 81.6001 31.359 80.3773C32.8377 79.1393 34.3873 77.9887 36 76.9313Z",
					fill: "white"
				})
			}),
			u("g", {
				mask: "url(#mask40_3_4)",
				children: [u("mask", {
					id: "mask41_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "14",
					y: "71",
					width: "34",
					height: "40",
					children: [u("mask", {
						id: "mask42_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "14",
						y: "71",
						width: "34",
						height: "40",
						children: u("path", {
							d: "M47.771 71.4823H14.582V110.258H47.771V71.4823Z",
							fill: "white"
						})
					}), u("g", {
						mask: "url(#mask42_3_4)",
						children: u("rect", {
							x: "14.572",
							y: "71.4403",
							width: "33.6",
							height: "38.88",
							fill: "url(#pattern18_3_4)"
						})
					})]
				}), u("g", {
					mask: "url(#mask41_3_4)",
					children: [u("mask", {
						id: "mask43_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "13",
						y: "70",
						width: "36",
						height: "42",
						children: [
							u("path", {
								d: "M48.893 70.4813H13.582V111.257H48.893V70.4813Z",
								fill: "black"
							}),
							u("mask", {
								id: "mask44_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "14",
								y: "71",
								width: "34",
								height: "40",
								children: u("path", {
									d: "M47.771 71.4823H14.582V110.258H47.771V71.4823Z",
									fill: "white"
								})
							}),
							u("g", {
								mask: "url(#mask44_3_4)",
								children: u("rect", {
									x: "14.572",
									y: "71.4403",
									width: "33.6",
									height: "38.88",
									fill: "url(#pattern19_3_4)"
								})
							})
						]
					}), u("g", {
						mask: "url(#mask43_3_4)",
						children: [u("mask", {
							id: "mask45_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "14",
							y: "71",
							width: "34",
							height: "40",
							children: u("path", {
								d: "M47.893 71.4823H14.582V110.258H47.893V71.4823Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask45_3_4)",
							children: [u("mask", {
								id: "mask46_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "14",
								y: "71",
								width: "34",
								height: "40",
								children: [u("mask", {
									id: "mask47_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "14",
									y: "71",
									width: "34",
									height: "40",
									children: u("path", {
										d: "M47.771 71.4823H14.582V110.258H47.771V71.4823Z",
										fill: "white"
									})
								}), u("g", {
									mask: "url(#mask47_3_4)",
									children: u("rect", {
										x: "14.572",
										y: "71.4403",
										width: "33.6",
										height: "38.88",
										fill: "url(#pattern20_3_4)"
									})
								})]
							}), u("g", {
								mask: "url(#mask46_3_4)",
								children: u("rect", {
									x: "14.572",
									y: "71.4403",
									width: "33.6",
									height: "38.88",
									fill: "url(#pattern21_3_4)"
								})
							})]
						})]
					})]
				})]
			}),
			u("mask", {
				id: "mask48_3_4",
				"mask-type": "luminance",
				maskUnits: "userSpaceOnUse",
				x: "125",
				y: "8",
				width: "94",
				height: "56",
				children: u("path", {
					d: "M125.661 8.45928C127.942 10.7313 129.704 11.9483 131.987 14.2213C134.27 16.4943 132.587 15.7693 134.87 18.0433C137.153 20.3173 143.357 26.6523 145.638 28.9263L152.484 35.7483C157.168 40.4183 161.852 45.0886 166.537 49.7593C169.676 52.8883 195.246 63.2123 200.662 63.2123H218.65C217.243 60.3376 215.709 57.5483 214.05 54.8443C212.391 52.1403 210.619 49.5356 208.734 47.0303C206.85 44.5233 203.234 42.3453 201.708 39.6303C200.48 37.1204 198.805 34.8549 196.766 32.9443C191.916 28.5443 187.901 24.9373 182.297 21.6143C176.682 18.2811 170.736 15.5387 164.555 13.4313C158.49 11.2996 152.209 9.84047 145.826 9.08028C142.258 8.66563 138.669 8.45828 135.077 8.45928H125.661Z",
					fill: "white"
				})
			}),
			u("g", {
				mask: "url(#mask48_3_4)",
				children: [u("mask", {
					id: "mask49_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "125",
					y: "8",
					width: "94",
					height: "56",
					children: [u("mask", {
						id: "mask50_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "125",
						y: "8",
						width: "94",
						height: "56",
						children: u("path", {
							d: "M218.652 8.45828H125.661V63.2133H218.652V8.45828Z",
							fill: "white"
						})
					}), u("g", {
						mask: "url(#mask50_3_4)",
						children: u("rect", {
							x: "125.452",
							y: "8.08028",
							width: "93.6",
							height: "55.2",
							fill: "url(#pattern22_3_4)"
						})
					})]
				}), u("g", {
					mask: "url(#mask49_3_4)",
					children: [u("mask", {
						id: "mask51_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "124",
						y: "7",
						width: "96",
						height: "58",
						children: [
							u("path", {
								d: "M219.65 7.45928H124.661V64.2123H219.65V7.45928Z",
								fill: "black"
							}),
							u("mask", {
								id: "mask52_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "125",
								y: "8",
								width: "94",
								height: "56",
								children: u("path", {
									d: "M218.652 8.45828H125.661V63.2133H218.652V8.45828Z",
									fill: "white"
								})
							}),
							u("g", {
								mask: "url(#mask52_3_4)",
								children: u("rect", {
									x: "125.452",
									y: "8.08028",
									width: "93.6",
									height: "55.2",
									fill: "url(#pattern23_3_4)"
								})
							})
						]
					}), u("g", {
						mask: "url(#mask51_3_4)",
						children: [u("mask", {
							id: "mask53_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "125",
							y: "8",
							width: "94",
							height: "56",
							children: u("path", {
								d: "M218.65 8.46028H125.661V63.2133H218.65V8.46028Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask53_3_4)",
							children: [u("mask", {
								id: "mask54_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "125",
								y: "8",
								width: "94",
								height: "56",
								children: [u("mask", {
									id: "mask55_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "125",
									y: "8",
									width: "94",
									height: "56",
									children: u("path", {
										d: "M218.652 8.45828H125.661V63.2133H218.652V8.45828Z",
										fill: "white"
									})
								}), u("g", {
									mask: "url(#mask55_3_4)",
									children: u("rect", {
										x: "125.452",
										y: "8.08028",
										width: "93.6",
										height: "55.2",
										fill: "url(#pattern24_3_4)"
									})
								})]
							}), u("g", {
								mask: "url(#mask54_3_4)",
								children: u("rect", {
									x: "125.452",
									y: "8.08028",
									width: "93.6",
									height: "55.2",
									fill: "url(#pattern25_3_4)"
								})
							})]
						})]
					})]
				})]
			}),
			u("g", {
				"mix-blend-mode": "overlay",
				opacity: "0.15",
				children: [u("mask", {
					id: "mask56_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "31",
					y: "164",
					width: "49",
					height: "14",
					children: u("path", {
						d: "M31.871 166.865C37.149 170.11 51.758 175.423 62.251 176.749C68.916 177.593 76.239 177.354 79.825 176.467L74.338 173.3C69.9956 173.542 65.6404 173.408 61.321 172.9C51.8003 171.313 42.5471 168.407 33.828 164.267L31.871 166.865Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask56_3_4)",
					children: [u("mask", {
						id: "mask57_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "22",
						y: "154",
						width: "68",
						height: "33",
						children: [u("mask", {
							id: "mask58_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "22",
							y: "154",
							width: "68",
							height: "33",
							children: u("path", {
								d: "M89.229 154.863H22.468V186.677H89.229V154.863Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask58_3_4)",
							children: u("rect", {
								x: "22.252",
								y: "154.48",
								width: "67.2",
								height: "32.64",
								fill: "url(#pattern26_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask57_3_4)",
						children: [u("mask", {
							id: "mask59_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "22",
							y: "154",
							width: "68",
							height: "33",
							children: [
								u("path", {
									d: "M80.826 163.266H30.871V178.593H80.826V163.266Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask60_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "22",
									y: "154",
									width: "68",
									height: "33",
									children: u("path", {
										d: "M89.229 154.863H22.468V186.677H89.229V154.863Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask60_3_4)",
									children: u("rect", {
										x: "22.252",
										y: "154.48",
										width: "67.2",
										height: "32.64",
										fill: "url(#pattern27_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask59_3_4)",
							children: [u("mask", {
								id: "mask61_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "31",
								y: "164",
								width: "49",
								height: "14",
								children: u("path", {
									d: "M79.825 164.266H31.87V177.594H79.825V164.266Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask61_3_4)",
								children: [u("mask", {
									id: "mask62_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "22",
									y: "154",
									width: "68",
									height: "33",
									children: [u("mask", {
										id: "mask63_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "22",
										y: "154",
										width: "68",
										height: "33",
										children: u("path", {
											d: "M89.229 154.863H22.468V186.677H89.229V154.863Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask63_3_4)",
										children: u("rect", {
											x: "22.252",
											y: "154.48",
											width: "67.2",
											height: "32.64",
											fill: "url(#pattern28_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask62_3_4)",
									children: u("rect", {
										x: "31.852",
										y: "164.08",
										width: "48",
										height: "13.92",
										fill: "url(#pattern29_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("g", {
				"mix-blend-mode": "overlay",
				opacity: "0.15",
				children: [u("mask", {
					id: "mask64_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "28",
					y: "169",
					width: "67",
					height: "20",
					children: u("path", {
						d: "M28.476 171.92C36.418 178.611 53.042 187.731 66.103 188.083C79.164 188.435 90.496 185.516 94.972 182.94L86.821 179.671C86.821 179.671 80.446 182.419 67.829 181.93C56.254 181.482 39.805 175.156 30.242 169.447L28.476 171.92Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask64_3_4)",
					children: [u("mask", {
						id: "mask65_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "19",
						y: "160",
						width: "86",
						height: "38",
						children: [u("mask", {
							id: "mask66_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "19",
							y: "160",
							width: "86",
							height: "38",
							children: u("path", {
								d: "M104.374 160.044H19.071V197.516H104.374V160.044Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask66_3_4)",
							children: u("rect", {
								x: "18.892",
								y: "159.76",
								width: "85.92",
								height: "37.92",
								fill: "url(#pattern30_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask65_3_4)",
						children: [u("mask", {
							id: "mask67_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "19",
							y: "160",
							width: "86",
							height: "38",
							children: [
								u("path", {
									d: "M95.972 168.446H27.476V189.438H95.972V168.446Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask68_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "19",
									y: "160",
									width: "86",
									height: "38",
									children: u("path", {
										d: "M104.374 160.044H19.071V197.516H104.374V160.044Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask68_3_4)",
									children: u("rect", {
										x: "18.892",
										y: "159.76",
										width: "85.92",
										height: "37.92",
										fill: "url(#pattern31_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask67_3_4)",
							children: [u("mask", {
								id: "mask69_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "28",
								y: "169",
								width: "67",
								height: "20",
								children: u("path", {
									d: "M94.972 169.447H28.476V188.439H94.972V169.447Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask69_3_4)",
								children: [u("mask", {
									id: "mask70_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "19",
									y: "160",
									width: "86",
									height: "38",
									children: [u("mask", {
										id: "mask71_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "19",
										y: "160",
										width: "86",
										height: "38",
										children: u("path", {
											d: "M104.374 160.044H19.071V197.516H104.374V160.044Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask71_3_4)",
										children: u("rect", {
											x: "18.892",
											y: "159.76",
											width: "85.92",
											height: "37.92",
											fill: "url(#pattern32_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask70_3_4)",
									children: u("rect", {
										x: "28.012",
										y: "169.36",
										width: "67.2",
										height: "19.2",
										fill: "url(#pattern33_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("g", {
				"mix-blend-mode": "overlay",
				opacity: "0.15",
				children: [u("mask", {
					id: "mask72_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "93",
					y: "157",
					width: "30",
					height: "16",
					children: u("path", {
						d: "M117.236 157.892C109.89 162.75 101.945 166.634 93.6 169.447L99.073 172.183C107.258 168.226 115.015 163.437 122.221 157.892H117.236Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask72_3_4)",
					children: [u("mask", {
						id: "mask73_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "84",
						y: "148",
						width: "48",
						height: "34",
						children: [u("mask", {
							id: "mask74_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "84",
							y: "148",
							width: "48",
							height: "34",
							children: u("path", {
								d: "M131.62 148.488H84.192V181.586H131.62V148.488Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask74_3_4)",
							children: u("rect", {
								x: "84.172",
								y: "148.24",
								width: "47.52",
								height: "33.6",
								fill: "url(#pattern34_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask73_3_4)",
						children: [u("mask", {
							id: "mask75_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "84",
							y: "148",
							width: "48",
							height: "34",
							children: [
								u("path", {
									d: "M123.216 156.892H92.595V173.183H123.216V156.892Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask76_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "84",
									y: "148",
									width: "48",
									height: "34",
									children: u("path", {
										d: "M131.62 148.488H84.192V181.586H131.62V148.488Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask76_3_4)",
									children: u("rect", {
										x: "84.172",
										y: "148.24",
										width: "47.52",
										height: "33.6",
										fill: "url(#pattern35_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask75_3_4)",
							children: [u("mask", {
								id: "mask77_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "93",
								y: "157",
								width: "30",
								height: "16",
								children: u("path", {
									d: "M122.216 157.893H93.595V172.184H122.216V157.893Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask77_3_4)",
								children: [u("mask", {
									id: "mask78_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "84",
									y: "148",
									width: "48",
									height: "34",
									children: [u("mask", {
										id: "mask79_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "84",
										y: "148",
										width: "48",
										height: "34",
										children: u("path", {
											d: "M131.62 148.488H84.192V181.586H131.62V148.488Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask79_3_4)",
										children: u("rect", {
											x: "84.172",
											y: "148.24",
											width: "47.52",
											height: "33.6",
											fill: "url(#pattern36_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask78_3_4)",
									children: u("rect", {
										x: "93.292",
										y: "157.84",
										width: "29.28",
										height: "14.4",
										fill: "url(#pattern37_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("g", {
				"mix-blend-mode": "overlay",
				opacity: "0.15",
				children: [u("mask", {
					id: "mask80_3_4",
					"mask-type": "luminance",
					maskUnits: "userSpaceOnUse",
					x: "106",
					y: "155",
					width: "23",
					height: "18",
					children: u("path", {
						d: "M116.638 170.507L106.212 172.367C114.035 167.967 122.092 161.195 128.348 155.237C126.221 160.457 121.438 166.479 116.638 170.507Z",
						fill: "white"
					})
				}), u("g", {
					mask: "url(#mask80_3_4)",
					children: [u("mask", {
						id: "mask81_3_4",
						"mask-type": "luminance",
						maskUnits: "userSpaceOnUse",
						x: "96",
						y: "145",
						width: "42",
						height: "37",
						children: [u("mask", {
							id: "mask82_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "96",
							y: "145",
							width: "42",
							height: "37",
							children: u("path", {
								d: "M137.751 145.832H96.807V181.77H137.751V145.832Z",
								fill: "white"
							})
						}), u("g", {
							mask: "url(#mask82_3_4)",
							children: u("rect", {
								x: "96.652",
								y: "145.36",
								width: "41.28",
								height: "36.48",
								fill: "url(#pattern38_3_4)"
							})
						})]
					}), u("g", {
						mask: "url(#mask81_3_4)",
						children: [u("mask", {
							id: "mask83_3_4",
							"mask-type": "luminance",
							maskUnits: "userSpaceOnUse",
							x: "96",
							y: "145",
							width: "42",
							height: "37",
							children: [
								u("path", {
									d: "M129.349 154.237H105.212V173.368H129.349V154.237Z",
									fill: "black"
								}),
								u("mask", {
									id: "mask84_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "96",
									y: "145",
									width: "42",
									height: "37",
									children: u("path", {
										d: "M137.751 145.832H96.807V181.77H137.751V145.832Z",
										fill: "white"
									})
								}),
								u("g", {
									mask: "url(#mask84_3_4)",
									children: u("rect", {
										x: "96.652",
										y: "145.36",
										width: "41.28",
										height: "36.48",
										fill: "url(#pattern39_3_4)"
									})
								})
							]
						}), u("g", {
							mask: "url(#mask83_3_4)",
							children: [u("mask", {
								id: "mask85_3_4",
								"mask-type": "luminance",
								maskUnits: "userSpaceOnUse",
								x: "106",
								y: "155",
								width: "23",
								height: "18",
								children: u("path", {
									d: "M128.348 155.237H106.212V172.367H128.348V155.237Z",
									fill: "white"
								})
							}), u("g", {
								mask: "url(#mask85_3_4)",
								children: [u("mask", {
									id: "mask86_3_4",
									"mask-type": "luminance",
									maskUnits: "userSpaceOnUse",
									x: "96",
									y: "145",
									width: "42",
									height: "37",
									children: [u("mask", {
										id: "mask87_3_4",
										"mask-type": "luminance",
										maskUnits: "userSpaceOnUse",
										x: "96",
										y: "145",
										width: "42",
										height: "37",
										children: u("path", {
											d: "M137.751 145.832H96.807V181.77H137.751V145.832Z",
											fill: "white"
										})
									}), u("g", {
										mask: "url(#mask87_3_4)",
										children: u("rect", {
											x: "96.652",
											y: "145.36",
											width: "41.28",
											height: "36.48",
											fill: "url(#pattern40_3_4)"
										})
									})]
								}), u("g", {
									mask: "url(#mask86_3_4)",
									children: u("rect", {
										x: "105.772",
										y: "154.96",
										width: "23.04",
										height: "17.76",
										fill: "url(#pattern41_3_4)"
									})
								})]
							})]
						})]
					})]
				})]
			}),
			u("defs", { children: [
				u("pattern", {
					id: "pattern0_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image0_3_4",
						transform: "scale(0.00371747)"
					})
				}),
				u("pattern", {
					id: "pattern1_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image1_3_4",
						transform: "scale(0.00306748 0.00261097)"
					})
				}),
				u("pattern", {
					id: "pattern2_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image2_3_4",
						transform: "scale(0.00568182 0.0031746)"
					})
				}),
				u("pattern", {
					id: "pattern3_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image2_3_4",
						transform: "scale(0.00568182 0.0031746)"
					})
				}),
				u("pattern", {
					id: "pattern4_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image2_3_4",
						transform: "scale(0.00568182 0.0031746)"
					})
				}),
				u("pattern", {
					id: "pattern5_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image3_3_4",
						transform: "scale(0.00735294 0.00361011)"
					})
				}),
				u("pattern", {
					id: "pattern6_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image4_3_4",
						transform: "scale(0.00675676 0.00327869)"
					})
				}),
				u("pattern", {
					id: "pattern7_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image4_3_4",
						transform: "scale(0.00675676 0.00327869)"
					})
				}),
				u("pattern", {
					id: "pattern8_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image4_3_4",
						transform: "scale(0.00675676 0.00327869)"
					})
				}),
				u("pattern", {
					id: "pattern9_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image5_3_4",
						transform: "scale(0.00917431 0.00374532)"
					})
				}),
				u("pattern", {
					id: "pattern10_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image6_3_4",
						transform: "scale(0.00137363 0.00137174)"
					})
				}),
				u("pattern", {
					id: "pattern11_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image6_3_4",
						transform: "scale(0.00137363 0.00137174)"
					})
				}),
				u("pattern", {
					id: "pattern12_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image6_3_4",
						transform: "scale(0.00137363 0.00137174)"
					})
				}),
				u("pattern", {
					id: "pattern13_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image7_3_4",
						transform: "scale(0.00137363 0.00137174)"
					})
				}),
				u("pattern", {
					id: "pattern14_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image8_3_4",
						transform: "scale(0.00465116 0.00531915)"
					})
				}),
				u("pattern", {
					id: "pattern15_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image8_3_4",
						transform: "scale(0.00465116 0.00531915)"
					})
				}),
				u("pattern", {
					id: "pattern16_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image8_3_4",
						transform: "scale(0.00465116 0.00531915)"
					})
				}),
				u("pattern", {
					id: "pattern17_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image9_3_4",
						transform: "scale(0.00546448 0.00671141)"
					})
				}),
				u("pattern", {
					id: "pattern18_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image10_3_4",
						transform: "scale(0.0142857 0.0123457)"
					})
				}),
				u("pattern", {
					id: "pattern19_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image10_3_4",
						transform: "scale(0.0142857 0.0123457)"
					})
				}),
				u("pattern", {
					id: "pattern20_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image10_3_4",
						transform: "scale(0.0142857 0.0123457)"
					})
				}),
				u("pattern", {
					id: "pattern21_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image11_3_4",
						transform: "scale(0.0142857 0.0123457)"
					})
				}),
				u("pattern", {
					id: "pattern22_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image12_3_4",
						transform: "scale(0.00512821 0.00869565)"
					})
				}),
				u("pattern", {
					id: "pattern23_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image12_3_4",
						transform: "scale(0.00512821 0.00869565)"
					})
				}),
				u("pattern", {
					id: "pattern24_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image12_3_4",
						transform: "scale(0.00512821 0.00869565)"
					})
				}),
				u("pattern", {
					id: "pattern25_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image13_3_4",
						transform: "scale(0.00512821 0.00869565)"
					})
				}),
				u("pattern", {
					id: "pattern26_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image14_3_4",
						transform: "scale(0.00714286 0.0147059)"
					})
				}),
				u("pattern", {
					id: "pattern27_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image14_3_4",
						transform: "scale(0.00714286 0.0147059)"
					})
				}),
				u("pattern", {
					id: "pattern28_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image14_3_4",
						transform: "scale(0.00714286 0.0147059)"
					})
				}),
				u("pattern", {
					id: "pattern29_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image15_3_4",
						transform: "scale(0.01 0.0344828)"
					})
				}),
				u("pattern", {
					id: "pattern30_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image16_3_4",
						transform: "scale(0.00558659 0.0126582)"
					})
				}),
				u("pattern", {
					id: "pattern31_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image16_3_4",
						transform: "scale(0.00558659 0.0126582)"
					})
				}),
				u("pattern", {
					id: "pattern32_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image16_3_4",
						transform: "scale(0.00558659 0.0126582)"
					})
				}),
				u("pattern", {
					id: "pattern33_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image17_3_4",
						transform: "scale(0.00714286 0.025)"
					})
				}),
				u("pattern", {
					id: "pattern34_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image18_3_4",
						transform: "scale(0.010101 0.0142857)"
					})
				}),
				u("pattern", {
					id: "pattern35_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image18_3_4",
						transform: "scale(0.010101 0.0142857)"
					})
				}),
				u("pattern", {
					id: "pattern36_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image18_3_4",
						transform: "scale(0.010101 0.0142857)"
					})
				}),
				u("pattern", {
					id: "pattern37_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image19_3_4",
						transform: "scale(0.0163934 0.0333333)"
					})
				}),
				u("pattern", {
					id: "pattern38_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image20_3_4",
						transform: "scale(0.0116279 0.0131579)"
					})
				}),
				u("pattern", {
					id: "pattern39_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image20_3_4",
						transform: "scale(0.0116279 0.0131579)"
					})
				}),
				u("pattern", {
					id: "pattern40_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image20_3_4",
						transform: "scale(0.0116279 0.0131579)"
					})
				}),
				u("pattern", {
					id: "pattern41_3_4",
					patternContentUnits: "objectBoundingBox",
					width: "1",
					height: "1",
					children: u("use", {
						"xlink:href": "#image21_3_4",
						transform: "scale(0.0208333 0.027027)"
					})
				}),
				u("linearGradient", {
					id: "paint0_linear_3_4",
					x1: "72.527",
					y1: "31.6787",
					x2: "78.4077",
					y2: "31.6787",
					gradientUnits: "userSpaceOnUse",
					children: [
						u("stop", { "stop-color": "white" }),
						u("stop", {
							offset: "0.94",
							"stop-color": "#404040"
						}),
						u("stop", {
							offset: "1",
							"stop-color": "#404040"
						})
					]
				}),
				u("linearGradient", {
					id: "paint1_linear_3_4",
					x1: "72.527",
					y1: "31.6787",
					x2: "78.4077",
					y2: "31.6787",
					gradientUnits: "userSpaceOnUse",
					children: [
						u("stop", {}),
						u("stop", { offset: "0.94" }),
						u("stop", { offset: "1" })
					]
				}),
				u("radialGradient", {
					id: "paint2_radial_3_4",
					cx: "0",
					cy: "0",
					r: "1",
					gradientUnits: "userSpaceOnUse",
					gradientTransform: "translate(76.2106 127.863) rotate(180) scale(67.7329 71.2466)",
					children: [
						u("stop", {}),
						u("stop", { offset: "0.831" }),
						u("stop", {
							offset: "0.887",
							"stop-color": "#787878"
						}),
						u("stop", {
							offset: "0.935",
							"stop-color": "#D9D9D9"
						}),
						u("stop", {
							offset: "0.956",
							"stop-color": "white"
						}),
						u("stop", {
							offset: "1",
							"stop-color": "white"
						})
					]
				}),
				u("radialGradient", {
					id: "paint3_radial_3_4",
					cx: "0",
					cy: "0",
					r: "1",
					gradientUnits: "userSpaceOnUse",
					gradientTransform: "translate(76.2106 127.861) rotate(180) scale(67.7329 71.2466)",
					children: [
						u("stop", {}),
						u("stop", { offset: "0.831" }),
						u("stop", { offset: "0.956" }),
						u("stop", { offset: "1" })
					]
				}),
				u("image", {
					id: "image0_3_4",
					width: "269",
					height: "269",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image1_3_4",
					width: "326",
					height: "383",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image2_3_4",
					width: "176",
					height: "315",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image3_3_4",
					width: "136",
					height: "277",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIgAAAEVCAYAAAA7Na17AAAACXBIWXMAABcRAAAXEQHKJvM/AAACjklEQVR4Xu3SMQHAIBDAwFL/nh8FBAHczRmzZmY+OPhvAW8zCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQDEIyCMkgJIOQNqT2BiYmcIjjAAAAAElFTkSuQmCC"
				}),
				u("image", {
					id: "image4_3_4",
					width: "148",
					height: "305",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAAExCAYAAACamos9AAAACXBIWXMAABcRAAAXEQHKJvM/AAAgAElEQVR4Xu2dS6gsV/XGV1X3OefeRI0aVCJqjM9oyDsxXnOTnICCjhTMQDEOhICIgwwkgq88Bk4cKCKKoBERHfhC4wMHit6IBMWREAQFowSDQSVgEO+595zu+g/u/+v++qu19t7dp9/dH2xq137Vrtq/WmvX7uruqmmaxibUQw89ZGfOnLFHH310kFZV1SC+v79vd9xxxyBstf6qxgUKEJ05c2aQxhBpnMOnPvUpq6rKPvGJT9hW66lioO68884RiFiAKAKrrusWXHfccYfddttt9vGPf7zV3larqyxQZ86csTvvvDNVZCKgOO22226z2267zU6fPm2nT59utb/V6igJ1EMPPWQPPvhglD2QApVyexFUCLfffrudPn3a7rvvPvdYWy23QqBSLk41DaAQr+va6rq2Tqdj9913n506dcpOnTrlHner5ZML1DgwmcVAMVg5tweQqqqyTqdjnU5nANatt95q9957r91yyy3tg2+1VKo1AU9x8xBYTlmxqqrst7/9rd1999125ZVX2he/+MVMq1stUiMWqmQC7ilnoVIuT10dB7VUHL/lllvsQx/6kN14441+p7ZaiEaAGtfVQRFAnB/BlIJKIfLSbr75ZvvgBz9o119/vdu3rearAVCTwmQ2voWKIOL9lHVCvNvtDvZvuukm+8AHPmDXXXed38mt5qIBUGxRxlUJUGbWgmZcC8VxwMRQdTodu+GGG+z973+/XXPNNU5Pt5q1qqZpmknnTlAOJAYqCuMApRApXN1u16699lr79Kc/7fR2q1mqNrORD3dnKXZ7Xl60z2BGMGr44x//aHfddZd973vfs63mp6ppmuY47s4sb5kQh4UptVIlLi6Vznnvfve77V3vele781tNVfWkE3FPeGDUreZH8iwNIMulc32v/COPPGL33HOP/fnPf072YavjqXPFFVc8OA2oIqvEW7ZCETwMBc+dvPmUpvHWq7+zs2O/+93v7C9/+Ytdeuml9sIXvrB9IlsdS62V8knlWSUvjYFLieHSfU43a3+sE7lUlH3iiSfsy1/+sv3iF79wj73V5JoaUGZpqBSknIVKWS4Fxyvjzdc07Ze//KV97Wtfs7/97W+21XQ0VaDMYqhy8ytP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"
				}),
				u("image", {
					id: "image5_3_4",
					width: "109",
					height: "267",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image6_3_4",
					width: "728",
					height: "729",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAtgAAALZCAYAAACNj1agAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4Xuyd61bjOtNulQPQvd77v9VvrSYH7x+9CypPqkpyCMRJ5hxDw7JsaKCtaOahbFbTNE0NAAAAAACuwrp3AgAAAAAAjINgAwAAAABcEQQbAAAAAOCKINgAAAAAAFcEwQYAAAAAuCIINgAAAADAFUGwAQAAAACuCIINAAAAAHBFEGwAAAAAgCuCYAMAAAAAXBEEGwAAAADgiiDYAAAAAABXBMEGAAAAALgiCDYAAAAAwBVBsAEAAAAArgiCDQAAAABwRRBsAAAAAIArgmADAAAAAFwRBBsAAAAA4Iog2AAAAAAAVwTBBgAAAAC4Igg2AAAAAMAVQbABAAAAAK4Igg0AAAAAcEUQbAAAAACAK4JgAwAAAABcEQQbAAAAAOCKINgAAAAAAFcEwQYAAAAAuCIINgAAAADAFUGwAQAAAACuCIINAAAAAHBFEGwAAAAAgCuCYAMAAAAAXBEEGwAAAADgiiDYAAAAAABXBMEGAAAAALgiCDYAAAAAwBVBsAEAAAAArgiCDQAAAABwRRBsAAAAAIArgmADAAAAAFwRBBsAAAAA4Iog2AAAAAAAVwTBBgAAAAC4Igg2AAAAAMAVQbABAAAAAK7ItncCAAD8PNM0hVvrW9PztV+xWq3C/dVq9dGiY9HHAgDAJwg2AMAPoWJ8PB5PxnRfz9d+tNV+xYhAe9H24q1tvV6f9KOPBQB4FhBsAIBvYLfbtdb+SvThcGjH4/FEoEflurVzMY9EW/vZWCS6mWhnifaIZPv99Xr90fx+9G8BADwCCDYAwBc4HA5tv9+3aZra+/v7iUhrX0W6Sqx7sm19v9X+CJlc27Yn1T3R9lKtcu3F27fNZnPy+QAA7g0EGwBgkD9//nyI8X///fch0L55sc7kOkuvWztNq+fIdSTWmWxH0hrJtW0jyW6thSl0T65VrCvRNtnebDZnH4N4A8CSQbABAIT9fv+RSu92u/b+/n5S5jHSvGirSEeSPSLWI3KdSXWGF9WeZEf7WYtEO5PskeYl20u3H0e6AWApINgA8NSYTB+Px/bvv/9+iLQXapVr3fcyPVeuj8dja62F0m3jWT/aGj3RVhntyXXW99Lc2meq3ZPsSLQj8Vax1r7fbrfbEwH3Xy8AwE+CYAPA02AlHppKHw6HM7GORDtrKth+LNpGMq2ttfHkOpPpbDyTzkqybZtJtrZIriPJzsS6apFca6qtbbvdfvw7AADfDYINAA+HF+M/f/58CHTWVLJVrA+Hw4cUW9+Oq1z7/Uike2I9V66r/ghetlW8Vab92Ihkq1RHsq3yHI1ZGj2SZo82S7sRbgD4DhBsALhrTHanafpIpff7/ZlE+zEV6iq17iXYkVB7iY76rbW0n4m29XXM/xyifkVPrm1b9f2+yeocyfbHorQ6ku1ov0q1Vax138YQbgC4Fgg2ANwVJqomzSbOuu2J9XfJdSTW0X7U/Pfnv99IsP3Wn6tEY5lM65iXZx2z/UyqRyU7E+45oq1SnfUjyda+7VvCHf1sAAB6INgAsHgyoY6kOkqvtXnRzuS617w0Z9tRsVaJjvaNSLg90VhFJte2VaHWY9H+qGh7mc62vq1Wp2UikWBXcr1erz/EOZLsaKsJNwDACAg2ACyS4/HY9vt92+12J0J9iWB7oY7EelSuTZgryc7EWvftexwR60ioK8muxo0smfXCnI2pWLfWPuSzEms7LxLuSq4j2c5almLrE0aqRFsF2/dfXl4+Pmf2MwQAQLABYBGYhJpUe6FWqc7KQbKxKrVWwZ6mz5ruSrQjuY6OVa21v5Jt338l29XW0xNrJZLESKh1q5I9Ktoq1pVkR6K92Ww+xrWvop0Jd9ayBFvTbN9eXl6QbQA4A8EGgJthMmvSHIl1llqPJNcq034skutMprWv20ymRyQ7kuYRob6GZI/IdTQWiXUk3yNyHY37bdWPWiba6/V4il3JdiXadi6yDQAINgD8KF6qvVCPyHW0VcE+Hv+m4CrWkUyPinUm1yN9+56PxzqpHhHtqh/tj6JCGMm172eCXe37lFclu9ePxHpUtL1g69hoij0q2ibZyDYAINgA8O2YYJpE6zaSbE2se4KdJdaZaPeaF+yoH0n1nGY/l14/OqY/22q/RySAPanWbSTWemxOy8Q66+tYlWKbSPdEu5LrTLRNrFW2KSMBeD4QbAD4NkyqrY2m1l6uR8Ta5HlUrHXfC/RXpLon263lqbUKdCTZvf41iOQ664+KdTQWCfWlsl2NRYIdyfWoaGeCvdlsUsH2om2yDQCPDYINAFfFBNb+HHmUWFflIFV6nbWeYGs/EupIrlWcVaB7Qp211trZvo1V26pfjfXQZHVErKOt9UfFumpeuqO+bq0cw7aVaFdb39br88f6VQm2SbaXbRVs67++vn78GwDweCDYAPBlpmn6kOoosR4V60qqbd/LdCTZkVCPtEikI8nOxDqTbfv52DaSbD0n2vqfddS/Jplg+/1qO9rPhLon2jrmx6N9n2D3hFvFOkuzM8nOmgq2NntjAACPAYINABdzPP69ofD9/b0r1yOC3UurI8n2Mq1SXUm2SfEcuc7EurXz0o9RmY6EOZLrnlh/VbYjueuJtsp1Nt6Ta388Eu1IrCO5roQ7EutKtCO5jmS7SrRVsKNEO2rrNak2wL2DYAPALKbpM60eEetIqqubGedI9SXJtRfrTKazcfv+I9n2xy6V60q2dbx3bA6RPPeORedkQh2NRXIdjZtsjsq1inUl2qOCHcm2T7J7su1rs0ck+/X1lVQb4M5BsAFgiOPx84/ARGIdSXYvudbEukqvs7Q6S69HpDrrR6IcjdvPpbW8/GNUsrOtkY3r8UvJRC4S6mi8J9f+WCbU0ZhKdTaWCfc1Rdu39fq8LjuTbS/YmmRHom2Cbf3t9m+5CgDcDwg2AJREaXUm2CrUI2LttybxJss2Vgm29aep/guM0XgkztF+a6ciHUl1JNY9kY6kOeuP7F+LTKaj/aifSfYcsW7t9NnZJpgq2dl+Jtar1fkNkX5byXYl3JFsR6l2VCoykmb7VBsAlg+CDQBnmKy+v78Pi3WvLMQkejS59mI9J63uybWKdDQ22lprHx9jPzftR2Ltt72x0f1rc4lkV2M90db9Oc1LdtTPZLvX5kp2JNtRvyfZ2+32JMVW0bYnkOj/CQAsh9X03a/SAHA3TNN0ItPXkGtNqXtincm1tUvlOtpqv9eOx/yGRj9u/Tnb0X60r/SOGz1B0+ORQGf9OVvt2/56vf4Yt74X6FHZjrbW96l1NKbHL5HsSLp982I9Ktl+2/t/BICfhwQbANrxeDyRaC/XVb21yvVXUutIqr1MV2Jtx0yCI6FWkY7E2gS6ku7W4qQ66mdjejw7Fu1X8lwdq6gEba5k61bHsvNUrqN+1iLp1rFIrqN+JNU6Nppo98pFItH2kv3+/t4tGbFE++WFp48ALAkEG+CJOR6PZzKtYm1/LMb2vVRnYj0q1VVyHQl0tK8CnQm2inS1r621lu5H/Wos2mp/7th34kV5dKySaNv2xiK51v2oebHOJNsLddaPRDvbV7Ferz9vgKwS7VHRriRb+6+vr4g2wAKgRATgCTkcDidC7Vsvtc5KQark2sv18Xg8GY+kejS5HpXqqB9JdWvtbCwa9/u9vt9W/Wh/zth34KV5zpjfj/qjUu370X42Fsm09qtt1XqSHQn3JZLtRdsk2vp+zIu17m823BAJcCsQbIAn4nA4lFKtNdeWXPvtqFyPpNZeoCOpjuTa5DgTbJXnSqij1tq5ZPfGrO+3l/RH9kePfYVIorNj1f6cfk+u54xFrZJs60eSrfsq2VE/E+xLRDtLsyvR1oZoA/w8CDbAE5CJtUp2lV5nQr3b7U5EOpLsEbGupLoS6t52bmutn2Jb32+jseiY9kf2s7E5x3t46R09rmPVftTXbXYsE+lobLRFybVuM8HuyXaUZq/XddlIJNsvL38fy1eVjHjRztLst7c3RBvgh0GwAR6YEbH2CbYl1VEpSCbZJtMjqbUJ9FypzsQ6kulLxdq31s5lOhLk3na0H+33xiPmnKt4ya3IztPxSJqzvo5V5/jjPYkebT259mMjsp2Jtm01wf5qmu3rsqs0G9EG+DkQbIAHJBLrP3/+lIn1iFj7tDoqCYnEOpLqOWIdJdM/KdZztr2xbH/O2Jzjl+IFd/T4yFglztHYyFb7lzYTad+/VLQjuc72I+G2rSbYPdH2yXUm2ibZiDbA94JgAzwQx+MxlGm/r1JtfRNoFWq/reTa+l6ivyLW0zSWWEf7c1pruVRHY37bG4v29Vg2NnLsFnghHjkWCXR1rBpTma7GLmlesv1+JNe6n0l2JdtVqq2SrXKdibaWiESi7SX77e2trdc8dQTg2iDYAA/A8fj3OdYm0l6orZ+JdVRnbfuHw+FErm3Mi7aKdCTZkVTrvolyJdm2r5I8V7Bby0U6Oh5tL+lXYyPHlDnnzkFFuEd2fjQeCfRIv9pmfT820lSwdSwT62jMC7bfr2Q7S7RVslWuszQ7E20VbOsj2gDXA8EGuGOmafoQ60iqtSSkEmuV7KgkJBPrLK32Ej2SWo9I9SWCbT+rrF+N+W1vLNvPxkaOzTnnO/HSe8k50TEd8/sqytFYJtMj/UsE2+9XYp01L9yZXGvzcm1bLR3RVFtLRt7e3s5E28Q6ku3q/xEAxkCwAe6QaZrafr8/Eesqtc7EWktAVLDniHVPqn3fpDgTbJXmOYJtPx/tV8es77e9Me1H+9lYNT56XJl7vjJXqnrnZ8ejcR3L9nWbHRvt6/4cwfb9SKajcRXsUdH2cu1T7dFE25eH6L4KtrXtdtv9PwaAHAQb4M4wsTaRjgQ7Sq+tvb+/h1IdlYSoZPdaJdW9xLoS6Z5gqzBXEq3S3Ntqf2Q/G7tkXBk971qMSlZ23pxxHav2I7HOtlU/2s+EWve9SOu217xgzxFtL9k9wfaiHcm1pdsq2L6/3fIHnwEugZkDcCccj8cPoVapHpXr0dTaRNvL80hZyKhUe6EeEelMqkdkuifQPaHuyXQkvCPnjBxbAqNfnz/Pi3BvXMdG9/Xj52znSPbxeBwW7DmSfTgcZov2fr8P5Xq73X4ci7Y2719fXz/eZFvZyH6//9jX83a7HY/2A7gQBBtg4UzTdJJWR+l1Jta29YtsrxwkSqz3+783Luq4CbLu99o0zU+t7WehTcf9vvVHttqfcyzaz8ZGuPTjboEXYCP7+m28Eu1L9lerVfi5M6mOxnqi3Vpr6/X6RLh7gv0don04HE5kW4V7t9t9iLOK9n6//0i0re+3kWDb/q9fv6jPBpgBgg2wYHa73YlYX1IScqlYZ5J9aWptolyJ9ahUezmOxka2o/1L9jNGz7snRr4nlbLoY6bpPK1u7Vyko/N7ff+5ItH2xyrR9p/by3ZPsEdF2wu0bb1sb7fbj/Eq0bZ5rqJtzV4DMsHWZun2r1+/qM8GGATBBlggh8MhFOvRJ4XYAvr+/n6ycEaLrIm0yvXxeJ5YZ0JdCfY0nQp0T6x7rbUW7vtxHTO+0o/2I0bOGeFan+e7mCNY1fcSSbVnmvKyED02p68Srccq0Y5k2yRapXuOaHu5jlJtL9eaaNu8VdH2gm3S3UuwM8m2c6w+m7IRgBwEG2BBTNPfcpD//vuvm1r/+fPnI+G2RdCE2qfYkVBb34u1CrYK9Ry5nqY4rc62vWY/m2jMH/Nj1+xH9I5nXPpxS2P0++iJePZ5KvGepr5A9/r2OVWio7FKtL1se7n2fdv320y2fXLtRdvLdJRoZ6J9OBzCUhHfIsH2rxOZdFM2ApCDYAMshP1+H4r1SFlItPj5hTFaVHtiPVeup+lcqr8i1q3lUu370Xak78ei/dFjEXPPf2Sqn0UlZtHHZdI9TXHKreM94c4E2/d7sh2JdpZiZ7LtJdvOszHf98KdibYJtBdu/0b79fU1FW2fWmeibWUjLy8vDQA+QbABbszx+Pl0kNHkWstBKsE+HD4fvXeJWFdS7ds0jQu2SZDuW983P279aHvJWER1TJlzLpyT/fwy8Y7OV7H255o423leoqN+trWPz+Q6GlPRjgQ7GlP59n0v3lWpiG4Ph0P4tJGXl5cT4bbmpdu/dmRv1r1or9f8NUiA1hBsgJsxTX//WMy///6bptZZzbVJtAq2T5l0UbSF1qQ7EmsVbJVqPzZNnxI9KtWjzX4+vl9te2Pa92Tjc8+B65H9vCPxjs6NpHuazqXZ97Pzoo/ribU2+1gv3FmaHQl3JNs2H0dE2+b6drv9kGo/HjUv2ZFc6+uOF+2Xl5fw/wrgmUCwAW7A4XA4S6ytbzIdpdcq1f6GRpVsvxh6mfZjlVhHUt0T6qg/0lpr4f7ItjemZONzz4GfR/9fMonLzvPXiUp2NZZt7XPPFW6T5Ey2M6lWwe6JtpWEaH+z2XyItpaNVJIdvbZE429vb+3Xr19ts+EmSHheEGyAH2Saprbb7dp///33IdResntyHaXWWWI9R67niLVKtN/32znNfja+X217xzzZ+OhxWC7R/10k3f48lW3rqzhnx7LtHMH2H5eJtAq3nmOibNtItP05vh+JdyTamXhXzb/+/P79mzQbnhYEG+CHOBw+U2uVay/WKtdeqiO5jqS6Emwv0JVgj8p1JNQ9yW6thfvVtndMz8noHYf7Rv9/I2GOjvtr6lLZts83R7jX6/XHnFGp9sJdpdxeriPRtrFMrPf7/VmibU3fkPcEW9uvX79Is+EpQbABvplpOk2tR+RanxDSe1KIbf0CqIuhSnUk1irXtvBnY9bPRDpr9nPJhNlLUHVMz8noHYfHRf/vK+G+pmyPCrY/f7U6TbQjyfb7XrBtq30v3JFk6+tCJtj2OhKVjUSvNzpOmg3PBoIN8I0cDnlqHbVMrLObGbPUSBfGuWI9Kte+ZaLd2vy0Ott6KmmujsFzEwl1dcxfg5lsK16aVaBbi6XbEmr7GBNlO+abPz6aZHvZVonOarX3+/MnjehrSSbWkXSTZsMzgWADfBO73a79+++/J2Kt9db//fffWa21l+pMrEfl2i+AlVT7fiTWfrwn1NpaG0urkWr4aa4l27r1n0Ml2z6fNn+OSbX/eC/UI6KtfS/Px+PxpDbbjvnXhsPhcPbEEf968vr6msq1nquvSTxpBJ4BBBvgyhyPxxOhVrGO2m73+RcZI7HuyfXh8Pn4vShlUqn2Qm37tlhfS6y9jKg097aeaKwaB7gEvZ5UlHXcX7OVbOs2kulKuL1oR5IdibbfV9m2NFvrs1W0VcrntN6bf59mr9c8NxseEwQb4Irs9/swtfb11lp7ndVa+77Jtd/qghWJdSbYI80Wab/1zY+11s6O29icraH7vXGAa+OvtVHZHiESbmutfabbVh7iz4tkOhLtaZpOUm0v1lGLRHtOy1LrTLz9mKXZAI8Ggg1wBaZpau/v7x9yPVJznZWDqFi/v7+niZCX7GoBtMWzJ9VeriOx1n373kfEGqmGe2VUtv21XaXYHi/Q9nkisY5S7Uq0/b7Na9+314TNZvORWquE62vGyGvMJc3+CqT+bADuGQQb4IscDoezcpCqLMQn15lcW1Jt7XD4/HPn2rdm+7rQjcq1F+ieWEdCnQk0Yg2PhF2XkSj78er6zcQ7S7ZVtkdFWyVbBVoTbk2yo7rsuW3kN2x2/Pfv39wACQ8Dgg3wBXa73VlqXSXXJtderKN666zWOlqsfD+Sa02gpmn62GaCfS2xRqrhUfHX6iWpdoQ/Fol2lGL7fk+2p2k6k+rsdWC0Ra89o1Kur2fH47H9+vWrvb6+hj8fgHsCwQa4gGma2p8/f0K5tieDeNH2Mq1ind3QqM2S7EvlOmuRTPu+Nvv+VZ6zMf25KdEYwD3hr+FItqNU2+TYth49Nirafps1LRs5Hs+TbV82ksmxHXt5eTmT7Uul25/z69ev9I0IwD2AYAPM5HD4WxIyN7keEWsv15FoR2IdLWS2f02xjuQ5GvNb7XuycYB7xq7rOam27/sx//GVaK/X65O+zeVe2YidZ+fqa4R/okjU/GtPJdPR+VE4oB/369evtt2iKXCfcOUCzMCXhHjB9mLtBdtLtS8NiQQ7k+pMrqNFrCfV1iKZ1v25Yq3CHAk0Ug3Pgkq1jnuxrqQ6GhtJszPRtrIQa74+2wu3NU2zo9cZ29c0O+tXIu73D4dD+/37NyUjcJcg2AADTFNdEmJibX1/I+NIcj0q11mLFrtMrFWmLxVrPe5/VgpiDc+MSnU05kXby3U1NpJmW9+3Ks32Au5fN3y/euRf9Hpkbb/ft7e3t5PzqvP9OE8ZgXsDwQbocDweTxLrKLnWspCReuv398/H76lcW721LUqVWGdCfTgczhZG24/6Ks0jfY/uZ2MAz4rNh0i0bdzvT1OdbFu/SrNVso/HY5hk27n+NaMn273Xn0iU9WP861j0uubH+TPrcE8g2AAF+/0+FOtIsDW11kfxebHOaq31RsZMrrOFTcdUorN+JtBZ3/D9agwAPvFzJEu1dZ710ls7R9NsG/fC7YU6Kh1R0dZmJSPVOVHT1yd9PcvE238Mf5gG7gUEGyDh/f3vH47xYh39lUZNrX0/q7nOkutIrKOa62zB8q0n1FFrDbEG+Em8VEdjmWhX/fX6758fPx6PoXB7yfZNZbsSbZNs/dPq2etR1aJ/I5Jx21pddu9NB8AtQbABhGn6rLceLQupaq41ta5qrqvUuhJr27eFym+1HzX7vrO+/9lEPy8A+Bo2j64h2sfjp1hnqbaX7OPxvGzE12ZnQp695vSEOmqaWI8ECTzKD5YMgg3gOB4/663nyHUk2JVcaz9Lrb1YR4uMH4sWOu1ra62dbKNx7VdjAPA1bF5dQ7RHJTsqG5lbMqKvP9FrkvazFp2Tfdzv378/EnuAJYFgA/x/9vt9KddesKvkWstCotTatl6mR+utI9HWhcwWRt9Xee71bV+JxgDgutg8GxHtimmKb4SsJNtaJtpROx77z82uXsMikY5+Uxd97O/fv3leNiwOrkiA9vl8668m11pr3SsLqZLrbIHJFiS/1YWvtTihjvq2r4wu6ABwPWzeVaI9Tf3abNvX+mwvzlVttj51JHod8q9B1ZiKtLboN3PRv+PbP//8w82PsCgQbHh6onrrTK69UJtom1RnNzNGct1LrnWRqcQ6Wsii1los1bZv9PYB4OexeTgq2tHHZ/XZ05TXZnux7qXZ+nrkx3qvX9Hx6uOjc7n5EZYEgg1PyzRNJ0m1irWWhvimNzNGJSHfcTOjLkjR1jf7PqN96/ufh/58AGBZ2LxU0fapdTTWq8/2n1O3x+Px5MkiWZqtY1abnb1ORa9nem6vRedx8yMsAQQbnpJpmk5KQkbk2qfWWc21l2q/76VaxXq/35/IdFYeEi1G0aJm35+1bN//LPRnAwDLxuapirUl0v68Sjan6a80H495yYhtszRb/yCNviZlW5Xqkdc5/bjsODc/wq1BsOHpOB6PqVz/+++/HyUjVhqSifXc5LpXb92T62xR8guNtdbq5Nr2PboPAMvH5m1PtO1YlHybXFclI752O0qzo1Tb70dPGvHn9oR7zjl2/Pfv3/zlR7gZCDY8Ffv9PhXraybXWhKSifXceuto4bL91sbKQWzricYA4H6YpnN5bi2vz872V6vVSaJtn8POMdH2rzWZZEevV9F4dE70Oqf/rgp11HjCCNwKrjp4Gvb7ffu///u/WWUhI4/iy25ojEpC5sq1LiK9xaQ1ykEAnhWbz3Pqs6N9k+sozbbzs9edSLL9a9fxeF6bHcl0FSjoa2R0nm+/f//mCSPw4yDY8BTsdrtUrqMnhkSptX9iiBfrKL1WuY5uaFSp9mPVIuP7reWpte3bmEf3AeBxsPk9UjaiTNPpTZCaZk9T/5nZmWTbx1ctE+dRmVYBt3PtCSMAPwWCDQ/P+/t7mVxbP5Nr25pca711VhYyklrrVheYaHHpLVq277eeaAwAHg+b65VoT1N9E6TJ9Wia7SU7Ol69lkVNz88+fvTzvr29pd8rwDVBsOGh+fPnz1BybYLt5dqn116uNbGubma8RK5tWy0sreXJteH70T4APAfTFJeERK8RWV12lWZb31r2hJHs9UvbiCyPiHb077TWeFY2/AgINjwk0zR9PA1EBTuT66gkROuu9/t9+MSQS+Vaf40ZpddRs+9Rx2xcfxYA8NzY60CWZk9TnWS3dppm28e2di7aup1z86Mds4+d26qPs2PHI8/Khu8HwYaHY5o+/4CMCnaVXPvyEC/WXqgvkWsVa5Vre8GPxNr69n1lC4n/3vVnAQBgTFN+g6O+lmRp9pynjFQlI7p/zRZ9bj/WWkOy4VtBsOGhmKa/cu2l+v/+7/9OxNrXXGtTwfY3NV5SFhKl1pfWW9v3p2M2rj8HAIAIe324NM32SfY0fUq1Crk1L9dzboC0fys6f06zz+3/Dev//v0byYZvAcGGh2GaphOpzspC/v33365cZ08L8WK92+1Ssb60LGRkkfD7Nhb1AQAq7PXCi/ZImu3HLM2eptP0OioZ8aJt22u1uZ/Pfx1INnwHCDY8BNM0nYj1SFmIivWfP38fw2fbSq6z9FrFOpLraRpLru37yhYF2/qfAQDAXKbpXKyrNNuPWZo9V7Rt6z9nts1e2/T1MXu97L2GTtPU/vnnHyQbrgqCDXfPNH3KdZRcW4mIfxRfVhLiS0N6ch2l15FYHw6HNk2nz2f1+3MWCP89R30AgEuw15Femp3hy0aMqGRkToo95zz/71T70THb/v79++MNAcBXQbDhrpmm6Sy19jXXVXKd1Vz7mxltayUhmVxnYl1JtW7t++ktMvr9AwBci2nK02w9rh8zkmTbfu952dHYaLOP9f9eddyDZMO1QLDhbpmmU7mOykK8YJtMR08L+a6ykGmKk2u/7S0q/vvV7x8A4NrYa4um2SOvOVoy0ujajwAAACAASURBVFoLhdxvtW/7+poY9aOPyc7Xc6Nta0g2XAcEG+6Saarl2peFVE8MqZLrr5SFjCTXUbPvrbeIAAB8N9NUp9l6jsdEe5rOH93XuwFSpbjX1/M90bGR11AkG74Kgg13xzSdPi2k+jPoXq6r51xnybV/UoiX7Cq51jZNY/XWfiHQrf/eAQB+ChVo27fXq+zGQDvWS7JVrv2Nj/4cfY2MjumY7fvzdSzaN7jxEb4Cgg13xTSd3tAYyfW///57cjOj3tQ48ji+LLnu3cwYSbUXa5Vs+56yxSPqAwD8JPb6M3oDpD9+PB7P/jCNnRPVZevnqaQ4+7er/RH814lkw6Ug2HA3qFxHYu3lOrup8ZLkeqTmOkuuI7HOBNv29fsGALg1kViP1GabXFdptsdeD6PH+Pnj2X72MdHWo1+T3bjJc7LhEhBsuAum6fTPn5to6w2NPbm2mxm17tqn1tZXwa5KQ0yiM8Gumn1/fuu/bwCApeDF2va9ZHsJV3yKnZWLWD87pscr2Y5eP0deU6OvH8mGuSDYsHhMrrUsxETabmgcketIrOc8LcRLtSbXKtk9se4tGgAAS8WLtEp2dX4k2NN0Xi6iH+v7o6+P1ecZwb5e+1qRbJgDgg2L58+fP2k5iN7QOCLXIzXXI8n13LKQ1trJvh/zzF0EAABugUp2a+MlIyPlIvY6qbXZ0TnZ66kf631dPVarVfv16xeSDUMg2LBo/vz5072hsfcoPl977aXaHsk3pywkE2tNraMEu7X+YvDVBQAA4CfxYm37KtlexA0v2ZGw+tfJajx7zZz7WuqTar8ftV+/fhWfCeAvCDYslvf39/QRfJpcW3nIXLnW9FoFW0tCbMwkOkuvs9ZanKbMXQwAAJaEl2gv2ZFcGybXPs22j8+eQT03lOgdj762Edl+e3s7+zgAD4INi2S3253Jtcn0V+Ta39AYlYZozbVKdibVPbGuUpfeAgAAcA9Ekm39Ck2xs0Tbb3V8LplE987z46+vr2fjAAaCDYtjv9+Xj+Hzcm0ifQ25jspCjsdj2+/3ZUnIHLm+1uIAALBEIrG2NLv6GEuxrR+x3+/Lemwje73NqMS6115eXoLPCIBgw8LoybWXbJVqa/q0kEvl+pKa69Y+awSRawB4RrxY234m2XYsKxf5LiKptnGfWkd93/73v/+17RaVgnO4KmAxHA6HodTai3Uk2tVj+K4t15pet3Yu2DZmINYA8Axomt1Lsls7f8KIkgUV2VYZFetoPBPt//3vf0PJOjwXCDYsgmmaZst1VA7iW++Gxp5cHw7xH5CpSkPse0GuAQBqyfbHPJFk22tqVD6y3+/bdrtt+/3+7FhFJtv+mD8nSrBXq7+p+z///JOWtsBzgmDDzcnkuvd866g8ZPRpISNybQKtop3JtYq1fW9RHwDgWagkO0Mlu5Jh+1xRiqyCHJEl1HqsEuzVatX++eef8uuE5wLBhpsyTed/At3kukqv/c2NWd31aFnIfv/3JsasNAS5BgD4GirZrfVvfvSS/VVx1Y/3At0b68m1CfZ6veYP0cAHCDbclPf391CqdZsl11Gttd+PxHqOXKtUj8i1LhjINQDAeUnISJptct27+TH7HJnsVhKcyXR0zOTa9/lDNNAagg03ZLfbDZeFaGLtnxiiqXUvvVaZ7t3UOCLWyDUAQB+fXtt+T7Jb69/8+BUiefbH/JhPqzPBXq/XPCMbEGy4Dfv95+P4fIlIllpnj+XLxLqXXGc119eS695iAQDwzPg0+7ske7VatcPhkB7TfibXvu+F2jctFVmv1zy+78nhfx9+nOPxGIq1JteaYHuprh7Hp+l1JdXINQDAbfguyfaS3Dsnkmjf903HsxTb2j///MPj+54YBBt+lGma0jprbf7mxd4Njbaf1VlXoo1cAwDchu+S7NbqBNufk/UjsY4SbE2ufZ8nizwvCDb8KNETQyytVrFWodaykOhmxqxEBLkGAFgm3ynZSpRKR+Mq1lWL6rJ948kizwmCDT+GPTEkS62jJ4Vkcu3LQLxUj6bWyDUAwHL4ScmeQyTSOpaJtW9vb2+9fwoeDAQbfoT9ft8tCdGa60qutSykKg+JxNpEGbkGAFgGPyXZVTqdjWfHtf5axdu3l5eX9GuCxwPBhm/neDyWj+LriXWVYHuhjspCvEBn+162kWsAgNvxE5LtRbkazyQ7qrnOpFobNz0+Dwg2fCvTNHXF2rbv7+9nNzdmTwnJJHtOSYim2Mg1AMDtuZZk28fZmInw4VA/us8Ls9+v2ohYbzYbbnp8IhBs+Fb8DYyVZGclIVoGEon16E2NKtijYo1cAwD8LF+RbB+eeCKxVlHWsegcFWu/HZFtbnp8DhBs+DbspsZLykJMrqMUO5LpqCxkVK57kt0acg0A8NNcItmRWGesVqdpdiTb0XhPtDW59gm29flLj48Pgg3fwuFwOJFplWyV66zu+jsSa+QaAOA+mCvZUalIhqbIKtW2zYRaWyXakXTzlx4fG/534epM02fdtRdrX2+dPYYvE2u/b9tIqKMxE2nkGgDg/ri2ZJska3q93+9Pjvt+r5lYmzxnYu3bP//809brdfg1wv2DYMPV6d3M2CsNyW5sNLk2eY4SbF8eQnINAPAYXEuyV6tVKN4q1L4/R7Z7CbYK+O/fvz8+PzwWCDZclff391CwR+quvWRHyXVUb521SKqtIdcAAPfHVyVb5dqLsaXZlWjv9/sPgVapjpod86m1ptnb7ZZ67AcFwYaroXXXUTlI76bG3qP4qpsafYlIlV4j1wAA98mlkm3hSkUl2pVUv7+/p7KtYq3CTT3248L/KFyFaZrK5Npku5dcR7XWmlh7sR6tuR4pDbHvw39PAACwLOZK9ly5tv2oZcc0ufZjtq9PEvHtf//738fnh8cAwYar4J93naXXVc21yvT7+3uZWnuhjkpDvGT3UmvkGgDgvpgj2VmKbR9j64iNedmOxHq/36cCrrKdJdkq2JvNpv3+/fv8i4e7BcGGL7Pb7dKbGn1ynSXW2Q2NKteZWPfKQXzfQK4BAO6bOZJta8F6/bcme7Wqb3a0/n5/+mSRSLgrsc5EO2rb7ba9vLycfU1wnyDY8CWOx2P3hsY5pSGjdddzJZvkGgDg8agk28uyjXnJVnxy7T8+S6rtpkctD9G+loVUsm3jcP8g2HAx0xTXXZtUV3XXkUxn6XVVd60yHe1nYh19PwAAcF9Ekm397HwVbEu0vUBrmchoU9HulYyoZP/zzz8nbw7gPkGw4WKy0hCfWvfkWkXby7PKtUp1JtnWegl2a0g1AMAj4MXa9jO0VCQS7tZO67F7Ql1Jtcp0VSqy3W7bdrttb29vwVcO9wSCDRdxOOSP5JtTd12l11FJiIq1ptaUhgAAPDcm26OSrUQJdpZmr9frttvthtPrSrBNrv0+3C/878Fspmk6keroiSGRYJtYZzc1RnXWXqa1H5WGjKTX9j347wcAAO4bn2KPSLZfL4zV6vyP0ahoe8He7XattVaWg1Sptgq29ikVuV8QbJjN+/t7mlz/999/3dS6l1xHZSGRZEeJtfVbO31SCHINAPD4zJFsWzPW63Uq25Fc275Prff7/dlYL8VW0VbBplTkvkGwYRZWGqKP4es981rT6qjuOqvB9qUhkVBnZSEGcg0A8Dz0JNsfs62WiliSbcJscm3C7UtBMrGORFvrsSkVeVz4X4NhpmkKk+usLMSXhGRPDomSa627zlJrleqsLMR//VEfAAAei0qy9fXfUmyTbC0TsTGfZmtibTJt9diZaGfpdZVi81ce7xMEG4bZ7XapWGta7ftRKUgk2VlJiEq2JteZWEeS3RpyDQDwDHjJ1nHFl4pomYitQbZvabZKtu3v9/szsd7tdkNptgm2ybX98RlKRe4PBBuGOBwO7d9//y1LQ7Knhqhoe8n2pSE9yVah1lKRSq6RagCA58On1z7Fzs71gu2T7KhUJEuyqwQ7S67//PmTCjalIvcJ/1vQZZqm4SeG6M2MWnftt5lUe6H2fU2uvVjb19mTa0QbAOA56Um2rSmaZJtoZ5JtWy/RlmJHLSoTWa/XJ0Ktov3y8tI2G54qck8g2NBlt9ulch2l1irbWUmIl2utu66S6yyxNpBrAAAwTKx9368H/phtoxTbn69ybYLdS7OzEhFNtqMkm6eK3BcINpQcj8fwmdf2lJBeeh2VhWRi7UtCtDykSq8r0Y76AADwXGSSHSXaUYrd2mk9dibZo0l2VHu93W7LUhGfcMPyQbChpPrz55Vcm0xrcp2JtQp1lGBXUp1JdmvINQAAxDc9ZuuDrSVRkq1ybWNZim1S7ftesDW9fn9/D8XaSkV+//599n3A8kCwIaUqDanKQ/TGxki2o7KQSK79i5xKdmtjddcAAACt9dNrf16UZJtoa3JtfS/Sto1SbHuqSHTDY1Ym8vLy8rF9eXkJv25YDgg2hEzTlNZc+76Jc/akkKgsJGtaHqLpdZVUZ3KNaAMAQEQk2b6MxLZZiq2S7ctHTLD3+/1Z2YjWXWeiXaXY9nGwXBBsCIkSa9+8WGdPDclKQ7LykEiqLxHtqA8AANDa1+uxVbR9uUhWHlLVYltZyIhg+xT7169fDZYLgg1nHA6HD5H2Kbal11FJSHZjY1aDHYm137cXs0yoK8luDbkGAIAcL9l+LDvX1iSVay0X8ZKttdcm2ZvN5qO/2+3OUmxfGqKi7QXbxmCZ8D8DJ0xTXRpSPTEkS7B9eh2VhKhcRwm2inQk10g1AACM0kuvW2sf45ZkRym23/eS7QU7KhUxqc7qsS3V9jL958+fkzrszYZnYy8VBBtO2O/34Y2Mo3JdlYZoep3JdSTWlWRb30C0AQBgDirZvoTEn+PXJDvP/xbW0mvd11IRX4ftRdsn11Gi7ZNsa6+vr+ffENwcBBs+OB6P5R+T0fKQnlz7sZGa60iyNalWyW4NuQYAgMswsY760bm2Nvlku7V2ViIyUiqSpdgq1O/v7ydSrf3tdtvWa254XBoINnzgnxCiYu1vbBxJrrPEOisNsa2m16OS3RpyDQAA8/FibfvZecfjeamIjZtUm4DbmBds29/v9ye115pi9254/PPnz4dgv76+csPjAkGwobV2emNjJNq+LGQkva4EO5Jrnwz00mo/hlQDAMC1MNn2a4um2n4dqkpF/NbXYmflIibXXrKjFFvLRP777z9ueFwg/G9Aa62dybU+KeQSuVbR7pWDjKTWrbWzrfYBAADm4FNsL9kq23bcxLq10xses1IRLRHxpSNRgr3b7cJabC/XlmJbnxselwWCDW2/34fJde/GxtF6a02ufXp9qWR7kGsAAPgqmWRH59nW1itfKuJLRHypiJfqKMH2W73pMarFVsl+fX3lLzwuCAT7yZmm6UyuR5LrSKq1r6UgkVj3hNp/nX5MtwAAAF/FS7bte7x0+3XJEuwovfZybeUiXrJNrK1pHbZPrt/f389ucPTCvd1uSbEXAoL95Ox2uzCxjiRb5ToqD/FyPZJee7nupdZINQAA/BQm27bmaKLt5don2JpeVym2Jtkm3FEdtr/BMSsVeXl5aW9vb9m3BD8Igv3EHI/HtCQkEute7fXcspBLJNuDaAMAwLXxKbb29bzjMf4DNKvV6iS9HhVsXyLiSzBNtG3rk+yXl5ePNdtke73msX23BsF+Yqz0wzd9ckgl1b4sJBJte0HpiXUk1QYpNgAA/DRerG3fU5WKqGR7ubZ+JNlerDXF3mw+/7Kjrd3Rc7FNtnls3+1BsJ+UXnrtpdr2tTTEtllyHYm1jfXSaqQaAACWgMl2lmZnch1tM8HWemwv27vd3yeK2Pb9/f0sxdYykZeXv39GHW4Hgv2kZLXWJtNesr1M+xTbJ9hZSYhPsjW59i9KKtQq2R5EGwAAvhsVaq3B9ucdj5+lIibTrZ3e9OiT7EiybU2NUmxfJuIlW2+A9O33799nXyv8HAj2E3I4HMr0uifZJs5RX8VamxfqTLgNUmwAALglXrJt39A0W5NsTbV7SXZWi+1LRbxQa6lIlGJvt2jereAn/4T00uuqaYqdlYhEcp0JdS+5RqoBAODW+BQ7SrP9+qWS7dNr3/eCvdlswhRbb3jUFPv9/b29vr5+CLdvCPbt4Cf/ZBwOh/b+fv6n0CPJrmS6VxYykmBHQp1Jth0DAAD4SUyodcxjMq2SbceyJNun2JZgj9ZiW1+TbL+ev76+Itk3gp/6kxH9hUYtB7k0tc7E2sYquY4k2/oAAAC3xCTbb1sbKxPx+5pkq2Rbf24tti8L0b/uiGDfBn7qT8R+v59VGuJ/JaXJdSbaUWqtcu3HMslu7fwubQAAgFtjkm19PXY8nt/w2KvDtr6m2L5sJGuaYOtzsZHs28BP/ImIpLon2jqRo/KQOcm1F2vrG5Fk2zgAAMAt8WJt+0Yvya5k2yfYXrp9qch6ffon1P0fnfGlIv630l6yN5vNWZkLfC8I9pMQpddaKlK9Q/YJtgq2F+osxVa51hchv++3AAAAS8Nk22/1eCbZUamIl+zohkddg60O27ZRqYhf719fX9vLy0vy3cB3gGA/CZFYZzXXvu46qsFWuZ5THqKttTy5tmMAAABLQFNsG/NkNzxqgm2JtQ+p9IZHL9n6RBFbm19eXsJSEQ3VttstKfYPwh+rfwKi9FrLQrxQe7H2Mm379kIwKte91lp8YyNyDQAASyNaq/x6la11PnDy62jW/Pqr6bVuo9IQbfv9Pvx+4HsgwX4CNL3uJddViUjUenIdiXZrcXKNVAMAwL0wTfUNj7YGWqodJdkm06vV6XOxLcHOSkWsPGSz2Zyk2JVsUybyc5BgPziaXuuki94JR1IdlYb0mr5jjyS7tfN3/zYGAACwRDKZ1rUtWwNHU2ufXGuK7fdtPfdrfCTZpNg/B4L94EQTbG563UuwI+HOpDpqBlINAAD3hq1dfuvXNy/VutU1sxJuXY+zcMyLduQA8DMg2A/M4XAI5Xokvc7EWid8lV5nLypGJNk2DgAAsGSitSqT655k+/U0W3d7KbaWh0S/sSbF/jkQ7AdGJ1WWXFdinUl29s47exGJXmxs328BAADuhWotq0Tbr5VRgh39pjhKsnspthdu7wTw/SDYD8rxeCyTaz8RD4fDUHrdE+1IuvXFpLU8ubZjAAAA90YVJKlU67ZqUYrt5TpKsff7+v6rw+FQfStwBRDsB6X69ZB/txsl2Fl6XYm0349aa+c3M/pxvwUAALgXdO2q5DqS7EqsR5pfv6P1PUqx39+pxf5uEOwH5Hg8hlJdlYSMptYq274fvTPPJBupBgCAR0NDpBHZ7ol2lGJnUp1JtvcA6x+Px+zbgCuAYD8g+m7V9/VXSLbVSZsJtTb/wqDvzKPW2nmSbWMAAAD3SLSmZbKta2W0nnqxHmmVdEe/0bYx+D4Q7AdjmqazCaXvZrUfSbXf10leiXYm1fa16T4AAMAjkYm17uu6mQVZXrZ1Pc5+G+1FO2om2ccjKfZ3gWA/GPv9/kyutZ9NRBXrUanWF4hIsvXFxYNoAwDAvROtbZlsR6JdpdiRZPv12q/h+htq9QLf3+95ZN93gWA/GPrrH9/0V0eZWGt6HU3y6AWhJ9X6QgMAAPCIZGKt+7p+RmGWrb+95tf07DfXtvWSzXr8PSDYD4R/l6oTKEuvbSLa5PQTWSd19g47epHIpFonMhMbAAAehWiNy2Q7Eu2vyHYk1z5Yy36zfTjwyL7vAMF+IHxa7W9oVKmOJFsnqCbWkViTXgMAAMRkYq37mWhHUq37uo7730qrXKsj2Pb9nUf2fQcI9oNwPB7PEuvsRkc/IVWwNblW0Y7eZVfN0H0bAwAAeCSitS6TbS/VKteRcGfrdBagRSl2JNmk2NcHwX4Qol//jCTY0a+ZMrmOmr449MQaqQYAgGchE2vdj4S7an6N1gQ7SrFVsCPhhuuCYD8A0zSFvwLyE2k0ve4JtYq07muzr0/FGtEGAIBHJVrzMtmO1tMsyMokW5tKdibVPsU+Hnlk3zVBsB+A/X7ffXLIaHrtJ20m15Foq1S3RnoNAACQibXuq2hHa3C0Xmdyvdt9PsAgS7J9OxwoE7kmCPYDUKXXkWhX6XU0aTO51q2+YGjfQLQBAODRida+TLarlgVefn3OJDsK17wXaIoN1wPBvnMOh0OaXNu2Emo/Hk3abJJXLwatkV4DAAAYkVjrfibWPcmu1vbsN9ik2N8Pgn3nZGm1ptbaMsn2cp21r4g1og0AAM9CtAZG66WXat36dXeOaGdiHaXYPsmG64Bg3zHTdH5zo04cle0qtZ4j137y+6/H9/0LBwAAwDNTrZFZi9ZgW7P9+p1Jtsr24ZD/lUeTbL+uw+Ug2HeMTZRKrr1MV8n1qFhray1+cbBxD6INAADPRrUW9tbSSLKzFkm1bqNEW9vhQJnINUCw75io9lrlWkVbpboS7GyCV7LdWnxjIwAAwLOjMq3j/lhPtlWodex4PIZybftZks3NjtcBwb5TjsdjV6yzSZVNyt6742rStxaXhegWAADg2dA1UNfNXusFX1GL1n2fXEeSTYp9PRDsOyUS62is9w5XxVrHepNeJbs1ZBoAAKBHtHaqQM8R6mq9rwK4SLL3+33xlcMICPYdMk3xX27UCVSl1zbx/Lb3DnlErBFtAACAc2xN1LXRr53ZOuvX4EyuM9HW5t1AQzov2qzhXwPBvkOOx2Mo1DbmJ1E1yXrvhkflOusbTFIAAIBTspAqk+teCNaT6yqE05KR9/f3djhQJvIVEOw7JKuZmpteq2gfDod0Ekdi3drYDRsAAADwSSTWup/JdtZ0PY/W+0i4sxKR3Y5nYn8FBPvOmKZpWKqjxHokwdaJXE32nlgj2gAAAH+J1sgsqPJjmWyPSLcP2aLwLUqzrR2PPBP7UhDsO+NwOJRyrZNJ+5VYZ6I9KtbINAAAwBhZONWTar9GV1JdBWwq2VnZ6eFAmcilINh3ht6QkMl2JNZ+kvltJtQ90W6trrlGuAEAAE6p1kztj8i29VW4I7GOJDtLsK0Pl4Fg3xHT1C8P0XemUWo9J8nuybX/2hBqAACA+UTraSTUKtYq1dq8ZFe/2fZyraJ9PFImcgkI9h2RvdscTa1VrHVi9t4t6wuAbaNxAAAAqKmCqt56rOt3FJzpuu89ofIJL9qHA2Uil4Bg3xH+HeVoch01fWebtd7krsQa0QYAAIiJ1swsuPJjXq6j/Uqsey37zThlIpeBYN8Jx2P87GuVbG02ngn0HJnOxBqZBgAAuIwsrOqtw16us6bhmt/6YC4Ta8pELgfBvhOqieBFukqre4m1yncl15FY+2MAAACQU62h2tf9aL2uJFulOkuxK+GGeSDYd4J/N9mTbD95/OTSydYT6Whi+631EWoAAICvo+urbavm1/Oon0m3SjWCfV0Q7DtgmqbhPypTvTMdmXijkl31AQAAYJwsuIrGbUzX7WqNz7ygl15TJnI5CPYdUL2rjBJrTal1glVSrWOt5b+isr4H0QYAABijWkOjNXikReGZ+sFc0TbPgHEQ7DtgJL2OZDsTav8ON5qcrcUT2sYNZBoAAOC69NbinkzrOp8JdyTVlWDv95SJzAHBXjjTNA2n1ybTUf9wOJxNtmjyZWJtX4ttEW0AAICvEwVYuj8q3KNSHUl2FtKZc+x2O9b7GSDYC6f3bjKaIDZ5oskVSbZOzGzStlYn2Ew8AACAr6Frrq6/0fER0fZuUEl25R2HA2UioyDYC2dEqKNxnUx+snmRHhFqHbNxAAAAuB7ZOpsJdCTSGqJlx+bKtTUYA8FeOL0LPUuvoxS7kmxrrZ1OZCUTbYQbAADgMrI1NFtvsxCsJ9+RJ2SiHUk3ZSLjINgL5ng8hjKtfZ00oy2bmFFrrS4PAQAAgOsQSbT1s+ORZPea94bRJNvCOKhBsBdML7XWCRGJtkq3f2c7ItTZGAAAAFyfLMzKJLon09HxXnpd+cd+T5nICAj2gtESkKgsJJoomVxXky2SakXH/McAAADA5WRraSTcVRiWybeu/VV63RNv6INgL5RpOn88n7/Aows/mzh+cvlJF03EqNnX4782AAAA+D4iibZ+djxa27NgbUS0KRO5HAR7oeiF3XtXmUl1NLkqia4ms/YBAADg+mTrbibSlWCrXFdCrXKdyfbhwOP6eiDYC0UT60q2owmTiXUm2JFwtxa/U9ZxAAAA+DrZmlqN+/W4Ctd6zfuE9bOAjzKRPgj2QpmTXkeSrRMseyerwt3aeR12JNYAAADwvURrcRaMRQGajqlMZ3KtMh01fKAGwV4g/iLvCXY2WSrR7rXW4oSayQQAAPAzROuvSnbWjyRbA7dMrv14zz8gB8FeIP4do76L9BOheheqYj0i2q2N1V4j2gAAAN9DtsZma/NI6wVwo2JNHfY4CPYCyeqv9Z1jJNl+IlXvXiu5HhHuaB8AAACuiwq1bav1O5LrUdHOpDoahxwEe2FM01Re0H4CRJLtZVsn1Yhc69cS9QEAAODnqNbjEcmOPCCS66xvXqJ+ghvkINgLY5qmobrrSLJVpufKdXTMjkd9AAAA+D6qtbgS6Sxky4Q6Go+cQ3/DfjxSh52BYC8MvXgrse61nlxnQu2ZOw4AAABfQ9dY24+EOwrFVLgjAY9kvBLtrEEMgr0wMrnOEute08mUTbjW4pouA6EGAAC4HZFQR+t31tQFelI9ItfUYecg2Atimj7rr6sLWi/6OSIdCbX1o632AQAA4Oeo1uNqTe+Jdq9lzqH3iOEIMQj2gpimuv5a32H2WiTZ0fFIvP3XpH0mEwAAwPeSrbXVWt2T6mg8ku7IOVS4/aOD4RwEe0FUSbX2M6HOxDoSaQOhBgAAWDYjQh2NRaKt3pC1ykV8g3MQ7AWRpdY9sR4Rbj9Wtdbi0hEAAAC4LVkgZvsjkl0Jt0p1T675gzM5CPaCiARb5Vov/Eqg/b6RSbUd5X+cjwAAIABJREFUy0C0AQAAbkO2VutaXkm2d4IskKta5Sg4wjkI9kKoLl6Vaz8ZdBuJdjS5qgmpYx4mEQAAwM+QrbnV+hyt/5UHVJLtvaPyFNzgHAR7IUzTlEp1JdradBL5Mft39N/VfjQGAAAAtyVbs32LxkZkO/MK/5vzyEVsC6cg2AuhSq+rCz8SaZ001Xhrec217wMAAMDtqdbpaG2vXCDziUyyvWhrg1MQ7IWg7wz1ItYLvCfcUTMioa5kGtEGAAC4LZlY6zqfSbbfV1foeUXkJDoGpyDYC2CaTstDItmuZDqT6p5sR/v+a4q+TgAAAPg5srW3WqdHnUA9wm9HZdsajnAKgr0ApikW7Ey4q0lRTSSV6d6kZbIAAAAsC78263odre16/jXkWvsI9jkI9gLQi1Qv3JELXs/J5DoT7WiSAgAAwPKoJNv6WYscoSfZ6ig++PN9+ATBXgDVxarSnUm032+tnlyGSjRSDQAAsFyqdVpFe9QJvEeoX1QOErkLfIJgLwCV6ejdYyTXI7IdyXU26Yyo78cAAADg54jW4Gytjtb0rGVSXfmGhoB+DD5BsG/MNJ0//7pKrDOptmM6Zv9GNh59PQAAALB8sjW7kmrvC/7cSLR1G0k1ddgxCPaNmaYpFGo/ll34evFnLft3/eTyW+0DAADAcojW62jdz5xAJdr3o4Cv10y0cYdPEOwbYxdzlGBXiXYm2T3Zjiaf32ofAAAAlke1bo+I9mirhDpyFPgLgn1joos2Emd/kUcXv59M1UQxfD9j5BwAAAD4Oaq1PNrPxjKZVqnOJNs7i3cX+AuCfWOqd4FzkutItiO5jvo98Ua0AQAAbktvLe6t7VXTMM+2vebP40bHUxDsG+MvTL2gs/1oQkTibGTnKNEYAAAALI9qPffnRK21FjqEukbkH95LoiAQ/oJg35Bpim9wrKRa96tjfiLpv6v9aAwAAACWj1/Lo/Vfx7Lzs1Z5ihdtbnT8BMG+IXbRXvJ4vkikRyeMPyf6mgAAAGD5+DU7W9N1vOcIkXdkY5mzAIJ9U0YvVn/RXtr03632AQAAYLmMrNv+nJ4jeLEeOSdyFG50PAXBviGZSNuvWPSCV9GuJoOi49F5elzHAAAA4HZk67vv+/U96uv6HjmEF2nbZmPUYccg2DckE+zoYq5Ee6QZ0b7fAgAAwH0RreG9td/Lcrbvx0a8BMH+BMG+IZFYRxeqv6B7Eu232TkVI+cAAADA7YnWbD+ma/8cf1Av8f3MURDsTxDsG1I9QSSbBKMtI5tMAAAAcH9Ea3nkApkjqBeog0Ry7fvaeJLIXxDsG1FdnNGx6EK/pPl/P/qaAAAA4D7J1nYdVy/ouYP6R0+y8QkE+2bohRldqHph+/P0YtfJYv9GNKmq/WwMAAAAlsPIWh05wVda5Cy+j2B/gmDfiOji9FvtR80+j+/rmB/Xf7/az8YAAADgdvTW6xFPiM71TV0kCv38schhnh0E+0Zk7/qqizWbMLav294EYwIAAAA8BtGano2Ntp5o+3Ftzw6CfSMqqa4u8Gg/aka0r0RjAAAAsHxG1vCeJ2TnVE6i3qLjzw6CfSP0YrQxHe9d6H6iRJPE/3s9Rs4BAACAZaI+oH09N/MI31c36fVt/9lBsG+ESvScFLu1+p1mRjSJmAQAAAD3TbSWR06QuYL6QeQi+vHRb+Btezgc2rODYN8Af2H6C1Uv3Owi14tdt9X5/lz9mgAAAOC+ydZ4HY98QvezMFD9IpLsZ/cKBPtGVO/8KqnW1lqeRs/dBwAAgPthZB2P1n51iJ5jmJtU50c+88wg2DdAL8hoe41m/1YPf87I+QAAAHA7orVax+acE20jlxhJtEmw/4Jg3wC9AKOLstfs8+jFn/17vj9y4feOAwAAwDJRN8jcoTpXfUET7KjM1W+fHQT7BmQX5EjzH+8/n26zcwAAAOAxidb6bP1Xr/Bj2kyYq3AQyT4Fwb4B1QVZNfvYXqv+3ZExAAAAuB9G1vLMFbxf+K3/mOzjrZ+5zDODYN+AEZmuWmvnKXU0IeZc5CPnAAAAwLLJvCA6T89Vx/B93ddaa3+e1WY/Mwj2DYguzqrpx+lEiSaEop9HxwAAAOCxqLxAz1E3iHwk85Zs/JlBsG9AdBGONvt4v9V+tG9j2TgAAADcL6NreSbAczzDH9fGU0T+gmDfgOpijC58veij/epcAAAAeB6itT9ygsw59Nil7ZlBsG9A9NxIvSCn6TLxjojGn/3CBwAAeARG1nM9p+cLkV9YGy0Tsf1nBcH+YaKLcqTZx/rP0fs3dKzHyDkAAABwe6I1e2Qdj1wico7sXH+s154ZBPsG9C7I7CLO+jrmP65HdM7IxwEAAMCyGVnPMw/IvKLylp7PPBMI9g8zKsvRxdmT55ELeeQcAAAAuG9UkDNpzs6PPjbykxF/eUYQ7BvQuxh7x/zn0bHomJ737Bc9AADAs1P5QeYdSna+usszgmD/MJVQW7/62Oz86BgAAAA8F5EDjLhFdSzzlmrs2V0Ewb4RIxenjtl+9TnnHHv2ix8AAOBRmLOm67mRHGeiHI1nHzPna3o0EOwfpifQ2Zgfr/oAAAAAEZfKbybcmVBnHvNMINg/jF6kPdH2Wx2PjtnYnIt75BwAAAB4LCo59udEx0fGn9kvEOwfJrsodXvphTpyDgAAADwu6hXaH6HyFT0n85W5/+YjgWDfiOwdX3RedOGOXPj+c2j/mS96AAAA+OQSJ6jcovKaZwHB/mGyd3l+/9kvSgAAAJhP5A+jXhEFd74fucvoec8Ign0jIrnW4yNEFzkAAABAxqj8RtJs20q4Rz73o4Ng/zDRRT16oWZCPnIhZ5Np5GMBAADg8bjEC3ouEvnMM4Jg34hRab7kXeGzX9QAAAAQU/lBL7zLxi5xlUcHwf5hehdi7+IGAAAA6DFHkCsqae45S+9zPzII9o0YfbdXXbBczAAAAPBVeg4yxzd6XvMsINgL4pKLsfqYSz4fAAAA3Bc/vd73fvP+01/PEkGwf5g57wKV3nmjn7v3eQAAAOC56Elzj9HzngUE+wbM/ZULFy0AAADckrnuUo0/Awj2AqHsAwAAAK7JqD989TzKRP6CYN8JvQu1dxwAAABgFLziayDYN4YLGAAAAOCxQLBvBGINAAAA8Jgg2DditVqdbAEAAADgMUCw74SeiPeOAwAAAIyCV3wNBHuBcFEDAADANbm2W1z78z0aCPadwQUNAAAA30XmGVVpqx+jBPYvCPYPs1qtzi6+6MLUj7mUr3wsAAAAPAc9se5xbX+5dxDsBdG7EHsXrx7/6mQBAACA5XPtdb33+b4zGHwUEOwbMforlOrC5aIGAACAr9IL5EZ9Awf5BMG+AaPSzIUKAAAA1+ISrxiVbD1vtVpd9O89Cgj2D1NdjNF5o0m3Z865AAAA8Hj0Uulovxfy9cYucZZHBcG+Af5dXfROr5LraswTTaCR8wAAAOA5uMQLMicZ9Y5nAcH+YUZlefSi590iAAAAzGWON4wEf9Z/drE2EOwb4C++3sUKAAAAMEIWxEXpcnSe9itf0WPV8WcEwf5hqguzmgTVRaznKtmkAQAAAJjrBuormYQ/Mwj2D5O947P97LzoeK8PAAAAz8u1/KAK8DJXUcd5NhDsH8YuOL0AowvSH5tzkc69uEfOAQAAgPtgzrqeiXHPV0Y/x7OCYP8wlTz3xDi66LOL+JkvagAAADjHu8EcAZ7jLtGxZwTBvgGjF2Ul0BHVOSMfDwAAAPfJ6DpfhXKRh+g5/tiIvzwrCPYPk12U2QWdfbzf1+3oBT16HgAAADwm6hFRP5Jn3Y+OPTMI9g3oiXV2wc65cLPP67cAAADwWERrfDZW+YE/rseij6+c5RlBsG9AJMuXXJgIMwAAAFSoa/ixjBE/GTnnmUGwf5iRi3Tk/OoC9x+rRJ+/dw4AAADcF3PXcu8T1TmjLhI5zTOBYN8Af+Gt1+vygtUL12/954s+f3VOxMg5AAAAcHuiNXtk7fdjI4Ks5+jnmnP+M4Fg/zDZRbher7vnZJPA748y51wAAABYJiPruZ4TOUO2H3nHnPasINg3oHcxRhdmdIHrMX882wcAAIDHJlr3MxfwnqCO0XOUqvng8Bl57u/+RviykNbiC7g3bkRj/mN7YzYOAAAAj436Q7af+Yge82Pebaz/zCDYN8BffNEFGTX/sdrXbUT1cQAAAHDfRGu6OkQ1pn2/jZxkjrs8Iwj2DcguxOoCHjlPz/f/Xo+RcwAAAGDZqBdoX8+NzvfH9POsVqcJtX4O/S39s4Jg3wBNr0dTbG2tnQu4hwscAADg8RlZ6zOPsGN6TvYxvlX+Qg02/Dj+QowkO7tY/QWfbfVc/XdHxgAAAOD+mLvOR9J8Scuc5plBsG+AXpDZxerPrZqdF/07/nPoGAAAADw+fs3P/KF3TuUr0fbZPQPBvhHVxanj1QVu43rc/zvRv13tZ2MAAABwe3pr9KgP6LGeW2SNBPscBPsGVBejTgp/8dp+tfX/RjTWY+QcAAAAuD1+zR5Zv+dIc6+t1+tueeszg2DfAH9h+gu0J91VSYl9Xh3z49HXEfUBAADgPtH1PHKC6FjmEj0/8WO+/+zwE7gR+s6vSrJ1AlRjntExAAAAuF+idT1b/yNnyLwjco0o/FO5pkQEwb4Z2bvAXoodXfC61Ylj6GTKxgAAAOD+yJygOj9zCt80FPTjurX27PATuBF6IfbS7Eq0tfl/IxqPvhYAAAC4P0bW8MoX/DY6Fu1H7mLjPed4FhDsGzEnre4d7zUjmigAAABw/0RrerbO97whco4qDIzas8NP4EZUF2X2zrAn0b2JpGPVfjYGAAAAt6O3NqsTqCf4j8/OrVqWWqtwPzv8BG6EvwijNDu7kC9p+u/2GDkHAAAAbodfq0fWej1fPaHnEplIZ+Hgs4Ng34jogs3S6+iiji5+/3n9mB+Pvo6oDwAAAPeFruM9FxjxiOg36j3ZxicQ7JuxWq3aZrPpinUm0/7Cts+nk8SP675OJgAAALg/ojW8t/arA/QE2vrqKpHDINh/QbBvyMiF6sezCZJNmOxYxcg5AAAAcHv8mu3X/+i4H5vjDZmD+JDQn7deo5atIdg3xS7E7CK1vl64flz70aRRsgkHAAAA90e1hmdeMCLX2qoQEME+hZ/CDYkuykyuexd9a/m7V51Avq/nKtEYAAAA/Dy9NTla47Mxa+oYUdin+5VcI9h/4adwQyrBzi7ialL0muH7GSPnAAAAwM9TrenR+q3n277fZk2dxPeze8kAwb4p/mLttehC1wlQibXu25jfah8AAACWS7V+R2t+tB+5hHqHjqlYa6krINg3xV+kus0kO9va56tE2u+rXFfnAwAAwHKJPMAfq1oW0Kl7RD6ibbPZ4BD/HwT7xmQyrReynwTRZNCx1vJJlcGkAAAAuA96a/aID0THK+9QmdZ9BPsTBPvG2AVZyXVPuEdba3HK3ZsMveMAAADwvWRrcTTux7L1Xx1CvUPPU5nWMWvwF34SNyZ6J1j9AZpof0SsW+tPQt1HrAEAAJZFtk7ruq/96HOoRGdCHXlH5C2bzabBXxDsG6PvCEckO5oElVxH/WyyaR8AAACWTW9Nj1rkEDqWyXYm1/jDJwj2jVmtVt0ykaxFcu337fNHUh2NI9kAAAD3QbZ2Z+t/tu5r68l1JNreYeAv/CRuzGp1+iSRTLb1Io8mg58wek40sbKvBwAAAJZLtFb7sZ5ER57g9yupzuSaBPsUBHsBRFIdjUUXfjWWiXV1zI4rTBoAAIDbkK3Bfl2Pzs3W/cgVKq/o+YmNwScI9gLQBHv0gh6V6lGRRqwBAACWS28Nz4Q6+hyRWGeO4V2kchP4hJ/GAtCLVPuVTPtJoROqJ96tnU5ID2INAACwTEZF2+/33EHHKumOnIUE+xQEewGsVud/0TGT60i2s63KdPTvar+atAAAAHBbsrVb1/xIrLOWSXXkIZGnbDbUXysI9gIwwdZ2LbnOmv3b/uvQMf06AQAA4OeYsyb7dbwn0zqmcq3HVKwjZ4FP+GkshEis58i2Thi/31o+2fwxj99HrAEAAG5Lti5Xa3q29ntx7sm03688BU5BsBeCv2gz2c6kOhNtlW4VacQaAADgvqjW6Uy8e16QBXeRe0TpNYJ9DoK9EEbEukqyRyZQJNrZmIFkAwAALINofe6t65lQ2zYL6NQ9oiDQH4dT+IkshNUqrsMeSbL9ZIgmUSXc9m9HX08Ewg0AAPAzzF2Le2Ktch3J9mazCeU7k2wEO4afyEKoBDu6yCvJ7km1F2vt+0mb9QEAAODnqNbm3hrvWy+IU5lWkc4ajnAOgr0gMrmO9v12jlhnE9CTTWQAAAC4HdX6rMeq1gvtVLJ7wg3nINgLopLr6GLP5HqOcLdGHTYAAMDSidbl3nquUu23OpaJtd/fbrcnnrLdbtt2uw2/3mcHwV4Q0cWrwl2Jtk4cP4Eq0W4tn7gRCDcAAMD3MmcNrsQ6k+xeqzzEj+EEMQj2glit6hsdM9muJktvsqlk60SJxBsAAAB+hmwdrtbwnlz7sZ5HqFRbEGjb9RqVjOCnsjD8r1x6Yu0v+kysK9FuLZ6Eflz7AAAA8PNkom37I3KtbpD5RC/g85INMQj2wvBirZKtF30l15FYR6Ld2rlAV5O4Nw4AAADXJVqXq/U8a+oIo6Gddw91E4hBsBdG752jv/CjSRCNV5OqmpTGiHADAADAdfBrsx/Lxv3xSKozH8hkuxJqP75eo5EZ/GQWxmq16paIjIh29I61avZv69cS9QEAAODnmCPUVYtkOpJqdQsTat/sOMTwk1kgvrYpk+1ItLPmJ1Vv8lXSjWQDAAD8LD251v0RB4jkOtqvPIT66xoEe4Fkv4rR/Z5Yz5Xr1uqJHI0DAADA9cjW1mo8Em0v05FUZ5KdhXmRk0AOgr1AsneN/lcy/qLXfjSh/Fgm1lnfQKgBAAB+hmz9jdbxXsskO0uuI6k2D/FeAjkI9gJZrVZpDbY2letoP5pkvTEkGwAA4LboWqzrcnS8WuNVsG0scgsd1/JVfKAGwV4oejNBVQflJ0OvZROstfNSEM/ccQAAAJjHyFp7iVxnDhA5hKbV3j38FmoQ7IXiL+6RFDuaKDpp9J3saDOyPgAAAFyPau2tZHpOuJYl1VlT2YYaBHuhrNfr8B2jl2i/VZmuJlcl0tqPxpBrAACA76cKtnRdvkS8e6Kd3Q+2XqOPPfgJLZjs1zO9UpEsufb9uZKtfQ/CDQAA8DV6Au37Iy1yAA3lNKirmvcP1v0+CPaCGRHqaDyS7GiSZccz8W5tTLgBAADgMqo1d26r1nwV7kyo1UWovx4DwV4w0UWdybafKL3JVE3G1igTAQAAuDVVoKXrcS84ixxBQ7meaFtbr1HHEfgpLZjVanV2YfcSbT+BVL51ss2VbO3r1woAAADz6Qm074+0KFSLRHtUqhHs+fBTWjiRVFeCPZJgV80mYSberY0JNwAAAMyjWmvntkioM8lW2a4EG8ZAsBdOdKFnYp0l19HEqiZla5SJAAAA3AJdX3Wt1XU4CsmqvvpBlF5Xsg1jINgLZ71en13cI7KdiXU06XqttfFaMAAAABgnWzujUKvXqvVe/cA7hDpF5hzrNdo4Cj+pO6ASbJsQkWzrhBptvQncGgk2AADANcmCrN6aPCLa2W+1o/S6ajAOgn0HZKl1JNf2DlPFOpLs3gSt5NpQyUa6AQAALkPXWl13eyLt1/doXMO3qCHY1wHBvgPW67hMJEuuNcHOJmAm2uv138tCxdrG/DEdBwAAgDGy4Kq37uq6nQl35gWZO0SO4fdhHAT7Tnh5eTkTbBvzEyObTCravXe+KtfaNxBrAACA6xCJdiTR1RperfORG2RptfeOl5eX4quGCAT7TvAXuRdrfXdpY5FYV2l29A44m9yt5cId7QMAAMAp1dqpa+2cpmt+tM2aptfeOWAeCPadsF6vwxRb5bpKszPB1ne5vckbvQhoHwAAAProOurlWsdtTNfrLDzzsl0Jda+t1+jiXPiJ3REq2LqfibVOskyye82jLwLRcQAAAOiThVe9dTkKylS4vQuMpNeaXL+8vLCmXwCCfUf4i35UrlW0db965zsi29mLAgAAAMR4gdbxnlxHa3W2jvtQza/9vcRagzyYD4J9R8yZFJVkjwq1n7gjog0AAADzycKrkVbJdZZUV+m1F2s7F+aDYN8ZWYL98vISThTb18kWvbvtCXck19r3IN0AAACnVGtlb91VoY4EO1rnM9HOpNr2eXrI5SDYd0Y0GaJykSy91n4l1Zlot1aXhiDWAAAANZFYZ+Mjsj1HtL0rRFLt/QIuA8G+M9brdZhgZy2S7EyuK9mOJLs1bnYEAAC4lCysmiPU2Xgk1Prb7aq9vLy09RpNvBR+cneIf4fp32VaXydTlWiPtLmibfsAAADwiRdoHR+V60q6s99aa4tkWn3i9fX17OuHcRDsOyT7VY4m116uM9G2CVgJtX+HPFe0AQAAIGZErCuhjtZwL9ZRkl2l2N4rNhtubvwKCPYdslqt2uvr68dkyH694yeP9XUyjiTZvcluX5OKtT8GAADwzFRr5Ihk67rck+sotdateoQX7PUaRfwK/PTuFD8pekl2llr35Dqa0JVkt0aCDQAAUJEFU5Vo6xocrdnZOt9LqyOPeHnh5savgmDfKZvNpqzDrhLt7N1tJNfR5B6RbZVspBsAAJ6Vak3MRFvX3CoQy0RbJdvva4Lta683G8pDvgqCfaesVqsTwa4kO5tgKtZVol3JtH09vT4AAMAzk4l1FVqNyLWu6RqqqUxncm191u6vg2DfMSrYVXo9N8G+RLSzvsGEBQCAZyNaC6t100u1l+sR4fbreZZkZ3LtG3wdBPuOWa/X7fX1tZtgj0h2NDmzyZxJdibXiDUAADw7ui5G+16sVa57Up01L9S2753Bu8Pr62tbr1HDa8BP8c4ZLRMZSbAz0dbJri8AmVzrC4iNAQAAPAPRGpiJddUquc5Eu/qNtko16fX1QbDvnM3m9GbHXrlIJdk6WaMWvbtWyW6NFBsAAMDIpFr3dW2N1t+eWPt1vhJrDeVsH64Dgn3nrFafNzvau9AqxY4kO0qse5Lda/7rU7lGtgEA4NGJ1r5MtFWsvUzrfrRuV5Ktop2Fci8v3Nx4TRDsB6CaLJlk68SL0uzsnbPfz+Q6k20AAIBnohLtaA1V2e6FXnMSbB/Cedl+fX3lT6NfGQT7AVivP2921FoqP5GqFLt6JzzyrjoT7dZIsQEA4LnIpDpaGy+V60isN5u/ZaORXEfptXeG9RolvCb8NB+EKLXWBDsT7V56HY1lUu1fQLIXFAAAgGegEu1Kqiu5ztLqLLmOUuvtdnsSzJFeXx8E+0HQyRIJt06+LMXORFvFelS0WyPFBgCA5yBa27I1sZLtTKx98OXFOpJrlezMEzYb/nLjtUGwHwh7F5pJtn/3qhMykuueaKtsR3KdyTYAAMAj49dB2/Zatd5mwh2l2dFvrvW32z69Zl2+Pgj2A2ETpyfXfqsptgp3JdqZWEei3RopNgAAPDbRGpethSrWkWTrfiTVKthZgq1+4J88BtcHwX4gVqvV7Jsdtalc95p/YYhk276u6AUGAADgEalEu2qZXEehlzb97bQm1pFc85cbvw9+qg+GThzfj35lFIl11TLJ7jVD920MAADgnqmkOhrzUq1ynTVNq71Qm2Rn6bX1NYiD7wHBfjDW63X5TjVKs/07X524o0m2f4GI5Dp7oQEAAHgkKtGuWrSeZiFXJtkq1b5p+Pb6+to2G25u/C4Q7AdEJ5G+g40mok7Q0fRaXxCqZui+jQEAANwjlVTrvkq1ynXWshCsSrErySa9/l4Q7Adks9mclYdUtdk9sTa5HhFt/4JRvcAYiDUAADwKUZg0ItnROpqtwz611nDM/5baS3XkA9stNzd+Jwj2gxJNpkiss1Q7eodcybV/kcgkO3qh8SDbAABwb0RrWSbaKtaZZGvLwq/st9KRcKsXwPeCYD8o2+32TK57sj0i1yOiXYl1a/GLDwAAwD2TSbXue7m+dnqtQk16fTv4CT8wfnK9vr629/f3swm42+0+tn6iHg6Htt/vP/o2yY/H40nzLwzTNH1sfT+SbBv3fb8FAABYOhoQVVIdtSytrtLrSK5VsrWpDxBsfT8k2A+MT7Gzd7FetkdT7F7Td+f6gtJaXI9tMPEBAGDp+LWqWtsiqe7JdZZe6xqdpdeRWPsyEfh+SLAfmNVqdSbYPsn2E1ETbEuufeul2L6vybU1n1y3RnoNAAD3jZdrPxY1letMtL1wq1hHch2l1xqqkV7/LAj2g6Mptk223W7Xdrtd2+/3H5Nxv99/lIVst9u23+9PJrNJ9vF4bIfD4WPym1hvNpuzMpGoVKS19iHSKtsGsg0AAEslklQv0rqvcm3b6DfD+pvjXnlIlF5nck16/XMg2A/OanWeYke12CbYUS12lGD7JDtKsI/H48cLiJdsf8zjhRuxBgCAe0DT60yyI7mOEuyeWHu5zspCovIQ0uufB8F+AvxEe3t7a+/v7x8Jtk+xbetvcIxSbJ9k++YTbOtncp0l2aTYAACwZFRSVaptTKXay7YX6qwfSXYm1ppeR430+mdBsJ+A0RTbniiiom1SbaUhKtbWTKJ9mu2FWltUj21fL4k2AAAsGRXqqHm5jhJrbZVYZ20kuX59fW3rNc+1+EkQ7CdBU2yfYGuKbWUim83mQ7S1TMQS7KgW2yfYPr2Obnw0vGxzwyMAACwRW6f8VvuVaI9KdVQaorIdpddvb2+k1wsBwX4SVqv4iSJesrP02kpFohIRXyriXzB8mp3d7KhC7aFUBAAAloSuUzamgdEcuZ6bXGtabeGZ30YpNun1z4NgPxHRpIuS7NfX15NE2ya2ifV2u/1Ir71ge9GOBDuS7EquEWsAAFgaWYrHj29hAAAgAElEQVQ9J7nebM7rrVW0Lb32cq37vbIQa/DzINhPxGq1+rjJ0Sadr8V+efl8Hram2b4Ou5Jrq8U2mbZSERXv1tpH/3g8fuzb12n7XsKRbQAAuAUaBM1NrlWybT+T6yzFjhLsTLDf3t7a29vb2dcOPwOC/WRst9uzGmx7/nXW/OT2KXYl3D691r4Js8l1L8k2kGwAAPhpVKJ9f0SqswRbU2yfWFttdSTY2+22LAcxsbZz4DYg2E/GalU/UcSaF2yrx/Zptkm1CXVWk61JdlaLHcm1F2/EGgAAbomtU37NGpVsL9KRaPsU24u2F+4sua6SbNLr24FgPyH27tc3S7KzRNvk2pJr37cXAJVtFWrbZpLdGn/hEQAAloMKahQMVZKtgp3JtS8HydLsaOsTa22k17cFwX5CVqtV+Ki+3W73IduaYlupiE+xTbIjsfYptqXXXrCzWuwoybavOeoDAAB8B3490n4l2T659sl0JtaZaFdSbc2n2KTXywLBflI0xR6py9bk2peKZCm2CbcXbV8+Yi9CJteaXNs+pSIAAHALVKL9uAq171+SXvvaayv78H0tCbFaa9Lr5YFgPzEq1b5UJBNsrcXWFDtLtH2ZiE+0W/uUZ//i5eXaoFQEAAB+Al1/NLVW6daSkEiuR5LrSLaz2uvsj8q8vvJYviWAYD8xm80m/auOXrpVsA+Hw4dkm0z7mx59em19L9hag+37Js6ZXHuxRrIBAODaaErt+73WKw+p0uuoqVRHpSCaYG+3qN0S4H/hyYnKRLxg7/d///CMpdVRqYil1ibYtm+11r5v6bVtW/uswfb94/H48TVSKgIAAD+NptR+PEqtq7KQKrW2NpJeR5LtH8tHer0cEOwnZ71en6TYViYyUoutddgm3F6yfZqdpdiaZls9tk+qPZSKAADAd6DrTZRS+/FMrKP0ulce0pNrX3fta6+9aG82m+jbghuAYMPwTY5ZLbZPr33ZiKXU/mbHKMXWBFtfyDyUigAAwHegKbXv99rc9DoS6qo0JCsL0QQblgOCDW21On9sny8TsWRbS0R8LbbWY1uK7QW7SrF9gt0apSIAAHAbNKX2416mqwQ7Sq9tq+Ug1s8S60q0fe21rZ+wDBBsaK3Ff0LdJ9km11E99svLy8mNjlYeos1EOkuxW/sUZ18q4sc9XrKRbQAAuBRdX6KU2o/PEWufWkcptk+wI6H2fX0cH4/lWy4INrTW8hTbkuyoBtv6JtaaZB8Oh7MSES/aUYrtE2x9UVNUqJFsAACYi6bUvt9rKtlaex2VhmiJSC/B1pKQSLSjNRJuC4INH2w2p4/t69Vge9n29dgq2D7R3mw+H9tXpdhetFuLb3SM0mskGwAARonkOkqsvUyPJthR7bXKdU+stTREb3B8e+OxfEuF/xU4wd/w6Ouwq6eIZDc6euG2emxNsSPJtkTbXri0VKS10xdFSkQAAOArREKdSXZPrOfIdSbZWWlIlF7DMkGw4YT1et1+/fp1IthZqUiWYkc3PGa12F6oVbJby2uyFS/XyDYAAPTQ9UTlOmuRZI+UhlRi7ftae53J9a9fvz7WSlgeCDacYTc8ZvXXUYptibW/4bFqUamIl+3WTktFTK4jwY7KQ5BsAADI8GuJ9iupjtLrEblWydYbG02offNiHcn1yws3Ni4ZBBvOWK1W7devXyeC3SsT0dIQvdkxSq5HSkVaO73h0ZJsw475PpINAAAZkVxrgNMTbev35DpKsDWx1tKQ6lF83Nh4PyDYELLZbNJSkapMZKREJCsV8ZJteNFu7TPJtmP6AqOSDQAAEKFy7ZuNa2LtRdukWtPsXllIVHc9Kta/fv1qv379atst+rZ0+B+ClNfX148kOyoRyW54jG5yVLHWrUq2b63Ff+Exe/fu5RrZBgAAQ9eNLKnW1NpLtsr1V9NrX2/t665160tGYPkg2JCyWq26KXZWIhIJ9uFw+JDm7fbzrzzaNioTseZT7NZOk2xPVB6CZAMAgF8ztJ9JtabXkVBb39daRwn2iFyrUFvQ5dNrXQ9hmSDYULLdbodT7NfX11KwrZlA98pENMVujXpsAACYTyTXtpb4cZXsKL2OEuwotc7KRKK6a18moiUhfp8bG+8HBBu6vL29pel1VSbiBduE2kt1lGJbWm2S3Vr7ON9e5AyfYnu5NpBsAADwqFz7ZuORVPv9EbmOZHqk7jorC7H0Gu4HBBu6rNfr9vv371CuVbCr5FqbibMKtkmwptqGT7H9i2KESjYAADwXuk5Ech2l176vcl0l1lVyHdVb+7rr6sZGSkPuCwQbhvh/7Z1rc+M4DkUp+ZGk5///1+087P3QhQS+BkDKVh52zqlikYQUT082LZ25Cym73a49Pj6mYp21ikR92T7NPhxOf8ujHz7B9mu9yPgkO8LLNbINAPB7iO4NPanWdhCrebnOJDvqufbJ9Xa7Ld8Y4ltCTKx55/VtgmDDML4XW0VbH3jsJdeaYlfjkn5sf05rPPQIAPDb8HLdS7G9SGtybQKdyXUvtdaWEO291jeERL3XVYgEPxMEG4bJWkUiwR7pxa72VZpts0+yNcX2Mm17JBsA4HeQybUNf0yFWpPrJZJt617ftZfprD3k8fGxPT09vd//4LZAsGER2+32vVXEi3X2sKOm11aLxDobrZ33Y3u5Nnm2FNv2CpINAHD/9OS6N1S0M6GuEmvda3LtR9YWwltDbhsEGxYxTdNJq8iIWFdtI5VYZwm2/695L9uWYmftInY+kg0AcP+MynWWXPdS66pFJGoL8VI9+mBjFBbBbYBgw2KsVUSlOnujiF9nrSGjsu1FW5NsQ9tFFJVsAAC4D7xU21yJdSbZWWtIJNWbzeakDaRqDdGHGiOptkFryG2DYMNF7Ha7MMmupLpKsCPpVrlu7bRVRDFx7qXYdq6BbAMA3D5ZsFLJtabWkVhXcl21ikTJtfVc68OMKte0htw+CDZczMPDQ9gicum7sb1ojybYNuziaBwOh1SyTaa9WCPZAAC3i5drTa/9WiU7aw2JxLrXDqKJdZRce7HWN4XQGnJfINhwMVmryIhUa3I9OlqL+7AjDofT3/Ro+BqSDQBw21RyHUl2rzXEC7Xfq1xHKbbKddQi0msN8WER3C4INlzFdnv6VpFKtDPhVtmupLu1U1lW2baav3h60VaQbACA22VErqv02q+zfuslyXUm1CNi/fT0RGvIHYFgw9U8PDykgu1Fe2Rkgt3aeVuIl2t/jraKeNGOQLIBAG6PS+Q6SqytHiXXUVrt15lUW833XO/3+7PX8Oke7gcEG65mmqYwxY5Sa91rer1kGJFoK1WK3RqSDQBwSyyV60iso+Q6ahNRuda3hESibSm1X2vPtSbY1T0Kbg8EG1Zhs9mkrSIq1ibU0XpEtls7Tay1RcRj4txLsf25SDYAwM/lErnuCbcKtYp1T671oUZNtPWhRm0N2W7RsXuD/0VhNfb7fbc1JEu2vWhney/VkWirhPvjrdVvFvHnI9kAAD+TS+W61xaikt17kFET60v7rh8feSXfvYJgw6pUDzyqdPu0WkU6S62zEaXYx+P5L6JBsgEAbpO15DpLrm1vYq1yXbWEREOl2tZPT0+0hvwCEGxYlWk67cfWBDsaXrRHRmvnbxLx6LkKkg0AcFsslWsv2T2xrtpCVLC3223b7/dpa0iUWmdtIU9PT2chENwPCDaszna7bU9PT+8Cncm2iXW17wm2ivTxWPdkG4dD/dBja0g2AMBP4BK51r7rKrX2yXUvvTa5jnqtswcbs0Hf9X3D/7rwKWg/tpftKsHuJdlGVlO5ViE2abYLbpVi+/ORbACAryeSa7+v5Drque6l11XPtd+bXOtr+Cq59q0h+/1e/1XhzkCw4dN4fHw8Eeleij0i2JFwR7LteX19fRdl/3/HHQ79VpHWkGwAgO8gk2u9llstk2tNr6M0u2oL0b7rLLmO2kGy1hD9jwW4PxBs+DSmqe7H1gcedSyRbSOS7qplRCXbZNrwco1kAwB8DZVc275KsCOxHk2sVa5HHmj0sh3JtU+vkevfAYINn8pmsznrx+4l2Jpmq2i3Fvde6/FRDoePfmwv23ahtuNINgDA59OT60ioe6l1T6y1lrWFqEz3+q29WPO+698F/0vDp7Pb7U4kW1PrbJ1JdSbX12JibVJtQo1kAwB8DWvL9Yhse4lWwdZ2kKjXOpLsh4eHd7m2thD6rn8XCDZ8Cf6hRxXtTLxH5TuS7dG64tNr+zq7eHvRR7IBANblM+RaZdpql7SFaN91ll5Hcv3w8BD9K8Mdg2DDlzBNU5piZ2IdCXVr+TuwM3k+Hsde3WccDnVftq8h2QAA1xPJtc3zPL/vr5HrSqxHBFuluve2EJNr+q5/Jwg2fBlesk2iVaYjqfa11tqJ+HrpXlNwTbLtnx+BZAMAXE8m1zZ0f6lcV5IdiXXWd90TbO29tv9AgN8Fgg1fij70GKXZkWi31sJZa7rW85ZgYm1pdpRAINkAAJfTk2utXSPX0QON1ne9RK79Xn/tuaXWT09P7c+fPzzU+Ivhf3n4cvShx0isoyTbJ9g9+bb1pXJteMnOPgfJBgBYzohc+/oacj2SXvt2kEyyq9TaBHu324X/3vA7QLDhW3h4eOj2YLd2/nCiHjMi0V5LcrMWEQ+SDQAwzhK5NrEeketIsjOprgS7aguJ5FrTa94YAgg2fBuPj4/vwuzlWfeaRKtE67HPEFsv9tU5SDYAQM2oXOsYkWtrAbGabwtRuc7eEFL1W2cPNfrBQ43QGoIN38g0/ftNj1WSnUn0CKPnjWAPPV4i2VYHAPjtXCLXvdaQSK6139on1rY3sc6S6156rS0hNpBraA3Bhm9mnuf29PQUptVVgl2J92fJ7KWS3RppNgD8blQ615RrP7xoZwm2ybNvD6nEer/fn70ZJJJr3hgCHgQbvp3N5uPNIiPpdbS3tZ8Nf050fAkm2Sb/GSbZtm4NyQaA30mUWtv6s+Q667k2ofaiHYm1PtA40hqy3aJU8AE/DfAj2G637c+fP6VgV6Id0Tt+KSbXl6TZSDYA/CYukWsT6yVy7RNrFWztudb2kEquTaw1vdbBG0NAQbDhx7Db7c4keyTV9oyIt+Ev9kvOsc+uJNuLNJINAL+RSK793EutM8FeS65NpP1s7SC9t4TY+PPnT9vveWMInINgw49iv9+Hfdet5a0dPen25y1FBXuaphOhvibJtjoAwL2RybUN3UdSrYJtbSCZXKtgL5Vr3w5iQ3usVbCRa8hAsOHH8fDw0E2tR4Q6YiS19uj50T9vaV+2/wzSbAC4J6JQwmYdvp4l1lbzfdaVXO92u/d5RK41tfbtIb4thNfxwVIQbPhxTNO/1/eNCLayRFazC6O/8L+9vZ0cywTa5NpEO/tzmGTbujUkGwDuA39N1fXIiNpBpmk6kWkVbH2YUdtDIrlW0da3hWjPddYeglxDBYINP5JpmtrT01NXsm1WQR0R1peXl7Oav2CqXFf4P0uvXcTO82KNZAPALXONXGctIVnPtdUulevoIUb/lpCoz1oHcg09EGz4sahkK6O1iOziaPXquIr3NH30Zfd6sr1IR5JtdQCAW0CvlXoN7Yl1JdhVW4hvB/FSvdls3oV6iVxHr+EjuYZrQLDhRzPPc/vz58/7XlPsS4kukHbRz85TubbzVaZHe7Jboy8bAG6XSq799TQTaxXqqOe61xZie99zHcn1w8ND2+12qVxHDzH++fPnTK7nmV8kA2Mg2PDjmeeP3/YYtYL0ZLSS5qrm6yrX/phi0t1Lsw2TbFu3hmQDwM9Gwwe/1uHrXqIjwY7aQnxLSNUaYjK93W7TBxqr5No/vBi1h2w2m7PvA0AGgg03wWazCZPsS9ALvtaicxUv3Hpz8ULt20F6f2ZaRgDgp5NdI/W6Wo0osR5pC4kE25JrL9U+vR6Ray/Wj4+P70Ltk2vkGpaCYMPNsNls3pPspWQC7Y+rcEd7f360jhJ2my/py9bjAADfRSXX2fVTxVqF2mqRVPu9bwnxUu3bQrxge7n2cyXX2hZior3dokqwHH5q4KbYbrfvSfaodEYyrMLcQz9De7ENlWj7M17Sl23r1pBsAPheqoChEmwTaC/WkWT3kussvY6GPtBor9/z/ddeqqPea+QaroWfHLg5vGSP0BPpKGnxdVtrzfa+VUTFW9tFVLQrcaZlBAC+G71+VnKt10kv0yrVto/EOuu51vS6EusoubZ1Jte+NQS5hmvhpwdukp5kV1JdCbSeZ8PemZ3JdXTMy7Xfq2grXqppGQGA7yKT60ims1Gl1iPJtabWS5NrL9fR6/es59q3h/z333/INVwNP0Fws1SSHd0YVKZViP15fmSfofu3t7f3mq3tWPbgY69dxM6zzyLNBoDPJrp++nV0/fMjagtRyc5S66glZCS5jh5o1NYQTa2Ra/hM+CmCm8ZLtr/Ye6qbge6jY9Hn6PHsjSKttTTJjvqyp2m8ZaR3PgDAUqLrp87ZNTQSa7+O5FqTaxXr0eQ6kmt9qFEfaPStIcg1rA0/SXDzZEl2JMm2ryRaz7X59fX17JgO7cf2tdbamRz792Ufj/Fr/LxEk2YDwGeQXftsHQl1NCKxtnUl1mu3hegr+aK+a59e03MNa8NPE9wFJtl6A7C1r/VuEkuO6efbrIm21XxSrWsTbE28I3EmzQaAtbDrlO6z66HWliTXkWRXqbWX6+32/F3XKtg6fM91llwj1/AZ8BMFd0PULmLrSoj1nGuHT7qt5oV7muqebJ9mqzBPE2k2AKyDvwbq3l/TdB+NLLmOhLrXFrLb7d5nL9eZWKtc+97rrOfaCzZyDZ8BP1VwV2w2mzDJHr1JROPSr5um84cd/d5q/u0iNo88/GiQZgPAUvx1yO+ja57u/ahaQiKhHpHrKLlWuY4eatS2kOgXyXixRq7hM+EnC+4Ok+zWxm8SvfPmeX7//Opc2/u678W22Y5HLSNetL1sT1Mu0aTZADCCXRei/ci1TdtBdNaWkCy1rlpDVKqXyLW2hVStIZsNv/4cPg8EG+6SeZ7fk+zshlENfxPRuh57fX3tfl7Wk23HM9HuPQCpkGYDQIZdf3TvZxu61+ugztoSEqXW8zynUm1r7be2WiTXviXEy7VJtYq1F2wfmgB8Bgg23C0q2a2NJTS9m0o2oq/Xr4nSbP+1mWiTZgPApdjf/2hfXcNsr9exSKyj1DpLrrUlxLeGROl11HNtfdYm1/6XyFRy/fT0hFzDl4Bgw10zTVN7eno6E1+9UWT70WFfF6XZ9uewkUl21TpyTZpt69YQbYDfhP19j/bRtUn30TUuS69VrlWyq+Rapdqn1pFgR6n1qFzr9wTgs0Cw4e6Zpqk9Pj6e3Ch88uJvFnpDyW4q2c0nu0lFSbY/z0v2SF/2kjQ7O8cfB4D7wv6OR3t/Lcr2l6TWkWSbRI/KtW8PUcFWsY4EO+q5tpp+TwA+EwQbfgXTdCrZ2VDxjo731tP0kWTP89xeXl7S87RFxNdUtG2u0uxpimU7SrOj8wHgtrG/59HerjF+He31ehXNPbnOWkJMrkceaNSHGTO59j3X0QON+/3+7PsC8Nkg2PCreHh4CAU6EusoqdG93oiyz/KtI62d3sy0VUTXXq5by9Psaeo/3EjbCMB9ogLp99F1J9pH10CddWRtISrWvt86EuuRthCfYFdtIbY2uQb4DhBs+HXsdrv233//ndxEIkGORFxvPLZ+fn5Oz/MJdvT103SaWmfr1vppdsY0ncq2iTZtIwC3jf29zWr+OuP3ekyvTT257iXXWWtI9DCjtYRocm1z1BqiLSFRW8hutzv73gB8FQg2/Eq2223777//QrmObjTRqG5IWvMtIz7N9ud6oY5aR+ycbPaJtm8dmab6163b2ohqAPCzsL+nWc2uGdk6G9l1LJJrlWwV66olRNtCRh5ofHx8PJHrLLl+euIXyMD3w08g/Fo2m83Ja/yiG4recKKbUXZe7zP087K3i3jxtn1rp60iNi9pG7E1og1wO9jfy6xma39t8Xu/1mtQdg1TsVapjoZ/kDETa02uK7nO2kKi5HqeeQ0ffD8INvxq5nl+/6UD2U3FD39cbzbR1+uNS9Pr6CY3Tf2WEdvrbGJt/26ZXEcg2gA/G/u7GO1VnrO1Dr0OZdfBXktIJNabTfx+66jf2mb/UGP2ppCHh4ezxNrW+j0C+C4QbPj1TNO/N4xUYp2N6EY0ety3jUTnvb29hQ9AqnRXsh21jNi/c9ZCgmgD/CxUGv2+kmm/joa/9mTXoii1tjlqC/GpdSbWXqo1vfap9X6/P5Hqqi3k4eHh7PsE8J0g2ADt303I3jBy6Ygkubp5ZTc5HVWCbe/Ntr3OvbaRbN0aog3w3agw+r2t7XoQ1WwfXVuya5CXaD+q1DoS60quK7G2oVKtDzZ6ud7veVMI/DwQbADHbrc7udFkw9+ARm9M2egl2fN8mmZHoj0i2YdD/20jEYg2wNehUh3VVKqrdSTVOts6S6v9eiS1rh5mzB5oHEmuvVTbzMOM8FPhJxNA2G63J33ZIyMT7qqmdS/adkyHtoeobFtdZ5PkKNVurU6yW6vfmR3VAGAZ9veoqtnf8ZG1Dn+98bXe9cz2vdR6s9mcSfWIXI8m15FczzMPM8LPBcEGCJjn+f0CHt107Aaj6+wGpbXq5vb6+pqe02sXuVSye6Lt1yTaAOtxrVj7Wjb89cTXRq5ZPblWse7JtQm2irV/mNHP0Xuu6beGWwDBBkiYpn8PP6pAZzId3bQuHZpm6+f32kWytpGeZEdy7OXag2gDXM5XinW0joRa6ybStu6l1plcRy0hmmCrWOsDjfRbw62BYAN08H3ZkWhHSXYv1bbjz8/P4U3OhqXZdnOs2kGylhF/3vF4PBPuanjs6xVEG2Ac+3uR1TKJjmrViOQ6u85E16qlqXUl172e65Hk+vHxkX5ruCn4aQUYYLv995sfVaBVqiO5zs6z8fLykt7oVLL9ep7Hk+xeqt0bHhNtFe6eaGsd4LcQSbXWLxXr1s7fEpLJdXR90WtPJtcm2NHwsm0yHaXXvi3ExDoSbBXrx8d/r1EFuCUQbIBBpum0ZURvVpFg92rZzU5HJdnzfCraJtu+7odKtqXaPcnO5LgSbdv7c7UGcK9EYq21nlD7YyrWmUyrWGcjCwIukevew4xVv7WKtRfs/X4ffh8BfjoINsACpmlq+/3+TJSj4Y/9/fv37KYWfb2m2X68vr6Gvdkq2lFKXSXZJsSjkh2l1/a98cfseCTVmYAD3DqZDC4V60yureZlOpLrkdG7hmVy7RNrL9U+wfZC7R9q7KXWXq5pCYFbhp9egAvYbj9e5VeJtfUsZjczX49ufJVIR0m2HbNZpdofm+f5TLiXptkq1R5fs3OMSLYRbbhlRsQ6EmmdrxXrnmBX16OeWEeiHSXX2ne9VK5pCYF7AMEGuJB5nt9TlpEEyNb2YGN1viXZ0c3QC3Im2YfD4USyq1f42TC5vkS0jUq4Wxt7n7bWAX4qI1Lt95lIR8dUriux7km1Cva1ch2Jde+BxlG5piUE7gUEG+AKpum0ZSST6qhmbSPRzc3qJtom0jqbREcPP/q1CXVv2HlekkdFO5JqFW5/ju0NZBtugVGptlol0jqPjEvFelSuVaY3m/NfIOP7rr1QRz3XKtdVak1LCNwT/DQDrMB2++8tI16ge8l2dJPztZeXl7N1dLM0uVbR9pI9z/N7kt2TbD+8FI/Idmv9FFvxX+f3BrIN300m1dGxEZG2eYlcLxHraZrS60V07dHrVpVa+3VPri2p9utMsKvvMcAtgmADrMQ0fbxlxKc/lWzbeX///g2P++HbRrxYq1C/vb2djOi4CbSl2ybgmWQvSbVba6VwZ7N9XSXU1TGANamET4+NyLTOuh6RaqtFQq01L9KRYOs1KRPrKrXO5DpKrb1Y2/rp6antdrsGcI8g2AArs9vtQpHObmTZDa8S7aj++vr6Po/2Zk/TR+tIJdoq1ra3ocKtx71Ej4Jsw1ezRKp9bWSOhFr3lVRHEp0JdyXX0XXJX4vs+uXFejS5NpEeeaDx4eGhbTabBnCvINgAn8A8fzwA6W9e2+22/e9//wtl26fY2+22PT8/pzfG19fXULRNsk2irW3Ejplge9m2JHtEtK2uUq1CHY3WlqXZhv9arRnINlzKZ0q1zkuGF+1rxDoSbBXraL9ErJck15ZaV993gHsAwQb4JKbp3wOQkUzrjc0f1xvh8/PzWd3k2kTb32Cjnmx9PZ8K9hLRtprJcJZiR4Lt9yrVvdm+3r63RiXb0XH43fTELjpeSbN+jUmxX0d7HV6o/T4Saa2PinV0rfGJdSbWflQtIdZr7XuuNb3ebEit4XeAYAN8MpvNpv358+fkRuZnveHZukqwt9tte3l5OenLfnl5eU+rTbT9Wnuz/buwK9GuJNun2SbC0bDz9BwvzxHXyvbIcbh/PkOqs2ORTOteZTqS6kiue2KtUj3P89l1JrveeKlWua6S69G2kP2e1+/B7wLBBvgCpukjzdYEe7fbtf/9739ndRVtv9f2EN8G4o9Zgq2S7euabmdSXUm2CrcOE2MdrdWptn4Pq3Os5ok+ozoO90FP5KLjPXHuHfOirPveiATar3WfibUKtkp1JNcm1CrV2+02FOvd7vS3MkatIZpeb7eoBvw++KkH+EI2m480W0XaerN7oh2d41tG/Gzj7e3tffZtIybVdsySaxNmn2TrOB6PZap9yWjtQ7gzkW7tXLYVq/WEOhItpPu26Ml0dc6IOFfHKqGOaibKS+Vax4hYL5FrFWsv0yrYKtV+7V/FR681/HYQbIAvZprqNPvv37+pZJto+xulH/omERNvE2wv3ibbkWibLHtpjmRbpVrXfh4ZrbVwXQm1P2Zfo+eNCvfoOfB9jAhbdk4kzX5d1aK5kulseIG2OatlYq2CbaZpEmkAABNnSURBVGOe57Nrg0q1F2u/16GCHaXWNus7rh8eeEMIAIIN8E1sNpv3lCdKtDVh8vWXl5ez1hGr2+xTbW0J8bI9ItqRbHuh7gn2EsmOBDuSbC/Rfm1Ux68RbgPx/nyy771SnadinK2rWiTRuh8Zo1Lt9yrTXqpVsFWsddZ2kEyuq3aQqCXEyzWpNcA/EGyAb2Saprbb/Xv4MbrJWZqtou1TbJNtv7cbqj34qMm23YRNriPRtpq2jRwOh/djVaJta5tVur1I2761U6mOZNuvp+lcoqNatbbPs7qnkuhIIpDuy1gqZNn5WvciHJ0TraNZ135k9WmK02qdI8HuyfWIWNu6+g/2Sq71QcZKri21nue5AcA/EGyAH8A8z+3x8TFMq7MbpEm1znbMp9kq2NqrraIdDZVqL9PRiIQ6m014K7HuyXZrl0u2X9tnWj0iE+ns/NaQ7+p7k9H7Gn98jXUkzX4d7bPRk2mteZlWuVahtn0l1pvN5uxaMiLWNnup7qXW2y0qAaDwtwLgB+FvjFmarTdIlWwTZS/h2i6iQxNrTbMjyY4E246ZPOt6nud0Hwn2qGz7Y9N0vWT7teH3Xs6i4xHR10T0PucnMvrvVtH7DD3u95eu/ZzV9FhvRBKts64zodY5GiNi7a8ZmWCPpta+73q/59V7ABkINsAPY5r+PQSZ3Qj//v17cgO1mk+so3m32733ZkeS7QU72ps8+1nbRDabzck5mWybnJsUa6J9qWhH0m3zNPVlWtf+M/wxoyfd0Xk91hYW/Wev/flLGP1n63l+P3osWlezrqN9NkyY/fpSse7JtRdq3dt1wepeqrfbj9fu+XUk15VY29hseIgRoGI6LrnyA8CX8/r62v7+/Xs2np+f38Xa9n68vr6+t4q8vr6+92qbUGeircl1lGRHsq1p9ohoq1R/hWhHc7W+ZJ/VKpae/9MYlWcjOr+S596+t1ZpjmqfJdYq1dek1pFgR0P/I3wkte7JNe0gAOPwNwXgh+P/b18/np+f39Pr6CaqbxSxm63fR6JtUp21jiwRbUu0/bFMtDPBrmS7tVqye2Lt52kaT6+jvT8/qxlRzUvhJUSfuZRr/wxK9nlaj86rzsmO6Tla97Mez/Y6Iqn26xGxjgS7kupMsEfF2tajqbUX7P1+z9tBAC6ABBvghjgcDu/JtU+x/WzDEmtb294n2lWKrcJdSbaX7SrRjoZJdCbVKtiRcLc2lmZHYl3Nuh7ZL6lV9dHjX01PsrLjUX2kVu0rgda5Wle1TKSzdSXU03T6MKOuR4aXab+vxNpL9RK5tv0883YQgKUg2AA3yNvbWyrYNnvB9pLtW0VUsqs0e1SyLxFtE2e/zoQ62rfW3udIqjPJHhHr6Ngl+169d8wzet61ZLKsVOdlx6L6JTKdHesJdXbMS/MSqbZ5ZFRiPc/zSUqtYp0l15VYe6mOBNuLtRfszYY+a4BLQbABbpjX19dukq2JthdtL9i9RNvLdk+wTaxHZNvLdSTZI4Lt9zpaq8U6E2mde7XRfa8+enwU/ZxRae7R+5xRsV4i1VEtmkfX0Vgq2JpQj0p1JNdZYu1nE2i/jtJrPx4eHs4SbH1LiBfr7ZbuUYBrQbABbpzj8RiKtg1NtHuiHSXZS0XbhDqT7WqYNEeyHQl1T7B12PfM5mw9MhtRPbq0RrWqvvSczyQT5pFzonokzdl6ybxUqCuZ1lok0br3NS/VKtQ9wdbE2oTa9irXml5rWq3JdSTYux191gBrgWAD3AnH47G9vJy/USTrzY5EW+Va15FcR7KdCbZKtt+bLGeyrWsbSwXbD/u+Zesls+H32Trajx7zjJ63lFHJqs7TY34/cmzJ3FvP8/w+R1IdybTuM6nWY5FYRzKdCbYXay/Vfta+66gdJJLsrC0EsQZYHwQb4M44Ho9n7SFR20gk2M/PzydirUm2SraKdS/VVtGuUu3jMZZrvzchvkay/bDvn87Zsex8PZbtR8+p6l9FJmBRvRJo3WfinB3Lzu+J88jwcl2JtF9nQ0W6kmxNqn1ftUp1lV6PiLUm1vPMA4wAnwGCDXCnHA6Hd2muJFsT7dfX0/dnV20jmmDr7IU6Euuloq1y7Wu+fu1o7bI0u1er1p6s3jv2GXjhHT0WSXK2rmrVrOtrhxdnm68Va5Vq3fuk+hK5VrH2+0quEWuAzwfBBrhzVLSzESXZmmhHwp1JdpRqq1QvEe1KrrP50tFaS2tL5tH1yL5X/yy8AFf1at9bZ7OtfT3bXzIiqdZ5RKyjpFplOxPrSKq9TKtkq0hvtx+/lbGXXO/3vHIP4KtAsAF+CT3RjlpGRtpGqkR7VLSrORLsaG8iHEn2UuFuLRds3VdzttbLbm+f1S45J8NL7ehxrWV7FeZqnQm07rNab2QybetIqHUfyXQl2EtS62hErSBerCOp1hpiDfC1INgAv4xItP0+E20/MsGu2kWqoUKdraPhBbo326iEu7Vzuda6nmP76BxjZJ3VonOq+rV48a2ORedlx6O1irKvZedkxyuZjvYqzlEtG5FUe6H2a5Poef54v3WUVvtallhHIxNqqyHWAN8Dgg3wSzkcDu9tIJloZ+0ikWi/vMQPQI6KtpfpSrD93mQ52qtMR1JdiXYk0NG+t67mal3VRo5dQyTO1bERkc7m0fWIUEcirTWV7Ey0I4HO9lVinSXXVVtIlFqPirUdR6wBvhcEG+CXczweU9Gu0mwv270ke1SyRxJtXzsej+/HTJiztYmvSvWoZPth37dsXdX83Kvpuqp9Bl6Wo1q0rmqZQEc1XfvRWv7KPa2rUEcy7WuZSGstkmrd99pBIrEeTa0jyd7teN0ewE8BwQaA1to/aXt7e1sk2UtFO5JsvzdxVtmORNsEO5LuSK4z4fZjqWzb9033OvvLbHWenqPrqlbVe2RSFtUjgfbrbLZ1dZ4eHx2W1mZyncm0X5sgWy2Sab/vJddeoDPB9sPkOVprr7XK9Xa7Pfk+A8D3g2ADwBkm2kslO5ozwfZirdKtou3lOkqze8PLcyTZkVgfDofWWkvna4Q7mkfXVW3kmKeSsuiYynK1Hpl7Mt3axy+JiaS6qvXk2o9pmsLE2su1ynRPrCOpVsHO2kH8OpNrOw8AfiYINgCkHA4fD0SaTPdaRjLJHm0ZeX19bYfD4X3uSXYl3CbKlXCrZEey3Rut9YVb17aPZl1H+6zWO6eS6uocrVVSrbVRqc7q1Yik2q8jmY5EuhLrpXI9klpnct1rCdnt6K8GuAUQbADocjx+9Gl7qdZ9JtdR+0gvxY5GJNlLEm0v0KPCreNwyBNsFelIrHUdzb2aZ+1LuIq01jKJzubRdTTsuBfnnlxHEl1J9TSdpteaWGcybcdVpr1sj4p1JtherLdb2kAAbgkEGwAW8fb21m0Z6cm11TTR1iQ7kutItivhVpnWmpdpX/P1aNix1vrpdSTXuq+EOqp51rqMRwJXCXVUi+ZIpnU/KtU9oc7WmWhnQq1iHYl2JtV+vdvFvyyml1qbWG82mwYAtweCDQAXcTgc3mV5RLQr4dZEu5dme9nORDvae4nuibaKdCXb2WgtlmydK5GOarqO6B3vpaGRRPt1VtP6ErkeEepMrjOxrqS6J9aRVEeSXbWCZOm1Db/3vdXzTBsIwC2DYAPA1fhUW6Xb7yOxzmR7iWhn8/H48Rq/bKhEV7JtIxLwUbmOhFqPG3rco7U1LuWZVGutJ9cjUq37SKSrfU+ye0OT62iupFoFuzdUplWs7TOj7zsA3B4INgCsxvF4DFNtn1yPinaVaJtAR8IdyfaSUQl0T6x9rbX8zSO2rmrRrOuqVtUridNjmUxns57fE+pIoqO6inQl1dN02let+yq1rtLrnlhbXdtCMrm2FpB5Jq0GuDcQbAD4FA6HQ5li90TbxDqT7CzNzhJtlW8V6qy2VKxHRmt5um2oXOulurdfSiXWfp8JdyTRuu+NSLQryY6Saa17ma6k2u/n+ePhRVt7gVbBNpn2Uq1i7QV7t+NNIAD3DoINAJ/O29vbYtHOBNvPh0P+Or+eaHvhVsmu9iNSfTh8JNZ2nu0rsV4i3LquahUq0lrLxLqSa7/WmollJdWRWEfyHB2LhFqlOpJsFe4orc4EW0cm1vbnBID7B8EGgC/jeDy+y/GSlpFIsKN1T669ZGfCXUm2F2ad9Xg07HtQ1Wxfzf77GdX1uFJJXibUvXlErrOhMh3NlWhXQp2to/TaS3Uk0yrcXqK1ZvXNhr5qgN8Igg0A30Ik273RE2xbZ2n2UslW0VaxHpHrTLjtexDtbV3N/vtY7Xuo/GX7nlz7dSXVXpizmkr0NXKtUq1yXaXWkVBXgo1UA4CBYAPAt+Nluzf8eSrUUc0k2ifcXqCvlexo9uvW2knd9n7uiba/TEfr3mXcjvekT+U5WmeC7Y/Nc/zrzTOp9uLsa5fItQp2T6ojoY7S655gI9UA4EGwAeBHYXI6Kti9FFuT7CzZVtk26fdyvVSybd9aO6tHEr1EsPXSnUl4RSbSfl8JdiTZuq/EOpLraPYjqlWJ9ahge3GuBNsP+/MAACgINgD8aEy2397+PSiZCXYm2irXWo/maqhMV4KdSXU2WovlWqV6Dbk2lkh2JtJ6zNdVqFWye2IdCXUm2NHsR1SLhLoS7Hnm7R8A0AfBBoCb4Xg8nki0topEsp2JdbQele2eXI9I9uFw+qYRW2dyrcd9zc+6rojkOpJsPS+TbJ/oRmK9plyrTEdiHQl1JNeRUPuafk8AAHog2ABws3hBzmS7GpFQq2yb1GeyfY1kZ6O1sfT6Grk2epKttUywR8YSua5GJtWRZC8RbNvPMyk1AFwHgg0Ad4HJ6GiSrQl2lGL7oTUT50y2K8HWfWv1A4++rjX9Hihay9LYEamuaj2hjgRbpbon2F6sI9G+RK632+3JvwsAwBog2ABwl3jh1lRbxVprmWR72a4EW4+NiHZrHw9C+j9/JtVLJLtCxTISaZ2vkWsv05VQ+2Mq1r4WibVKtk+qN5sNQg0Anw6CDQC/BhNYe2VfJNxernuptkq0rqs5k24drcW92cZnCbatVaT9ekSsVa5VsqN1NDStzmYd9jUAAF8Jgg0AvxYvuVGaHYn1qGircGu9tfzVfZVo+z+31vTfrSIT60yofW10eNmOhLon1aNy7WXa/7kBAL4LBBsAwOGldrRlZFS2l0q2/nn83tZ+1vUIXkZ7kp3tVapbO32LSCTXKtFay9pCfB2ZBoCfCoINADCAia1KdCTe/rxKsnVdDf9nsLWfdR3tDZXSSyS7EuxsPSLaKtb+cwAAbgUEGwDgClSElybZS4b/59naz7oe4VK59jUv0pVoq0yrQPvPBgC4ZRBsAIBPQqVYxXpUtv1nRGv952V7QyV2RLIz0Y6kOkux9bMBAO4VBBsA4JvJEmkTb6tFYj0i2hk9sbZZ5Xie5/JrAAB+Owg2AMAdsfSSjhQDAKzPtncCAADcDggzAMD3w9v3AQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABWBMEGAAAAAFgRBBsAAAAAYEUQbAAAAACAFUGwAQAAAABW5P/bdA0UbwR/UgAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image7_3_4",
					width: "728",
					height: "729",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image8_3_4",
					width: "215",
					height: "188",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANcAAAC8CAYAAADrTjssAAAACXBIWXMAABcRAAAXEQHKJvM/AAAbrElEQVR4Xu2d224cRRPHa/3xHPH6EDsE+w0i2zk5ISfCDZJREjmIp3ASBQXBY3ABIbYjEEjckwDhCbxJLn14BO64yX4XUS+1tXXqmZ492PWTRt1dVX2Ynfpvz8760Op2u10I3Lx9+xbevn3bZ2u1Wr36L7/8MmDj6h7b4uIiLC4u9myLi4uwsLAAwWTQCnEN8vPPP/fqb9++hTdv3gCALRip7vXnCA+gX2zXr1+HYLw4seJ68+ZNTzQAAD/99FOvLolB83kFwfk9ovL6bty4AQAA165dg2C0nBhxvXnzBl6/ft0rAezkt3xW3ev3CKhqv9OnT8PCwgJ8/PHHEAyXYysuLCS8QyW8AtJ8UlxJkXjivbGnT5+G+fn5Xhk0y7ERVxLR8+fPB3xUBJzNIxpvnBWfIw5Pv6p9rl69CvPz8yG0hphocb1+/Rpev37dExQnIsnuFZDV9gqD89eN94zjLa9evQpXrlyBoBwTJy4qKIwkLurLFRttW3WvP7evJRDPuFY5Pz8PV65cgbm5OQjqMTHiev78OXQ6HfZhBMZjH6a4OLtHBFzdGscqPTFpnrm5OZibm4P19XUIqjHW4trd3e3tVBSPiDS7lMSSzRKUp56T9J5+VBBVx7LGX19fh8uXL0OQx1iKa3d3F3Z3dwHAL5Zce5121XpO0nP1HIFIcXXK9fV1mJ2dhdnZWQhsxkpcWFQYmugl7FwMtUltTQBcPK5bpcdmjdF0OTc3B5cuXQqRGYyFuHZ3d2FnZ2cgORNN2LkYatPanACkGC5eKrV+Vt+SpbW+VqsFly5dgosXL0LAM1JxJVElaKJiJF+OXUpgKUZrW2KQ4rkk5exWf48Q6pSemFRevHgxRMYwEnHt7Oywt38Ag8lp2SWfx+adS0v23HiPLycmVxDWXFofacxUfvnllzAzMwPBe4Yqrk6nAzs7O9DpdABgMCkTTdqpzdO3dN2buFIfa6w6MTjOiuXWOTs7CxcuXAiRAQxPXDs7O323gAD9F6eOXfNRu9Xm7Fofq67ZqsR4yqq+OrG0nJmZgS+++AJOMo2Li+5WFJxYms3j94zlieFsuF21Tm1ajBSrlaViuFjPWrny/PnzcP78eTiJNCquhw8fiqJK4IvmsVsxlk0bl/qkflXrngRNdStWS+iqPi3WWq9WzszMwP379+Gk0Yi4Op0OPHz40ArrgS+Ux27FUJvV1nxcEuXWcxJS82llHZtnTCveigMAuH//PrTbbTgpFBfXzs4ObG9vsz78Qnvs3hjqs9qSjfOVqHv9dco6Ns+YnnhP2W63YXNzE04CRcX14MED8zYQoD/BNBuHFEftVjvHXrVOyypx3gT32jw+LsYTL/Xn/JubmzA9PQ3HmWLi8goLoD+JPHYOGsv19cRoPpoQml1LpBy/p8z1lYj32rSS2trtNty7dw+OK1NWgEWn04Fbt27B3t6eFdpD0nOOzmks19cTU8eH7Z75qb3KnJaPo+l4L1RsBwcH8P3338Ph4aHWbWKptXN1Oh3Y2trqtfE7lAcpPmccLpbaPDGSnXvXxfW6fi42d3cobeN8Vh/POhOc7d69e8fuNrHyzrW9vd0nLIBy73g543h2DCkmZx4A31xevP3oLuddg2azdtwmwYLCth9++OHY7WCVdq6trS318xX3AkposXXGkS4ih9WXe9eV6to7Na2ntjWOthtUibP6lozFpWUDeP808c6dO3AcyN659vb2zM9XOXot9dnCu1t50MaqMobV3zsmhzW2F884WASl/FRkh4eH8PTp04G4SSRr59rb2+vdClovpDcGwI6z/Bgaa11Qr82qWzbLLr3bc2UdG+crVddsXGnV79y5A6dOnYJJxb1zYWF58erWirP8uVTZPaydSLJZsZLPE2tRJc7bpwSWyJ4+fQpHR0cD/SYFl7iqCCtR6mJ5x6FxUj9P0krikMidyxoPY8WWECNFOvcq42Hx5Ph+/PHHiRWYKa46wkp4EsnypxhvnNbW7J7xAfrX4hlHiuXGyVlDjg+Pz81VV0AJ7Tw0IVF/qk+qwExxST8nWOXFt/pY/oQ3DiMJ02PzJJ2UrFxfbi2edVi2XF9VcgSSoPNzMcdtB1PFtbW1ZT4ZzKXURbbGsUSQa5ME5ulr+SQB5tg44Wr9tDrFeq0pOfGSoDj7pAlMFNf29rYprJwXEVPqQlqxwxKY5ZfG0cbXYjXxePppdcsn2YZBq9WCZ8+eTYzAxEfxN2/e5Mws1m0Ch9XH8mOs2Jx3R2rT2qXrrVb1R9tVbFxb81kx2ryWT7JRX+LcuXNw7ty5gbhxgt25ch9gVHkns/pYfkxOLMbzrux9V2+iTm3etVCb9vrk+qzXx+vLgRPbq1ev4NmzZ0z0+DAgLs9PYHBUeSGtPt2u7+kgQPWLXCWB8Lo8IvHWOZ81D0XrR9vWeVIsfyLFcaLIRRvj6OgI/v77b9E/agbElbtrYXLEkIN3TE/SeX2aoGiMJBKvqDBcfy4el5agaByN8Vw36zXC9RKi8tBqteDVq1dj+xmsT1x1hIWxLlQVvGNqcbk+j41Lcineqkt+LY76OJu0Zs5n2T1+qy9HHUFub2+PpcB64qp6O1iXnAvhjZUSvYpPskltSyi5ie0RVE685zW0zpeSc37WWF6oGMdRYD1xSV8WVyXnRfRedID82FI+K+E8fTg7FYMlFE88RlsDdw51zkuixBgexu3zV9/OVZrcFzBdXE+/EnG5Pm9bEgO1c/FcPyleGxuXWr2EjcMbZ8GNI91CHh0dFd8k6jAFUH7XwlR9kbXErxpXwudtS+LR+mviSaXkk/xaXbNxWH2949TB+mw2TgKbAmhm18J4BcCR+lpjWP4UU9VnCcRKMm9/q7Rsnrr1mnLnY52ThPd1seJyODo6GovPX1PDfJAhXaQcrDGs8bX+WsIlP43V/JIt1aW2VmrjcmNyMRR83nQsz2tB21KfEnjHHocHHFPevzVYEuvCedD6cskixUh4+3kTWktuDI3jSmkOjDa39fpINqmPdU4U7bUtyagFZv7KSdPQi8YddbESqcrF1hLMqnv9Upnqmp36uVgOaSwao/msuoc6fTGj/Pw1cnF54C5isuci9dHm8PaRkpire5PHisd+Gktt3FrpwcXSPpJdOg/t/Dx+Sm78qAQ2EeLS0C6qhJYMll3ycW2azB4/l+CSzfLTsWkMRjo/67xz7MnH1TVbXUb1M4gTJS7thcdJIB1WP48d+zRbqlMbtVMbnVeLp+NzNk+sde50XVwf3FdrV6XuuKP4GcT//fvvv19ZQeOE9T1HDtJY2hzUZ/3ukfQ7StrvM3F+7neirD60ziGtHx+cjTtwHDcW9Uvnoq1fWq+Hf/75B5aXl62wYkzUzgWQ/46lIb0LW+/MdDfQ+tN3fxzDxXL9rHju4PwU6VyksaT+3DhepHElv+c8JIZ9ezg1TCWPM1KSaImptakPJymXsJxdKnG8NK7k1+wYK1Zai8cuIcVwa5PirHmGeXs4keLKvWi5aMlGbVwMTUYu3orRSq2P5sdtbp1SX+ugSHbs50ouBre5dXFY63316hXbrzStbrfbzfl7GZOA9x7cQhvHe++f8znC+/nD+vxi1SUbF5Nz0PmmpqbUOFxaNozXpnHq1Cn4/PPPrbBaTAHAUD/kDQPrndOL9e5rvbsmG/Vx78JSTJUxtbnoGFIMnd9z0LG1OFpKWP6EdJ4Sw/j5w2MprkTuC85h9bcSk8ZwCeapS8nJxUh16cDjcOdDkfp4+mpw55ba3JwcOfM3/QdupgAANjY2rLiJxpNYGp44aTxsp3WPn8ZyfbUx6Jo4P42jdmseimfMZMOlZKM+3PbEaTQpsN6j+OO6e1lwiSDFeZDG8yQV55f6cInK1a1Y6vecJ43X+nNz0ZJbH9cX+6rYOJq8PTzx4sJYF8TyU7iE05KK+rlxuETU6lKbxmvzSGuVsPq+e/eOXR9X0jrX1mye46+//hroW4KeuDY2NkJgwL9bevxW0mnJkmxcglkJyMXQueh8XHzJgyL58Rq0Eo9B+2I4m4ejo6NGHs/3/YTGcf/slYN1obiEkZKLQ+rjsXN+zse1uXXjvlx/jDSvdw5ubdTH2fEYdDwMt2YPTexefeJaXl6O3QshJZiFlJxaW0oarq4lLHdo40pzSeNzdineamMbHYPapbrU5tZmUVpg7D9iOG5fKpcg90tKDO1rfQmqfYnKfQkrfTHr+aJX8tU58Djpi2RubM/6canVuTZHq9VSRVfy/zCzP7j77bffcuYTTe67oBfpnVx756cld0jjS3NZ43n8dG5vPB6bllIMrdN4Cc0HUHb3YsUVt4c81oVJcBedtmkSSAllxWjtd+/eiWNq/SU8fm0eGkNtqW7ZOB/Fe06Uw8PDYo/mxV85iYcbPNoF0y66dpGlZNRs1I/HkkrPuHUODilGmj/VcZxly12DFgsA8Oeff4q+HERxLS8vN/6DjZOM52JpF1BLuFTHdsvGrcWTVJrNOj8cL/XDMZpd60/9ko2OYSGd5+HhYZHbQ/WXJWP3Kot24Tk7TRoaxyUlFyMlH9dfSkopEdNh3YJ6x8Fr4uKpT0M7H4sSu5f5m8jxcKMe1sXlEkDqoyUf7Wslbu4BMPiTFd1ut2fzzJ382rrpOBTPXFwfzm5Rd/cyxRUPN+pDL6yVCFJp2aS+2M/ZuBgpaTkbN75nLLoGaT4uTrLRcTCSXaLu7mWKCyBuD0uQe2ExNHFSKSUbd+D+Wow3NvfwjKfNj23YR20U2p/araOOwFziiocbw0VLlmSXEosraZJydWzDt3oSVlJy8VxfauP8XJuOK8XSuFwaFxdA/GDvqOGS10puLo77iXQ6hzV2enhB+9U5uPk9pWTztL1UFZhbXABxezhMuISjfi3xtMTlxpH6coc3TuvPrYGre0pqo3at7WEo4oqHG+OFNxGlg3v6V+Ww5rEO7lxw3VNqdantORKHh4eQS5a4AOLR/DChCYHtnkSU+tHEoTYr2bQk5LD6cueS2jklHUMaL4c0RpXdK1tcABAPN4aIJ5FpQmE79eN2lQN/3rJic+elMfQcMF5/qtPxczk4OMjevSqJKx5ujD9cMklJbCV53Tjah6KNmdo0FttpPxyL0Xwe/vjjDyukj0riAoiHG+OGlHRcwlp++jSQQsei40rxUn8pLtm0Oi21OsW7/sTh4WHW7lVZXPFwY/zgxCLVOV9q0zjtoGgxXB8tTlqXBBev1Tms8xuKuADi4cY4QhODq0sxozi4tXPngn1cSW0anpgEXVPOrWEtcQHEw41xhiadlbg5hxctXhqTa9M6Lb0+qW2B1+R9clhbXPFwY/yREjdXNNw41qHF07Hp2rg5pVLz0f5S20O324WXL19aYQBQQFwA8XBjErAEgNvSl8vWONahrYfaU12y4fgc6vZPeD57FRFX/GDvZMGJRapTAWjCsRKVExP1S7HWvNw6pHVZbQ8HBwdWSBlxAcTuNS54/rwYQL+QUhvbc8Wj9ZfiNaHQGDwHrktCkUoah9va+VE8DzaKiQsgnh5OGp7k5WI9h9WXQtchiYFbL7d+qS9npzZpHIp1a1hUXHF7OJlIic0Jwpt8Ul8pBrelMaQ1UjiftQaK5xytW8Oi4gKIp4eTBpeAElbiUxFwfaUYq22hiYeL8YxvxVm3hsXFBfD+9jAENjngJLJEowmIG9MSnCU06pfqFE+cJyb5pEPbvRoRF8B7gcVnsOGjJbUngXLQks4TL/lx20OKo/HcWNoc3vkw2ueuxsQF8P4zWOxiowcnVI4YKN44AHue3DVIouD6WWNRuHV50b5QblRcACGwSYcmf64oKFYfKhou3iMoTnxSncPyY6RbQ/ZfCDXJ9vY27O3twd7enhUaDBHu3/pUOdK/DPIe2nycj9pSWyslmxQj+SXW1tZgdXV1wD50cWG2t7cBoNn/qB748CR77uERmjQfZ6e21Kbrp3Zc0nqOT+Px48cDtpGKy0MSIEfsgOWwkl07Uh8qJu0f33nG89o8ZZU61+bodruwubkJ7Xa7zz724qoDJ8wQJI83kbVDEpe3f868yV6lTFh2qY1J8llbW4O1tbU+37EWlwcswJN8eyolNPVZh+dWkDukeTg7tz5ccjYtRqtLNiqbdrsNm5ubfbYTLy6JkyY6K3lzjxyRSXN47Hj9OaVWt9qSZL766qu+dogrg+P8AEZLXi7BPYf2mcv7j8i5g64vtT2lZdPallRCXAVJYpv0z3FcInoT3XNwu5g0rjUf9ktr10rLJrU90M9dIa6CTOJ3eFLSeZO99CHNx9m59VO7FEdtnrZFiGtIbG9vj/3to5RMVqI3cXjm4tamrZsrJZun7QHfGoa4GmZvbw86nc5YCk1KJiuxmzis8amfrhf7OZ9l87YtQlwjYpyEpiWRldilD218az147ZINn5dk87Yt8JfJIa4RMcrPZ1YC5SR6icMaF/tpLF4/Fyv5MbltDfy5K8Q1BgxTaJ7EqSuGnEMay2vH55BbJnLbGu32f18mh7jGiL29vZ7QmsCTNFpiW4lf5dDGoj6tTdeulVrd07ZIn7s+0MOCYZL+uUXTIrOwkokTwSjpdrtjsY7EwcEBtNvt5n9ZMsgn/YJpyb+k5Xk3pu/m3oQdhdBK3nCVHAvgv1+eDHGNMRsbG/Dbb7/VFlmusDx2iVyR5cQ2RVNrCHFNAHVElissThy5ggHgP0fVoc7ukvrWGcMDPdcQ1wSRRFby75Hk7Fh1BSJRalxJPHXG9/bFcemP1oS4JpD0Z+vqisza1bRdrMrO5I2zwCJqejfyIJ1TPC2cUPCTxa2tLSuchXvKpgkq1SVyxYah8doTQGzPnack1tyxc004y8vLWbeK3lsnTiRYYB4BSXGcja6L68NReueyzinhiQtxHRNKPLqXBKOJie5WnqTjGHY/D9r5WhwcHIS4jhMbGxuuPyHO7RI4abQE8ojIm5TUZu1WWqxkK0nO+IeHhyGu40bObSInFFrPFZHls0RRRWDepPfGcVTpG+I6pnD/CEPbdThR4eTVxJIjJM3u9VeF+3zW1FwAIa5jTfoxKm534oTGCUUTHY2T+mt2rc3VuTaHtEYNy59L/FT8CaDT6cCDBw/UxMfJzdW5dim7NKcnTrMlcm1cm/o8xM51AlhaWoJvvvkGAORkT9CEkhJb6kPt1hy0nZvQVkzOenNjAPTXM8R1QlhaWoJff/0VlpaWAEAWkZQsmuiwTaKEwHKFZ6GN4bmhk/qn1yLEdcL4+uuve08SpXdcrk3jJaQxk09rSz5LVHh9EpYYc9bmJcR1Anny5AksLS2ZCWUJThOS1Q+3uboHbU7JnzsHQLU+ACGuE8uTJ0/go48+GhCH1uaEpAlHwyMwaWwuxjtvQhN17lgS8bTwhPPZZ5+ZwtJ8WqzVjwrDMybXRyuluuT3tC17InauE076Yyo06aUjxWKsRMZtqS/1WYmLYzyxAL44TwyALy7EdcI5e/YsPH78mBWQVKc2K94SmVX3Co8TGxdr+UsR4grg7Nmz8OjRo17bEoomHquvh5zk5wRFfZKfYo2RS4grAID/BEYFkeAEJIlKiufsXF3yecRixXrqmk2zU0JcQY8PP/wQzp49CwD9AuIOGpPQ/FLi03jso3B+GpcjIA66DssuEU8LgwHu3bvHJrwkFMvGiUbyV52PKyWbFCO1JZtF7FzBAOlvckgioAf1J6wYro370rqW9NYYXB+vr4qwAEJcAcOZM2fg008/dQtJ8nHCkYRiiUOKl2hinBxarfjZwkDg9u3bcObMGQDgxYPrloC0kkt8bkwaw5ErBGtsz3j4NaCvR4grELl9+7aYOJzArDiu1OpevILzxpUixBWILC4uwieffJIlEM7nicmJ1+bQ7FKMNreGFrO6uhriCnRu3boFi4uLaoJbPi4moQmUi/MkPYclJozl98aEuAKTW7duDQhFEo1HBLgfjbXEyPWpgyZ2CU8MQIgrcLCwsAALCwumkHCpCTBhiShHsBzamJK/JCGuwMXNmzcBgBcOJ6QUi/tQmyeOxmh9uX6SzxIeBz0/ixBX4GJhYcH87JVKSUySj9axzSMybbycuTQsP2VlZSXEFfi5ceMGAOgCyvFjGxdH7Zytqs+y5fglQlyBm9OnTw989pKEhP3YbglMQxor14ex5rb8GiGuIIvr168DAL87SWLLSXxvidEEkCtgjDWuNWaIK8hC2r1w3SsAb+J7RFkFSzweHz7ndExPTwNAiCuowLVr1wCgP8E5UXkEpQlGSnBpXKm/V+yWjztHjna7DQAhrqAC8/PzcO3aNTGhqd2T9JaQpHloX0uYmk8Tj0dUlBBXUImrV6/2CYkmJtfGJcYbZ1GlT6KKGCVWVlYAIMQV1AALLMG9+1uCojZvadm85MZ7CXEFlbly5UqvLokMJz+1JTtXevDEeoSukRufHmYAhLiCmszPz5sJzAmIE5tHdFyyc/1GRYgrKMb8/DwA6DtValMkMXkE4omhVOmTS4grKMb6+vqASKS2d5eS7F6BSu1cqvQPcQVFSQKTdq1kwz6ujmO1xK6S9KMgxBXUZm5uDgB44UhC4QSG7VwcZdwEmB7BJz4Q4oLAzdzcnCoQapcEkzOG1+71U3LjOWLnCopw+fJldefKERZl2LtW1f505wpxBUW4fPkyAMiflziBSUg72LB2rSrgBxmJuC0MiuHZjSyxWH4Lzxpy/F44ccXOFRTj0qVLAKDvXlzdQ9VdS8NaYw70lhAgdq6gILOzs6aAvJ+VtHG8QvPG1YXbtQBCXEFBZmdnRZ+V0FWEZY3JUaWPhSSuuC0MipIEliMCb2yOL3fX9PgluFtCgBBXUBjPrSH2Vd2lqgqhNJKwAEJcQWEuXrxohQCALZYcYXmFVvqfqE5PT6viis9cQSPk3JbVEVYpqoyrCQsgdq6gAbjdq4qwPEjx0i6Va5dYWVkRH2QkQlxBcfBTQ/q5CmMJK1dow8K6HUyEuILizMzMAID9MEMj57ZSIneX8uxe09PTcPfuXSsMAEJcQUPkfueVKxyAan0sNIHlCAsgxBU0xIULFwZs2i0ijSuBNo5nl8LcvXs3S1gA8bQwaIiZmRmYmZmB/f19UyyWvwp1xux2u73+Kysrrs9XHK1uroSDIINHjx6p/pyHGN5Yj7CsmNXV1cqiSsTOFTTKhQsX4Pfff2d9VoJXoc6Y09PT0G63a4sqETtX0DjS7uXdiSS/1ZagcSV2KY4QV9A4+/v78N133/XZcp8YeuI94kox09PTsLq6an4RXIcQVzAUqMByheERl2RLtNvtord9FiGuYGgkgeWKQvJ7baurq9ButxvdpThCXMFQ2d/fh5cvX8L+/n7PZglLitGeFrbb7cZv+yxCXMFIePHiBbx48QIAyoprbW0NVldXB+yjIMQVjIyDg4PeTqah7VAA7wWVHqOPEyGuYCxIt4oHBwcDPiqu9GAC4L2wxpUQVzC24B0NC2pS+D+kI1XvFL99fwAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image9_3_4",
					width: "183",
					height: "149",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAACVCAYAAAAaCmuiAAAACXBIWXMAABcRAAAXEQHKJvM/AAABpUlEQVR4Xu3SMREAIBDAMMC/50cCM71k7tg9M7Mg6LwC+JW5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYmy9xkmZssc5NlbrLMTZa5yTI3WeYm6wI8HgUmkfjzMwAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image10_3_4",
					width: "70",
					height: "81",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image11_3_4",
					width: "70",
					height: "81",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAABRCAYAAABv/dCnAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAuElEQVR4Xu3QwQ3AIBDAsNL9dz4GQBEDYL/zypqZ+Tj8t+BVxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYE4wJxgRjgjHBmGBMMCYYEzbHagSeHZU5TQAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image12_3_4",
					width: "195",
					height: "115",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image13_3_4",
					width: "195",
					height: "115",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAABzCAYAAAAltbbfAAAACXBIWXMAABcRAAAXEQHKJvM/AAABIUlEQVR4Xu3ToQEAIAzAMOD/n4ep5wASXds9M7OAdV4B/MIMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMEDNAzAAxA8QMkAsrVQTiurEFegAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image14_3_4",
					width: "140",
					height: "68",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAABECAYAAABTe93nAAAACXBIWXMAABcRAAAXEQHKJvM/AAALsElEQVR4Xu1dv2uUzxN+3vfOzh+9JiDBHwRN/JEYcxZWFoKNYArBQNIYLELU5O9IIXafwsLKIilsRBALLUzAoCAYY5RoJJoQENEiCJrct/C7r3NzM7P73r3vxeg9sOy+s7Oz++48N7Pv3SUXlcvlMnLC+Ph40h4bGzM0m9gqiLIgzNTUFJ48eZLUPjjyNEm09VAXYaampjA+Ph5EEo4oihBFEUZHR1EqlVAqlXxDmvgDUBNh6iEK8IssrnalVCrh+vXr6O3t9YxuYjORmjB9fX01EwWoJIurOXFKpRJGRkYsM01sElIRJg+yuNqVOI6TMjIyguHhYdVeE41HMGHqJQvwmxiuTeVxHFcRxpXh4WGcOHEC3d3dmukmGgQvYaampnDhwgVLJRgSYaToEkURCoVCFXFOnjyJ7u5uXL582ZqmiRzhJUwWkQXQ05BrS5HFFUqeQqGAQqGArq4udHV1YXBwUJuyiRxgEmZ8fLzizbd6YJ1fOEGoTCILbRcKBQwODuLIkSPo7OxU528iG6iEyTIVATphtLOLlJI4UeI4RrFYrJBdunQJHR0dOHTokLqWJmqHSpjdu3dL4prBD7mutqKKRBpOFok0xWIRHR0dOHz4MNrb29He3q4tq4mUKErCvr4+SZwZyuVyxWG3lkJJxmsAmJ2dxfz8fEKg8+fPI45jnDt3zrO6JixURZisU5EDjzDU8TTKSNFFOsfwQvuKxaIYdVx98OBB7N+/H/v27UNbW5ux6iY4KgjTKLK4mqcjnoIkovCU5dISJQVvS6ShsjNnziCOY5w+fVq7hSb+jwrCZPUIzUFJ4moruvAiRRIeUTg5QkjDiVMsFrF3717s3bsXra2t2LNnj3Vb/ySSM0w9Hyb6UC6XEce/zhY02lBwMkmF6zlCaeOobadPay6PoghLS0tYWVnB06dPUSwW0draipaWFhw9ehRNkAiT9VMRh3MKIEcYLRVJ6UgqcRxXRQyaqqQzjXXOof287uzsTO7nwIEDnjv/u1AEkNmbcxZc5nMRQQKPDFRGCSZFE01ObVr93D6dn9ezs7MJoRYWFhIytbW1JXZ27dqFHTt24G9DEfh12G0UeHqiznKQSEDBr6kshCAa8bQxGhn53IuLi0m0WllZSdo7d+7E9u3bvfa0OazaegHmgSKA3M4uaeHbLK1oZxMuo3asebkdqsch6fH+tbU1fP/+vSq1SumY34tFLgDY2Nio0MsbxUZFF/pmHfA7NVnO1DZK2jhpHN9sH6EkG9I6fGOojPalReiYcrmMjY0NAJX7mgeKjYouPodazpXCLneiJqNy1+YyKrcQ+NWhCtAxIXMA4XoSapkvDRqaAENffZbTreKLIFp6kvSlFCHZD1kfhySrBfQ+aO1QLpdrIrmFTSGMtKE+mZXL6RhfqpPmCCECb9NrGgF966PjJZtUXg8oUbIkTtyIR2qgcgOszeQllCiSUzRd12fZ1kgkXQOoiEAapL5QZ/L1S/DZ8fWHIG7EH5P5HGcVriOBpx0tfVh2JBL41qbZ8/VLuhZ8/Y2E+PWGLBHqIJ+TXB8nAyWIdkaR7HJdru8jnLZGyZa7ltah6Vsy6dqnp8nSItczTBT5UwrX5xugjXMEkeCbV+rjMs0ubWvr53rWeEtfSyHWGl1/XsiNMPSmtI3RHMU3U9LldjQdzRYvPlt8Tg7JhqVvgdpytWWjnrnSIj516pRPpyb4nKLp04OjZIMW39ON66e1i0q+9XFbkpz2ubYPkg1JLtmU5m404jz+CF5yhuWg0KggvSlF+30HXgeeyuh4a521FrpeKc3QtWltKpPkrk+D1ZcGMZD9v90IuVHqINpvOch3HtKKtAbpsKytU7qmMgnW+cO65jJtHt/8eSEGgLzSkgRps6lMc7jWHxqdJJsh+tIa3bUvJXK5tEZJn0OTu75GIgaAUqmUK2n4RmkbzfXoeKuEjqGQ5HwdVC/ttTYfR+jaJEhrl3R8dtIgSeZZpiUrT9NaKpRMIdHDktO5tTloP18fJ7aVuixo9ul46ZpDuz8NoXppkBAmjyjDNz3kDOLGaRuctlhPRdqcdF4JUp9mz11n/Smyb61ZzCGh4nGhnihDHSS9giV9q3ZtZ9NyOH/qoWO57ZAnIe0wro2T5ubXfC0afGNDxvt06kHFTpdKJUxOTmq6InybWUtfWl2pX5PxtVM9PoZHJzpO0udwMp6iQ+5FsxXazgtVL81Q0vBNot+ok25ccwh3DNfh1/UWvnbrSUebm/dp15qN0E+NJVubDfGjAYs02qZoeiGF6vP3RniK4++fWOmDr0XTobapjMJyMteV5nDj3QuL63Jblk1rXN5QP0sqlUr49OlT1UHY2jj63Q7uBH6DFJoe33hrPN88Tig6h9OhNbcHVH7HxTpHaeB7QW1La9bWwuW+6zzh/fBxYmIiKEU5WDdNi0YQPsayIdmjpNDGSnItNWnzcfu+++FIE7E0SGvJG17CAL+jjXuK0t5n8W2y5RzN4T5baefR5Np8oeugelpt6aUBt9VIBBHGYWxsDJOTk1Vpit6AtImWXmgqsuxS+7wdYktbizQnHcMRx9WHdw4+rwVtfOihOQ+kIgzwK9pMTExgdHQUgOwQB8sB9RTLLj+30PVQODmveZuDvwEnjafXfH28XxprgR6eNwOpCeMwNjaGjx8/Jr8VAFRvktSWHJqWWNSuNA/vt2zQmsJan6br2lTOZdJ1rdgM0tT9nV4XaaanpzE9PY0bN24EOcqSSTq0T3v6kZyq2fE9RdGxHNJaac3bfKwFXz9Q+WjOH9PzRs0RhqO3txfXrl3Du3fvkt8J4A7SnCs5kztEck6IrRD73C4ttF/qk8bRs4wvOlH7WwGZEYbi6tWrePPmDW7fvo2enp5E7tt0qiM9NWkbL9m1ijRWsqXNqdnM8nzB1+mQhe16UHdKstDT04Oenh7MzMxgZmYG//33HwB/StL6tScqa7zPtqSvgerQj0Jon8+WNYdvfopGpyKHXCIMR3d3N65cuYJnz55haGgIx48fT/pCHU3DvOYkCksWUjikedMg7Rgpkmx2dAFyjjAShoaGAADPnz/HrVu38OLFi4r04yA50Odk6yCrOVsjiUYgqc1rCdLHJrXCRZfNiDINiTASjh07hps3b+LRo0cYGBiocnoIOTRnA9VEcG3nOM2mNTe3T2upzyfn177P6WrpyxqbRhiKgYEBPHjwAP39/ejs7KwiBD/4OmiO5Y7g6UzTc7DkIeOpPoX2kUoaNJIcEhqekiz09/cn7Tt37uDVq1eYm5sDYJ9dfAWofteZ2+HXvgjGwXWk6xA70nssUurhfY1KT38UYSguXryYtGdnZzE3N4e7d++qhAB0IvnORkD1H7c5XaD6iYjrhKzJgkYGDh8pfP1ZwPsDW38aXr9+jfn5edy7d6/qnwxq/xG83uLONnw+TYfWUST/fgI96NOatzkJac2JSeu8sOUIw3H//n0sLCzg/fv3ifOk3x/gztT+CTQnAScI19N0eCkUChXkoUTRyAL8TqVAdVq26rzwx6akUJw9ezZpP3z4EFEU4fHjx+IrkDqEyqQ2r7VXtoPlKDrWPaVJZxXelmSbjS0fYTQsLi7iw4cPmJqaEiOCFE14StMii9SmtRZh6LUjrxVhOElDyZ0n/lrCUCwtLWFpaQnLy8tYXl5WCePaPEVxkvG+tGSRiMMJA8gHaip3bVrzdtbY8ikpBC0tLWhpaUmuZ2ZmEMcxVldXsbq6WvVqB7JxAHWsBZ6SAHlOLXVJehpC1mPhnyAMh/SD6S9fvkQURfj8+TO+fPkCwH6F+xCiI6HWcaHnHIuQIfgnCSNB+hXat2/fJkRZXFxU36nlqaJWZzhoNqSoF0qUrPBPnGGyxNevX/Ht2zfEcVxxHtLOKNJZJooqH6els4xERKlNa962ZLWiSZgMsba2hrW1tSqnu/Ljxw/8/PlTJYxEGqA6NTpIMifPC03C/EFYX1/H+vp64vBt27Z5RjQe/wOyVuRu4Q+yWAAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image15_3_4",
					width: "100",
					height: "29",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAdCAYAAABcz8ldAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAYElEQVRoQ+3RoREAIBDAMGD/nZ8RcFxFouu6Z2YWGecV8JchMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJzAVICBDYBbqcIAAAAAElFTkSuQmCC"
				}),
				u("image", {
					id: "image16_3_4",
					width: "179",
					height: "79",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image17_3_4",
					width: "140",
					height: "40",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAAoCAYAAAAsTRLGAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAfUlEQVR4Xu3SIQLAIBDAsLH///mwOKhPdGXXzMwHj/5bACfDkBiGxDAkhiExDIlhSAxDYhgSw5AYhsQwJIYhMQyJYUgMQ2IYEsOQGIbEMCSGITEMiWFIDENiGBLDkBiGxDAkhiExDIlhSAxDYhgSw5AYhsQwJIYhMQyJYUg2VpcETA7M46UAAAAASUVORK5CYII="
				}),
				u("image", {
					id: "image18_3_4",
					width: "99",
					height: "70",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image19_3_4",
					width: "61",
					height: "30",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAAeCAYAAACfWhZxAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAx0lEQVRYR93YMRKDQAxDUW2G+1/ZVDQ7YCBr2TK/zNC8aElIhpkZSBmAcfLaVfO1rH53F2RGe/en6OgZMuAvmgHf7i5YKeu4vo2+9FWVa5ehKytFe/c3c+1S9FH2vS+BBs7hrLVl0JlJobPWlkJn1QIdvXYLNBALl0NnfH3JoQH+A4sk2isCLotmHnNZtNfq2tJo1s9PaTSr1uh/15ZHM/5Tk0cfRX6at0EDcQ8trdBeb+Dt0BHHvB3a6+nan0IDz+At0atHfAdeThk6Q/gVXQAAAABJRU5ErkJggg=="
				}),
				u("image", {
					id: "image20_3_4",
					width: "86",
					height: "76",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,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"
				}),
				u("image", {
					id: "image21_3_4",
					width: "48",
					height: "37",
					preserveAspectRatio: "none",
					"xlink:href": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAlCAYAAAAEGWqvAAAACXBIWXMAABcRAAAXEQHKJvM/AAAASElEQVRYR+3PsQ3AMAzAsDT//+ye0FE1QM5a9MzMnMXuV/B3BmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGausHXkUxBEYL0arCAAAAAElFTkSuQmCC"
				})
			] })
		]
	});
	var LogoPrimeVideo = (props) => u("svg", {
		"aria-hidden": "true",
		viewBox: "0 0 4605.7 2723.6",
		fill: "currentColor",
		...props,
		children: u("path", { d: "M2246 2723.1a2591.3 2591.3 0 0 1-591.4-83.5 2159.7 2159.7 0 0 1-516.8-208.3A1728.5 1728.5 0 0 1 679.1 2060c-55.6-63.6-86-106.3-101-141.4a93 93 0 0 1-9-35.5c-1.2-22.7 6-36.6 23.6-45.2 6.3-3.2 7-3.3 18.6-3.3a51 51 0 0 1 19 2.3c20.3 6.6 46.1 22.7 79.5 49.4a2069.6 2069.6 0 0 0 372.5 240.3c147.7 74.5 292.3 128.2 473.7 176a3157 3157 0 0 0 627.8 98.4c72.8 4.1 93.8 4.6 189.5 4.6 105.9 0 154.2-1.5 242-7.5 361.5-24.8 718.7-108.9 984.8-231.8a2156 2156 0 0 0 63-31c45.1-22.7 57-28.2 75.7-35 26.3-9.4 44.4-6.3 59.7 10.2a50.4 50.4 0 0 1 14.8 38.5c-5.1 41.5-59 100.4-163.7 179.3-249.6 188-594.4 319.3-974.8 371.2a2718 2718 0 0 1-263.5 22.6 3806 3806 0 0 1-165.4 1zm1615-239.4a51.1 51.1 0 0 1-26.8-24c-7.7-16.8-5.3-31.5 10.4-64.1a572 572 0 0 1 31.9-56.5c41.2-68.3 82.6-159.4 102.1-224.6 19.6-65.4 22-102.6 8-123.8-12-18.2-50.5-29.6-113.2-33.7-24.5-1.6-103.2-.6-126.7 1.5-52.5 4.9-89 10.2-138 20.1-35 7.1-41.8 8-66.5 8-23.9 0-28.8-.7-38.5-5.5a41 41 0 0 1-21-41.6c2.5-13.7 11.4-26.6 27.8-40.3 41.9-35 107.4-69 178.7-92.6a654.9 654.9 0 0 1 232.5-33.3 596 596 0 0 1 133 19.4c71.2 18.4 114.3 42 129.3 71 11.5 22.3 15.8 44.9 15.7 83.6a617 617 0 0 1-33.6 195.2 608 608 0 0 1-156.5 249.2c-53 52.3-89.7 80-119.5 90a57.3 57.3 0 0 1-29 2zm-3838.6-729a39.2 39.2 0 0 1-19.9-17.9l-2.3-4.2-.2-656.5c-.2-594.8-.1-657 1.3-661.9 2-6.9 10.3-16 18.3-19.8l5.6-2.8h181l4.7 2.2a34.4 34.4 0 0 1 16.7 17.1c3.6 7.7 4.7 12.9 19.3 84.5l10.3 50.7h10l4.5-9.7a318.5 318.5 0 0 1 38.7-63.3 322.1 322.1 0 0 1 65.6-59.3 278.7 278.7 0 0 1 218.2-40.6c76.2 16.7 145 67.4 195 143.7 48.3 73.8 82.2 179.6 93 290.7 3.2 33 3.7 42.2 4.2 89.7a905 905 0 0 1-6.7 140.3c-16 127.7-59.3 238.2-122 311a470.3 470.3 0 0 1-46 44.7 285.6 285.6 0 0 1-137 60c-19.6 3-66.8 3.3-85.5.5-72.7-10.9-127.5-44.7-175.8-108.5a491.5 491.5 0 0 1-36-56.4c-2.7-4.7-2.8-4.8-7.7-4.8h-5l-.2 224.3-.3 224.2-3 5.3a40.6 40.6 0 0 1-18.1 16.6c-4.2 1.4-16 1.6-110.8 1.6-86.6 0-106.8-.3-109.9-1.4zM466 1231c38-7.3 68.2-28.8 92-65.5 30-46 47.6-113 52.9-201.8 1.6-26.5.7-105.1-1.5-127.7-4.6-48-12.1-87-23-118.7-25.2-73.5-64.5-114.7-120.4-126a222 222 0 0 0-57.3 0c-45.8 9.2-80.6 38.3-106.3 88.7a346 346 0 0 0-31 94c-12.9 65.2-15.2 163.8-5.5 239.4 8.2 64.1 25.4 116.1 50.7 153.6 27 39.7 60.5 60.9 104.7 66 10.8 1.3 32.9.3 44.7-2zm3677.3 224.4-15.5-1.5a408 408 0 0 1-207.3-78.7 477 477 0 0 1-78.6-75.9c-64-80.8-103.7-183.6-115.5-299.8-3.1-30.9-3.8-50-3.3-92.7a661 661 0 0 1 10.3-120.8c37.3-212.7 172.2-371.6 348-409.8 32.2-7 57.7-9.6 94.4-9.6a382 382 0 0 1 144.5 26.1 505.2 505.2 0 0 1 51.3 24.9 426.6 426.6 0 0 1 135 127.6 588 588 0 0 1 85.6 210.8c10.3 51.4 14 96.8 13.5 167-.3 42.6-.4 43.6-2.6 47.6a31.6 31.6 0 0 1-22.1 17c-4.6 1.1-57.6 1.4-293.5 1.4h-287.8l.6 6.8c8 86.2 23.8 142.4 51.7 184.1 23.3 35 51.9 55 90 63.2 12.2 2.6 41.2 3.6 55.8 2 39.6-4.6 68.5-18 92.6-43.3 19.4-20.3 32.7-45.7 42.3-80.8 4.9-18 6-20.7 10.8-26 5.2-5.8 11-8.3 19.3-8.3 9 0 197.8 42.2 205.6 45.9a24 24 0 0 1 14 25.3c-2 15.6-24.8 68.7-42.6 99.7a387 387 0 0 1-161.5 154.2 437.6 437.6 0 0 1-148.5 41.8c-13.6 1.5-76 2.8-86.5 1.8zm192.1-648.6c-1.3-14-5.7-42.5-9.1-59.7-16.1-79.3-48.4-134.1-92.4-157a133.2 133.2 0 0 0-117.6-.3 133 133 0 0 0-37.5 28.2 173.4 173.4 0 0 0-32.7 43.2c-19 34.3-33.3 80.5-41.2 133.8-1.1 7.4-2 14.7-2 16.3v2.7H4336l-.7-7.2zm-3283 621.4a39 39 0 0 1-18-18.8c-1.4-4.3-1.6-47.8-1.6-499.4 0-447.5.2-495 1.6-499.3a29.4 29.4 0 0 1 15.6-16.3l6.3-2.9 87.5-.3c91-.3 95.3-.2 103.1 3.8 5.5 2.8 12.4 11 14.8 17.7 1.2 3.2 7.8 33.5 14.6 67.3l13 63.8c.6 2 1 2.3 5.6 2l5-.3 5.3-12a330.4 330.4 0 0 1 42.2-71.5c9.5-11.9 30-32 42-41.1 46.7-35.6 96.4-52 158.3-51.9 42 0 79 7.2 113 21.8 11.2 4.8 17.3 9.7 21 16.5 2.4 4.8 2.6 6.1 2.6 16.2 0 11-.1 11.3-24.8 111-13.6 55-25.5 102-26.3 104.2-2 5.2-7.2 10.8-12.2 13a31 31 0 0 1-11.2 1.6c-8.5 0-9.2-.2-43.7-14.2-36.1-14.7-63.3-23.2-84.3-26.2a267.2 267.2 0 0 0-55 .4 142 142 0 0 0-51.7 18.9c-12 7.4-30.7 26-39.5 39.3-24.3 36.9-35.3 79.5-37.8 145.5-.5 13.5-.9 151.7-1 307 0 312.7.6 286.5-6.4 296.1a23.8 23.8 0 0 1-9.2 7.5l-5.9 2.9-108.5.3-108.5.2zm745 1.4c-9.8-3-16.1-9-19.3-18-1.7-4.9-1.8-27.7-1.8-501.1v-496l2.6-5.5c3.3-7 8-11.5 15-14.9l5.4-2.6 105.5-.3c109.3-.3 114.3-.1 122 3.8a30 30 0 0 1 11.8 12.8c1.7 3.5 1.8 30 2 500.7.2 453.3.1 497.4-1.3 502.5a23 23 0 0 1-7.3 11.1c-9.5 9.5-.6 9-123.6 8.8-83.4 0-108-.3-111-1.3zm449.3 0c-8.3-3-15.6-9.5-20-17.8l-2.4-4.3v-994l2.4-5.3a28.2 28.2 0 0 1 15.1-14.1l5.5-2.6h91c84.7 0 91.4.1 95.6 1.8a32 32 0 0 1 19 19.5c1.7 4.6 10.5 46.2 27 128l1 5.2h10.5l3.5-8.8a413.7 413.7 0 0 1 25.1-49.7c40.4-64.6 98.8-104.9 169.8-117 47.2-8.1 99.7-4.2 142.8 10.6 56.5 19.4 103.7 58 138.5 113.4a431.7 431.7 0 0 1 23.4 44.8l2.9 6.7h10l8-12.2c35.9-55 80.4-100.5 124.5-127.2a295 295 0 0 1 194.4-37 258.8 258.8 0 0 1 171.2 103c12 16 21.3 31.3 31.4 51.9 25.9 52.6 42 112.8 48.5 181.7 3.4 35.7 3.7 63.6 3.3 384.3l-.3 317-2.6 5.5a27.7 27.7 0 0 1-14.1 15.1l-5.3 2.4h-219l-4.3-2.3a41.3 41.3 0 0 1-15.7-15.4l-3-5.3-.5-320c-.6-340.2-.4-324.1-5-351-9.7-57.3-35.1-97.2-73.5-115.6-19-9.1-37.6-12.5-63.8-11.6-37 1.3-64.6 12.7-88.1 36.2-28.2 28.1-44.5 69.5-52.3 132.5-1.5 12.3-1.7 42-2.2 321.5l-.6 308-2.6 5.5a27.7 27.7 0 0 1-14.1 15.1l-5.3 2.4h-219l-5.2-3a40.5 40.5 0 0 1-15.4-15.6l-2.4-4.4-.5-320c-.6-340.2-.4-324.1-5-351-9.7-57.3-35.1-97.2-73.5-115.6-19-9.1-37.6-12.5-63.8-11.6-37 1.3-64.6 12.7-88.1 36.2-28.2 28.1-44.5 69.5-52.3 132.5-1.5 12.3-1.7 42-2.2 321.5l-.6 308-2.6 5.5a27.7 27.7 0 0 1-14.1 15.1l-5.3 2.4-108 .2c-86.6.2-108.7 0-111.6-1zM1887.8 309a154 154 0 0 1-94-46.7 139.7 139.7 0 0 1-37-72c-3-15-3.8-44-1.6-60.8 6-45 26.5-79 62.3-103C1869-8 1944.5-9 1995.4 24.2a154 154 0 0 1 48.3 49.5c21.5 36.4 26 93 11.1 137.5a147.5 147.5 0 0 1-85.6 88c-23.8 9.2-54 12.9-81.4 9.8z" })
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
	var LogoIqiyi = (props) => u("svg", {
		viewBox: "0 0 204 64",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "#00DC5A",
			d: "M101.138 63.0562C101.143 63.2013 101.206 63.3383 101.312 63.437C101.418 63.5358 101.56 63.5882 101.705 63.5832H115.292C115.595 63.5942 115.85 63.3589 115.863 63.0562V2.15089C115.858 2.00475 115.795 1.8667 115.688 1.76717C115.581 1.66764 115.438 1.61478 115.292 1.61987H101.705C101.403 1.6111 101.151 1.84574 101.138 2.14684V63.0562ZM1.26286 63.0562C1.26601 63.2038 1.3282 63.3439 1.43549 63.4452C1.54278 63.5464 1.68619 63.6004 1.83357 63.5949H15.4174C15.72 63.6064 15.975 63.3711 15.9881 63.0683V24.7089C15.975 24.4061 15.72 24.1709 15.4174 24.1823H1.83357C1.53099 24.1709 1.276 24.4061 1.26286 24.7089V63.0562ZM92.1724 53.1159L85.4493 47.7165C85.3195 47.614 85.2271 47.4717 85.1862 47.3114C85.1524 47.1423 85.1766 46.9667 85.255 46.8132C92.787 32.6123 88.489 15.0168 75.26 5.89462C62.0309 -3.22751 44.0707 -0.980313 33.4931 11.1205C22.9156 23.2213 23.0788 41.3342 33.8727 53.2421C44.6666 65.1501 62.6644 67.0728 75.7269 57.7134C75.993 57.5088 76.3634 57.5088 76.6295 57.7134L83.8383 63.5018C83.9584 63.5968 84.1113 63.6399 84.2633 63.6217C84.4153 63.6034 84.5537 63.5253 84.6479 63.4046L92.2493 53.9261C92.3465 53.8085 92.393 53.657 92.3786 53.5051C92.3642 53.3531 92.29 53.2131 92.1724 53.1159ZM60.5726 50.2278C50.7329 52.0061 41.2493 45.282 39.4319 35.2405C37.6145 25.199 44.1474 15.5747 54.0033 13.7924C63.8593 12.0101 73.3267 18.7342 75.144 28.7797C76.9614 38.8253 70.4286 48.4537 60.5726 50.2278ZM203.041 1.61986H189.453C189.15 1.60883 188.895 1.8441 188.882 2.14684V63.0562C188.895 63.3589 189.15 63.5942 189.453 63.5832H203.041C203.186 63.5882 203.327 63.5358 203.433 63.437C203.539 63.3383 203.602 63.2013 203.607 63.0562V2.15089C203.596 1.84818 203.343 1.61115 203.041 1.61986ZM13.1611 16.3875C17.2132 13.881 18.4678 8.56175 15.9632 4.50659C13.4585 0.451418 8.14324 -0.804043 4.09109 1.70244C0.0389361 4.20891 -1.21559 9.52818 1.28902 13.5833C3.79364 17.6385 9.10894 18.894 13.1611 16.3875ZM181.694 1.62023H167.215C166.972 1.61804 166.746 1.7443 166.62 1.95241L153.17 25.8916C153.17 25.8916 153.073 26.0658 152.939 26.0699C152.806 26.0699 152.709 25.8916 152.709 25.8916L139.258 1.95646C139.134 1.7468 138.907 1.61889 138.663 1.62023H124.185C123.949 1.62089 123.734 1.75276 123.626 1.96228C123.518 2.1718 123.535 2.42411 123.671 2.61671L145.188 38.8496C145.394 39.1994 145.502 39.5982 145.5 40.0041V62.9509C145.497 63.1185 145.56 63.2805 145.676 63.4013C145.792 63.5221 145.952 63.5917 146.119 63.5949H159.735C159.902 63.5949 160.063 63.5282 160.18 63.4096C160.298 63.291 160.364 63.1303 160.363 62.963V40.0041C160.362 39.5978 160.471 39.1991 160.678 38.8496L182.208 2.62076C182.346 2.42809 182.365 2.17416 182.256 1.96321C182.148 1.75225 181.931 1.62023 181.694 1.62023Z"
		})
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
	var LogoYouku = (props) => u("svg", {
		viewBox: "0 0 55 66",
		"aria-hidden": "true",
		...props,
		children: [
			u("defs", { children: [u("linearGradient", {
				id: "youkuGrad1",
				x1: "13.0298",
				y1: "50.969",
				x2: "32.0761",
				y2: "36.5697",
				gradientUnits: "userSpaceOnUse",
				children: [u("stop", { "stop-color": "#FF8000" }), u("stop", {
					offset: "1",
					"stop-color": "#FF6400"
				})]
			}), u("linearGradient", {
				id: "youkuGrad2",
				x1: "9.9728",
				y1: "15.0216",
				x2: "50.0677",
				y2: "39.3418",
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
			})] }),
			u("path", {
				d: "M18.8912 31.7762L20.95 32.9992L46.2122 48.0252L18.9453 64.2541C12.9039 67.8476 5.18024 65.7166 1.69386 59.4894C-1.79252 53.2622 0.27493 45.3011 6.31636 41.7075L18.8561 34.2458C19.2704 33.9949 19.5484 33.5309 19.5484 33C19.5484 32.4843 19.286 32.0317 18.8912 31.7762Z",
				fill: "url(#youkuGrad1)"
			}),
			u("path", {
				d: "M46.2122 17.9698L18.9453 1.74594C12.9039 -1.84763 5.18024 0.283384 1.69386 6.51057C-1.79252 12.7378 0.27493 20.6989 6.31636 24.2925L20.9543 33.0025L46.2122 48.0302C57.4369 41.3507 57.4369 24.6493 46.2122 17.9698Z",
				fill: "url(#youkuGrad2)"
			})
		]
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
	var LogoTencentTv = (props) => u("svg", {
		viewBox: "0 0 289 259",
		"aria-hidden": "true",
		...props,
		children: [
			u("defs", { children: [
				u("linearGradient", {
					id: "tencentGrad1",
					x1: "112.791",
					y1: "27.7062",
					x2: "112.791",
					y2: "231.592",
					gradientUnits: "userSpaceOnUse",
					children: [u("stop", { "stop-color": "#F9B93B" }), u("stop", {
						offset: "1",
						"stop-color": "#FA7535"
					})]
				}),
				u("linearGradient", {
					id: "tencentGrad2",
					x1: "166.259",
					y1: "0.00682032",
					x2: "166.259",
					y2: "259.007",
					gradientUnits: "userSpaceOnUse",
					children: [u("stop", { "stop-color": "#53C4FE" }), u("stop", {
						offset: "1",
						"stop-color": "#0D84F4"
					})]
				}),
				u("linearGradient", {
					id: "tencentGrad3",
					x1: "134.762",
					y1: "30.2776",
					x2: "134.762",
					y2: "229.032",
					gradientUnits: "userSpaceOnUse",
					children: [u("stop", { "stop-color": "#AEF922" }), u("stop", {
						offset: "1",
						"stop-color": "#62BB0D"
					})]
				}),
				u("linearGradient", {
					id: "tencentGrad4",
					x1: "127.262",
					y1: "83.0401",
					x2: "127.262",
					y2: "175.954",
					gradientUnits: "userSpaceOnUse",
					children: [
						u("stop", { "stop-color": "white" }),
						u("stop", {
							offset: "0.6",
							"stop-color": "white"
						}),
						u("stop", {
							offset: "1",
							"stop-color": "#E5F6D2"
						})
					]
				})
			] }),
			u("path", {
				d: "M213.376 108.613C190.677 90.3692 163.87 76.2031 135.766 62.6809C109.392 49.588 81.5044 38.8562 52.9682 30.2707C52.9682 30.2707 52.9682 30.2707 52.9682 30.4853C52.1035 30.2707 51.4549 30.056 50.5902 29.6268C32.2146 24.0462 16.0008 30.4853 8.6506 50.232C-0.429097 74.9153 0.0032693 102.603 0.0032693 129.648C0.0032693 156.692 -0.212914 183.951 8.43442 208.634C16.4332 231.386 31.9984 234.82 50.374 229.24C50.8064 229.025 51.8873 228.81 52.752 228.381C52.752 228.596 52.752 228.81 52.752 229.025C81.7206 220.225 110.041 209.064 137.28 195.541C164.735 182.019 191.109 167.639 213.592 149.824C230.455 136.516 228.725 121.062 213.376 108.613Z",
				fill: "url(#tencentGrad1)"
			}),
			u("path", {
				d: "M275.421 155.19C294.013 135.872 291.851 118.057 275.205 102.818C250.776 80.0666 221.807 61.6077 191.542 44.2221C162.141 27.2658 131.01 13.3143 99.0153 1.93854C80.8559 -4.28595 61.1832 4.94346 54.6977 22.973C54.0491 24.6901 53.6168 26.4072 53.4006 28.1243C40.862 95.0912 40.862 163.775 53.1844 230.742C56.6433 249.415 74.8027 261.864 93.6107 258.43C95.3402 258.001 97.2858 257.572 99.0153 256.928C131.659 245.337 163.006 230.742 192.839 213.356C222.672 196.4 252.289 179.014 275.421 155.19Z",
				fill: "url(#tencentGrad2)"
			}),
			u("path", {
				d: "M52.9682 30.2707C41.0781 95.9497 40.8619 163.346 52.752 229.025C81.7205 220.225 110.041 209.064 137.28 195.542C164.735 182.019 191.109 167.639 213.592 149.824C230.455 136.516 228.725 121.062 213.376 108.613C190.677 90.3692 163.87 76.2031 135.766 62.6809C109.392 49.5881 81.5044 38.8562 52.9682 30.2707Z",
				fill: "url(#tencentGrad3)"
			}),
			u("path", {
				d: "M171.653 124.711C171.653 124.711 162.573 116.34 132.524 101.101C102.907 86.0764 90.5841 83.5008 90.5841 83.5008C86.2604 82.213 83.6662 83.5008 82.5853 88.4374C82.5853 88.4374 79.7749 92.5155 79.7749 129.433C79.7749 166.351 82.5853 170.858 82.5853 170.858C83.45 175.366 85.6119 176.868 90.5841 175.795C90.5841 175.795 99.0152 174.507 132.524 157.765C166.032 141.024 171.653 134.584 171.653 134.584C175.328 130.936 176.193 128.575 171.653 124.711Z",
				fill: "url(#tencentGrad4)"
			})
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
	var LogoBilibili = (props) => u("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "#00A1D6",
			d: "M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z"
		})
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
	var LogoCbs = (props) => u("svg", {
		viewBox: "0 0 24 24",
		xmlns: "http://www.w3.org/2000/svg",
		...props,
		children: [u("title", { children: "CBS" }), u("path", { d: "M12 24C5.314 24 .068 18.587.068 11.949.068 5.413 5.314 0 12 0s11.932 5.413 11.932 11.949C23.932 18.587 18.686 24 12 24zm0-5.106c5.452 0 9.36-3.473 11.109-6.945C21.875 9.294 18.172 5.106 12 5.106c-5.452 0-9.36 3.37-11.109 6.843C2.537 15.42 6.548 18.894 12 18.894zm0-.613c-3.497 0-6.377-2.86-6.377-6.332S8.503 5.617 12 5.617s6.377 2.86 6.377 6.332c0 3.574-2.88 6.332-6.377 6.332Z" })]
	});
	var LogoCctv = (props) => u("svg", {
		viewBox: "0 0 1000 230",
		"aria-hidden": "true",
		...props,
		children: [
			u("path", {
				fill: "#000000",
				d: "M 846.3033,0 c -2.30059,0 -4.36694,1.4075976 -5.20913,3.5484877 L 781.66384,154.62167 723.62941,7.0969831 C 721.94502,2.8151979 717.81233,0 713.21114,0 H 454.91623 v 54.501305 c 0,3.091533 2.50615,5.597718 5.59771,5.597718 h 73.88041 V 227.26075 h 60.43542 c 3.0915,0 5.59772,-2.50619 5.59772,-5.59772 V 60.099023 h 69.06853 c 2.28294,0 4.33711,1.386338 5.19123,3.503463 l 66.02332,163.658254 h 78.12868 c 2.28288,0 4.33705,-1.38632 5.19111,-3.50343 L 914.29901,0 Z"
			}),
			u("rect", {
				fill: "#E80413",
				width: "87.839653",
				height: "87.839653",
				x: "912.16034",
				y: "140.19064"
			}),
			u("path", {
				fill: "#000000",
				d: "M 358.42902,168.8641 c -37.23363,0 -68.1357,-24.71578 -68.1357,-54.61957 0,-29.903795 28.53097,-54.145507 63.72586,-54.145507 h 78.11337 c 3.09156,0 5.59772,-2.506154 5.59772,-5.597718 V 0 h -83.71109 c -74.25947,0 -134.45867,51.149038 -134.45867,114.24453 0,63.09549 64.60904,114.66766 138.86851,114.66766 33.06117,0 60.03484,-6.51924 88.27787,-17.45216 l -22.77982,-56.42435 c -21.08711,8.53802 -40.39853,13.82842 -65.49805,13.82842 z"
			}),
			u("path", {
				fill: "#000000",
				d: "M 138.86851,168.8641 c -37.23363,0 -68.135715,-24.71578 -68.135715,-54.61957 0,-29.903795 28.53097,-54.145507 63.725855,-54.145507 h 78.11338 c 3.09156,0 5.59771,-2.506154 5.59771,-5.597718 V 0 H 134.45865 C 60.199183,0 0,51.149038 0,114.24453 c 0,63.09549 64.609052,114.66766 138.86851,114.66766 33.06117,0 60.03483,-6.51924 88.27786,-17.45216 l -22.77982,-56.42435 c -21.08712,8.53802 -40.39852,13.82842 -65.49804,13.82842 z"
			})
		]
	});
	var LogoFox = (props) => u("svg", {
		viewBox: "0 0 1000 434",
		"aria-hidden": "true",
		...props,
		children: [
			u("path", {
				fill: "#FF5027",
				d: "M 0,434.04061 V 0 H 260.95965 L 269.25166,118.4886 122.85582,118.73828 V 175.34999 L 242.14602,175.64347 V 293.7247 H 121.90528 L 122.42654,434.04061 Z"
			}),
			u("path", {
				fill: "#FF5027",
				d: "M 803.02858,94.26086 752.9655,0.7578 H 614.30975 L 735.47475,209.79272 607.3406,433.3529 H 741.67295 L 801.52612,323.96229 861.9137,433.3529 H 1000 L 869.3296,208.0143 988.173,0.7578 H 854.1079 Z"
			}),
			u("path", {
				fill: "#FF5027",
				d: "M 468.73741,6.64938 C 354.30939,6.4435 261.8182,101.06355 261.8182,217.77373 261.8182,334.29117 354.30939,428.56955 468.77245,428.65716 582.54779,428.62211 675.34561,334.29555 675.34561,217.77373 675.35437,101.07231 582.55217,6.43912 468.73741,6.64938 M 469.11412,339.47313 C 449.79237,339.47313 433.85226,323.53302 433.85226,303.81266 V 130.70541 C 433.85226,111.04638 449.79237,93.32784 469.11412,93.32784 488.71183,93.32784 505.40536,111.12084 505.40536,130.91129 V 304.20251 C 505.40536,323.96229 488.53223,339.47313 469.11412,339.47313"
			})
		]
	});
	var LogoFx = (props) => u("svg", {
		viewBox: "0 0 1000 597",
		"aria-hidden": "true",
		fill: "currentColor",
		...props,
		children: u("polygon", { points: "762.825,0 690.039,133.12 615.406,0 379.613,0 379.705,0.092 0,0.092 0,596.773 207.839,596.773 207.839,402.677 410.242,402.677 410.242,240.127 207.839,240.127 207.839,168.175 492.895,168.175 571.953,285.605 380.445,596.773 615.222,596.773 689.854,455.812 763.56,596.773 998.986,596.773 809.413,285.147 1000,0 " })
	});
	var LogoAbc = (props) => u("svg", {
		viewBox: "0 0 978 978",
		"aria-hidden": "true",
		...props,
		children: [u("path", {
			fill: "#f2f2f2",
			d: "M 488.906 0 C 218.891 0 0 218.895 0 488.906 C 0 758.934 218.891 977.82 488.906 977.82 C 758.926 977.82 977.82 758.934 977.82 488.906 C 977.82 218.895 758.926 0 488.906 0 Z"
		}), u("path", {
			fill: "#07111E",
			"fill-rule": "evenodd",
			d: "M 775.977 354.91 C 701.879 354.91 641.809 414.977 641.809 489.078 C 641.809 563.176 701.879 623.242 775.977 623.242 C 843.105 623.168 899.852 573.484 908.785 506.961 L 832.215 506.961 C 824.633 530.809 802.332 548.09 775.977 548.09 C 743.387 548.09 716.977 521.668 716.977 489.086 C 716.977 456.496 743.398 430.086 775.977 430.074 C 802.332 430.074 824.645 447.352 832.215 471.203 L 908.797 471.203 C 899.852 404.66 843.105 354.992 775.977 354.91 Z M 201.215 548.078 C 168.625 548.078 142.215 521.66 142.215 489.062 C 142.215 456.473 168.637 430.062 201.215 430.062 C 233.805 430.062 260.215 456.484 260.215 489.062 C 260.215 521.668 233.793 548.078 201.215 548.078 Z M 335.383 620.973 L 335.383 489.078 C 335.383 414.977 275.312 354.91 201.215 354.91 C 127.117 354.91 67.047 414.977 67.047 489.078 C 67.047 563.176 127.117 623.242 201.215 623.242 C 223.082 623.215 245.742 613.922 261.715 598.477 L 261.715 620.973 Z M 488.301 430.074 C 520.895 430.074 547.301 456.496 547.301 489.086 C 547.301 521.68 520.879 548.09 488.301 548.09 C 455.711 548.09 429.301 521.668 429.301 489.086 C 429.301 456.484 455.711 430.074 488.301 430.074 Z M 354.133 288.875 L 354.133 489.078 C 354.133 563.176 414.203 623.242 488.301 623.242 C 562.406 623.242 622.469 563.176 622.469 489.078 C 622.469 414.977 562.406 354.91 488.301 354.91 C 467.844 354.945 446.664 361.453 429.301 373.215 L 429.301 288.875 Z"
		})]
	});
	var LogoBbc = (props) => u("svg", {
		viewBox: "0 0 1000 285",
		"aria-hidden": "true",
		fill: "currentColor",
		...props,
		children: u("path", { d: "M541.817 184.201c0 30.971-38.541 29.133-38.541 29.133h-38.54V157.371h38.54C542.939 157.105 541.817 184.201 541.817 184.201M464.736 72.023h29.368c30.496 1.611 29.345 24.316 29.345 24.316c0 28.216-33.721 28.676-33.721 28.676H464.736V72.023zM534.688 136.02c0 0 26.38-11.241 26.145-41.057c0 0 4.012-48.864-60.729-54.824H428.266v204.849h82.344c0 0 68.802 0.205 68.802-57.799C579.411 187.189 581.038 147.716 534.688 136.02M348.773 0h302.453V285.013H348.773V0zM193.041 184.201c0 30.971-38.541 29.133-38.541 29.133h-38.543V157.371h38.543C194.166 157.105 193.041 184.201 193.041 184.201M115.957 72.023h29.374c30.497 1.611 29.343 24.316 29.343 24.316c0 28.216-33.719 28.676-33.719 28.676h-24.998V72.023zM185.915 136.02c0 0 26.384-11.241 26.147-41.057c0 0 4.009-48.864-60.732-54.824h-71.841v204.849h82.349c0 0 68.801 0.205 68.801-57.799C230.639 187.189 232.26 147.716 185.915 136.02M0 0h302.453V285.013H0V0zM938.301 54.825v37.846c0 0-36.942-22.702-77.764-23.159c0 0-76.161-1.495-79.594 73.005c0 0-2.751 68.513 78.676 72.417c0 0 34.165 4.115 80.514-25.441v39.195c0 0-62.173 36.939-134.197 8.488c0 0-60.545-22.109-62.851-94.659c0 0-2.518-74.619 78.23-99.389c0 0 21.563-8.255 60.313-4.586C881.629 38.541 904.789 40.832 938.301 54.825M697.547 285.013H1000V0H697.547V285.013z" })
	});
	var LogoUsa = (props) => u("svg", {
		viewBox: "0 0 2560 1129",
		"aria-hidden": "true",
		...props,
		children: [
			u("path", {
				d: "",
				stroke: "none",
				fill: "#000000",
				"fill-rule": "evenodd"
			}),
			u("path", {
				stroke: "none",
				fill: "#f83837",
				"fill-rule": "evenodd",
				d: "M 1903.500 1.634 C 1784.314 15.712, 1682.157 73.061, 1605.547 168.898 C 1583.494 196.486, 1562.379 229.271, 1547.518 259 C 1544.906 264.225, 1542.627 268.656, 1542.454 268.847 C 1542.281 269.038, 1536.816 264.538, 1530.310 258.847 C 1469.043 205.257, 1424.232 177.562, 1371.500 160.700 C 1345.317 152.326, 1322.678 148.743, 1296 148.747 C 1273.456 148.751, 1260.348 150.631, 1242.817 156.373 C 1220.347 163.734, 1204.847 173.091, 1188.861 188.947 C 1169.198 208.450, 1158.021 230.596, 1153.996 258.026 C 1152.002 271.613, 1153.135 295.156, 1156.376 307.477 C 1163.448 334.364, 1181.097 357.845, 1207.383 375.336 C 1234.333 393.269, 1265.751 405.637, 1346 429.902 C 1458.722 463.987, 1518.480 492.987, 1568.276 537.771 C 1609.835 575.146, 1641.474 627.241, 1658.302 686 C 1675.147 744.818, 1678.544 811.883, 1667.876 875 C 1663.465 901.099, 1653.448 936.173, 1644.417 957.141 C 1642.437 961.739, 1639.960 967.650, 1638.913 970.277 L 1637.008 975.053 1641.254 979.688 C 1647.854 986.893, 1668.256 1005.248, 1681.500 1015.897 C 1737.638 1061.037, 1808.741 1093.120, 1882.240 1106.475 C 1956.544 1119.977, 2032.078 1114.179, 2098.164 1089.902 C 2144.990 1072.701, 2183.174 1049.736, 2218.250 1017.680 L 2229 1007.856 2229 1052.928 L 2229 1098 2388.010 1098 L 2547.020 1098 2546.766 614.250 C 2546.627 348.188, 2546.390 104.288, 2546.240 72.250 L 2545.968 14 2387.484 14 L 2229 14 2229 59.068 L 2229 104.136 2221.250 97.105 C 2197.436 75.503, 2163.326 52.977, 2132.178 38.285 C 2091.936 19.304, 2047.794 6.756, 2003 1.567 C 1985.150 -0.502, 1921.211 -0.458, 1903.500 1.634 M 0.006 324.747 C 0.011 528.765, 0.385 654.674, 1.024 667 C 5.881 760.611, 21.515 827.216, 53.722 891.495 C 72.426 928.824, 92.738 956.982, 121.909 986.019 C 159.532 1023.470, 203.051 1051.454, 256 1072.244 C 322.087 1098.192, 407.169 1111.410, 497 1109.686 C 530.162 1109.049, 545.853 1108.073, 573.500 1104.926 C 725.362 1087.639, 835.653 1023.944, 900.224 916.237 C 914.746 892.015, 927.544 865.062, 935.293 842.387 C 937.057 837.225, 938.804 833.114, 939.174 833.251 C 939.545 833.388, 946.745 839.870, 955.174 847.656 C 974.075 865.115, 985.044 874.512, 1000.309 886.320 C 1055.703 929.172, 1111.100 954.323, 1166.052 961.569 C 1184.785 964.039, 1216.100 963.091, 1232.889 959.545 C 1279.338 949.735, 1313.122 923.133, 1329.560 883.423 C 1340.388 857.266, 1341.914 824.469, 1333.473 799.324 C 1322.622 767.001, 1298.210 741.676, 1258.874 721.937 C 1236.164 710.540, 1213.372 702.345, 1153.142 683.917 C 1097.314 666.835, 1089.249 664.200, 1065.500 655.279 C 1009.553 634.263, 967.698 611.349, 932.500 582.467 C 920.837 572.897, 900.422 552.164, 890.684 540 C 870.149 514.349, 851.275 479.718, 839.724 446.494 C 816.357 379.282, 811.484 296.670, 826.573 223.500 C 841.637 150.447, 875.816 86.233, 928.349 32.290 C 935.966 24.469, 945.978 14.824, 950.599 10.857 C 955.219 6.890, 959 3.275, 959 2.823 C 959 2.121, 640.260 1.549, 639.856 2.250 C 639.777 2.388, 639.376 143.575, 638.965 316 C 638.464 526.725, 637.866 633.106, 637.143 640.500 C 635.123 661.155, 632.869 677.492, 630.028 692.061 C 612.040 784.322, 564.959 828, 483.500 828 C 423.984 828, 382.393 803.588, 357.529 754.062 C 343.409 725.935, 336.271 696.773, 330.834 645 C 329.930 636.396, 329.484 554.048, 329.063 318 L 328.500 2.500 164.250 2.247 L 0 1.994 0.006 324.747 M 1999.301 286.993 C 1929.027 294.419, 1868.337 337.785, 1829.255 408.500 C 1810.369 442.672, 1797.817 484.868, 1793.914 527.305 C 1792.203 545.908, 1793.250 583.693, 1795.970 601.500 C 1810.075 693.858, 1861.777 770.576, 1933.500 805.572 C 1981.545 829.015, 2033.405 832.210, 2083.876 814.835 C 2136.924 796.573, 2183.258 754.785, 2212.433 698.890 C 2235.040 655.579, 2246.292 608.616, 2246.310 557.500 C 2246.324 519.949, 2241.716 490.480, 2230.519 456.500 C 2200.367 365.001, 2130.965 301.225, 2047.717 288.516 C 2035.198 286.604, 2010.371 285.824, 1999.301 286.993"
			}),
			u("path", {
				d: "",
				stroke: "none",
				fill: "#000000",
				"fill-rule": "evenodd"
			})
		]
	});
	var LogoPeacock = (props) => u("svg", {
		viewBox: "0 0 69.5 68.18",
		"aria-hidden": "true",
		...props,
		children: [
			u("defs", { children: u("linearGradient", {
				id: "peacockGrad",
				x1: "1575.74",
				x2: "1575.74",
				y1: "-0.83",
				y2: "400.19",
				gradientUnits: "userSpaceOnUse",
				gradientTransform: "matrix(0.17955816,0,0,0.1704379,-219.04915,0.00749893)",
				children: [
					u("stop", { "stop-color": "#ffdc23" }),
					u("stop", {
						offset: ".16",
						"stop-color": "#ff8700"
					}),
					u("stop", {
						offset: ".21",
						"stop-color": "#ff5401"
					}),
					u("stop", {
						offset: ".37",
						"stop-color": "#d9005a"
					}),
					u("stop", {
						offset: ".42",
						"stop-color": "#c814c8"
					}),
					u("stop", {
						offset: ".58",
						"stop-color": "#8250ff"
					}),
					u("stop", {
						offset: ".63",
						"stop-color": "#6e64ff"
					}),
					u("stop", {
						offset: ".79",
						"stop-color": "#00c8ff"
					}),
					u("stop", {
						offset: ".84",
						"stop-color": "#0c9"
					}),
					u("stop", {
						offset: ".99",
						"stop-color": "#00a637"
					})
				]
			}) }),
			u("path", {
				"stroke-width": "0.222043",
				d: "m 48.344254,23.376251 c 0,14.582148 -11.296608,26.178142 -36.607947,29.086577 v 15.47688 H 0 V 24.601791 C 0,9.1049395 10.947966,0 24.698431,0 38.448896,0 48.344254,10.24389 48.344254,23.376251 m -11.736307,0.437376 c 0,-7.180057 -5.429566,-12.60618 -12.349215,-12.60618 -6.919641,0 -12.524649,4.902158 -12.524649,13.394344 v 16.71352 C 21.134238,41.04889 36.605731,35.784844 36.605731,23.813627 Z"
			}),
			u("path", {
				fill: "url(#peacockGrad)",
				d: "m 69.499016,5.333684 c 0,2.9417574 -2.512018,5.326184 -5.611192,5.326184 -3.099174,0 -5.611193,-2.3844266 -5.611193,-5.326184 0,-2.9417581 2.512019,-5.32618468 5.611193,-5.32618468 3.099174,0 5.611192,2.38442658 5.611192,5.32618468 m -5.611192,9.055365 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326185 0,2.941758 2.512019,5.326185 5.611193,5.326185 3.099174,0 5.611192,-2.384427 5.611192,-5.326185 0,-2.941758 -2.512018,-5.326185 -5.611192,-5.326185 m 0,14.379846 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326185 0,2.941758 2.512019,5.326184 5.611193,5.326184 3.099174,0 5.611192,-2.384426 5.611192,-5.326184 0,-2.941758 -2.512018,-5.326185 -5.611192,-5.326185 m 0,14.379845 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326186 0,2.941758 2.512019,5.326184 5.611193,5.326184 3.099174,0 5.611192,-2.384426 5.611192,-5.326184 0,-2.941759 -2.512018,-5.326186 -5.611192,-5.326186 m 0,14.381551 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326184 0,2.941758 2.512019,5.326185 5.611193,5.326185 3.099174,0 5.611192,-2.384427 5.611192,-5.326185 0,-2.941757 -2.512018,-5.326184 -5.611192,-5.326184"
			})
		]
	});
	var LogoCw = (props) => u("svg", {
		viewBox: "0 0 634.82 278.47",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "#ff4500",
			"fill-rule": "evenodd",
			d: "M 132.45054,0 C 59.024992,0.32967 0,62.2039 0,139.04781 0,216.09719 59.333691,278.12623 133.03254,278.12623 h 89.4401 c 31.40713,0 60.18012,-11.29179 82.88879,-30.1835 18.44963,18.87803 43.97747,30.52429 72.26351,30.52429 29.17254,0 55.38991,-12.41067 73.9559,-32.34304 19.33778,19.93306 46.64489,32.34304 77.03052,32.34304 58.24863,0 105.18745,-45.54729 106.20702,-102.47383 V 0 h -86.51481 c 9.4e-4,198.95195 0.17625,-69.53274 0.17625,162.67998 0,14.63405 -11.78186,26.41583 -26.41583,26.41583 -14.63405,0 -26.41583,-11.78178 -26.41583,-26.41583 0,-232.21269 0.17526,36.27171 0.17605,-162.67998 H 408.1569 c 9.2e-4,198.95162 0.17624,-69.53269 0.17604,162.67998 0,14.63405 -11.78183,26.41583 -26.41581,26.41583 -14.63404,0 -26.41582,-11.78178 -26.41582,-26.41583 0,-232.21267 0.17526,36.27166 0.17604,-162.67998 h -87.49104 v 139.04781 c 0,28.63159 -20.7988,51.68297 -46.63262,51.68297 h -87.66347 c -25.83379,0 -46.632605,-23.05138 -46.632605,-51.68297 0,-28.63166 20.798815,-51.683 46.632605,-51.683 h 85.2168 V 0 Z"
		})
	});
	var LogoItvx = (props) => u("svg", {
		viewBox: "0 0 24 24",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "M15.91 11.018a59.87 59.87 0 0 0-.98-.27c-.1 0-.16.05-.2.17-.35 1.2-.9 2.53-1.38 3.36-.16-.3-.45-.83-.73-1.3l-1.04-1.83c-.22-.34-.36-.43-.64-.43-.57 0-1.42.51-1.42 1 0 .16.04.28.21.57.2.32.3.6.3.92 0 .82-.62 1.56-1.8 1.56-.55 0-.99-.16-1.27-.45-.27-.28-.4-.65-.4-1.27v-1.03c.2.08.44.12.73.12h.93c.13 0 .17-.05.17-.16v-1c0-.11-.04-.17-.17-.17H6.56v-1.63c0-.2-.05-.33-.16-.43-.16-.15-.5-.22-.89-.22-.4 0-.72.07-.89.22-.1.1-.16.24-.16.43v4c0 .66-.1 1.02-.34 1.27-.2.22-.53.34-.88.34s-.66-.12-.84-.31c-.2-.2-.29-.48-.29-.9v-2.6c0-.11-.04-.16-.16-.16H.18c-.12 0-.17.05-.17.16v2.35c0 .94.25 1.47.67 1.9.55.54 1.48.79 2.38.79.88 0 1.81-.32 2.36-.82a4 4 0 0 0 2.6.82c1.42 0 2.47-.6 3.08-1.6.27.43.47.74.67 1.02.28.42.54.58 1.12.58.54 0 .87-.13 1.17-.59.78-1.18 1.44-2.59 1.92-3.88.05-.16.1-.28.1-.35 0-.08-.05-.14-.17-.18zm-14.85-.92c.66 0 1.07-.46 1.07-1.05 0-.6-.4-1.06-1.07-1.06-.65-.01-1.06.46-1.06 1.05 0 .59.4 1.05 1.06 1.05zm22.84 5.1-2.28-3.13c-.05-.07-.05-.14 0-.2l2.1-3.07c.07-.09.11-.15.11-.28 0-.12-.07-.25-.19-.37a.51.51 0 0 0-.39-.17.4.4 0 0 0-.24.1l-2.9 2.22c-.06.05-.13.05-.2 0l-2.89-2.22a.4.4 0 0 0-.25-.1.51.51 0 0 0-.38.17c-.12.12-.2.25-.2.37 0 .13.05.2.11.28l2.11 3.07c.05.06.05.13 0 .2l-2.28 3.13a.42.42 0 0 0-.1.26c0 .14.06.26.18.38.11.11.24.18.38.18.1 0 .17-.04.26-.1l3.06-2.23a.17.17 0 0 1 .2 0l3.07 2.23c.09.06.16.1.26.1.14 0 .27-.07.38-.18.12-.12.18-.24.18-.38 0-.1-.04-.17-.1-.26z" })
	});
	var LogoChannel4 = (props) => u("svg", {
		viewBox: "0 0 24 24",
		xmlns: "http://www.w3.org/2000/svg",
		"aria-hidden": "true",
		...props,
		children: u("path", { d: "m14.309 0-.33.412v4.201l2.382-2.95zm-1.155 1.201L10.707 4.22v8.674h2.447zm3.268 1.701-2.443 3.02v14.81h2.443zM9.887 5.236l-6.201 7.657h3.142L9.887 9.12Zm-6.766 8.48v2.444h10.033v-2.443Zm14.125 0v2.444h3.633v-2.443Zm-6.539 3.268V24h2.443v-7.016Zm-3.271 4.573V24h2.443v-2.443zm6.543 0V24h5.189v-2.443z" })
	});
	var LogoSbs = (props) => u("svg", {
		viewBox: "0 0 90.77 40.55",
		"aria-hidden": "true",
		...props,
		children: [
			u("path", {
				fill: "#005293",
				d: "M22.05,19.14l-9.62-8.82h0a3.18,3.18,0,0,1-1.08-2.39A3.44,3.44,0,0,1,14.87,4.6H25.51V0H9.24C4.19,0,0,3.4,0,8.72a8.41,8.41,0,0,0,2.43,5.89L13.76,25.3A3.46,3.46,0,0,1,15,29c-.67,2.28-3.56,2.28-4.64,2.28H0v9.32H15.73c6.36,0,11.52-4.86,11.52-10.87V29.6c.18-4.49-2.24-7.7-5.2-10.46"
			}),
			u("path", {
				fill: "#005293",
				d: "M85.55,19.14l-9.61-8.82h0a3.15,3.15,0,0,1-1.09-2.39A3.44,3.44,0,0,1,78.37,4.6H89V0H72.74c-5,0-9.24,3.4-9.24,8.72a8.42,8.42,0,0,0,2.44,5.89L77.26,25.3A3.46,3.46,0,0,1,78.51,29c-.66,2.28-3.56,2.28-4.64,2.28H63.51v9.32H79.24c6.36,0,11.52-4.86,11.52-10.87V29.6c.17-4.48-2.24-7.7-5.21-10.46"
			}),
			u("path", {
				fill: "#005293",
				d: "M61.31,28.78a11.8,11.8,0,0,0-8.16-11.43A8.3,8.3,0,0,0,59.41,8.8,8.33,8.33,0,0,0,55.93,2C52.87-.11,48.3.05,48.3.05h-18V40.55h19.1a13.64,13.64,0,0,0,7.77-2.77A12,12,0,0,0,61.31,28.78ZM40.06,4.67h4.3c.66,0,5.16,0,5.54,4.39.26,3.14-1.87,5.11-5.33,5.11H40.06Zm5.17,26.56H40.06V20.44h5c.65,0,5.68,0,6,5C51.35,29,48.69,31.23,45.23,31.23Z"
			})
		]
	});
	var LogoTvn = (props) => u("svg", {
		viewBox: "0 0 300 121",
		"aria-hidden": "true",
		...props,
		children: u("path", {
			fill: "#E80328",
			d: "M 106.234375 121 L 82.542969 55.753906 L 59.488281 55.753906 L 48.011719 121 L 16.882812 121 L 28.359375 55.753906 L 0.152344 55.753906 L 4.640625 30.253906 L 32.851562 30.253906 L 60.996094 0 L 69.300781 0 L 63.980469 30.253906 L 104.566406 30.253906 L 123.8125 83.238281 L 151.921875 30.253906 L 186.035156 30.253906 L 137.886719 121 Z M 246.988281 121 L 222.238281 52.855469 L 210.25 121 L 179.121094 121 L 200.414062 0 L 232.171875 0 L 256.792969 67.792969 L 268.71875 0 L 299.847656 0 L 278.554688 121 Z M 246.988281 121 "
		})
	});
	var LogoNhk = (props) => u("svg", {
		viewBox: "0 0 1230 354",
		"aria-hidden": "true",
		...props,
		children: u("g", {
			fill: "#808080",
			children: [
				u("path", { d: "m359.6777698651264,7.090877978451821 a51.89632499779503,51.89632499779503 0 0 0 -64.06788575758715,35.84591520466254 l-37.584709598918565,132.54963420828574 l-93.62739045993946,-146.45998936233386 a51.762571582852246,51.762571582852246 0 0 0 -51.093804508138405,-23.94186127475595 a52.29758524262333,52.29758524262333 0 0 0 -42.26607912191553,37.8522164288041 l-69.01676211046966,243.02995495101436 a52.16383182768057,52.16383182768057 0 0 0 35.578408374777,64.46914600241546 a53.501365977108264,53.501365977108264 0 0 0 14.311615398876462,2.407561468969873 a52.030078412737794,52.030078412737794 0 0 0 49.756270358710694,-37.8522164288041 l37.584709598918565,-132.54963420828574 l93.62739045993946,147.12875643704774 a51.62881816790948,51.62881816790948 0 0 0 93.62739045993946,-13.375341494277066 l68.74925528058412,-244.2337356854993 a52.16383182768057,52.16383182768057 0 0 0 -35.578408374777,-64.87040624724375 z" }),
				u("path", { d: "m782.73982132911,7.090877978451821 a51.762571582852246,51.762571582852246 0 0 0 -64.06788575758715,35.84591520466254 l-24.47687493452704,86.53845946797261 h-116.76673124503881 l16.451670037960792,-57.51396842539139 a51.89632499779503,51.89632499779503 0 1 0 -98.9775270576503,-29.024491042581232 l-69.8192826001263,243.02995495101436 a52.030078412737794,52.030078412737794 0 0 0 49.89002377365347,66.87670747138533 a51.762571582852246,51.762571582852246 0 0 0 49.756270358710694,-37.8522164288041 l24.610628349469803,-86.40470605302984 h116.76673124503881 l-16.451670037960792,57.380215010448616 a52.16383182768057,52.16383182768057 0 0 0 35.578408374777,64.46914600241546 a53.501365977108264,53.501365977108264 0 0 0 14.311615398876462,2.407561468969873 a52.030078412737794,52.030078412737794 0 0 0 49.48876352882515,-37.8522164288041 l69.28426894035522,-243.02995495101436 a52.16383182768057,52.16383182768057 0 0 0 -35.578408374777,-64.87040624724375 z" }),
				u("path", { d: "m1219.979734777027,25.816356070439717 a51.495064752966705,51.495064752966705 0 0 0 -72.49435089898171,-10.165259535650572 l-146.19248253244834,111.41659464732795 l15.247889303475858,-55.106406956421516 a51.89632499779503,51.89632499779503 0 1 0 -99.64629413236416,-28.623230797752925 l-68.61550186564135,242.62869470618602 a52.16383182768057,52.16383182768057 0 0 0 35.578408374777,64.46914600241546 a53.501365977108264,53.501365977108264 0 0 0 14.311615398876462,2.0063012241415614 a52.030078412737794,52.030078412737794 0 0 0 49.756270358710694,-37.8522164288041 l29.693258117295095,-104.59517048524665 a18.190464432216814,18.190464432216814 0 0 0 1.6050409793132485,1.6050409793132485 c0.6687670747138535,0.8025204896566244 1.0700273195421655,1.7387943942560198 1.7387943942560198,2.407561468969873 l112.35286855192736,121.71560759792132 a51.495064752966705,51.495064752966705 0 0 0 73.16311797369555,2.808821713798184 a52.29758524262333,52.29758524262333 0 0 0 2.6750682988554133,-73.69813163346663 l-73.16311797369555,-79.44952847600578 l113.95790953124062,-86.67221288291539 a52.16383182768057,52.16383182768057 0 0 0 10.031506120707805,-72.89561114381002 z" })
			]
		})
	});
	var LogoShowtime = (props) => u("svg", {
		viewBox: "0 0 24 24",
		xmlns: "http://www.w3.org/2000/svg",
		...props,
		children: [u("title", { children: "Showtime" }), u("path", { d: "M16.99 12.167c0-4.808 1.779-7.84 3.903-8.16C18.769 1.397 15.221 0 11.999 0 8.451 0 5.265 1.54 3.07 3.985c2.094.416 2.806 2.174 2.806 4.892H3.314c0-1.605-.334-2.436-1.284-2.436-.427 0-.758.217-.954.587-.027.06-.057.122-.084.184a2.115 2.115 0 0 0-.114.71c0 3.324 5.46 3.159 5.46 8.27 0 1.995-1.53 3.855-3.252 3.855C5.35 22.52 8.441 24 12 24c3.46 0 6.577-1.464 8.766-3.808-2.018-.509-3.776-3.413-3.776-8.025zm-1.142 7.921h-2.746V13.26h-2.967v6.83H7.384V4.327h2.746v6.348h2.972V4.327h2.746v15.761zM2.372 17.58c-1.32 0-2.399-2.32-2.372-5.8 1.905 1.72 3.681 2.11 3.681 4.145 0 .981-.543 1.655-1.309 1.655zM24 12.002c0 2.844-.896 5.409-2.1 5.409-1.445 0-2.181-2.703-2.181-5.498 0-2.654.771-5.308 2.181-5.308 1.676 0 2.1 4.102 2.1 5.397z" })]
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
	function addUniqueItem(arr, item) {
		if (arr.indexOf(item) === -1) arr.push(item);
	}
	function removeItem(arr, item) {
		const index = arr.indexOf(item);
		if (index > -1) arr.splice(index, 1);
	}
	var clamp = (min, max, v) => {
		if (v > max) return max;
		if (v < min) return min;
		return v;
	};
	var MotionGlobalConfig = {};
	var isNumericalString = (v) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(v);
	var isObject = (value) => typeof value === "object" && value !== null;
	var isZeroValueString = (v) => /^0[^.\s]+$/u.test(v);
	function memo(callback) {
		let result;
		return () => {
			if (result === void 0) result = callback();
			return result;
		};
	}
	var noop$3 = (any) => any;
	var pipe = (...transformers) => transformers.reduce((a, b) => (v) => b(a(v)));
	var progress = (from, to, value) => {
		const range = to - from;
		return range ? (value - from) / range : 1;
	};
	var SubscriptionManager = class {
		constructor() {
			this.subscriptions = [];
		}
		add(handler) {
			addUniqueItem(this.subscriptions, handler);
			return () => removeItem(this.subscriptions, handler);
		}
		notify(a, b, c) {
			const numSubscriptions = this.subscriptions.length;
			if (!numSubscriptions) return;
			if (numSubscriptions === 1) this.subscriptions[0](a, b, c);
			else for (let i = 0; i < numSubscriptions; i++) {
				const handler = this.subscriptions[i];
				handler && handler(a, b, c);
			}
		}
		getSize() {
			return this.subscriptions.length;
		}
		clear() {
			this.subscriptions.length = 0;
		}
	};
	var secondsToMilliseconds = (seconds) => seconds * 1e3;
	var millisecondsToSeconds = (milliseconds) => milliseconds / 1e3;
	var velocityPerSecond = (velocity, frameDuration) => frameDuration ? velocity * (1e3 / frameDuration) : 0;
	var wrap = (min, max, v) => {
		const rangeSize = max - min;
		return ((v - min) % rangeSize + rangeSize) % rangeSize + min;
	};
	var calcBezier = (t, a1, a2) => (((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t + 3 * a1) * t;
	var subdivisionPrecision = 1e-7;
	var subdivisionMaxIterations = 12;
	function binarySubdivide(x, lowerBound, upperBound, mX1, mX2) {
		let currentX;
		let currentT;
		let i = 0;
		do {
			currentT = lowerBound + (upperBound - lowerBound) / 2;
			currentX = calcBezier(currentT, mX1, mX2) - x;
			if (currentX > 0) upperBound = currentT;
			else lowerBound = currentT;
		} while (Math.abs(currentX) > subdivisionPrecision && ++i < subdivisionMaxIterations);
		return currentT;
	}
	function cubicBezier(mX1, mY1, mX2, mY2) {
		if (mX1 === mY1 && mX2 === mY2) return noop$3;
		const getTForX = (aX) => binarySubdivide(aX, 0, 1, mX1, mX2);
		return (t) => t === 0 || t === 1 ? t : calcBezier(getTForX(t), mY1, mY2);
	}
	var mirrorEasing = (easing) => (p) => p <= .5 ? easing(2 * p) / 2 : (2 - easing(2 * (1 - p))) / 2;
	var reverseEasing = (easing) => (p) => 1 - easing(1 - p);
	var backOut = cubicBezier(.33, 1.53, .69, .99);
	var backIn = reverseEasing(backOut);
	var backInOut = mirrorEasing(backIn);
	var anticipate = (p) => p >= 1 ? 1 : (p *= 2) < 1 ? .5 * backIn(p) : .5 * (2 - Math.pow(2, -10 * (p - 1)));
	var circIn = (p) => 1 - Math.sin(Math.acos(p));
	var circOut = reverseEasing(circIn);
	var circInOut = mirrorEasing(circIn);
	var easeIn = cubicBezier(.42, 0, 1, 1);
	var easeOut = cubicBezier(0, 0, .58, 1);
	var easeInOut = cubicBezier(.42, 0, .58, 1);
	var isEasingArray = (ease) => {
		return Array.isArray(ease) && typeof ease[0] !== "number";
	};
	function getEasingForSegment(easing, i) {
		return isEasingArray(easing) ? easing[wrap(0, easing.length, i)] : easing;
	}
	var isBezierDefinition = (easing) => Array.isArray(easing) && typeof easing[0] === "number";
	var easingLookup = {
		linear: noop$3,
		easeIn,
		easeInOut,
		easeOut,
		circIn,
		circInOut,
		circOut,
		backIn,
		backInOut,
		backOut,
		anticipate
	};
	var isValidEasing = (easing) => {
		return typeof easing === "string";
	};
	var easingDefinitionToFunction = (definition) => {
		if (isBezierDefinition(definition)) {
			definition.length;
			const [x1, y1, x2, y2] = definition;
			return cubicBezier(x1, y1, x2, y2);
		} else if (isValidEasing(definition)) {
			easingLookup[definition], `${definition}`;
			return easingLookup[definition];
		}
		return definition;
	};
	var stepsOrder = [
		"setup",
		"read",
		"resolveKeyframes",
		"preUpdate",
		"update",
		"preRender",
		"render",
		"postRender"
	];
	function createRenderStep(runNextFrame) {
		let thisFrame = new Set();
		let nextFrame = new Set();
		let isProcessing = false;
		let flushNextFrame = false;
		const toKeepAlive = new WeakSet();
		let latestFrameData = {
			delta: 0,
			timestamp: 0,
			isProcessing: false
		};
		function triggerCallback(callback) {
			if (toKeepAlive.has(callback)) {
				step.schedule(callback);
				runNextFrame();
			}
			callback(latestFrameData);
		}
		const step = {
			schedule: (callback, keepAlive = false, immediate = false) => {
				const queue = immediate && isProcessing ? thisFrame : nextFrame;
				if (keepAlive) toKeepAlive.add(callback);
				queue.add(callback);
				return callback;
			},
			cancel: (callback) => {
				nextFrame.delete(callback);
				toKeepAlive.delete(callback);
			},
			process: (frameData) => {
				latestFrameData = frameData;
				if (isProcessing) {
					flushNextFrame = true;
					return;
				}
				isProcessing = true;
				const prevFrame = thisFrame;
				thisFrame = nextFrame;
				nextFrame = prevFrame;
				thisFrame.forEach(triggerCallback);
				thisFrame.clear();
				isProcessing = false;
				if (flushNextFrame) {
					flushNextFrame = false;
					step.process(frameData);
				}
			}
		};
		return step;
	}
	var maxElapsed = 40;
	function createRenderBatcher(scheduleNextBatch, allowKeepAlive) {
		let runNextFrame = false;
		let useDefaultElapsed = true;
		const state = {
			delta: 0,
			timestamp: 0,
			isProcessing: false
		};
		const flagRunNextFrame = () => runNextFrame = true;
		const steps = stepsOrder.reduce((acc, key) => {
			acc[key] = createRenderStep(flagRunNextFrame);
			return acc;
		}, {});
		const { setup, read, resolveKeyframes, preUpdate, update, preRender, render, postRender } = steps;
		const processBatch = () => {
			const useManualTiming = MotionGlobalConfig.useManualTiming;
			const timestamp = useManualTiming ? state.timestamp : performance.now();
			runNextFrame = false;
			if (!useManualTiming) state.delta = useDefaultElapsed ? 1e3 / 60 : Math.max(Math.min(timestamp - state.timestamp, maxElapsed), 1);
			state.timestamp = timestamp;
			state.isProcessing = true;
			setup.process(state);
			read.process(state);
			resolveKeyframes.process(state);
			preUpdate.process(state);
			update.process(state);
			preRender.process(state);
			render.process(state);
			postRender.process(state);
			state.isProcessing = false;
			if (runNextFrame && allowKeepAlive) {
				useDefaultElapsed = false;
				scheduleNextBatch(processBatch);
			}
		};
		const wake = () => {
			runNextFrame = true;
			useDefaultElapsed = true;
			if (!state.isProcessing) scheduleNextBatch(processBatch);
		};
		const schedule = stepsOrder.reduce((acc, key) => {
			const step = steps[key];
			acc[key] = (process, keepAlive = false, immediate = false) => {
				if (!runNextFrame) wake();
				return step.schedule(process, keepAlive, immediate);
			};
			return acc;
		}, {});
		const cancel = (process) => {
			for (let i = 0; i < stepsOrder.length; i++) steps[stepsOrder[i]].cancel(process);
		};
		return {
			schedule,
			cancel,
			state,
			steps
		};
	}
	var { schedule: frame, cancel: cancelFrame, state: frameData, steps: frameSteps } = createRenderBatcher(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : noop$3, true);
	var now;
	function clearTime() {
		now = void 0;
	}
	var time = {
		now: () => {
			if (now === void 0) time.set(frameData.isProcessing || MotionGlobalConfig.useManualTiming ? frameData.timestamp : performance.now());
			return now;
		},
		set: (newTime) => {
			now = newTime;
			queueMicrotask(clearTime);
		}
	};
	var checkStringStartsWith = (token) => (key) => typeof key === "string" && key.startsWith(token);
	var isCSSVariableName = checkStringStartsWith("--");
	var startsAsVariableToken = checkStringStartsWith("var(--");
	var isCSSVariableToken = (value) => {
		if (!startsAsVariableToken(value)) return false;
		return singleCssVariableRegex.test(value.split("/*")[0].trim());
	};
	var singleCssVariableRegex = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
	function containsCSSVariable(value) {
		if (typeof value !== "string") return false;
		return value.split("/*")[0].includes("var(--");
	}
	var number = {
		test: (v) => typeof v === "number",
		parse: parseFloat,
		transform: (v) => v
	};
	var alpha = {
		...number,
		transform: (v) => clamp(0, 1, v)
	};
	var scale = {
		...number,
		default: 1
	};
	var sanitize = (v) => Math.round(v * 1e5) / 1e5;
	var floatRegex = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
	function isNullish(v) {
		return v == null;
	}
	var singleColorRegex = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;
	var isColorString = (type, testProp) => (v) => {
		return Boolean(typeof v === "string" && singleColorRegex.test(v) && v.startsWith(type) || testProp && !isNullish(v) && Object.prototype.hasOwnProperty.call(v, testProp));
	};
	var splitColor = (aName, bName, cName) => (v) => {
		if (typeof v !== "string") return v;
		const [a, b, c, alpha] = v.match(floatRegex);
		return {
			[aName]: parseFloat(a),
			[bName]: parseFloat(b),
			[cName]: parseFloat(c),
			alpha: alpha !== void 0 ? parseFloat(alpha) : 1
		};
	};
	var clampRgbUnit = (v) => clamp(0, 255, v);
	var rgbUnit = {
		...number,
		transform: (v) => Math.round(clampRgbUnit(v))
	};
	var rgba = {
		test: isColorString("rgb", "red"),
		parse: splitColor("red", "green", "blue"),
		transform: ({ red, green, blue, alpha: alpha$1 = 1 }) => "rgba(" + rgbUnit.transform(red) + ", " + rgbUnit.transform(green) + ", " + rgbUnit.transform(blue) + ", " + sanitize(alpha.transform(alpha$1)) + ")"
	};
	function parseHex(v) {
		let r = "";
		let g = "";
		let b = "";
		let a = "";
		if (v.length > 5) {
			r = v.substring(1, 3);
			g = v.substring(3, 5);
			b = v.substring(5, 7);
			a = v.substring(7, 9);
		} else {
			r = v.substring(1, 2);
			g = v.substring(2, 3);
			b = v.substring(3, 4);
			a = v.substring(4, 5);
			r += r;
			g += g;
			b += b;
			a += a;
		}
		return {
			red: parseInt(r, 16),
			green: parseInt(g, 16),
			blue: parseInt(b, 16),
			alpha: a ? parseInt(a, 16) / 255 : 1
		};
	}
	var hex = {
		test: isColorString("#"),
		parse: parseHex,
		transform: rgba.transform
	};
	var createUnitType = (unit) => ({
		test: (v) => typeof v === "string" && v.endsWith(unit) && v.split(" ").length === 1,
		parse: parseFloat,
		transform: (v) => `${v}${unit}`
	});
	var degrees = createUnitType("deg");
	var percent = createUnitType("%");
	var px = createUnitType("px");
	var vh = createUnitType("vh");
	var vw = createUnitType("vw");
	var progressPercentage = (() => ({
		...percent,
		parse: (v) => percent.parse(v) / 100,
		transform: (v) => percent.transform(v * 100)
	}))();
	var hsla = {
		test: isColorString("hsl", "hue"),
		parse: splitColor("hue", "saturation", "lightness"),
		transform: ({ hue, saturation, lightness, alpha: alpha$1 = 1 }) => {
			return "hsla(" + Math.round(hue) + ", " + percent.transform(sanitize(saturation)) + ", " + percent.transform(sanitize(lightness)) + ", " + sanitize(alpha.transform(alpha$1)) + ")";
		}
	};
	var color = {
		test: (v) => rgba.test(v) || hex.test(v) || hsla.test(v),
		parse: (v) => {
			if (rgba.test(v)) return rgba.parse(v);
			else if (hsla.test(v)) return hsla.parse(v);
			else return hex.parse(v);
		},
		transform: (v) => {
			return typeof v === "string" ? v : v.hasOwnProperty("red") ? rgba.transform(v) : hsla.transform(v);
		},
		getAnimatableNone: (v) => {
			const parsed = color.parse(v);
			parsed.alpha = 0;
			return color.transform(parsed);
		}
	};
	var colorRegex = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
	function test(v) {
		return isNaN(v) && typeof v === "string" && (v.match(floatRegex)?.length || 0) + (v.match(colorRegex)?.length || 0) > 0;
	}
	var NUMBER_TOKEN = "number";
	var COLOR_TOKEN = "color";
	var VAR_TOKEN = "var";
	var VAR_FUNCTION_TOKEN = "var(";
	var SPLIT_TOKEN = "${}";
	var complexRegex = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
	function analyseComplexValue(value) {
		const originalValue = value.toString();
		const values = [];
		const indexes = {
			color: [],
			number: [],
			var: []
		};
		const types = [];
		let i = 0;
		return {
			values,
			split: originalValue.replace(complexRegex, (parsedValue) => {
				if (color.test(parsedValue)) {
					indexes.color.push(i);
					types.push(COLOR_TOKEN);
					values.push(color.parse(parsedValue));
				} else if (parsedValue.startsWith(VAR_FUNCTION_TOKEN)) {
					indexes.var.push(i);
					types.push(VAR_TOKEN);
					values.push(parsedValue);
				} else {
					indexes.number.push(i);
					types.push(NUMBER_TOKEN);
					values.push(parseFloat(parsedValue));
				}
				++i;
				return SPLIT_TOKEN;
			}).split(SPLIT_TOKEN),
			indexes,
			types
		};
	}
	function parseComplexValue(v) {
		return analyseComplexValue(v).values;
	}
	function buildTransformer({ split, types }) {
		const numSections = split.length;
		return (v) => {
			let output = "";
			for (let i = 0; i < numSections; i++) {
				output += split[i];
				if (v[i] !== void 0) {
					const type = types[i];
					if (type === NUMBER_TOKEN) output += sanitize(v[i]);
					else if (type === COLOR_TOKEN) output += color.transform(v[i]);
					else output += v[i];
				}
			}
			return output;
		};
	}
	function createTransformer(source) {
		return buildTransformer(analyseComplexValue(source));
	}
	var convertNumbersToZero = (v) => typeof v === "number" ? 0 : color.test(v) ? color.getAnimatableNone(v) : v;
	var convertToZero = (value, splitBefore) => {
		if (typeof value === "number") return splitBefore?.trim().endsWith("/") ? value : 0;
		return convertNumbersToZero(value);
	};
	function getAnimatableNone$1(v) {
		const info = analyseComplexValue(v);
		return buildTransformer(info)(info.values.map((value, i) => convertToZero(value, info.split[i])));
	}
	var complex = {
		test,
		parse: parseComplexValue,
		createTransformer,
		getAnimatableNone: getAnimatableNone$1
	};
	function hueToRgb(p, q, t) {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}
	function hslaToRgba({ hue, saturation, lightness, alpha }) {
		hue /= 360;
		saturation /= 100;
		lightness /= 100;
		let red = 0;
		let green = 0;
		let blue = 0;
		if (!saturation) red = green = blue = lightness;
		else {
			const q = lightness < .5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
			const p = 2 * lightness - q;
			red = hueToRgb(p, q, hue + 1 / 3);
			green = hueToRgb(p, q, hue);
			blue = hueToRgb(p, q, hue - 1 / 3);
		}
		return {
			red: Math.round(red * 255),
			green: Math.round(green * 255),
			blue: Math.round(blue * 255),
			alpha
		};
	}
	function mixImmediate(a, b) {
		return (p) => p > 0 ? b : a;
	}
	var mixNumber$1 = (from, to, progress) => {
		return from + (to - from) * progress;
	};
	var mixLinearColor = (from, to, v) => {
		const fromExpo = from * from;
		const expo = v * (to * to - fromExpo) + fromExpo;
		return expo < 0 ? 0 : Math.sqrt(expo);
	};
	var colorTypes = [
		hex,
		rgba,
		hsla
	];
	var getColorType = (v) => colorTypes.find((type) => type.test(v));
	function asRGBA(color) {
		const type = getColorType(color);
		`${color}`;
		if (!Boolean(type)) return false;
		let model = type.parse(color);
		if (type === hsla) model = hslaToRgba(model);
		return model;
	}
	var mixColor = (from, to) => {
		const fromRGBA = asRGBA(from);
		const toRGBA = asRGBA(to);
		if (!fromRGBA || !toRGBA) return mixImmediate(from, to);
		const blended = { ...fromRGBA };
		return (v) => {
			blended.red = mixLinearColor(fromRGBA.red, toRGBA.red, v);
			blended.green = mixLinearColor(fromRGBA.green, toRGBA.green, v);
			blended.blue = mixLinearColor(fromRGBA.blue, toRGBA.blue, v);
			blended.alpha = mixNumber$1(fromRGBA.alpha, toRGBA.alpha, v);
			return rgba.transform(blended);
		};
	};
	var invisibleValues = new Set(["none", "hidden"]);
	function mixVisibility(origin, target) {
		if (invisibleValues.has(origin)) return (p) => p <= 0 ? origin : target;
		else return (p) => p >= 1 ? target : origin;
	}
	function mixNumber(a, b) {
		return (p) => mixNumber$1(a, b, p);
	}
	function getMixer(a) {
		if (typeof a === "number") return mixNumber;
		else if (typeof a === "string") return isCSSVariableToken(a) ? mixImmediate : color.test(a) ? mixColor : mixComplex;
		else if (Array.isArray(a)) return mixArray;
		else if (typeof a === "object") return color.test(a) ? mixColor : mixObject;
		return mixImmediate;
	}
	function mixArray(a, b) {
		const output = [...a];
		const numValues = output.length;
		const blendValue = a.map((v, i) => getMixer(v)(v, b[i]));
		return (p) => {
			for (let i = 0; i < numValues; i++) output[i] = blendValue[i](p);
			return output;
		};
	}
	function mixObject(a, b) {
		const output = {
			...a,
			...b
		};
		const blendValue = {};
		for (const key in output) if (a[key] !== void 0 && b[key] !== void 0) blendValue[key] = getMixer(a[key])(a[key], b[key]);
		return (v) => {
			for (const key in blendValue) output[key] = blendValue[key](v);
			return output;
		};
	}
	function matchOrder(origin, target) {
		const orderedOrigin = [];
		const pointers = {
			color: 0,
			var: 0,
			number: 0
		};
		for (let i = 0; i < target.values.length; i++) {
			const type = target.types[i];
			const originIndex = origin.indexes[type][pointers[type]];
			orderedOrigin[i] = origin.values[originIndex] ?? 0;
			pointers[type]++;
		}
		return orderedOrigin;
	}
	var mixComplex = (origin, target) => {
		const template = complex.createTransformer(target);
		const originStats = analyseComplexValue(origin);
		const targetStats = analyseComplexValue(target);
		if (originStats.indexes.var.length === targetStats.indexes.var.length && originStats.indexes.color.length === targetStats.indexes.color.length && originStats.indexes.number.length >= targetStats.indexes.number.length) {
			if (invisibleValues.has(origin) && !targetStats.values.length || invisibleValues.has(target) && !originStats.values.length) return mixVisibility(origin, target);
			return pipe(mixArray(matchOrder(originStats, targetStats), targetStats.values), template);
		} else {
			`${origin}${target}`;
			return mixImmediate(origin, target);
		}
	};
	function mix(from, to, p) {
		if (typeof from === "number" && typeof to === "number" && typeof p === "number") return mixNumber$1(from, to, p);
		return getMixer(from)(from, to);
	}
	var frameloopDriver = (update) => {
		const passTimestamp = ({ timestamp }) => update(timestamp);
		return {
			start: (keepAlive = true) => frame.update(passTimestamp, keepAlive),
			stop: () => cancelFrame(passTimestamp),
			now: () => frameData.isProcessing ? frameData.timestamp : time.now()
		};
	};
	var generateLinearEasing = (easing, duration, resolution = 10) => {
		let points = "";
		const numPoints = Math.max(Math.round(duration / resolution), 2);
		for (let i = 0; i < numPoints; i++) points += Math.round(easing(i / (numPoints - 1)) * 1e4) / 1e4 + ", ";
		return `linear(${points.substring(0, points.length - 2)})`;
	};
	var maxGeneratorDuration = 2e4;
	function calcGeneratorDuration(generator) {
		let duration = 0;
		const timeStep = 50;
		let state = generator.next(duration);
		while (!state.done && duration < 2e4) {
			duration += timeStep;
			state = generator.next(duration);
		}
		return duration >= 2e4 ? Infinity : duration;
	}
	function createGeneratorEasing(options, scale = 100, createGenerator) {
		const generator = createGenerator({
			...options,
			keyframes: [0, scale]
		});
		const duration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
		return {
			type: "keyframes",
			ease: (progress) => {
				return generator.next(duration * progress).value / scale;
			},
			duration: millisecondsToSeconds(duration)
		};
	}
	var springDefaults = {
		stiffness: 100,
		damping: 10,
		mass: 1,
		velocity: 0,
		duration: 800,
		bounce: .3,
		visualDuration: .3,
		restSpeed: {
			granular: .01,
			default: 2
		},
		restDelta: {
			granular: .005,
			default: .5
		},
		minDuration: .01,
		maxDuration: 10,
		minDamping: .05,
		maxDamping: 1
	};
	function calcAngularFreq(undampedFreq, dampingRatio) {
		return undampedFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
	}
	var rootIterations = 12;
	function approximateRoot(envelope, derivative, initialGuess) {
		let result = initialGuess;
		for (let i = 1; i < rootIterations; i++) result = result - envelope(result) / derivative(result);
		return result;
	}
	var safeMin = .001;
	function findSpring({ duration = springDefaults.duration, bounce = springDefaults.bounce, velocity = springDefaults.velocity, mass = springDefaults.mass }) {
		let envelope;
		let derivative;
		springDefaults.maxDuration;
		let dampingRatio = 1 - bounce;
		dampingRatio = clamp(springDefaults.minDamping, springDefaults.maxDamping, dampingRatio);
		duration = clamp(springDefaults.minDuration, springDefaults.maxDuration, millisecondsToSeconds(duration));
		if (dampingRatio < 1) {
			envelope = (undampedFreq) => {
				const exponentialDecay = undampedFreq * dampingRatio;
				const delta = exponentialDecay * duration;
				const a = exponentialDecay - velocity;
				const b = calcAngularFreq(undampedFreq, dampingRatio);
				const c = Math.exp(-delta);
				return safeMin - a / b * c;
			};
			derivative = (undampedFreq) => {
				const delta = undampedFreq * dampingRatio * duration;
				const d = delta * velocity + velocity;
				const e = Math.pow(dampingRatio, 2) * Math.pow(undampedFreq, 2) * duration;
				const f = Math.exp(-delta);
				const g = calcAngularFreq(Math.pow(undampedFreq, 2), dampingRatio);
				return (-envelope(undampedFreq) + safeMin > 0 ? -1 : 1) * ((d - e) * f) / g;
			};
		} else {
			envelope = (undampedFreq) => {
				return -.001 + Math.exp(-undampedFreq * duration) * ((undampedFreq - velocity) * duration + 1);
			};
			derivative = (undampedFreq) => {
				return Math.exp(-undampedFreq * duration) * ((velocity - undampedFreq) * (duration * duration));
			};
		}
		const initialGuess = 5 / duration;
		const undampedFreq = approximateRoot(envelope, derivative, initialGuess);
		duration = secondsToMilliseconds(duration);
		if (isNaN(undampedFreq)) return {
			stiffness: springDefaults.stiffness,
			damping: springDefaults.damping,
			duration
		};
		else {
			const stiffness = Math.pow(undampedFreq, 2) * mass;
			return {
				stiffness,
				damping: dampingRatio * 2 * Math.sqrt(mass * stiffness),
				duration
			};
		}
	}
	var durationKeys = ["duration", "bounce"];
	var physicsKeys = [
		"stiffness",
		"damping",
		"mass"
	];
	function isSpringType(options, keys) {
		return keys.some((key) => options[key] !== void 0);
	}
	function getSpringOptions(options) {
		let springOptions = {
			velocity: springDefaults.velocity,
			stiffness: springDefaults.stiffness,
			damping: springDefaults.damping,
			mass: springDefaults.mass,
			isResolvedFromDuration: false,
			...options
		};
		if (!isSpringType(options, physicsKeys) && isSpringType(options, durationKeys)) {
			springOptions.velocity = 0;
			if (options.visualDuration) {
				const visualDuration = options.visualDuration;
				const root = 2 * Math.PI / (visualDuration * 1.2);
				const stiffness = root * root;
				const damping = 2 * clamp(.05, 1, 1 - (options.bounce || 0)) * Math.sqrt(stiffness);
				springOptions = {
					...springOptions,
					mass: springDefaults.mass,
					stiffness,
					damping
				};
			} else {
				const derived = findSpring({
					...options,
					velocity: 0
				});
				springOptions = {
					...springOptions,
					...derived,
					mass: springDefaults.mass
				};
				springOptions.isResolvedFromDuration = true;
			}
		}
		return springOptions;
	}
	function spring(optionsOrVisualDuration = springDefaults.visualDuration, bounce = springDefaults.bounce) {
		const options = typeof optionsOrVisualDuration !== "object" ? {
			visualDuration: optionsOrVisualDuration,
			keyframes: [0, 1],
			bounce
		} : optionsOrVisualDuration;
		let { restSpeed, restDelta } = options;
		const origin = options.keyframes[0];
		const target = options.keyframes[options.keyframes.length - 1];
		const state = {
			done: false,
			value: origin
		};
		const { stiffness, damping, mass, duration, velocity, isResolvedFromDuration } = getSpringOptions({
			...options,
			velocity: -millisecondsToSeconds(options.velocity || 0)
		});
		const initialVelocity = velocity || 0;
		const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
		const initialDelta = target - origin;
		const undampedAngularFreq = millisecondsToSeconds(Math.sqrt(stiffness / mass));
		const isGranularScale = Math.abs(initialDelta) < 5;
		restSpeed || (restSpeed = isGranularScale ? springDefaults.restSpeed.granular : springDefaults.restSpeed.default);
		restDelta || (restDelta = isGranularScale ? springDefaults.restDelta.granular : springDefaults.restDelta.default);
		let resolveSpring;
		let resolveVelocity;
		let angularFreq;
		let A;
		let sinCoeff;
		let cosCoeff;
		if (dampingRatio < 1) {
			angularFreq = calcAngularFreq(undampedAngularFreq, dampingRatio);
			A = (initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / angularFreq;
			resolveSpring = (t) => {
				const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
				return target - envelope * (A * Math.sin(angularFreq * t) + initialDelta * Math.cos(angularFreq * t));
			};
			sinCoeff = dampingRatio * undampedAngularFreq * A + initialDelta * angularFreq;
			cosCoeff = dampingRatio * undampedAngularFreq * initialDelta - A * angularFreq;
			resolveVelocity = (t) => {
				return Math.exp(-dampingRatio * undampedAngularFreq * t) * (sinCoeff * Math.sin(angularFreq * t) + cosCoeff * Math.cos(angularFreq * t));
			};
		} else if (dampingRatio === 1) {
			resolveSpring = (t) => target - Math.exp(-undampedAngularFreq * t) * (initialDelta + (initialVelocity + undampedAngularFreq * initialDelta) * t);
			const C = initialVelocity + undampedAngularFreq * initialDelta;
			resolveVelocity = (t) => Math.exp(-undampedAngularFreq * t) * (undampedAngularFreq * C * t - initialVelocity);
		} else {
			const dampedAngularFreq = undampedAngularFreq * Math.sqrt(dampingRatio * dampingRatio - 1);
			resolveSpring = (t) => {
				const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
				const freqForT = Math.min(dampedAngularFreq * t, 300);
				return target - envelope * ((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) * Math.sinh(freqForT) + dampedAngularFreq * initialDelta * Math.cosh(freqForT)) / dampedAngularFreq;
			};
			const P = (initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / dampedAngularFreq;
			const sinhCoeff = dampingRatio * undampedAngularFreq * P - initialDelta * dampedAngularFreq;
			const coshCoeff = dampingRatio * undampedAngularFreq * initialDelta - P * dampedAngularFreq;
			resolveVelocity = (t) => {
				const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
				const freqForT = Math.min(dampedAngularFreq * t, 300);
				return envelope * (sinhCoeff * Math.sinh(freqForT) + coshCoeff * Math.cosh(freqForT));
			};
		}
		const generator = {
			calculatedDuration: isResolvedFromDuration ? duration || null : null,
			velocity: (t) => secondsToMilliseconds(resolveVelocity(t)),
			next: (t) => {
				if (!isResolvedFromDuration && dampingRatio < 1) {
					const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
					const sin = Math.sin(angularFreq * t);
					const cos = Math.cos(angularFreq * t);
					const current = target - envelope * (A * sin + initialDelta * cos);
					const currentVelocity = secondsToMilliseconds(envelope * (sinCoeff * sin + cosCoeff * cos));
					state.done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current) <= restDelta;
					state.value = state.done ? target : current;
					return state;
				}
				const current = resolveSpring(t);
				if (!isResolvedFromDuration) {
					const currentVelocity = secondsToMilliseconds(resolveVelocity(t));
					state.done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current) <= restDelta;
				} else state.done = t >= duration;
				state.value = state.done ? target : current;
				return state;
			},
			toString: () => {
				const calculatedDuration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
				const easing = generateLinearEasing((progress) => generator.next(calculatedDuration * progress).value, calculatedDuration, 30);
				return calculatedDuration + "ms " + easing;
			},
			toTransition: () => {}
		};
		return generator;
	}
	spring.applyToOptions = (options) => {
		const generatorOptions = createGeneratorEasing(options, 100, spring);
		options.ease = generatorOptions.ease;
		options.duration = secondsToMilliseconds(generatorOptions.duration);
		options.type = "keyframes";
		return options;
	};
	var velocitySampleDuration = 5;
	function getGeneratorVelocity(resolveValue, t, current) {
		const prevT = Math.max(t - velocitySampleDuration, 0);
		return velocityPerSecond(current - resolveValue(prevT), t - prevT);
	}
	function inertia({ keyframes, velocity = 0, power = .8, timeConstant = 325, bounceDamping = 10, bounceStiffness = 500, modifyTarget, min, max, restDelta = .5, restSpeed }) {
		const origin = keyframes[0];
		const state = {
			done: false,
			value: origin
		};
		const isOutOfBounds = (v) => min !== void 0 && v < min || max !== void 0 && v > max;
		const nearestBoundary = (v) => {
			if (min === void 0) return max;
			if (max === void 0) return min;
			return Math.abs(min - v) < Math.abs(max - v) ? min : max;
		};
		let amplitude = power * velocity;
		const ideal = origin + amplitude;
		const target = modifyTarget === void 0 ? ideal : modifyTarget(ideal);
		if (target !== ideal) amplitude = target - origin;
		const calcDelta = (t) => -amplitude * Math.exp(-t / timeConstant);
		const calcLatest = (t) => target + calcDelta(t);
		const applyFriction = (t) => {
			const delta = calcDelta(t);
			const latest = calcLatest(t);
			state.done = Math.abs(delta) <= restDelta;
			state.value = state.done ? target : latest;
		};
		let timeReachedBoundary;
		let spring$1;
		const checkCatchBoundary = (t) => {
			if (!isOutOfBounds(state.value)) return;
			timeReachedBoundary = t;
			spring$1 = spring({
				keyframes: [state.value, nearestBoundary(state.value)],
				velocity: getGeneratorVelocity(calcLatest, t, state.value),
				damping: bounceDamping,
				stiffness: bounceStiffness,
				restDelta,
				restSpeed
			});
		};
		checkCatchBoundary(0);
		return {
			calculatedDuration: null,
			next: (t) => {
				let hasUpdatedFrame = false;
				if (!spring$1 && timeReachedBoundary === void 0) {
					hasUpdatedFrame = true;
					applyFriction(t);
					checkCatchBoundary(t);
				}
				if (timeReachedBoundary !== void 0 && t >= timeReachedBoundary) return spring$1.next(t - timeReachedBoundary);
				else {
					!hasUpdatedFrame && applyFriction(t);
					return state;
				}
			}
		};
	}
	function createMixers(output, ease, customMixer) {
		const mixers = [];
		const mixerFactory = customMixer || MotionGlobalConfig.mix || mix;
		const numMixers = output.length - 1;
		for (let i = 0; i < numMixers; i++) {
			let mixer = mixerFactory(output[i], output[i + 1]);
			if (ease) mixer = pipe(Array.isArray(ease) ? ease[i] || noop$3 : ease, mixer);
			mixers.push(mixer);
		}
		return mixers;
	}
	function interpolate(input, output, { clamp: isClamp = true, ease, mixer } = {}) {
		const inputLength = input.length;
		output.length;
		if (inputLength === 1) return () => output[0];
		if (inputLength === 2 && output[0] === output[1]) return () => output[1];
		const isZeroDeltaRange = input[0] === input[1];
		if (input[0] > input[inputLength - 1]) {
			input = [...input].reverse();
			output = [...output].reverse();
		}
		const mixers = createMixers(output, ease, mixer);
		const numMixers = mixers.length;
		const interpolator = (v) => {
			if (isZeroDeltaRange && v < input[0]) return output[0];
			let i = 0;
			if (numMixers > 1) {
				for (; i < input.length - 2; i++) if (v < input[i + 1]) break;
			}
			const progressInRange = progress(input[i], input[i + 1], v);
			return mixers[i](progressInRange);
		};
		return isClamp ? (v) => interpolator(clamp(input[0], input[inputLength - 1], v)) : interpolator;
	}
	function fillOffset(offset, remaining) {
		const min = offset[offset.length - 1];
		for (let i = 1; i <= remaining; i++) {
			const offsetProgress = progress(0, remaining, i);
			offset.push(mixNumber$1(min, 1, offsetProgress));
		}
	}
	function defaultOffset(arr) {
		const offset = [0];
		fillOffset(offset, arr.length - 1);
		return offset;
	}
	function convertOffsetToTimes(offset, duration) {
		return offset.map((o) => o * duration);
	}
	function defaultEasing(values, easing) {
		return values.map(() => easing || easeInOut).splice(0, values.length - 1);
	}
	function keyframes({ duration = 300, keyframes: keyframeValues, times, ease = "easeInOut" }) {
		const easingFunctions = isEasingArray(ease) ? ease.map(easingDefinitionToFunction) : easingDefinitionToFunction(ease);
		const state = {
			done: false,
			value: keyframeValues[0]
		};
		const mapTimeToKeyframe = interpolate(convertOffsetToTimes(times && times.length === keyframeValues.length ? times : defaultOffset(keyframeValues), duration), keyframeValues, { ease: Array.isArray(easingFunctions) ? easingFunctions : defaultEasing(keyframeValues, easingFunctions) });
		return {
			calculatedDuration: duration,
			next: (t) => {
				state.value = mapTimeToKeyframe(t);
				state.done = t >= duration;
				return state;
			}
		};
	}
	var isNotNull = (value) => value !== null;
	function getFinalKeyframe(keyframes, { repeat, repeatType = "loop" }, finalKeyframe, speed = 1) {
		const resolvedKeyframes = keyframes.filter(isNotNull);
		const index = speed < 0 || repeat && repeatType !== "loop" && repeat % 2 === 1 ? 0 : resolvedKeyframes.length - 1;
		return !index || finalKeyframe === void 0 ? resolvedKeyframes[index] : finalKeyframe;
	}
	var transitionTypeMap = {
		decay: inertia,
		inertia,
		tween: keyframes,
		keyframes,
		spring
	};
	function replaceTransitionType(transition) {
		if (typeof transition.type === "string") transition.type = transitionTypeMap[transition.type];
	}
	var WithPromise = class {
		constructor() {
			this.updateFinished();
		}
		get finished() {
			return this._finished;
		}
		updateFinished() {
			this._finished = new Promise((resolve) => {
				this.resolve = resolve;
			});
		}
		notifyFinished() {
			this.resolve();
		}
		then(onResolve, onReject) {
			return this.finished.then(onResolve, onReject);
		}
	};
	var percentToProgress = (percent) => percent / 100;
	var JSAnimation = class extends WithPromise {
		constructor(options) {
			super();
			this.state = "idle";
			this.startTime = null;
			this.isStopped = false;
			this.currentTime = 0;
			this.holdTime = null;
			this.playbackSpeed = 1;
			this.delayState = {
				done: false,
				value: void 0
			};
			this.stop = () => {
				const { motionValue } = this.options;
				if (motionValue && motionValue.updatedAt !== time.now()) this.tick(time.now());
				this.isStopped = true;
				if (this.state === "idle") return;
				this.teardown();
				this.options.onStop?.();
			};
			this.options = options;
			this.initAnimation();
			this.play();
			if (options.autoplay === false) this.pause();
		}
		initAnimation() {
			const { options } = this;
			replaceTransitionType(options);
			const { type = keyframes, repeat = 0, repeatDelay = 0, repeatType, velocity = 0 } = options;
			let { keyframes: keyframes$1 } = options;
			const generatorFactory = type || keyframes;
			if (generatorFactory !== keyframes && typeof keyframes$1[0] !== "number") {
				this.mixKeyframes = pipe(percentToProgress, mix(keyframes$1[0], keyframes$1[1]));
				keyframes$1 = [0, 100];
			}
			const generator = generatorFactory({
				...options,
				keyframes: keyframes$1
			});
			if (repeatType === "mirror") this.mirroredGenerator = generatorFactory({
				...options,
				keyframes: [...keyframes$1].reverse(),
				velocity: -velocity
			});
			if (generator.calculatedDuration === null) generator.calculatedDuration = calcGeneratorDuration(generator);
			const { calculatedDuration } = generator;
			this.calculatedDuration = calculatedDuration;
			this.resolvedDuration = calculatedDuration + repeatDelay;
			this.totalDuration = this.resolvedDuration * (repeat + 1) - repeatDelay;
			this.generator = generator;
		}
		updateTime(timestamp) {
			const animationTime = Math.round(timestamp - this.startTime) * this.playbackSpeed;
			if (this.holdTime !== null) this.currentTime = this.holdTime;
			else this.currentTime = animationTime;
		}
		tick(timestamp, sample = false) {
			const { generator, totalDuration, mixKeyframes, mirroredGenerator, resolvedDuration, calculatedDuration } = this;
			if (this.startTime === null) return generator.next(0);
			const { delay = 0, keyframes, repeat, repeatType, repeatDelay, type, onUpdate, finalKeyframe } = this.options;
			if (this.speed > 0) this.startTime = Math.min(this.startTime, timestamp);
			else if (this.speed < 0) this.startTime = Math.min(timestamp - totalDuration / this.speed, this.startTime);
			if (sample) this.currentTime = timestamp;
			else this.updateTime(timestamp);
			const timeWithoutDelay = this.currentTime - delay * (this.playbackSpeed >= 0 ? 1 : -1);
			const isInDelayPhase = this.playbackSpeed >= 0 ? timeWithoutDelay < 0 : timeWithoutDelay > totalDuration;
			this.currentTime = Math.max(timeWithoutDelay, 0);
			if (this.state === "finished" && this.holdTime === null) this.currentTime = totalDuration;
			let elapsed = this.currentTime;
			let frameGenerator = generator;
			if (repeat) {
				const progress = Math.min(this.currentTime, totalDuration) / resolvedDuration;
				let currentIteration = Math.floor(progress);
				let iterationProgress = progress % 1;
				if (!iterationProgress && progress >= 1) iterationProgress = 1;
				iterationProgress === 1 && currentIteration--;
				currentIteration = Math.min(currentIteration, repeat + 1);
				if (Boolean(currentIteration % 2)) {
					if (repeatType === "reverse") {
						iterationProgress = 1 - iterationProgress;
						if (repeatDelay) iterationProgress -= repeatDelay / resolvedDuration;
					} else if (repeatType === "mirror") frameGenerator = mirroredGenerator;
				}
				elapsed = clamp(0, 1, iterationProgress) * resolvedDuration;
			}
			let state;
			if (isInDelayPhase) {
				this.delayState.value = keyframes[0];
				state = this.delayState;
			} else state = frameGenerator.next(elapsed);
			if (mixKeyframes && !isInDelayPhase) state.value = mixKeyframes(state.value);
			let { done } = state;
			if (!isInDelayPhase && calculatedDuration !== null) done = this.playbackSpeed >= 0 ? this.currentTime >= totalDuration : this.currentTime <= 0;
			const isAnimationFinished = this.holdTime === null && (this.state === "finished" || this.state === "running" && done);
			if (isAnimationFinished && type !== inertia) state.value = getFinalKeyframe(keyframes, this.options, finalKeyframe, this.speed);
			if (onUpdate) onUpdate(state.value);
			if (isAnimationFinished) this.finish();
			return state;
		}
		then(resolve, reject) {
			return this.finished.then(resolve, reject);
		}
		get duration() {
			return millisecondsToSeconds(this.calculatedDuration);
		}
		get iterationDuration() {
			const { delay = 0 } = this.options || {};
			return this.duration + millisecondsToSeconds(delay);
		}
		get time() {
			return millisecondsToSeconds(this.currentTime);
		}
		set time(newTime) {
			newTime = secondsToMilliseconds(newTime);
			this.currentTime = newTime;
			if (this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0) this.holdTime = newTime;
			else if (this.driver) this.startTime = this.driver.now() - newTime / this.playbackSpeed;
			if (this.driver) this.driver.start(false);
			else {
				this.startTime = 0;
				this.state = "paused";
				this.holdTime = newTime;
				this.tick(newTime);
			}
		}
		getGeneratorVelocity() {
			const t = this.currentTime;
			if (t <= 0) return this.options.velocity || 0;
			if (this.generator.velocity) return this.generator.velocity(t);
			const current = this.generator.next(t).value;
			return getGeneratorVelocity((s) => this.generator.next(s).value, t, current);
		}
		get speed() {
			return this.playbackSpeed;
		}
		set speed(newSpeed) {
			const hasChanged = this.playbackSpeed !== newSpeed;
			if (hasChanged && this.driver) this.updateTime(time.now());
			this.playbackSpeed = newSpeed;
			if (hasChanged && this.driver) this.time = millisecondsToSeconds(this.currentTime);
		}
		play() {
			if (this.isStopped) return;
			const { driver = frameloopDriver, startTime } = this.options;
			if (!this.driver) this.driver = driver((timestamp) => this.tick(timestamp));
			this.options.onPlay?.();
			const now = this.driver.now();
			if (this.state === "finished") {
				this.updateFinished();
				this.startTime = now;
			} else if (this.holdTime !== null) this.startTime = now - this.holdTime;
			else if (!this.startTime) this.startTime = startTime ?? now;
			if (this.state === "finished" && this.speed < 0) this.startTime += this.calculatedDuration;
			this.holdTime = null;
			this.state = "running";
			this.driver.start();
		}
		pause() {
			this.state = "paused";
			this.updateTime(time.now());
			this.holdTime = this.currentTime;
		}
		complete() {
			if (this.state !== "running") this.play();
			this.state = "finished";
			this.holdTime = null;
		}
		finish() {
			this.notifyFinished();
			this.teardown();
			this.state = "finished";
			this.options.onComplete?.();
		}
		cancel() {
			this.holdTime = null;
			this.startTime = 0;
			this.tick(0);
			this.teardown();
			this.options.onCancel?.();
		}
		teardown() {
			this.state = "idle";
			this.stopDriver();
			this.startTime = this.holdTime = null;
		}
		stopDriver() {
			if (!this.driver) return;
			this.driver.stop();
			this.driver = void 0;
		}
		sample(sampleTime) {
			this.startTime = 0;
			return this.tick(sampleTime, true);
		}
		attachTimeline(timeline) {
			if (this.options.allowFlatten) {
				this.options.type = "keyframes";
				this.options.ease = "linear";
				this.initAnimation();
			}
			this.driver?.stop();
			return timeline.observe(this);
		}
	};
	function fillWildcards(keyframes) {
		for (let i = 1; i < keyframes.length; i++) keyframes[i] ?? (keyframes[i] = keyframes[i - 1]);
	}
	var radToDeg = (rad) => rad * 180 / Math.PI;
	var rotate = (v) => {
		return rebaseAngle(radToDeg(Math.atan2(v[1], v[0])));
	};
	var matrix2dParsers = {
		x: 4,
		y: 5,
		translateX: 4,
		translateY: 5,
		scaleX: 0,
		scaleY: 3,
		scale: (v) => (Math.abs(v[0]) + Math.abs(v[3])) / 2,
		rotate,
		rotateZ: rotate,
		skewX: (v) => radToDeg(Math.atan(v[1])),
		skewY: (v) => radToDeg(Math.atan(v[2])),
		skew: (v) => (Math.abs(v[1]) + Math.abs(v[2])) / 2
	};
	var rebaseAngle = (angle) => {
		angle = angle % 360;
		if (angle < 0) angle += 360;
		return angle;
	};
	var rotateZ = rotate;
	var scaleX = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	var scaleY = (v) => Math.sqrt(v[4] * v[4] + v[5] * v[5]);
	var matrix3dParsers = {
		x: 12,
		y: 13,
		z: 14,
		translateX: 12,
		translateY: 13,
		translateZ: 14,
		scaleX,
		scaleY,
		scale: (v) => (scaleX(v) + scaleY(v)) / 2,
		rotateX: (v) => rebaseAngle(radToDeg(Math.atan2(v[6], v[5]))),
		rotateY: (v) => rebaseAngle(radToDeg(Math.atan2(-v[2], v[0]))),
		rotateZ,
		rotate: rotateZ,
		skewX: (v) => radToDeg(Math.atan(v[4])),
		skewY: (v) => radToDeg(Math.atan(v[1])),
		skew: (v) => (Math.abs(v[1]) + Math.abs(v[4])) / 2
	};
	function defaultTransformValue(name) {
		return name.includes("scale") ? 1 : 0;
	}
	function parseValueFromTransform(transform, name) {
		if (!transform || transform === "none") return defaultTransformValue(name);
		const matrix3dMatch = transform.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
		let parsers;
		let match;
		if (matrix3dMatch) {
			parsers = matrix3dParsers;
			match = matrix3dMatch;
		} else {
			const matrix2dMatch = transform.match(/^matrix\(([-\d.e\s,]+)\)$/u);
			parsers = matrix2dParsers;
			match = matrix2dMatch;
		}
		if (!match) return defaultTransformValue(name);
		const valueParser = parsers[name];
		const values = match[1].split(",").map(convertTransformToNumber);
		return typeof valueParser === "function" ? valueParser(values) : values[valueParser];
	}
	var readTransformValue = (instance, name) => {
		const { transform = "none" } = getComputedStyle(instance);
		return parseValueFromTransform(transform, name);
	};
	function convertTransformToNumber(value) {
		return parseFloat(value.trim());
	}
	var transformPropOrder = [
		"transformPerspective",
		"x",
		"y",
		"z",
		"translateX",
		"translateY",
		"translateZ",
		"scale",
		"scaleX",
		"scaleY",
		"rotate",
		"rotateX",
		"rotateY",
		"rotateZ",
		"skew",
		"skewX",
		"skewY"
	];
	var transformProps = (() => new Set([...transformPropOrder, "pathRotation"]))();
	var isNumOrPxType = (v) => v === number || v === px;
	var transformKeys = new Set([
		"x",
		"y",
		"z"
	]);
	var nonTranslationalTransformKeys = transformPropOrder.filter((key) => !transformKeys.has(key));
	function removeNonTranslationalTransform(visualElement) {
		const removedTransforms = [];
		nonTranslationalTransformKeys.forEach((key) => {
			const value = visualElement.getValue(key);
			if (value !== void 0) {
				removedTransforms.push([key, value.get()]);
				value.set(key.startsWith("scale") ? 1 : 0);
			}
		});
		return removedTransforms;
	}
	var positionalValues = {
		width: ({ x }, { paddingLeft = "0", paddingRight = "0", boxSizing }) => {
			const width = x.max - x.min;
			return boxSizing === "border-box" ? width : width - parseFloat(paddingLeft) - parseFloat(paddingRight);
		},
		height: ({ y }, { paddingTop = "0", paddingBottom = "0", boxSizing }) => {
			const height = y.max - y.min;
			return boxSizing === "border-box" ? height : height - parseFloat(paddingTop) - parseFloat(paddingBottom);
		},
		top: (_bbox, { top }) => parseFloat(top),
		left: (_bbox, { left }) => parseFloat(left),
		bottom: ({ y }, { top }) => parseFloat(top) + (y.max - y.min),
		right: ({ x }, { left }) => parseFloat(left) + (x.max - x.min),
		x: (_bbox, { transform }) => parseValueFromTransform(transform, "x"),
		y: (_bbox, { transform }) => parseValueFromTransform(transform, "y")
	};
	positionalValues.translateX = positionalValues.x;
	positionalValues.translateY = positionalValues.y;
	var toResolve = new Set();
	var isScheduled = false;
	var anyNeedsMeasurement = false;
	var isForced = false;
	function measureAllKeyframes() {
		if (anyNeedsMeasurement) {
			const resolversToMeasure = Array.from(toResolve).filter((resolver) => resolver.needsMeasurement);
			const elementsToMeasure = new Set(resolversToMeasure.map((resolver) => resolver.element));
			const transformsToRestore = new Map();
			elementsToMeasure.forEach((element) => {
				const removedTransforms = removeNonTranslationalTransform(element);
				if (!removedTransforms.length) return;
				transformsToRestore.set(element, removedTransforms);
				element.render();
			});
			resolversToMeasure.forEach((resolver) => resolver.measureInitialState());
			elementsToMeasure.forEach((element) => {
				element.render();
				const restore = transformsToRestore.get(element);
				if (restore) restore.forEach(([key, value]) => {
					element.getValue(key)?.set(value);
				});
			});
			resolversToMeasure.forEach((resolver) => resolver.measureEndState());
			resolversToMeasure.forEach((resolver) => {
				if (resolver.suspendedScrollY !== void 0) window.scrollTo(0, resolver.suspendedScrollY);
			});
		}
		anyNeedsMeasurement = false;
		isScheduled = false;
		toResolve.forEach((resolver) => resolver.complete(isForced));
		toResolve.clear();
	}
	function readAllKeyframes() {
		toResolve.forEach((resolver) => {
			resolver.readKeyframes();
			if (resolver.needsMeasurement) anyNeedsMeasurement = true;
		});
	}
	function flushKeyframeResolvers() {
		isForced = true;
		readAllKeyframes();
		measureAllKeyframes();
		isForced = false;
	}
	var KeyframeResolver = class {
		constructor(unresolvedKeyframes, onComplete, name, motionValue, element, isAsync = false) {
			this.state = "pending";
			this.isAsync = false;
			this.needsMeasurement = false;
			this.unresolvedKeyframes = [...unresolvedKeyframes];
			this.onComplete = onComplete;
			this.name = name;
			this.motionValue = motionValue;
			this.element = element;
			this.isAsync = isAsync;
		}
		scheduleResolve() {
			this.state = "scheduled";
			if (this.isAsync) {
				toResolve.add(this);
				if (!isScheduled) {
					isScheduled = true;
					frame.read(readAllKeyframes);
					frame.resolveKeyframes(measureAllKeyframes);
				}
			} else {
				this.readKeyframes();
				this.complete();
			}
		}
		readKeyframes() {
			const { unresolvedKeyframes, name, element, motionValue } = this;
			if (unresolvedKeyframes[0] === null) {
				const currentValue = motionValue?.get();
				const finalKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
				if (currentValue !== void 0) unresolvedKeyframes[0] = currentValue;
				else if (element && name) {
					const valueAsRead = element.readValue(name, finalKeyframe);
					if (valueAsRead !== void 0 && valueAsRead !== null) unresolvedKeyframes[0] = valueAsRead;
				}
				if (unresolvedKeyframes[0] === void 0) unresolvedKeyframes[0] = finalKeyframe;
				if (motionValue && currentValue === void 0) motionValue.set(unresolvedKeyframes[0]);
			}
			fillWildcards(unresolvedKeyframes);
		}
		setFinalKeyframe() {}
		measureInitialState() {}
		renderEndStyles() {}
		measureEndState() {}
		complete(isForcedComplete = false) {
			this.state = "complete";
			this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, isForcedComplete);
			toResolve.delete(this);
		}
		cancel() {
			if (this.state === "scheduled") {
				toResolve.delete(this);
				this.state = "pending";
			}
		}
		resume() {
			if (this.state === "pending") this.scheduleResolve();
		}
	};
	var isCSSVar = (name) => name.startsWith("--");
	function setStyle(element, name, value) {
		isCSSVar(name) ? element.style.setProperty(name, value) : element.style[name] = value;
	}
	var supportsFlags = {};
	function memoSupports(callback, supportsFlag) {
		const memoized = memo(callback);
		return () => supportsFlags[supportsFlag] ?? memoized();
	}
	var supportsScrollTimeline = memoSupports(() => window.ScrollTimeline !== void 0, "scrollTimeline");
	var supportsLinearEasing = memoSupports(() => {
		try {
			document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
		} catch (e) {
			return false;
		}
		return true;
	}, "linearEasing");
	var cubicBezierAsString = ([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
	var supportedWaapiEasing = {
		linear: "linear",
		ease: "ease",
		easeIn: "ease-in",
		easeOut: "ease-out",
		easeInOut: "ease-in-out",
		circIn: cubicBezierAsString([
			0,
			.65,
			.55,
			1
		]),
		circOut: cubicBezierAsString([
			.55,
			0,
			1,
			.45
		]),
		backIn: cubicBezierAsString([
			.31,
			.01,
			.66,
			-.59
		]),
		backOut: cubicBezierAsString([
			.33,
			1.53,
			.69,
			.99
		])
	};
	function mapEasingToNativeEasing(easing, duration) {
		if (!easing) return;
		else if (typeof easing === "function") return supportsLinearEasing() ? generateLinearEasing(easing, duration) : "ease-out";
		else if (isBezierDefinition(easing)) return cubicBezierAsString(easing);
		else if (Array.isArray(easing)) return easing.map((segmentEasing) => mapEasingToNativeEasing(segmentEasing, duration) || supportedWaapiEasing.easeOut);
		else return supportedWaapiEasing[easing];
	}
	function startWaapiAnimation(element, valueName, keyframes, { delay = 0, duration = 300, repeat = 0, repeatType = "loop", ease = "easeOut", times } = {}, pseudoElement = void 0) {
		const keyframeOptions = { [valueName]: keyframes };
		if (times) keyframeOptions.offset = times;
		const easing = mapEasingToNativeEasing(ease, duration);
		if (Array.isArray(easing)) keyframeOptions.easing = easing;
		const options = {
			delay,
			duration,
			easing: !Array.isArray(easing) ? easing : "linear",
			fill: "both",
			iterations: repeat + 1,
			direction: repeatType === "reverse" ? "alternate" : "normal"
		};
		if (pseudoElement) options.pseudoElement = pseudoElement;
		return element.animate(keyframeOptions, options);
	}
	function isGenerator(type) {
		return typeof type === "function" && "applyToOptions" in type;
	}
	function applyGeneratorOptions({ type, ...options }) {
		if (isGenerator(type) && supportsLinearEasing()) return type.applyToOptions(options);
		else {
			options.duration ?? (options.duration = 300);
			options.ease ?? (options.ease = "easeOut");
		}
		return options;
	}
	var NativeAnimation = class extends WithPromise {
		constructor(options) {
			super();
			this.finishedTime = null;
			this.isStopped = false;
			this.manualStartTime = null;
			if (!options) return;
			const { element, name, keyframes, pseudoElement, allowFlatten = false, finalKeyframe, onComplete } = options;
			this.isPseudoElement = Boolean(pseudoElement);
			this.allowFlatten = allowFlatten;
			this.options = options;
			options.type;
			const transition = applyGeneratorOptions(options);
			this.animation = startWaapiAnimation(element, name, keyframes, transition, pseudoElement);
			if (transition.autoplay === false) this.animation.pause();
			this.animation.onfinish = () => {
				this.finishedTime = this.time;
				if (!pseudoElement) {
					const keyframe = getFinalKeyframe(keyframes, this.options, finalKeyframe, this.speed);
					if (this.updateMotionValue) this.updateMotionValue(keyframe);
					setStyle(element, name, keyframe);
					this.animation.cancel();
				}
				onComplete?.();
				this.notifyFinished();
			};
		}
		play() {
			if (this.isStopped) return;
			this.manualStartTime = null;
			this.animation.play();
			if (this.state === "finished") this.updateFinished();
		}
		pause() {
			this.animation.pause();
		}
		complete() {
			this.animation.finish?.();
		}
		cancel() {
			try {
				this.animation.cancel();
			} catch (e) {}
		}
		stop() {
			if (this.isStopped) return;
			this.isStopped = true;
			const { state } = this;
			if (state === "idle" || state === "finished") return;
			if (this.updateMotionValue) this.updateMotionValue();
			else this.commitStyles();
			if (!this.isPseudoElement) this.cancel();
		}
		commitStyles() {
			const element = this.options?.element;
			if (!this.isPseudoElement && element?.isConnected) this.animation.commitStyles?.();
		}
		get duration() {
			const duration = this.animation.effect?.getComputedTiming?.().duration || 0;
			return millisecondsToSeconds(Number(duration));
		}
		get iterationDuration() {
			const { delay = 0 } = this.options || {};
			return this.duration + millisecondsToSeconds(delay);
		}
		get time() {
			return millisecondsToSeconds(Number(this.animation.currentTime) || 0);
		}
		set time(newTime) {
			const wasFinished = this.finishedTime !== null;
			this.manualStartTime = null;
			this.finishedTime = null;
			this.animation.currentTime = secondsToMilliseconds(newTime);
			if (wasFinished) this.animation.pause();
		}
		get speed() {
			return this.animation.playbackRate;
		}
		set speed(newSpeed) {
			if (newSpeed < 0) this.finishedTime = null;
			this.animation.playbackRate = newSpeed;
		}
		get state() {
			return this.finishedTime !== null ? "finished" : this.animation.playState;
		}
		get startTime() {
			return this.manualStartTime ?? Number(this.animation.startTime);
		}
		set startTime(newStartTime) {
			this.manualStartTime = this.animation.startTime = newStartTime;
		}
		attachTimeline({ timeline, rangeStart, rangeEnd, observe }) {
			if (this.allowFlatten) this.animation.effect?.updateTiming({ easing: "linear" });
			this.animation.onfinish = null;
			if (timeline && supportsScrollTimeline()) {
				this.animation.timeline = timeline;
				if (rangeStart) this.animation.rangeStart = rangeStart;
				if (rangeEnd) this.animation.rangeEnd = rangeEnd;
				return noop$3;
			} else return observe(this);
		}
	};
	var unsupportedEasingFunctions = {
		anticipate,
		backInOut,
		circInOut
	};
	function isUnsupportedEase(key) {
		return key in unsupportedEasingFunctions;
	}
	function replaceStringEasing(transition) {
		if (typeof transition.ease === "string" && isUnsupportedEase(transition.ease)) transition.ease = unsupportedEasingFunctions[transition.ease];
	}
	var sampleDelta = 10;
	var NativeAnimationExtended = class extends NativeAnimation {
		constructor(options) {
			replaceStringEasing(options);
			replaceTransitionType(options);
			super(options);
			if (options.startTime !== void 0 && options.autoplay !== false) this.startTime = options.startTime;
			this.options = options;
		}
		updateMotionValue(value) {
			const { motionValue, onUpdate, onComplete, element, ...options } = this.options;
			if (!motionValue) return;
			if (value !== void 0) {
				motionValue.set(value);
				return;
			}
			const sampleAnimation = new JSAnimation({
				...options,
				autoplay: false
			});
			const sampleTime = Math.max(sampleDelta, time.now() - this.startTime);
			const delta = clamp(0, sampleDelta, sampleTime - sampleDelta);
			const current = sampleAnimation.sample(sampleTime).value;
			const { name } = this.options;
			if (element && name) setStyle(element, name, current);
			motionValue.setWithVelocity(sampleAnimation.sample(Math.max(0, sampleTime - delta)).value, current, delta);
			sampleAnimation.stop();
		}
	};
	var isAnimatable = (value, name) => {
		if (name === "zIndex") return false;
		if (typeof value === "number" || Array.isArray(value)) return true;
		if (typeof value === "string" && (complex.test(value) || value === "0") && !value.startsWith("url(")) return true;
		return false;
	};
	function hasKeyframesChanged(keyframes) {
		const current = keyframes[0];
		if (keyframes.length === 1) return true;
		for (let i = 0; i < keyframes.length; i++) if (keyframes[i] !== current) return true;
	}
	function canAnimate(keyframes, name, type, velocity) {
		const originKeyframe = keyframes[0];
		if (originKeyframe === null) return false;
		if (name === "display" || name === "visibility") return true;
		const targetKeyframe = keyframes[keyframes.length - 1];
		const isOriginAnimatable = isAnimatable(originKeyframe, name);
		const isTargetAnimatable = isAnimatable(targetKeyframe, name);
		`${name}${originKeyframe}${targetKeyframe}${isOriginAnimatable ? targetKeyframe : originKeyframe}`;
		if (!isOriginAnimatable || !isTargetAnimatable) return false;
		return hasKeyframesChanged(keyframes) || (type === "spring" || isGenerator(type)) && velocity;
	}
	function makeAnimationInstant(options) {
		options.duration = 0;
		options.type = "keyframes";
	}
	var acceleratedValues = new Set([
		"opacity",
		"clipPath",
		"filter",
		"transform"
	]);
	var browserColorFunctions = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
	function hasBrowserOnlyColors(keyframes) {
		for (let i = 0; i < keyframes.length; i++) if (typeof keyframes[i] === "string" && browserColorFunctions.test(keyframes[i])) return true;
		return false;
	}
	var colorProperties = new Set([
		"color",
		"backgroundColor",
		"outlineColor",
		"fill",
		"stroke",
		"borderColor",
		"borderTopColor",
		"borderRightColor",
		"borderBottomColor",
		"borderLeftColor"
	]);
	var supportsWaapi = memo(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
	function supportsBrowserAnimation(options) {
		const { motionValue, name, repeatDelay, repeatType, damping, type, keyframes } = options;
		if (!(motionValue?.owner?.current instanceof HTMLElement)) return false;
		const { onUpdate, transformTemplate } = motionValue.owner.getProps();
		return supportsWaapi() && name && (acceleratedValues.has(name) || colorProperties.has(name) && hasBrowserOnlyColors(keyframes)) && (name !== "transform" || !transformTemplate) && !onUpdate && !repeatDelay && repeatType !== "mirror" && damping !== 0 && type !== "inertia";
	}
	var MAX_RESOLVE_DELAY = 40;
	var AsyncMotionValueAnimation = class extends WithPromise {
		constructor({ autoplay = true, delay = 0, type = "keyframes", repeat = 0, repeatDelay = 0, repeatType = "loop", keyframes, name, motionValue, element, ...options }) {
			super();
			this.stop = () => {
				if (this._animation) {
					this._animation.stop();
					this.stopTimeline?.();
				}
				this.keyframeResolver?.cancel();
			};
			this.createdAt = time.now();
			const optionsWithDefaults = {
				autoplay,
				delay,
				type,
				repeat,
				repeatDelay,
				repeatType,
				name,
				motionValue,
				element,
				...options
			};
			const KeyframeResolver$1 = element?.KeyframeResolver || KeyframeResolver;
			this.keyframeResolver = new KeyframeResolver$1(keyframes, (resolvedKeyframes, finalKeyframe, forced) => this.onKeyframesResolved(resolvedKeyframes, finalKeyframe, optionsWithDefaults, !forced), name, motionValue, element);
			this.keyframeResolver?.scheduleResolve();
		}
		onKeyframesResolved(keyframes, finalKeyframe, options, sync) {
			this.keyframeResolver = void 0;
			const { name, type, velocity, delay, isHandoff, onUpdate } = options;
			this.resolvedAt = time.now();
			let canAnimateValue = true;
			if (!canAnimate(keyframes, name, type, velocity)) {
				canAnimateValue = false;
				if (MotionGlobalConfig.instantAnimations || !delay) onUpdate?.(getFinalKeyframe(keyframes, options, finalKeyframe));
				keyframes[0] = keyframes[keyframes.length - 1];
				makeAnimationInstant(options);
				options.repeat = 0;
			}
			const resolvedOptions = {
				startTime: sync ? !this.resolvedAt ? this.createdAt : this.resolvedAt - this.createdAt > MAX_RESOLVE_DELAY ? this.resolvedAt : this.createdAt : void 0,
				finalKeyframe,
				...options,
				keyframes
			};
			const useWaapi = canAnimateValue && !isHandoff && supportsBrowserAnimation(resolvedOptions);
			const element = resolvedOptions.motionValue?.owner?.current;
			let animation;
			if (useWaapi) try {
				animation = new NativeAnimationExtended({
					...resolvedOptions,
					element
				});
			} catch {
				animation = new JSAnimation(resolvedOptions);
			}
			else animation = new JSAnimation(resolvedOptions);
			animation.finished.then(() => {
				this.notifyFinished();
			}).catch(noop$3);
			if (this.pendingTimeline) {
				this.stopTimeline = animation.attachTimeline(this.pendingTimeline);
				this.pendingTimeline = void 0;
			}
			this._animation = animation;
		}
		get finished() {
			if (!this._animation) return this._finished;
			else return this.animation.finished;
		}
		then(onResolve, _onReject) {
			return this.finished.finally(onResolve).then(() => {});
		}
		get animation() {
			if (!this._animation) {
				this.keyframeResolver?.resume();
				flushKeyframeResolvers();
			}
			return this._animation;
		}
		get duration() {
			return this.animation.duration;
		}
		get iterationDuration() {
			return this.animation.iterationDuration;
		}
		get time() {
			return this.animation.time;
		}
		set time(newTime) {
			this.animation.time = newTime;
		}
		get speed() {
			return this.animation.speed;
		}
		get state() {
			return this.animation.state;
		}
		set speed(newSpeed) {
			this.animation.speed = newSpeed;
		}
		get startTime() {
			return this.animation.startTime;
		}
		attachTimeline(timeline) {
			if (this._animation) this.stopTimeline = this.animation.attachTimeline(timeline);
			else this.pendingTimeline = timeline;
			return () => this.stop();
		}
		play() {
			this.animation.play();
		}
		pause() {
			this.animation.pause();
		}
		complete() {
			this.animation.complete();
		}
		cancel() {
			if (this._animation) this.animation.cancel();
			this.keyframeResolver?.cancel();
		}
	};
	var GroupAnimation = class {
		constructor(animations) {
			this.stop = () => this.runAll("stop");
			this.animations = animations.filter(Boolean);
		}
		get finished() {
			return Promise.all(this.animations.map((animation) => animation.finished));
		}
		getAll(propName) {
			return this.animations[0][propName];
		}
		setAll(propName, newValue) {
			for (let i = 0; i < this.animations.length; i++) this.animations[i][propName] = newValue;
		}
		attachTimeline(timeline) {
			const subscriptions = this.animations.map((animation) => animation.attachTimeline(timeline));
			return () => {
				subscriptions.forEach((cancel, i) => {
					cancel && cancel();
					this.animations[i].stop();
				});
			};
		}
		get time() {
			return this.getAll("time");
		}
		set time(time) {
			this.setAll("time", time);
		}
		get speed() {
			return this.getAll("speed");
		}
		set speed(speed) {
			this.setAll("speed", speed);
		}
		get state() {
			return this.getAll("state");
		}
		get startTime() {
			return this.getAll("startTime");
		}
		get duration() {
			return getMax(this.animations, "duration");
		}
		get iterationDuration() {
			return getMax(this.animations, "iterationDuration");
		}
		runAll(methodName) {
			this.animations.forEach((controls) => controls[methodName]());
		}
		play() {
			this.runAll("play");
		}
		pause() {
			this.runAll("pause");
		}
		cancel() {
			this.runAll("cancel");
		}
		complete() {
			this.runAll("complete");
		}
	};
	function getMax(animations, propName) {
		let max = 0;
		for (let i = 0; i < animations.length; i++) {
			const value = animations[i][propName];
			if (value !== null && value > max) max = value;
		}
		return max;
	}
	var GroupAnimationWithThen = class extends GroupAnimation {
		then(onResolve, _onReject) {
			return this.finished.finally(onResolve).then(() => {});
		}
	};
	var MAX_VELOCITY_DELTA = 30;
	var isFloat = (value) => {
		return !isNaN(parseFloat(value));
	};
	var collectMotionValues = { current: void 0 };
	var MotionValue = class {
		constructor(init, options = {}) {
			this.canTrackVelocity = null;
			this.events = {};
			this.updateAndNotify = (v) => {
				const currentTime = time.now();
				if (this.updatedAt !== currentTime) this.setPrevFrameValue();
				this.prev = this.current;
				this.setCurrent(v);
				if (this.current !== this.prev) {
					this.events.change?.notify(this.current);
					if (this.dependents) for (const dependent of this.dependents) dependent.dirty();
				}
			};
			this.hasAnimated = false;
			this.setCurrent(init);
			this.owner = options.owner;
		}
		setCurrent(current) {
			this.current = current;
			this.updatedAt = time.now();
			if (this.canTrackVelocity === null && current !== void 0) this.canTrackVelocity = isFloat(this.current);
		}
		setPrevFrameValue(prevFrameValue = this.current) {
			this.prevFrameValue = prevFrameValue;
			this.prevUpdatedAt = this.updatedAt;
		}
		onChange(subscription) {
			return this.on("change", subscription);
		}
		on(eventName, callback) {
			if (!this.events[eventName]) this.events[eventName] = new SubscriptionManager();
			const unsubscribe = this.events[eventName].add(callback);
			if (eventName === "change") return () => {
				unsubscribe();
				frame.read(() => {
					if (!this.events.change.getSize()) this.stop();
				});
			};
			return unsubscribe;
		}
		clearListeners() {
			for (const eventManagers in this.events) this.events[eventManagers].clear();
		}
		attach(passiveEffect, stopPassiveEffect) {
			this.passiveEffect = passiveEffect;
			this.stopPassiveEffect = stopPassiveEffect;
		}
		set(v) {
			if (!this.passiveEffect) this.updateAndNotify(v);
			else this.passiveEffect(v, this.updateAndNotify);
		}
		setWithVelocity(prev, current, delta) {
			this.set(current);
			this.prev = void 0;
			this.prevFrameValue = prev;
			this.prevUpdatedAt = this.updatedAt - delta;
		}
		jump(v, endAnimation = true) {
			this.updateAndNotify(v);
			this.prev = v;
			this.prevUpdatedAt = this.prevFrameValue = void 0;
			endAnimation && this.stop();
			if (this.stopPassiveEffect) this.stopPassiveEffect();
		}
		dirty() {
			this.events.change?.notify(this.current);
		}
		addDependent(dependent) {
			if (!this.dependents) this.dependents = new Set();
			this.dependents.add(dependent);
		}
		removeDependent(dependent) {
			if (this.dependents) this.dependents.delete(dependent);
		}
		get() {
			if (collectMotionValues.current) collectMotionValues.current.push(this);
			return this.current;
		}
		getPrevious() {
			return this.prev;
		}
		getVelocity() {
			const currentTime = time.now();
			if (!this.canTrackVelocity || this.prevFrameValue === void 0 || currentTime - this.updatedAt > MAX_VELOCITY_DELTA) return 0;
			const delta = Math.min(this.updatedAt - this.prevUpdatedAt, MAX_VELOCITY_DELTA);
			return velocityPerSecond(parseFloat(this.current) - parseFloat(this.prevFrameValue), delta);
		}
		start(startAnimation) {
			this.stop();
			return new Promise((resolve) => {
				this.hasAnimated = true;
				this.animation = startAnimation(resolve);
				if (this.events.animationStart) this.events.animationStart.notify();
			}).then(() => {
				if (this.events.animationComplete) this.events.animationComplete.notify();
				this.clearAnimation();
			});
		}
		stop() {
			if (this.animation) {
				this.animation.stop();
				if (this.events.animationCancel) this.events.animationCancel.notify();
			}
			this.clearAnimation();
		}
		isAnimating() {
			return !!this.animation;
		}
		clearAnimation() {
			delete this.animation;
		}
		destroy() {
			this.dependents?.clear();
			this.events.destroy?.notify();
			this.clearListeners();
			this.stop();
			if (this.stopPassiveEffect) this.stopPassiveEffect();
		}
	};
	function motionValue(init, options) {
		return new MotionValue(init, options);
	}
	function resolveTransition(transition, parentTransition) {
		if (transition?.inherit && parentTransition) {
			const { inherit: _, ...rest } = transition;
			return {
				...parentTransition,
				...rest
			};
		}
		return transition;
	}
	function getValueTransition$1(transition, key) {
		const valueTransition = transition?.[key] ?? transition?.["default"] ?? transition;
		if (valueTransition !== transition) return resolveTransition(valueTransition, transition);
		return valueTransition;
	}
	var underDampedSpring = {
		type: "spring",
		stiffness: 500,
		damping: 25,
		restSpeed: 10
	};
	var criticallyDampedSpring = (target) => ({
		type: "spring",
		stiffness: 550,
		damping: target === 0 ? 2 * Math.sqrt(550) : 30,
		restSpeed: 10
	});
	var keyframesTransition = {
		type: "keyframes",
		duration: .8
	};
	var ease = {
		type: "keyframes",
		ease: [
			.25,
			.1,
			.35,
			1
		],
		duration: .3
	};
	var getDefaultTransition = (valueKey, { keyframes }) => {
		if (keyframes.length > 2) return keyframesTransition;
		else if (transformProps.has(valueKey)) return valueKey.startsWith("scale") ? criticallyDampedSpring(keyframes[1]) : underDampedSpring;
		return ease;
	};
	var orchestrationKeys = new Set([
		"when",
		"delay",
		"delayChildren",
		"staggerChildren",
		"staggerDirection",
		"repeat",
		"repeatType",
		"repeatDelay",
		"from",
		"elapsed"
	]);
	function isTransitionDefined(transition) {
		for (const key in transition) if (!orchestrationKeys.has(key)) return true;
		return false;
	}
	var animateMotionValue = (name, value, target, transition = {}, element, isHandoff) => (onComplete) => {
		const valueTransition = getValueTransition$1(transition, name) || {};
		const delay = valueTransition.delay || transition.delay || 0;
		let { elapsed = 0 } = transition;
		elapsed = elapsed - secondsToMilliseconds(delay);
		const options = {
			keyframes: Array.isArray(target) ? target : [null, target],
			ease: "easeOut",
			velocity: value.getVelocity(),
			...valueTransition,
			delay: -elapsed,
			onUpdate: (v) => {
				value.set(v);
				valueTransition.onUpdate && valueTransition.onUpdate(v);
			},
			onComplete: () => {
				onComplete();
				valueTransition.onComplete && valueTransition.onComplete();
			},
			name,
			motionValue: value,
			element: isHandoff ? void 0 : element
		};
		if (!isTransitionDefined(valueTransition)) Object.assign(options, getDefaultTransition(name, options));
		options.duration && (options.duration = secondsToMilliseconds(options.duration));
		options.repeatDelay && (options.repeatDelay = secondsToMilliseconds(options.repeatDelay));
		if (options.from !== void 0) options.keyframes[0] = options.from;
		let shouldSkip = false;
		if (options.type === false || options.duration === 0 && !options.repeatDelay) {
			makeAnimationInstant(options);
			if (options.delay === 0) shouldSkip = true;
		}
		if (MotionGlobalConfig.instantAnimations || MotionGlobalConfig.skipAnimations || element?.shouldSkipAnimations || valueTransition.skipAnimations) {
			shouldSkip = true;
			makeAnimationInstant(options);
			options.delay = 0;
		}
		options.allowFlatten = !valueTransition.type && !valueTransition.ease;
		if (shouldSkip && !isHandoff && value.get() !== void 0) {
			const finalKeyframe = getFinalKeyframe(options.keyframes, valueTransition);
			if (finalKeyframe !== void 0) {
				frame.update(() => {
					options.onUpdate(finalKeyframe);
					options.onComplete();
				});
				return;
			}
		}
		return valueTransition.isSync ? new JSAnimation(options) : new AsyncMotionValueAnimation(options);
	};
	var splitCSSVariableRegex = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
	function parseCSSVariable(current) {
		const match = splitCSSVariableRegex.exec(current);
		if (!match) return [,];
		const [, token1, token2, fallback] = match;
		return [`--${token1 ?? token2}`, fallback];
	}
	function getVariableValue(current, element, depth = 1) {
		`${current}`;
		const [token, fallback] = parseCSSVariable(current);
		if (!token) return;
		const resolved = window.getComputedStyle(element).getPropertyValue(token);
		if (resolved) {
			const trimmed = resolved.trim();
			return isNumericalString(trimmed) ? parseFloat(trimmed) : trimmed;
		}
		return isCSSVariableToken(fallback) ? getVariableValue(fallback, element, depth + 1) : fallback;
	}
	function getValueState(visualElement) {
		const state = [{}, {}];
		visualElement?.values.forEach((value, key) => {
			state[0][key] = value.get();
			state[1][key] = value.getVelocity();
		});
		return state;
	}
	function resolveVariantFromProps(props, definition, custom, visualElement) {
		if (typeof definition === "function") {
			const [current, velocity] = getValueState(visualElement);
			definition = definition(custom !== void 0 ? custom : props.custom, current, velocity);
		}
		if (typeof definition === "string") definition = props.variants && props.variants[definition];
		if (typeof definition === "function") {
			const [current, velocity] = getValueState(visualElement);
			definition = definition(custom !== void 0 ? custom : props.custom, current, velocity);
		}
		return definition;
	}
	function resolveVariant(visualElement, definition, custom) {
		const props = visualElement.getProps();
		return resolveVariantFromProps(props, definition, custom !== void 0 ? custom : props.custom, visualElement);
	}
	var positionalKeys = new Set([
		"width",
		"height",
		"top",
		"left",
		"right",
		"bottom",
		...transformPropOrder
	]);
	var isKeyframesTarget = (v) => {
		return Array.isArray(v);
	};
	function setMotionValue(visualElement, key, value) {
		if (visualElement.hasValue(key)) visualElement.getValue(key).set(value);
		else visualElement.addValue(key, motionValue(value));
	}
	function resolveFinalValueInKeyframes(v) {
		return isKeyframesTarget(v) ? v[v.length - 1] || 0 : v;
	}
	function setTarget(visualElement, definition) {
		let { transitionEnd = {}, transition = {}, ...target } = resolveVariant(visualElement, definition) || {};
		target = {
			...target,
			...transitionEnd
		};
		for (const key in target) setMotionValue(visualElement, key, resolveFinalValueInKeyframes(target[key]));
	}
	var isMotionValue = (value) => Boolean(value && value.getVelocity);
	function isWillChangeMotionValue(value) {
		return Boolean(isMotionValue(value) && value.add);
	}
	function addValueToWillChange(visualElement, key) {
		const willChange = visualElement.getValue("willChange");
		if (isWillChangeMotionValue(willChange)) return willChange.add(key);
		else if (!willChange && MotionGlobalConfig.WillChange) {
			const newWillChange = new MotionGlobalConfig.WillChange("auto");
			visualElement.addValue("willChange", newWillChange);
			newWillChange.add(key);
		}
	}
	function camelToDash(str) {
		return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
	}
	var optimizedAppearDataAttribute = "data-" + camelToDash("framerAppearId");
	function getOptimisedAppearId(visualElement) {
		return visualElement.props[optimizedAppearDataAttribute];
	}
	function shouldBlockAnimation({ protectedKeys, needsAnimating }, key) {
		const shouldBlock = protectedKeys.hasOwnProperty(key) && needsAnimating[key] !== true;
		needsAnimating[key] = false;
		return shouldBlock;
	}
	function animateTarget(visualElement, targetAndTransition, { delay = 0, transitionOverride, type } = {}) {
		let { transition, transitionEnd, ...target } = targetAndTransition;
		const defaultTransition = visualElement.getDefaultTransition();
		transition = transition ? resolveTransition(transition, defaultTransition) : defaultTransition;
		const reduceMotion = transition?.reduceMotion;
		const skipAnimations = transition?.skipAnimations;
		if (transitionOverride) transition = transitionOverride;
		const animations = [];
		const animationTypeState = type && visualElement.animationState && visualElement.animationState.getState()[type];
		const path = transition?.path;
		if (path) path.animateVisualElement(visualElement, target, transition, delay, animations);
		for (const key in target) {
			const value = visualElement.getValue(key, visualElement.latestValues[key] ?? null);
			const valueTarget = target[key];
			if (valueTarget === void 0 || animationTypeState && shouldBlockAnimation(animationTypeState, key)) continue;
			const valueTransition = {
				delay,
				...getValueTransition$1(transition || {}, key)
			};
			if (skipAnimations) valueTransition.skipAnimations = true;
			const currentValue = value.get();
			if (currentValue !== void 0 && !value.isAnimating() && !Array.isArray(valueTarget) && valueTarget === currentValue && !valueTransition.velocity) {
				frame.update(() => value.set(valueTarget));
				continue;
			}
			let isHandoff = false;
			if (window.MotionHandoffAnimation) {
				const appearId = getOptimisedAppearId(visualElement);
				if (appearId) {
					const startTime = window.MotionHandoffAnimation(appearId, key, frame);
					if (startTime !== null) {
						valueTransition.startTime = startTime;
						isHandoff = true;
					}
				}
			}
			addValueToWillChange(visualElement, key);
			const shouldReduceMotion = reduceMotion ?? visualElement.shouldReduceMotion;
			value.start(animateMotionValue(key, value, valueTarget, shouldReduceMotion && positionalKeys.has(key) ? { type: false } : valueTransition, visualElement, isHandoff));
			const animation = value.animation;
			if (animation) animations.push(animation);
		}
		if (transitionEnd) {
			const applyTransitionEnd = () => frame.update(() => {
				transitionEnd && setTarget(visualElement, transitionEnd);
			});
			if (animations.length) Promise.all(animations).then(applyTransitionEnd);
			else applyTransitionEnd();
		}
		return animations;
	}
	var auto = {
		test: (v) => v === "auto",
		parse: (v) => v
	};
	var testValueType = (v) => (type) => type.test(v);
	var dimensionValueTypes = [
		number,
		px,
		percent,
		degrees,
		vw,
		vh,
		auto
	];
	var findDimensionValueType = (v) => dimensionValueTypes.find(testValueType(v));
	function isNone(value) {
		if (typeof value === "number") return value === 0;
		else if (value !== null) return value === "none" || value === "0" || isZeroValueString(value);
		else return true;
	}
	var maxDefaults = new Set([
		"brightness",
		"contrast",
		"saturate",
		"opacity"
	]);
	function applyDefaultFilter(v) {
		const [name, value] = v.slice(0, -1).split("(");
		if (name === "drop-shadow") return v;
		const [number] = value.match(floatRegex) || [];
		if (!number) return v;
		const unit = value.replace(number, "");
		let defaultValue = maxDefaults.has(name) ? 1 : 0;
		if (number !== value) defaultValue *= 100;
		return name + "(" + defaultValue + unit + ")";
	}
	var functionRegex = /\b([a-z-]*)\(.*?\)/gu;
	var filter = {
		...complex,
		getAnimatableNone: (v) => {
			const functions = v.match(functionRegex);
			return functions ? functions.map(applyDefaultFilter).join(" ") : v;
		}
	};
	var mask = {
		...complex,
		getAnimatableNone: (v) => {
			const parsed = complex.parse(v);
			return complex.createTransformer(v)(parsed.map((v) => typeof v === "number" ? 0 : typeof v === "object" ? {
				...v,
				alpha: 1
			} : v));
		}
	};
	var int = {
		...number,
		transform: Math.round
	};
	var numberValueTypes = {
		borderWidth: px,
		borderTopWidth: px,
		borderRightWidth: px,
		borderBottomWidth: px,
		borderLeftWidth: px,
		borderRadius: px,
		borderTopLeftRadius: px,
		borderTopRightRadius: px,
		borderBottomRightRadius: px,
		borderBottomLeftRadius: px,
		width: px,
		maxWidth: px,
		height: px,
		maxHeight: px,
		top: px,
		right: px,
		bottom: px,
		left: px,
		inset: px,
		insetBlock: px,
		insetBlockStart: px,
		insetBlockEnd: px,
		insetInline: px,
		insetInlineStart: px,
		insetInlineEnd: px,
		padding: px,
		paddingTop: px,
		paddingRight: px,
		paddingBottom: px,
		paddingLeft: px,
		paddingBlock: px,
		paddingBlockStart: px,
		paddingBlockEnd: px,
		paddingInline: px,
		paddingInlineStart: px,
		paddingInlineEnd: px,
		margin: px,
		marginTop: px,
		marginRight: px,
		marginBottom: px,
		marginLeft: px,
		marginBlock: px,
		marginBlockStart: px,
		marginBlockEnd: px,
		marginInline: px,
		marginInlineStart: px,
		marginInlineEnd: px,
		fontSize: px,
		backgroundPositionX: px,
		backgroundPositionY: px,
		rotate: degrees,
		pathRotation: degrees,
		rotateX: degrees,
		rotateY: degrees,
		rotateZ: degrees,
		scale,
		scaleX: scale,
		scaleY: scale,
		scaleZ: scale,
		skew: degrees,
		skewX: degrees,
		skewY: degrees,
		distance: px,
		translateX: px,
		translateY: px,
		translateZ: px,
		x: px,
		y: px,
		z: px,
		perspective: px,
		transformPerspective: px,
		opacity: alpha,
		originX: progressPercentage,
		originY: progressPercentage,
		originZ: px,
		zIndex: int,
		fillOpacity: alpha,
		strokeOpacity: alpha,
		numOctaves: int
	};
	var defaultValueTypes = {
		...numberValueTypes,
		color,
		backgroundColor: color,
		outlineColor: color,
		fill: color,
		stroke: color,
		borderColor: color,
		borderTopColor: color,
		borderRightColor: color,
		borderBottomColor: color,
		borderLeftColor: color,
		filter,
		WebkitFilter: filter,
		mask,
		WebkitMask: mask
	};
	var getDefaultValueType = (key) => defaultValueTypes[key];
	var customTypes = new Set([filter, mask]);
	function getAnimatableNone(key, value) {
		let defaultValueType = getDefaultValueType(key);
		if (!customTypes.has(defaultValueType)) defaultValueType = complex;
		return defaultValueType.getAnimatableNone ? defaultValueType.getAnimatableNone(value) : void 0;
	}
	var invalidTemplates = new Set([
		"auto",
		"none",
		"0"
	]);
	function makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name) {
		let i = 0;
		let animatableTemplate = void 0;
		while (i < unresolvedKeyframes.length && !animatableTemplate) {
			const keyframe = unresolvedKeyframes[i];
			if (typeof keyframe === "string" && !invalidTemplates.has(keyframe) && analyseComplexValue(keyframe).values.length) animatableTemplate = unresolvedKeyframes[i];
			i++;
		}
		if (animatableTemplate && name) for (const noneIndex of noneKeyframeIndexes) unresolvedKeyframes[noneIndex] = getAnimatableNone(name, animatableTemplate);
	}
	var DOMKeyframesResolver = class extends KeyframeResolver {
		constructor(unresolvedKeyframes, onComplete, name, motionValue, element) {
			super(unresolvedKeyframes, onComplete, name, motionValue, element, true);
		}
		readKeyframes() {
			const { unresolvedKeyframes, element, name } = this;
			if (!element || !element.current) return;
			super.readKeyframes();
			for (let i = 0; i < unresolvedKeyframes.length; i++) {
				let keyframe = unresolvedKeyframes[i];
				if (typeof keyframe === "string") {
					keyframe = keyframe.trim();
					if (isCSSVariableToken(keyframe)) {
						const resolved = getVariableValue(keyframe, element.current);
						if (resolved !== void 0) unresolvedKeyframes[i] = resolved;
						if (i === unresolvedKeyframes.length - 1) this.finalKeyframe = keyframe;
					}
				}
			}
			this.resolveNoneKeyframes();
			if (!positionalKeys.has(name) || unresolvedKeyframes.length !== 2) return;
			const [origin, target] = unresolvedKeyframes;
			const originType = findDimensionValueType(origin);
			const targetType = findDimensionValueType(target);
			if (containsCSSVariable(origin) !== containsCSSVariable(target) && positionalValues[name]) {
				this.needsMeasurement = true;
				return;
			}
			if (originType === targetType) return;
			if (isNumOrPxType(originType) && isNumOrPxType(targetType)) for (let i = 0; i < unresolvedKeyframes.length; i++) {
				const value = unresolvedKeyframes[i];
				if (typeof value === "string") unresolvedKeyframes[i] = parseFloat(value);
			}
			else if (positionalValues[name]) this.needsMeasurement = true;
		}
		resolveNoneKeyframes() {
			const { unresolvedKeyframes, name } = this;
			const noneKeyframeIndexes = [];
			for (let i = 0; i < unresolvedKeyframes.length; i++) if (unresolvedKeyframes[i] === null || isNone(unresolvedKeyframes[i])) noneKeyframeIndexes.push(i);
			if (noneKeyframeIndexes.length) makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name);
		}
		measureInitialState() {
			const { element, unresolvedKeyframes, name } = this;
			if (!element || !element.current) return;
			if (name === "height") this.suspendedScrollY = window.pageYOffset;
			this.measuredOrigin = positionalValues[name](element.measureViewportBox(), window.getComputedStyle(element.current));
			unresolvedKeyframes[0] = this.measuredOrigin;
			const measureKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
			if (measureKeyframe !== void 0) element.getValue(name, measureKeyframe).jump(measureKeyframe, false);
		}
		measureEndState() {
			const { element, name, unresolvedKeyframes } = this;
			if (!element || !element.current) return;
			const value = element.getValue(name);
			value && value.jump(this.measuredOrigin, false);
			const finalKeyframeIndex = unresolvedKeyframes.length - 1;
			const finalKeyframe = unresolvedKeyframes[finalKeyframeIndex];
			unresolvedKeyframes[finalKeyframeIndex] = positionalValues[name](element.measureViewportBox(), window.getComputedStyle(element.current));
			if (finalKeyframe !== null && this.finalKeyframe === void 0) this.finalKeyframe = finalKeyframe;
			if (this.removedTransforms?.length) this.removedTransforms.forEach(([unsetTransformName, unsetTransformValue]) => {
				element.getValue(unsetTransformName).set(unsetTransformValue);
			});
			this.resolveNoneKeyframes();
		}
	};
	var cornerRadiusProps = [
		"borderTopLeftRadius",
		"borderTopRightRadius",
		"borderBottomRightRadius",
		"borderBottomLeftRadius"
	];
	function resolveElements(elementOrSelector, scope, selectorCache) {
		if (elementOrSelector == null) return [];
		if (elementOrSelector instanceof EventTarget) return [elementOrSelector];
		else if (typeof elementOrSelector === "string") {
			let root = document;
			if (scope) root = scope.current;
			const elements = selectorCache?.[elementOrSelector] ?? root.querySelectorAll(elementOrSelector);
			return elements ? Array.from(elements) : [];
		}
		return Array.from(elementOrSelector).filter((element) => element != null);
	}
	var getValueAsType = (value, type) => {
		return type && typeof value === "number" ? type.transform(value) : value;
	};
	var { schedule: microtask, cancel: cancelMicrotask } = createRenderBatcher(queueMicrotask, false);
	function isSVGElement(element) {
		return isObject(element) && "ownerSVGElement" in element;
	}
	function isSVGSVGElement(element) {
		return isSVGElement(element) && element.tagName === "svg";
	}
	var valueTypes = [
		...dimensionValueTypes,
		color,
		complex
	];
	var findValueType = (v) => valueTypes.find(testValueType(v));
	var createAxis = () => ({
		min: 0,
		max: 0
	});
	var createBox = () => ({
		x: createAxis(),
		y: createAxis()
	});
	var visualElementStore = new WeakMap();
	function isAnimationControls(v) {
		return v !== null && typeof v === "object" && typeof v.start === "function";
	}
	function isVariantLabel(v) {
		return typeof v === "string" || Array.isArray(v);
	}
	var variantProps = ["initial", ...[
		"animate",
		"whileInView",
		"whileFocus",
		"whileHover",
		"whileTap",
		"whileDrag",
		"exit"
	]];
	function isControllingVariants(props) {
		return isAnimationControls(props.animate) || variantProps.some((name) => isVariantLabel(props[name]));
	}
	function isVariantNode(props) {
		return Boolean(isControllingVariants(props) || props.variants);
	}
	function updateMotionValuesFromProps(element, next, prev) {
		for (const key in next) {
			const nextValue = next[key];
			const prevValue = prev[key];
			if (isMotionValue(nextValue)) element.addValue(key, nextValue);
			else if (isMotionValue(prevValue)) element.addValue(key, motionValue(nextValue, { owner: element }));
			else if (prevValue !== nextValue) if (element.hasValue(key)) {
				const existingValue = element.getValue(key);
				if (existingValue.liveStyle === true) existingValue.jump(nextValue);
				else if (!existingValue.hasAnimated) existingValue.set(nextValue);
			} else {
				const latestValue = element.getStaticValue(key);
				element.addValue(key, motionValue(latestValue !== void 0 ? latestValue : nextValue, { owner: element }));
			}
		}
		for (const key in prev) if (next[key] === void 0) element.removeValue(key);
		return next;
	}
	var prefersReducedMotion$1 = { current: null };
	var hasReducedMotionListener = { current: false };
	var isBrowser = typeof window !== "undefined";
	function initPrefersReducedMotion() {
		hasReducedMotionListener.current = true;
		if (!isBrowser) return;
		if (window.matchMedia) {
			const motionMediaQuery = window.matchMedia("(prefers-reduced-motion)");
			const setReducedMotionPreferences = () => prefersReducedMotion$1.current = motionMediaQuery.matches;
			motionMediaQuery.addEventListener("change", setReducedMotionPreferences);
			setReducedMotionPreferences();
		} else prefersReducedMotion$1.current = false;
	}
	var propEventHandlers = [
		"AnimationStart",
		"AnimationComplete",
		"Update",
		"BeforeLayoutMeasure",
		"LayoutMeasure",
		"LayoutAnimationStart",
		"LayoutAnimationComplete"
	];
	var featureDefinitions = {};
	var VisualElement = class {
		scrapeMotionValuesFromProps(_props, _prevProps, _visualElement) {
			return {};
		}
		constructor({ parent, props, presenceContext, reducedMotionConfig, skipAnimations, blockInitialAnimation, visualState }, options = {}) {
			this.current = null;
			this.children = new Set();
			this.isVariantNode = false;
			this.isControllingVariants = false;
			this.shouldReduceMotion = null;
			this.shouldSkipAnimations = false;
			this.values = new Map();
			this.KeyframeResolver = KeyframeResolver;
			this.features = {};
			this.valueSubscriptions = new Map();
			this.prevMotionValues = {};
			this.hasBeenMounted = false;
			this.events = {};
			this.propEventSubscriptions = {};
			this.notifyUpdate = () => this.notify("Update", this.latestValues);
			this.render = () => {
				if (!this.current) return;
				this.triggerBuild();
				this.renderInstance(this.current, this.renderState, this.props.style, this.projection);
			};
			this.renderScheduledAt = 0;
			this.scheduleRender = () => {
				const now = time.now();
				if (this.renderScheduledAt < now) {
					this.renderScheduledAt = now;
					frame.render(this.render, false, true);
				}
			};
			const { latestValues, renderState } = visualState;
			this.latestValues = latestValues;
			this.baseTarget = { ...latestValues };
			this.initialValues = props.initial ? { ...latestValues } : {};
			this.renderState = renderState;
			this.parent = parent;
			this.props = props;
			this.presenceContext = presenceContext;
			this.depth = parent ? parent.depth + 1 : 0;
			this.reducedMotionConfig = reducedMotionConfig;
			this.skipAnimationsConfig = skipAnimations;
			this.options = options;
			this.blockInitialAnimation = Boolean(blockInitialAnimation);
			this.isControllingVariants = isControllingVariants(props);
			this.isVariantNode = isVariantNode(props);
			if (this.isVariantNode) this.variantChildren = new Set();
			this.manuallyAnimateOnMount = Boolean(parent && parent.current);
			const { willChange, ...initialMotionValues } = this.scrapeMotionValuesFromProps(props, {}, this);
			for (const key in initialMotionValues) {
				const value = initialMotionValues[key];
				if (latestValues[key] !== void 0 && isMotionValue(value)) value.set(latestValues[key]);
			}
		}
		mount(instance) {
			if (this.hasBeenMounted) for (const key in this.initialValues) {
				this.values.get(key)?.jump(this.initialValues[key]);
				this.latestValues[key] = this.initialValues[key];
			}
			this.current = instance;
			visualElementStore.set(instance, this);
			if (this.projection && !this.projection.instance) this.projection.mount(instance);
			if (this.parent && this.isVariantNode && !this.isControllingVariants) this.removeFromVariantTree = this.parent.addVariantChild(this);
			this.values.forEach((value, key) => this.bindToMotionValue(key, value));
			if (this.reducedMotionConfig === "never") this.shouldReduceMotion = false;
			else if (this.reducedMotionConfig === "always") this.shouldReduceMotion = true;
			else {
				if (!hasReducedMotionListener.current) initPrefersReducedMotion();
				this.shouldReduceMotion = prefersReducedMotion$1.current;
			}
			this.shouldSkipAnimations = this.skipAnimationsConfig ?? false;
			this.parent?.addChild(this);
			this.update(this.props, this.presenceContext);
			this.hasBeenMounted = true;
		}
		unmount() {
			this.projection && this.projection.unmount();
			cancelFrame(this.notifyUpdate);
			cancelFrame(this.render);
			this.valueSubscriptions.forEach((remove) => remove());
			this.valueSubscriptions.clear();
			this.removeFromVariantTree && this.removeFromVariantTree();
			this.parent?.removeChild(this);
			for (const key in this.events) this.events[key].clear();
			for (const key in this.features) {
				const feature = this.features[key];
				if (feature) {
					feature.unmount();
					feature.isMounted = false;
				}
			}
			this.current = null;
		}
		addChild(child) {
			this.children.add(child);
			this.enteringChildren ?? (this.enteringChildren = new Set());
			this.enteringChildren.add(child);
		}
		removeChild(child) {
			this.children.delete(child);
			this.enteringChildren && this.enteringChildren.delete(child);
		}
		bindToMotionValue(key, value) {
			if (this.valueSubscriptions.has(key)) this.valueSubscriptions.get(key)();
			if (value.accelerate && acceleratedValues.has(key) && this.current instanceof HTMLElement) {
				const { factory, keyframes, times, ease, duration } = value.accelerate;
				const animation = new NativeAnimation({
					element: this.current,
					name: key,
					keyframes,
					times,
					ease,
					duration: secondsToMilliseconds(duration)
				});
				const cleanup = factory(animation);
				this.valueSubscriptions.set(key, () => {
					cleanup();
					animation.cancel();
				});
				return;
			}
			const valueIsTransform = transformProps.has(key);
			if (valueIsTransform && this.onBindTransform) this.onBindTransform();
			const removeOnChange = value.on("change", (latestValue) => {
				this.latestValues[key] = latestValue;
				this.props.onUpdate && frame.preRender(this.notifyUpdate);
				if (valueIsTransform && this.projection) this.projection.isTransformDirty = true;
				this.scheduleRender();
			});
			let removeSyncCheck;
			if (typeof window !== "undefined" && window.MotionCheckAppearSync) removeSyncCheck = window.MotionCheckAppearSync(this, key, value);
			this.valueSubscriptions.set(key, () => {
				removeOnChange();
				if (removeSyncCheck) removeSyncCheck();
			});
		}
		sortNodePosition(other) {
			if (!this.current || !this.sortInstanceNodePosition || this.type !== other.type) return 0;
			return this.sortInstanceNodePosition(this.current, other.current);
		}
		updateFeatures() {
			let key = "animation";
			for (key in featureDefinitions) {
				const featureDefinition = featureDefinitions[key];
				if (!featureDefinition) continue;
				const { isEnabled, Feature: FeatureConstructor } = featureDefinition;
				if (!this.features[key] && FeatureConstructor && isEnabled(this.props)) this.features[key] = new FeatureConstructor(this);
				if (this.features[key]) {
					const feature = this.features[key];
					if (feature.isMounted) feature.update();
					else {
						feature.mount();
						feature.isMounted = true;
					}
				}
			}
		}
		triggerBuild() {
			this.build(this.renderState, this.latestValues, this.props);
		}
		measureViewportBox() {
			return this.current ? this.measureInstanceViewportBox(this.current, this.props) : createBox();
		}
		getStaticValue(key) {
			return this.latestValues[key];
		}
		setStaticValue(key, value) {
			this.latestValues[key] = value;
		}
		update(props, presenceContext) {
			if (props.transformTemplate || this.props.transformTemplate) this.scheduleRender();
			this.prevProps = this.props;
			this.props = props;
			this.prevPresenceContext = this.presenceContext;
			this.presenceContext = presenceContext;
			for (let i = 0; i < propEventHandlers.length; i++) {
				const key = propEventHandlers[i];
				if (this.propEventSubscriptions[key]) {
					this.propEventSubscriptions[key]();
					delete this.propEventSubscriptions[key];
				}
				const listener = props["on" + key];
				if (listener) this.propEventSubscriptions[key] = this.on(key, listener);
			}
			this.prevMotionValues = updateMotionValuesFromProps(this, this.scrapeMotionValuesFromProps(props, this.prevProps || {}, this), this.prevMotionValues);
			if (this.handleChildMotionValue) this.handleChildMotionValue();
		}
		getProps() {
			return this.props;
		}
		getVariant(name) {
			return this.props.variants ? this.props.variants[name] : void 0;
		}
		getDefaultTransition() {
			return this.props.transition;
		}
		getTransformPagePoint() {
			return this.props.transformPagePoint;
		}
		getClosestVariantNode() {
			return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
		}
		addVariantChild(child) {
			const closestVariantNode = this.getClosestVariantNode();
			if (closestVariantNode) {
				closestVariantNode.variantChildren && closestVariantNode.variantChildren.add(child);
				return () => closestVariantNode.variantChildren.delete(child);
			}
		}
		addValue(key, value) {
			const existingValue = this.values.get(key);
			if (value !== existingValue) {
				if (existingValue) this.removeValue(key);
				this.bindToMotionValue(key, value);
				this.values.set(key, value);
				this.latestValues[key] = value.get();
			}
		}
		removeValue(key) {
			this.values.delete(key);
			const unsubscribe = this.valueSubscriptions.get(key);
			if (unsubscribe) {
				unsubscribe();
				this.valueSubscriptions.delete(key);
			}
			delete this.latestValues[key];
			this.removeValueFromRenderState(key, this.renderState);
		}
		hasValue(key) {
			return this.values.has(key);
		}
		getValue(key, defaultValue) {
			if (this.props.values && this.props.values[key]) return this.props.values[key];
			let value = this.values.get(key);
			if (value === void 0 && defaultValue !== void 0) {
				value = motionValue(defaultValue === null ? void 0 : defaultValue, { owner: this });
				this.addValue(key, value);
			}
			return value;
		}
		readValue(key, target) {
			let value = this.latestValues[key] !== void 0 || !this.current ? this.latestValues[key] : this.getBaseTargetFromProps(this.props, key) ?? this.readValueFromInstance(this.current, key, this.options);
			if (value !== void 0 && value !== null) {
				if (typeof value === "string" && (isNumericalString(value) || isZeroValueString(value))) value = parseFloat(value);
				else if (!findValueType(value) && complex.test(target)) value = getAnimatableNone(key, target);
				this.setBaseTarget(key, isMotionValue(value) ? value.get() : value);
			}
			return isMotionValue(value) ? value.get() : value;
		}
		setBaseTarget(key, value) {
			this.baseTarget[key] = value;
		}
		getBaseTarget(key) {
			const { initial } = this.props;
			let valueFromInitial;
			if (typeof initial === "string" || typeof initial === "object") {
				const variant = resolveVariantFromProps(this.props, initial, this.presenceContext?.custom);
				if (variant) valueFromInitial = variant[key];
			}
			if (initial && valueFromInitial !== void 0) return valueFromInitial;
			const target = this.getBaseTargetFromProps(this.props, key);
			if (target !== void 0 && !isMotionValue(target)) return target;
			return this.initialValues[key] !== void 0 && valueFromInitial === void 0 ? void 0 : this.baseTarget[key];
		}
		on(eventName, callback) {
			if (!this.events[eventName]) this.events[eventName] = new SubscriptionManager();
			return this.events[eventName].add(callback);
		}
		notify(eventName, ...args) {
			if (this.events[eventName]) this.events[eventName].notify(...args);
		}
		scheduleRenderMicrotask() {
			microtask.render(this.render);
		}
	};
	var DOMVisualElement = class extends VisualElement {
		constructor() {
			super(...arguments);
			this.KeyframeResolver = DOMKeyframesResolver;
		}
		sortInstanceNodePosition(a, b) {
			return a.compareDocumentPosition(b) & 2 ? 1 : -1;
		}
		getBaseTargetFromProps(props, key) {
			const style = props.style;
			return style ? style[key] : void 0;
		}
		removeValueFromRenderState(key, { vars, style }) {
			delete vars[key];
			delete style[key];
		}
		handleChildMotionValue() {
			if (this.childSubscription) {
				this.childSubscription();
				delete this.childSubscription;
			}
			const { children } = this.props;
			if (isMotionValue(children)) this.childSubscription = children.on("change", (latest) => {
				if (this.current) this.current.textContent = `${latest}`;
			});
		}
	};
	function convertBoundingBoxToBox({ top, left, right, bottom }) {
		return {
			x: {
				min: left,
				max: right
			},
			y: {
				min: top,
				max: bottom
			}
		};
	}
	function transformBoxPoints(point, transformPoint) {
		if (!transformPoint) return point;
		const topLeft = transformPoint({
			x: point.left,
			y: point.top
		});
		const bottomRight = transformPoint({
			x: point.right,
			y: point.bottom
		});
		return {
			top: topLeft.y,
			left: topLeft.x,
			bottom: bottomRight.y,
			right: bottomRight.x
		};
	}
	function measureViewportBox(instance, transformPoint) {
		return convertBoundingBoxToBox(transformBoxPoints(instance.getBoundingClientRect(), transformPoint));
	}
	var translateAlias = {
		x: "translateX",
		y: "translateY",
		z: "translateZ",
		transformPerspective: "perspective"
	};
	var numTransforms = transformPropOrder.length;
	function buildTransform(latestValues, transform, transformTemplate) {
		let transformString = "";
		let transformIsDefault = true;
		for (let i = 0; i < numTransforms; i++) {
			const key = transformPropOrder[i];
			const value = latestValues[key];
			if (value === void 0) continue;
			let valueIsDefault = true;
			if (typeof value === "number") valueIsDefault = value === (key.startsWith("scale") ? 1 : 0);
			else {
				const parsed = parseFloat(value);
				valueIsDefault = key.startsWith("scale") ? parsed === 1 : parsed === 0;
			}
			if (!valueIsDefault || transformTemplate) {
				const valueAsType = getValueAsType(value, numberValueTypes[key]);
				if (!valueIsDefault) {
					transformIsDefault = false;
					const transformName = translateAlias[key] || key;
					transformString += `${transformName}(${valueAsType}) `;
				}
				if (transformTemplate) transform[key] = valueAsType;
			}
		}
		const pathRotation = latestValues.pathRotation;
		if (pathRotation) {
			transformIsDefault = false;
			transformString += `rotate(${getValueAsType(pathRotation, numberValueTypes.pathRotation)}) `;
		}
		transformString = transformString.trim();
		if (transformTemplate) transformString = transformTemplate(transform, transformIsDefault ? "" : transformString);
		else if (transformIsDefault) transformString = "none";
		return transformString;
	}
	function buildHTMLStyles(state, latestValues, transformTemplate) {
		const { style, vars, transformOrigin } = state;
		let hasTransform = false;
		let hasTransformOrigin = false;
		for (const key in latestValues) {
			const value = latestValues[key];
			if (transformProps.has(key)) {
				hasTransform = true;
				continue;
			} else if (isCSSVariableName(key)) {
				vars[key] = value;
				continue;
			} else {
				const valueAsType = getValueAsType(value, numberValueTypes[key]);
				if (key.startsWith("origin")) {
					hasTransformOrigin = true;
					transformOrigin[key] = valueAsType;
				} else style[key] = valueAsType;
			}
		}
		if (!latestValues.transform) {
			if (hasTransform || transformTemplate) style.transform = buildTransform(latestValues, state.transform, transformTemplate);
			else if (style.transform) style.transform = "none";
		}
		if (hasTransformOrigin) {
			const { originX = "50%", originY = "50%", originZ = 0 } = transformOrigin;
			style.transformOrigin = `${originX} ${originY} ${originZ}`;
		}
	}
	function renderHTML(element, { style, vars }, styleProp, projection) {
		const elementStyle = element.style;
		let key;
		for (key in style) elementStyle[key] = style[key];
		projection?.applyProjectionStyles(elementStyle, styleProp);
		for (key in vars) elementStyle.setProperty(key, vars[key]);
	}
	function pixelsToPercent(pixels, axis) {
		if (axis.max === axis.min) return 0;
		return pixels / (axis.max - axis.min) * 100;
	}
	var correctBorderRadius = { correct: (latest, node) => {
		if (!node.target) return latest;
		if (typeof latest === "string") if (px.test(latest)) latest = parseFloat(latest);
		else return latest;
		return `${pixelsToPercent(latest, node.target.x)}% ${pixelsToPercent(latest, node.target.y)}%`;
	} };
	var correctBoxShadow = { correct: (latest, { treeScale, projectionDelta }) => {
		const original = latest;
		const shadow = complex.parse(latest);
		if (shadow.length > 5) return original;
		const template = complex.createTransformer(latest);
		const offset = typeof shadow[0] !== "number" ? 1 : 0;
		const xScale = projectionDelta.x.scale * treeScale.x;
		const yScale = projectionDelta.y.scale * treeScale.y;
		shadow[0 + offset] /= xScale;
		shadow[1 + offset] /= yScale;
		const averageScale = mixNumber$1(xScale, yScale, .5);
		if (typeof shadow[2 + offset] === "number") shadow[2 + offset] /= averageScale;
		if (typeof shadow[3 + offset] === "number") shadow[3 + offset] /= averageScale;
		return template(shadow);
	} };
	var scaleCorrectors = {
		borderRadius: {
			...correctBorderRadius,
			applyTo: [...cornerRadiusProps]
		},
		borderTopLeftRadius: correctBorderRadius,
		borderTopRightRadius: correctBorderRadius,
		borderBottomLeftRadius: correctBorderRadius,
		borderBottomRightRadius: correctBorderRadius,
		boxShadow: correctBoxShadow
	};
	function isForcedMotionValue(key, { layout, layoutId }) {
		return transformProps.has(key) || key.startsWith("origin") || (layout || layoutId !== void 0) && (!!scaleCorrectors[key] || key === "opacity");
	}
	function scrapeMotionValuesFromProps$1(props, prevProps, visualElement) {
		const style = props.style;
		const prevStyle = prevProps?.style;
		const newValues = {};
		if (!style) return newValues;
		for (const key in style) if (isMotionValue(style[key]) || prevStyle && isMotionValue(prevStyle[key]) || isForcedMotionValue(key, props) || visualElement?.getValue(key)?.liveStyle !== void 0) newValues[key] = style[key];
		return newValues;
	}
	function getComputedStyle$1(element) {
		return window.getComputedStyle(element);
	}
	var HTMLVisualElement = class extends DOMVisualElement {
		constructor() {
			super(...arguments);
			this.type = "html";
			this.renderInstance = renderHTML;
		}
		readValueFromInstance(instance, key) {
			if (transformProps.has(key)) return this.projection?.isProjecting ? defaultTransformValue(key) : readTransformValue(instance, key);
			else {
				const computedStyle = getComputedStyle$1(instance);
				const value = (isCSSVariableName(key) ? computedStyle.getPropertyValue(key) : computedStyle[key]) || 0;
				return typeof value === "string" ? value.trim() : value;
			}
		}
		measureInstanceViewportBox(instance, { transformPagePoint }) {
			return measureViewportBox(instance, transformPagePoint);
		}
		build(renderState, latestValues, props) {
			buildHTMLStyles(renderState, latestValues, props.transformTemplate);
		}
		scrapeMotionValuesFromProps(props, prevProps, visualElement) {
			return scrapeMotionValuesFromProps$1(props, prevProps, visualElement);
		}
	};
	function isObjectKey(key, object) {
		return key in object;
	}
	var ObjectVisualElement = class extends VisualElement {
		constructor() {
			super(...arguments);
			this.type = "object";
		}
		readValueFromInstance(instance, key) {
			if (isObjectKey(key, instance)) {
				const value = instance[key];
				if (typeof value === "string" || typeof value === "number") return value;
			}
		}
		getBaseTargetFromProps() {}
		removeValueFromRenderState(key, renderState) {
			delete renderState.output[key];
		}
		measureInstanceViewportBox() {
			return createBox();
		}
		build(renderState, latestValues) {
			Object.assign(renderState.output, latestValues);
		}
		renderInstance(instance, { output }) {
			Object.assign(instance, output);
		}
		sortInstanceNodePosition() {
			return 0;
		}
	};
	var dashKeys = {
		offset: "stroke-dashoffset",
		array: "stroke-dasharray"
	};
	var camelKeys = {
		offset: "strokeDashoffset",
		array: "strokeDasharray"
	};
	function buildSVGPath(attrs, length, spacing = 1, offset = 0, useDashCase = true) {
		attrs.pathLength = 1;
		const keys = useDashCase ? dashKeys : camelKeys;
		attrs[keys.offset] = `${-offset}`;
		attrs[keys.array] = `${length} ${spacing}`;
	}
	var cssMotionPathProperties = [
		"offsetDistance",
		"offsetPath",
		"offsetRotate",
		"offsetAnchor"
	];
	function buildSVGAttrs(state, { attrX, attrY, attrScale, pathLength, pathSpacing = 1, pathOffset = 0, ...latest }, isSVGTag, transformTemplate, styleProp) {
		buildHTMLStyles(state, latest, transformTemplate);
		if (isSVGTag) {
			if (state.style.viewBox) state.attrs.viewBox = state.style.viewBox;
			return;
		}
		state.attrs = state.style;
		state.style = {};
		const { attrs, style } = state;
		if (attrs.transform) {
			style.transform = attrs.transform;
			delete attrs.transform;
		}
		if (style.transform || attrs.transformOrigin) {
			style.transformOrigin = attrs.transformOrigin ?? "50% 50%";
			delete attrs.transformOrigin;
		}
		if (style.transform) {
			style.transformBox = styleProp?.transformBox ?? "fill-box";
			delete attrs.transformBox;
		}
		for (const key of cssMotionPathProperties) if (attrs[key] !== void 0) {
			style[key] = attrs[key];
			delete attrs[key];
		}
		if (attrX !== void 0) attrs.x = attrX;
		if (attrY !== void 0) attrs.y = attrY;
		if (attrScale !== void 0) attrs.scale = attrScale;
		if (pathLength !== void 0) buildSVGPath(attrs, pathLength, pathSpacing, pathOffset, false);
	}
	var camelCaseAttributes = new Set([
		"baseFrequency",
		"diffuseConstant",
		"kernelMatrix",
		"kernelUnitLength",
		"keySplines",
		"keyTimes",
		"limitingConeAngle",
		"markerHeight",
		"markerWidth",
		"numOctaves",
		"targetX",
		"targetY",
		"surfaceScale",
		"specularConstant",
		"specularExponent",
		"stdDeviation",
		"tableValues",
		"viewBox",
		"gradientTransform",
		"pathLength",
		"startOffset",
		"textLength",
		"lengthAdjust"
	]);
	var isSVGTag = (tag) => typeof tag === "string" && tag.toLowerCase() === "svg";
	function renderSVG(element, renderState, _styleProp, projection) {
		renderHTML(element, renderState, void 0, projection);
		for (const key in renderState.attrs) element.setAttribute(!camelCaseAttributes.has(key) ? camelToDash(key) : key, renderState.attrs[key]);
	}
	function scrapeMotionValuesFromProps(props, prevProps, visualElement) {
		const newValues = scrapeMotionValuesFromProps$1(props, prevProps, visualElement);
		for (const key in props) if (isMotionValue(props[key]) || isMotionValue(prevProps[key])) {
			const targetKey = transformPropOrder.indexOf(key) !== -1 ? "attr" + key.charAt(0).toUpperCase() + key.substring(1) : key;
			newValues[targetKey] = props[key];
		}
		return newValues;
	}
	var SVGVisualElement = class extends DOMVisualElement {
		constructor() {
			super(...arguments);
			this.type = "svg";
			this.isSVGTag = false;
			this.measureInstanceViewportBox = createBox;
		}
		getBaseTargetFromProps(props, key) {
			return props[key];
		}
		readValueFromInstance(instance, key) {
			if (transformProps.has(key)) {
				const defaultType = getDefaultValueType(key);
				return defaultType ? defaultType.default || 0 : 0;
			}
			key = !camelCaseAttributes.has(key) ? camelToDash(key) : key;
			return instance.getAttribute(key);
		}
		scrapeMotionValuesFromProps(props, prevProps, visualElement) {
			return scrapeMotionValuesFromProps(props, prevProps, visualElement);
		}
		build(renderState, latestValues, props) {
			buildSVGAttrs(renderState, latestValues, this.isSVGTag, props.transformTemplate, props.style);
		}
		renderInstance(instance, renderState, styleProp, projection) {
			renderSVG(instance, renderState, styleProp, projection);
		}
		mount(instance) {
			this.isSVGTag = isSVGTag(instance.tagName);
			super.mount(instance);
		}
	};
	function animateSingleValue(value, keyframes, options) {
		const motionValue$1 = isMotionValue(value) ? value : motionValue(value);
		motionValue$1.start(animateMotionValue("", motionValue$1, keyframes, options));
		return motionValue$1.animation;
	}
	function isDOMKeyframes(keyframes) {
		return typeof keyframes === "object" && !Array.isArray(keyframes);
	}
	function resolveSubjects(subject, keyframes, scope, selectorCache) {
		if (subject == null) return [];
		if (typeof subject === "string" && isDOMKeyframes(keyframes)) return resolveElements(subject, scope, selectorCache);
		else if (subject instanceof NodeList) return Array.from(subject);
		else if (Array.isArray(subject)) return subject.filter((s) => s != null);
		else return [subject];
	}
	function calculateRepeatDuration(duration, repeat, repeatDelay) {
		return duration * (repeat + 1) + repeatDelay * repeat;
	}
	function calcNextTime(current, next, prev, labels) {
		if (typeof next === "number") return next;
		else if (next.startsWith("-") || next.startsWith("+")) return Math.max(0, current + parseFloat(next));
		else if (next === "<") return prev;
		else if (next.startsWith("<")) return Math.max(0, prev + parseFloat(next.slice(1)));
		else return labels.get(next) ?? current;
	}
	function eraseKeyframes(sequence, startTime, endTime) {
		for (let i = 0; i < sequence.length; i++) {
			const keyframe = sequence[i];
			if (keyframe.at > startTime && keyframe.at < endTime) {
				removeItem(sequence, keyframe);
				i--;
			}
		}
	}
	function addKeyframes(sequence, keyframes, easing, offset, startTime, endTime) {
		eraseKeyframes(sequence, startTime, endTime);
		for (let i = 0; i < keyframes.length; i++) sequence.push({
			value: keyframes[i],
			at: mixNumber$1(startTime, endTime, offset[i]),
			easing: getEasingForSegment(easing, i)
		});
	}
	function normalizeTimes(times, repeat, repeatDelayUnits = 0) {
		const totalUnits = repeat + 1 + repeat * repeatDelayUnits;
		for (let i = 0; i < times.length; i++) times[i] = times[i] / totalUnits;
	}
	function compareByTime(a, b) {
		if (a.at === b.at) {
			if (a.value === null) return 1;
			if (b.value === null) return -1;
			return 0;
		} else return a.at - b.at;
	}
	var defaultSegmentEasing = "easeInOut";
	var MAX_REPEAT = 20;
	function createAnimationsFromSequence(sequence, { defaultTransition = {}, ...sequenceTransition } = {}, scope, generators) {
		const defaultDuration = defaultTransition.duration || .3;
		const animationDefinitions = new Map();
		const sequences = new Map();
		const elementCache = {};
		const timeLabels = new Map();
		let prevTime = 0;
		let currentTime = 0;
		let totalDuration = 0;
		for (let i = 0; i < sequence.length; i++) {
			const segment = sequence[i];
			if (typeof segment === "string") {
				timeLabels.set(segment, currentTime);
				continue;
			} else if (!Array.isArray(segment)) {
				timeLabels.set(segment.name, calcNextTime(currentTime, segment.at, prevTime, timeLabels));
				continue;
			}
			let [subject, keyframes, transition = {}] = segment;
			if (transition.at !== void 0) currentTime = calcNextTime(currentTime, transition.at, prevTime, timeLabels);
			let maxDuration = 0;
			const resolveValueSequence = (valueKeyframes, valueTransition, valueSequence, elementIndex = 0, numSubjects = 0) => {
				const valueKeyframesAsList = keyframesAsList(valueKeyframes);
				const { delay = 0, times = defaultOffset(valueKeyframesAsList), type = defaultTransition.type || "keyframes", repeat, repeatType, repeatDelay = 0, ...remainingTransition } = valueTransition;
				let { ease = defaultTransition.ease || "easeOut", duration } = valueTransition;
				const calculatedDelay = typeof delay === "function" ? delay(elementIndex, numSubjects) : delay;
				const numKeyframes = valueKeyframesAsList.length;
				const createGenerator = isGenerator(type) ? type : generators?.[type || "keyframes"];
				if (numKeyframes <= 2 && createGenerator) {
					let absoluteDelta = 100;
					if (numKeyframes === 2 && isNumberKeyframesArray(valueKeyframesAsList)) {
						const delta = valueKeyframesAsList[1] - valueKeyframesAsList[0];
						absoluteDelta = Math.abs(delta);
					}
					const springTransition = {
						...defaultTransition,
						...remainingTransition
					};
					if (duration !== void 0) springTransition.duration = secondsToMilliseconds(duration);
					const springEasing = createGeneratorEasing(springTransition, absoluteDelta, createGenerator);
					ease = springEasing.ease;
					duration = springEasing.duration;
				}
				duration ?? (duration = defaultDuration);
				const startTime = currentTime + calculatedDelay;
				if (times.length === 1 && times[0] === 0) times[1] = 1;
				const remainder = times.length - valueKeyframesAsList.length;
				remainder > 0 && fillOffset(times, remainder);
				valueKeyframesAsList.length === 1 && valueKeyframesAsList.unshift(null);
				if (repeat) `${repeat}${MAX_REPEAT}`;
				if (repeat && repeat < MAX_REPEAT) {
					const repeatDelayUnits = duration > 0 ? repeatDelay / duration : 0;
					duration = calculateRepeatDuration(duration, repeat, repeatDelay);
					const originalKeyframes = [...valueKeyframesAsList];
					const originalTimes = [...times];
					ease = Array.isArray(ease) ? [...ease] : [ease];
					const originalEase = [...ease];
					const isFlipping = repeatType === "reverse" || repeatType === "mirror";
					let flippedKeyframes = originalKeyframes;
					let flippedEases = originalEase;
					if (isFlipping) {
						flippedKeyframes = [...originalKeyframes].reverse();
						if (repeatType === "reverse") flippedEases = [...originalEase].reverse().map((e) => typeof e === "function" ? reverseEasing(e) : e);
					}
					for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
						const isFlipped = isFlipping && repeatIndex % 2 === 0;
						const iterKeyframes = isFlipped ? flippedKeyframes : originalKeyframes;
						const iterEase = isFlipped ? flippedEases : originalEase;
						const iterStartOffset = (repeatIndex + 1) * (1 + repeatDelayUnits);
						if (repeatDelayUnits > 0) {
							valueKeyframesAsList.push(valueKeyframesAsList[valueKeyframesAsList.length - 1]);
							times.push(iterStartOffset);
							ease.push("linear");
						}
						valueKeyframesAsList.push(...iterKeyframes);
						for (let keyframeIndex = 0; keyframeIndex < iterKeyframes.length; keyframeIndex++) {
							times.push(originalTimes[keyframeIndex] + iterStartOffset);
							ease.push(keyframeIndex === 0 ? "linear" : getEasingForSegment(iterEase, keyframeIndex - 1));
						}
					}
					normalizeTimes(times, repeat, repeatDelayUnits);
				}
				const targetTime = startTime + duration;
				addKeyframes(valueSequence, valueKeyframesAsList, ease, times, startTime, targetTime);
				maxDuration = Math.max(calculatedDelay + duration, maxDuration);
				totalDuration = Math.max(targetTime, totalDuration);
			};
			if (isMotionValue(subject)) {
				const subjectSequence = getSubjectSequence(subject, sequences);
				resolveValueSequence(keyframes, transition, getValueSequence("default", subjectSequence));
			} else {
				const subjects = resolveSubjects(subject, keyframes, scope, elementCache);
				const numSubjects = subjects.length;
				for (let subjectIndex = 0; subjectIndex < numSubjects; subjectIndex++) {
					keyframes = keyframes;
					transition = transition;
					const thisSubject = subjects[subjectIndex];
					const subjectSequence = getSubjectSequence(thisSubject, sequences);
					for (const key in keyframes) resolveValueSequence(keyframes[key], getValueTransition(transition, key), getValueSequence(key, subjectSequence), subjectIndex, numSubjects);
				}
			}
			prevTime = currentTime;
			currentTime += maxDuration;
		}
		sequences.forEach((valueSequences, element) => {
			for (const key in valueSequences) {
				const valueSequence = valueSequences[key];
				valueSequence.sort(compareByTime);
				const keyframes = [];
				const valueOffset = [];
				const valueEasing = [];
				for (let i = 0; i < valueSequence.length; i++) {
					const { at, value, easing } = valueSequence[i];
					keyframes.push(value);
					valueOffset.push(progress(0, totalDuration, at));
					valueEasing.push(easing || "easeOut");
				}
				if (valueOffset[0] !== 0) {
					valueOffset.unshift(0);
					keyframes.unshift(keyframes[0]);
					valueEasing.unshift(defaultSegmentEasing);
				}
				if (valueOffset[valueOffset.length - 1] !== 1) {
					valueOffset.push(1);
					keyframes.push(null);
				}
				if (!animationDefinitions.has(element)) animationDefinitions.set(element, {
					keyframes: {},
					transition: {}
				});
				const definition = animationDefinitions.get(element);
				definition.keyframes[key] = keyframes;
				const { type: _type, ...remainingDefaultTransition } = defaultTransition;
				definition.transition[key] = {
					...remainingDefaultTransition,
					duration: totalDuration,
					ease: valueEasing,
					times: valueOffset,
					...sequenceTransition
				};
			}
		});
		return animationDefinitions;
	}
	function getSubjectSequence(subject, sequences) {
		!sequences.has(subject) && sequences.set(subject, {});
		return sequences.get(subject);
	}
	function getValueSequence(name, sequences) {
		if (!sequences[name]) sequences[name] = [];
		return sequences[name];
	}
	function keyframesAsList(keyframes) {
		return Array.isArray(keyframes) ? keyframes : [keyframes];
	}
	function getValueTransition(transition, key) {
		return transition && transition[key] ? {
			...transition,
			...transition[key]
		} : { ...transition };
	}
	var isNumber = (keyframe) => typeof keyframe === "number";
	var isNumberKeyframesArray = (keyframes) => keyframes.every(isNumber);
	function createDOMVisualElement(element) {
		const options = {
			presenceContext: null,
			props: {},
			visualState: {
				renderState: {
					transform: {},
					transformOrigin: {},
					style: {},
					vars: {},
					attrs: {}
				},
				latestValues: {}
			}
		};
		const node = isSVGElement(element) && !isSVGSVGElement(element) ? new SVGVisualElement(options) : new HTMLVisualElement(options);
		node.mount(element);
		visualElementStore.set(element, node);
	}
	function createObjectVisualElement(subject) {
		const node = new ObjectVisualElement({
			presenceContext: null,
			props: {},
			visualState: {
				renderState: { output: {} },
				latestValues: {}
			}
		});
		node.mount(subject);
		visualElementStore.set(subject, node);
	}
	function isSingleValue(subject, keyframes) {
		return isMotionValue(subject) || typeof subject === "number" || typeof subject === "string" && !isDOMKeyframes(keyframes);
	}
	function animateSubject(subject, keyframes, options, scope) {
		const animations = [];
		if (isSingleValue(subject, keyframes)) animations.push(animateSingleValue(subject, isDOMKeyframes(keyframes) ? keyframes.default || keyframes : keyframes, options ? options.default || options : options));
		else {
			if (subject == null) return animations;
			const subjects = resolveSubjects(subject, keyframes, scope);
			const numSubjects = subjects.length;
			for (let i = 0; i < numSubjects; i++) {
				const thisSubject = subjects[i];
				const createVisualElement = thisSubject instanceof Element ? createDOMVisualElement : createObjectVisualElement;
				if (!visualElementStore.has(thisSubject)) createVisualElement(thisSubject);
				const visualElement = visualElementStore.get(thisSubject);
				const transition = { ...options };
				if ("delay" in transition && typeof transition.delay === "function") transition.delay = transition.delay(i, numSubjects);
				animations.push(...animateTarget(visualElement, {
					...keyframes,
					transition
				}, {}));
			}
		}
		return animations;
	}
	function animateSequence(sequence, options, scope) {
		const animations = [];
		createAnimationsFromSequence(sequence.map((segment) => {
			if (Array.isArray(segment) && typeof segment[0] === "function") {
				const callback = segment[0];
				const mv = motionValue(0);
				mv.on("change", callback);
				if (segment.length === 1) return [mv, [0, 1]];
				else if (segment.length === 2) return [
					mv,
					[0, 1],
					segment[1]
				];
				else return [
					mv,
					segment[1],
					segment[2]
				];
			}
			return segment;
		}), options, scope, { spring }).forEach(({ keyframes, transition }, subject) => {
			animations.push(...animateSubject(subject, keyframes, transition));
		});
		return animations;
	}
	function isSequence(value) {
		return Array.isArray(value) && value.some(Array.isArray);
	}
	function createScopedAnimate(options = {}) {
		const { scope, reduceMotion, skipAnimations } = options;
		function scopedAnimate(subjectOrSequence, optionsOrKeyframes, options) {
			let animations = [];
			let animationOnComplete;
			const inherited = {};
			if (reduceMotion !== void 0) inherited.reduceMotion = reduceMotion;
			if (skipAnimations !== void 0) inherited.skipAnimations = skipAnimations;
			if (isSequence(subjectOrSequence)) {
				const { onComplete, ...sequenceOptions } = optionsOrKeyframes || {};
				if (typeof onComplete === "function") animationOnComplete = onComplete;
				animations = animateSequence(subjectOrSequence, {
					...inherited,
					...sequenceOptions
				}, scope);
			} else {
				const { onComplete, ...rest } = options || {};
				if (typeof onComplete === "function") animationOnComplete = onComplete;
				animations = animateSubject(subjectOrSequence, optionsOrKeyframes, {
					...inherited,
					...rest
				}, scope);
			}
			const animation = new GroupAnimationWithThen(animations);
			if (animationOnComplete) animation.finished.then(animationOnComplete);
			if (scope) {
				scope.animations.push(animation);
				animation.finished.then(() => {
					removeItem(scope.animations, animation);
				});
			}
			return animation;
		}
		return scopedAnimate;
	}
	var animate = createScopedAnimate();
	var springConfigs = {
		carouselSnap: {
			damping: 18,
			stiffness: 200,
			type: "spring"
		},
		contentEntrance: {
			damping: 28,
			stiffness: 300,
			type: "spring"
		},
		modalBackdrop: {
			bounce: 0,
			duration: .4,
			type: "spring"
		},
		modalSurface: {
			bounce: 0,
			duration: .35,
			type: "spring"
		},
		stickyNav: {
			damping: 28,
			stiffness: 300,
			type: "spring"
		},
		swipeToDismiss: {
			damping: 15,
			stiffness: 180,
			type: "spring"
		}
	};
	var animateWithReducedMotion = (element, options) => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return animate(element, options.reducedMotionProperties ?? options.properties, { duration: .2 });
		return animate(element, options.properties, options.springConfig ?? springConfigs.contentEntrance);
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
	var ModalCloseContext = X(null);
	var useModalClose = () => {
		const close = x(ModalCloseContext);
		if (!close) throw new Error("useModalClose must be used inside a ModalShell");
		return close;
	};
	var ENTERING_SURFACE_TRANSFORM = "scale(0.92) translateY(8px)";
	var EXITING_SURFACE_TRANSFORM = "scale(0.92) translateY(100dvh)";
	var reducedMotionQuery = "(prefers-reduced-motion: reduce)";
	var prefersReducedMotion = () => window.matchMedia?.(reducedMotionQuery).matches ?? false;
	var finishClosingAnimation = async (animationId, animations, animationIdRef, finishClose) => {
		try {
			await Promise.all(animations.map((animation) => animation.finished));
			if (animationId === animationIdRef.current) finishClose();
		} catch {}
	};
	var ModalShell = ({ ariaDescribedBy, ariaLabel, ariaLabelledBy, children, className, id, onClose, openRequestId, surfaceClassName }) => {
		const overlayRef = A(null);
		const surfaceRef = A(null);
		const realOnCloseRef = A(onClose);
		const [phase, setPhase] = d("open");
		const [reducedMotion, setReducedMotion] = d(prefersReducedMotion);
		const didFinishCloseRef = A(false);
		const animationIdRef = A(0);
		const animationsRef = A([]);
		const previousOpenRequestIdRef = A(openRequestId);
		h(() => {
			realOnCloseRef.current = onClose;
		}, [onClose]);
		h(() => {
			const mediaQuery = window.matchMedia?.(reducedMotionQuery);
			if (!mediaQuery) return;
			const updateReducedMotion = () => setReducedMotion(mediaQuery.matches);
			mediaQuery.addEventListener("change", updateReducedMotion);
			return () => mediaQuery.removeEventListener("change", updateReducedMotion);
		}, []);
		const finishClose = q(() => {
			if (didFinishCloseRef.current) return;
			didFinishCloseRef.current = true;
			realOnCloseRef.current();
		}, []);
		const animateModal = q((state) => {
			const overlay = overlayRef.current;
			const surface = surfaceRef.current;
			if (!overlay || !surface) return;
			for (const animation of animationsRef.current) animation.stop();
			const animationId = animationIdRef.current + 1;
			animationIdRef.current = animationId;
			const opening = state === "open";
			const backdropAnimation = animateWithReducedMotion(overlay, {
				properties: { opacity: opening ? 1 : 0 },
				reducedMotionProperties: { opacity: opening ? 1 : 0 },
				springConfig: springConfigs.modalBackdrop
			});
			const surfaceAnimation = animateWithReducedMotion(surface, {
				properties: {
					opacity: opening ? 1 : 0,
					transform: opening ? "scale(1) translateY(0)" : EXITING_SURFACE_TRANSFORM
				},
				reducedMotionProperties: { opacity: opening ? 1 : 0 },
				springConfig: springConfigs.modalSurface
			});
			animationsRef.current = [backdropAnimation, surfaceAnimation];
			if (!opening) finishClosingAnimation(animationId, [backdropAnimation, surfaceAnimation], animationIdRef, finishClose);
		}, [finishClose]);
		_(() => {
			if (previousOpenRequestIdRef.current === openRequestId) return;
			previousOpenRequestIdRef.current = openRequestId;
			didFinishCloseRef.current = false;
			setPhase("open");
			animateModal("open");
		}, [animateModal, openRequestId]);
		const handleClose = q(() => {
			if (didFinishCloseRef.current) return;
			didFinishCloseRef.current = false;
			setPhase("closing");
			animateModal("closed");
		}, [animateModal]);
		h(() => {
			const frame = requestAnimationFrame(() => {
				if (!overlayRef.current) return;
				animateModal("open");
			});
			return () => {
				cancelAnimationFrame(frame);
				for (const animation of animationsRef.current) animation.stop();
			};
		}, [animateModal]);
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
		return u(ModalCloseContext.Provider, {
			value: handleClose,
			children: u("dialog", {
				"aria-describedby": ariaDescribedBy,
				"aria-label": ariaLabel,
				"aria-labelledby": ariaLabelledBy,
				"aria-modal": "true",
				class: className,
				id,
				open: true,
				ref: overlayRef,
				style: {
					opacity: 0,
					pointerEvents: phase === "open" ? "auto" : "none"
				},
				children: u("div", {
					class: surfaceClassName,
					onClick: (event) => event.stopPropagation(),
					ref: surfaceRef,
					role: "none",
					style: {
						opacity: 0,
						transform: reducedMotion ? "none" : ENTERING_SURFACE_TRANSFORM
					},
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
	var PosterModal = ({ alt, onClose, openRequestId, src }) => u(ModalShell, {
		ariaLabel: "海报预览",
		className: "atv-modal-overlay",
		id: MODAL_ID$1,
		onClose,
		openRequestId,
		surfaceClassName: "atv-modal-surface",
		children: u(PosterModalContent, {
			alt,
			src
		})
	});
	var FALLBACK_DELAY_MS = 1500;
	var isRecord$1 = (value) => typeof value === "object" && value !== null;
	var safeEmbedUrl = (value) => {
		if (typeof value !== "string" || !value) return null;
		try {
			const url = new URL(value, window.location.href);
			return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
		} catch {
			return null;
		}
	};
	var findEmbedUrl = (value) => {
		if (Array.isArray(value)) {
			for (const item of value) {
				const embedUrl = findEmbedUrl(item);
				if (embedUrl) return embedUrl;
			}
			return null;
		}
		if (!isRecord$1(value)) return null;
		return safeEmbedUrl(value.embedUrl) ?? findEmbedUrl(value.video) ?? findEmbedUrl(value["@graph"]);
	};
	var extractEmbedUrl = (html) => {
		const doc = new DOMParser().parseFromString(html, "text/html");
		for (const script of doc.querySelectorAll("script[type=\"application/ld+json\"]")) try {
			const embedUrl = findEmbedUrl(JSON.parse(script.textContent ?? ""));
			if (embedUrl) return embedUrl;
		} catch {}
		return null;
	};
	var loadEmbedUrl = async (trailerPageUrl, signal) => {
		const response = await fetch(trailerPageUrl, { signal });
		if (!response.ok) throw new Error("trailer page request failed");
		const embedUrl = extractEmbedUrl(await response.text());
		if (!embedUrl) throw new Error("trailer page has no safe embed URL");
		return embedUrl;
	};
	var useTrailerAcquisition = (trailer) => {
		const [record, setRecord] = d({
			result: { status: "loading" },
			trailerPageUrl: null
		});
		const trailerPageUrl = trailer?.trailerPageUrl;
		h(() => {
			if (!trailerPageUrl) return;
			const controller = new AbortController();
			setRecord({
				result: { status: "loading" },
				trailerPageUrl
			});
			(async () => {
				try {
					const embedUrl = await loadEmbedUrl(trailerPageUrl, controller.signal);
					if (!controller.signal.aborted) setRecord({
						result: {
							embedUrl,
							status: "loaded"
						},
						trailerPageUrl
					});
				} catch {
					if (!controller.signal.aborted) setRecord({
						result: { status: "failed" },
						trailerPageUrl
					});
				}
			})();
			return () => controller.abort();
		}, [trailerPageUrl]);
		h(() => {
			if (!trailerPageUrl || record.trailerPageUrl !== trailerPageUrl || record.result.status !== "failed") return;
			const fallbackTimer = window.setTimeout(() => {
				window.open(trailerPageUrl, "_blank", "noopener");
				setRecord({
					result: { status: "fallback" },
					trailerPageUrl
				});
			}, FALLBACK_DELAY_MS);
			return () => window.clearTimeout(fallbackTimer);
		}, [
			record.result.status,
			record.trailerPageUrl,
			trailerPageUrl
		]);
		return record.trailerPageUrl === trailerPageUrl ? record.result : { status: "loading" };
	};
	var MODAL_ID = "atv-video-modal";
	var VideoModalContent = ({ acquisition }) => {
		const close = useModalClose();
		h(() => {
			if (acquisition.status === "fallback") close();
		}, [acquisition.status, close]);
		return u(S, { children: [u(ModalCloseButton, {
			ariaLabel: "关闭视频",
			onClick: close
		}), u("div", {
			class: "atv-modal-video-content",
			children: [
				acquisition.status === "loading" ? u("div", {
					class: "atv-modal-loading",
					children: [u("div", { class: "atv-spinner" }), u("span", { children: "加载中..." })]
				}) : null,
				acquisition.status === "loaded" ? u("video", {
					autoplay: true,
					class: "atv-modal-video",
					controls: true,
					playsinline: true,
					src: acquisition.embedUrl
				}) : null,
				acquisition.status === "failed" ? u("div", {
					class: "atv-modal-toast",
					children: "视频加载失败"
				}) : null
			]
		})] });
	};
	var VideoModal = ({ acquisition, onClose, openRequestId, trailer }) => u(ModalShell, {
		ariaLabel: trailer.title || "视频预览",
		className: "atv-modal-overlay is-video",
		id: MODAL_ID,
		onClose,
		openRequestId,
		surfaceClassName: "atv-modal-surface",
		children: u(VideoModalContent, { acquisition })
	});
	var TrailerModal = ({ onClose, openRequestId, trailer }) => {
		return u(VideoModal, {
			acquisition: useTrailerAcquisition(trailer),
			onClose,
			openRequestId,
			trailer
		});
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
			title: getSubjectSectionCopy("comments").sectionTitle,
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
			u("div", { class: "atv-modal-accent-bar" }),
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
	var CommentModal = ({ canVote, comment, onClose, openRequestId, onVoteStateChange, onVote, voteState }) => u(ModalShell, {
		className: "atv-comment-overlay",
		id: "atv-comment-overlay",
		onClose,
		openRequestId,
		surfaceClassName: "atv-comment-overlay-inner",
		children: u(CommentModalContent, {
			canVote,
			comment,
			onVoteStateChange,
			onVote,
			voteState
		})
	});
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
			title: getSubjectSectionCopy("details").sectionTitle,
			children: u("div", {
				class: "atv-info-grid",
				children: rows.map((row) => u(S, { children: [typeof row.label === "string" ? u("div", {
					class: "atv-info-label",
					children: row.label
				}) : row.label, row.value] }))
			})
		});
	};
	var DiscussionAuthorLink = ({ author }) => author.href ? u("a", {
		class: "atv-discussion-author",
		href: author.href,
		rel: "noopener",
		target: "_blank",
		children: author.name
	}) : u("span", {
		class: "atv-discussion-author",
		children: author.name
	});
	var DiscussionActivityTime = ({ activity }) => activity.date && activity.dateTime && activity.time ? u("time", {
		class: "atv-discussion-time",
		dateTime: activity.dateTime,
		title: activity.raw,
		children: [u("span", { children: activity.date }), u("span", { children: activity.time })]
	}) : u("time", {
		class: "atv-discussion-time",
		title: activity.raw,
		children: activity.raw
	});
	var DiscussionMetadata = ({ activity, author, replies }) => author || replies !== void 0 || activity ? u("div", {
		class: "atv-discussion-meta",
		children: [author ? u(DiscussionAuthorLink, { author }) : null, replies !== void 0 || activity ? u("div", {
			class: "atv-discussion-activity",
			children: [replies === void 0 ? null : u("span", {
				class: "atv-discussion-replies",
				children: `${replies} 回应`
			}), activity ? u(DiscussionActivityTime, { activity }) : null]
		}) : null]
	}) : null;
	var formatDiscussionTotal = (total) => total === void 0 ? "查看全部讨论 →" : `查看全部 ${total.toLocaleString("en-US")} 条讨论 →`;
	var DiscussionsSection = ({ discussions }) => discussions.topics.length ? u(Section, {
		id: "atv-discussions",
		moreLink: discussions.startDiscussionHref ? {
			href: discussions.startDiscussionHref,
			text: "发起讨论 ↗"
		} : void 0,
		title: getSubjectSectionCopy("discussions").sectionTitle,
		children: [u("div", {
			class: "atv-discussion-board",
			children: discussions.topics.map((topic, index) => u("article", {
				class: "atv-discussion-row",
				children: [
					u("a", {
						"aria-label": `打开讨论：${topic.title}`,
						class: "atv-discussion-topic-link",
						href: topic.href,
						rel: "noopener",
						target: "_blank"
					}),
					u("div", {
						class: "atv-discussion-copy",
						children: [u("h3", {
							class: "atv-discussion-title",
							children: topic.title
						}), u(DiscussionMetadata, {
							activity: topic.activity,
							author: topic.author,
							replies: topic.replies
						})]
					}),
					u("span", {
						"aria-hidden": "true",
						class: "atv-discussion-arrow",
						children: "↗"
					})
				]
			}, `${topic.href}-${index}`))
		}), discussions.allDiscussions ? u("footer", {
			class: "atv-discussion-footer",
			children: u("a", {
				href: discussions.allDiscussions.href,
				rel: "noopener",
				target: "_blank",
				children: formatDiscussionTotal(discussions.allDiscussions.total)
			})
		}) : null]
	}) : null;
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
	var CONTENT_TRANSITION_MS = 200;
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
	var ExternalRating = (props) => {
		const shouldRender = !props.resolved || Boolean(props.rating);
		const [rendered, setRendered] = d(shouldRender);
		const [exiting, setExiting] = d(!shouldRender);
		h(() => {
			if (shouldRender) {
				setRendered(true);
				setExiting(false);
				return;
			}
			setExiting(true);
			const timer = window.setTimeout(() => setRendered(false), CONTENT_TRANSITION_MS);
			return () => window.clearTimeout(timer);
		}, [shouldRender]);
		if (!rendered) return null;
		return u("div", {
			class: `${SOURCE_CLASS[props.source]} ${ratingStateClass(Boolean(props.rating), props.resolved)}${exiting ? " is-exiting" : ""}`,
			children: [u(RatingLogo, { name: props.source }), renderExternalRatingContent(props)]
		});
	};
	var RatingPanel = ({ douban, externalRatings, imdbId }) => {
		if (!douban && !imdbId) return null;
		const resolved = Boolean(externalRatings);
		return u("div", {
			class: "atv-rating-panel",
			children: [u(DoubanRating, { rating: douban }), imdbId ? u(S, { children: [
				u(ExternalRating, {
					rating: externalRatings?.imdb?.rating ?? null,
					resolved,
					source: "imdb"
				}),
				u(ExternalRating, {
					rating: externalRatings?.mc ?? null,
					resolved,
					source: "metacritic"
				}),
				u(ExternalRating, {
					rating: externalRatings?.rt ?? null,
					resolved,
					source: "rt"
				})
			] }) : null]
		});
	};
	var PLATFORM_BRANDS = [
		{
			Icon: LogoAbc,
			aliases: [
				"abc",
				"abc电视台",
				"abc 电视台",
				"american broadcasting company"
			],
			color: "#07111E",
			key: "abc",
			label: "ABC",
			surface: "dark"
		},
		{
			Icon: LogoAmc,
			aliases: ["amc"],
			color: "#ffffff",
			key: "amc",
			label: "AMC",
			surface: "dark"
		},
		{
			Icon: LogoDiscoveryPlus,
			aliases: [
				"discovery+",
				"discovery plus",
				"discoveryplus"
			],
			color: "#34A65C",
			colorMode: "intrinsic",
			key: "discovery-plus",
			label: "Discovery+",
			surface: "dark"
		},
		{
			Icon: LogoDisneyPlus,
			aliases: [
				"disney+",
				"disney plus",
				"disneyplus"
			],
			color: "#113CCF",
			key: "disney-plus",
			label: "Disney+",
			surface: "dark"
		},
		{
			Icon: LogoBilibiliCombined,
			aliases: [
				"哔哩哔哩",
				"bilibili",
				"b站",
				"b 站"
			],
			color: "#00A1D6",
			colorMode: "intrinsic",
			heroIcon: LogoBilibili,
			key: "bilibili",
			label: "哔哩哔哩",
			surface: "dark"
		},
		{
			Icon: LogoBbc,
			aliases: [
				"bbc",
				"bbc电视台",
				"bbc 电视台"
			],
			color: "#ffffff",
			key: "bbc",
			label: "BBC",
			presentation: "wordmark",
			surface: "dark"
		},
		{
			Icon: LogoPrimeVideo,
			aliases: ["prime video", "primevideo"],
			color: "#0779ff",
			key: "prime-video",
			label: "Prime Video",
			surface: "dark"
		},
		{
			Icon: LogoIqiyiCombined,
			aliases: [
				"爱奇艺",
				"iqiyi",
				"iQIYI"
			],
			color: "#00DC5A",
			colorMode: "intrinsic",
			heroIcon: LogoIqiyi,
			key: "iqiyi",
			label: "爱奇艺",
			presentation: "wordmark",
			surface: "dark"
		},
		{
			Icon: LogoTencentCombined,
			aliases: [
				"腾讯视频",
				"tencent video",
				"tencent tv",
				"wetv"
			],
			color: "#00A2FF",
			colorMode: "intrinsic",
			heroIcon: LogoTencentTv,
			key: "tencent-video",
			label: "腾讯视频",
			surface: "dark"
		},
		{
			Icon: LogoYoukuCombined,
			aliases: ["优酷", "youku"],
			color: "#00A6FF",
			colorMode: "intrinsic",
			heroIcon: LogoYouku,
			key: "youku",
			label: "优酷",
			surface: "dark"
		},
		{
			Icon: LogoHulu,
			aliases: ["hulu"],
			color: "#1CE783",
			colorMode: "intrinsic",
			key: "hulu",
			label: "Hulu",
			presentation: "wordmark",
			surface: "dark"
		},
		{
			Icon: LogoNbc,
			aliases: ["nbc"],
			color: "#6e55dc",
			colorMode: "intrinsic",
			key: "nbc",
			label: "NBC",
			surface: "dark"
		},
		{
			Icon: LogoNetflix,
			aliases: ["netflix"],
			color: "#E50914",
			colorMode: "intrinsic",
			key: "netflix",
			label: "Netflix",
			surface: "dark"
		},
		{
			Icon: LogoYouTube,
			aliases: ["youtube", "youtube tv"],
			color: "#FF0000",
			key: "youtube",
			label: "YouTube",
			surface: "dark"
		},
		{
			Icon: LogoAppleTv,
			aliases: ["apple tv", "apple tv+"],
			color: "#F5F5F7",
			key: "apple-tv",
			label: "Apple TV",
			surface: "dark"
		},
		{
			Icon: LogoHbo,
			aliases: ["hbo"],
			color: "#F5F5F7",
			key: "hbo",
			label: "HBO",
			surface: "dark"
		},
		{
			Icon: LogoHboMax,
			aliases: ["hbo max", "max"],
			color: "#8A7CFF",
			key: "hbo-max",
			label: "HBO Max",
			surface: "dark"
		},
		{
			Icon: LogoParamountPlus,
			aliases: ["paramount+", "Paramount Network"],
			color: "#0064FF",
			key: "paramount-plus",
			label: "Paramount+",
			surface: "dark"
		},
		{
			Icon: LogoTubi,
			aliases: ["tubi"],
			color: "#7408FF",
			key: "tubi",
			label: "Tubi",
			surface: "dark"
		},
		{
			Icon: LogoVimeo,
			aliases: ["vimeo"],
			color: "#1AB7EA",
			key: "vimeo",
			label: "Vimeo",
			surface: "dark"
		},
		{
			Icon: LogoCbs,
			aliases: ["cbs"],
			color: "#033963",
			key: "cbs",
			label: "CBS",
			surface: "dark"
		},
		{
			Icon: LogoCctv,
			aliases: [
				"cctv",
				"中国中央电视台",
				"央视",
				"中央电视台"
			],
			color: "#E80413",
			colorMode: "intrinsic",
			key: "cctv",
			label: "CCTV",
			presentation: "wordmark",
			surface: "dark"
		},
		{
			Icon: LogoFox,
			aliases: ["fox"],
			color: "#FF5027",
			colorMode: "intrinsic",
			key: "fox",
			label: "FOX",
			surface: "dark"
		},
		{
			Icon: LogoFx,
			aliases: ["fx"],
			color: "#ffffff",
			key: "fx",
			label: "FX",
			surface: "dark"
		},
		{
			Icon: LogoShowtime,
			aliases: ["showtime", "sho"],
			color: "#B10000",
			key: "showtime",
			label: "Showtime",
			surface: "dark"
		},
		{
			Icon: LogoPeacock,
			aliases: ["peacock", "peacock tv"],
			color: "#0066FF",
			key: "peacock",
			label: "Peacock",
			surface: "dark"
		},
		{
			Icon: LogoCw,
			aliases: ["cw", "the cw"],
			color: "#ff4500",
			key: "cw",
			label: "The CW",
			surface: "dark"
		},
		{
			Icon: LogoItvx,
			aliases: [
				"itv",
				"itvx",
				"itv x"
			],
			color: "#DEEB52",
			key: "itvx",
			label: "ITVX",
			surface: "dark"
		},
		{
			Icon: LogoChannel4,
			aliases: [
				"channel 4",
				"channel4",
				"ch4"
			],
			color: "#AAFF89",
			key: "channel-4",
			label: "Channel 4",
			surface: "dark"
		},
		{
			Icon: LogoSbs,
			aliases: [
				"sbs",
				"sbs korea",
				"서울방송"
			],
			color: "#005293",
			key: "sbs",
			label: "SBS",
			surface: "dark"
		},
		{
			Icon: LogoTvn,
			aliases: ["tvn", "tv n"],
			color: "#E80328",
			key: "tvn",
			label: "tvN",
			surface: "dark"
		},
		{
			Icon: LogoNhk,
			aliases: ["nhk", "日本放送協会"],
			color: "#808080",
			key: "nhk",
			label: "NHK",
			surface: "dark"
		},
		{
			Icon: LogoUsa,
			aliases: ["usa", "usa network"],
			color: "#f83837",
			key: "usa",
			label: "USA",
			surface: "dark"
		}
	];
	var normalizePlatformName = (value) => value.toLowerCase().replaceAll(/\s+/gu, "");
	var findPlatformBrandByExactName = (value) => {
		const normalized = normalizePlatformName(value);
		return PLATFORM_BRANDS.find((brand) => brand.aliases.some((alias) => normalizePlatformName(alias) === normalized)) ?? null;
	};
	var findPlatformBrandByContainedName = (value) => {
		const normalized = normalizePlatformName(value);
		return PLATFORM_BRANDS.find((brand) => brand.aliases.some((alias) => normalized.includes(normalizePlatformName(alias)))) ?? null;
	};
	var FirstBroadcastPlatform = ({ platform }) => {
		const brand = platform.split("/").map(findPlatformBrandByExactName).find((candidate) => candidate !== null) ?? null;
		const Icon = brand?.heroIcon ?? brand?.Icon;
		if (!brand || !Icon) return u("span", {
			"aria-label": `首播平台：${platform}`,
			class: "atv-first-broadcast-platform is-unknown",
			"data-provider": "unknown",
			children: ["首播 · ", platform]
		});
		return u("span", {
			class: "atv-first-broadcast-platform",
			"data-provider": brand?.key ?? "unknown",
			children: [u("span", {
				"aria-hidden": "true",
				class: `atv-first-broadcast-platform-mark${brand.presentation === "wordmark" ? " is-wordmark" : ""}${brand.colorMode === "intrinsic" ? " is-intrinsic" : " is-catalog"} is-surface-${brand.surface}`,
				style: { color: brand.colorMode === "intrinsic" ? void 0 : brand.color },
				children: u(Icon, {})
			}), u("span", {
				class: "atv-screen-reader-only",
				children: ["首播平台：", platform]
			})]
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
					onClick: () => callbacks.handleOpenInterest(state, "标记想看")
				}),
				state.hasWatching ? u(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "在看",
					onClick: () => callbacks.handleOpenInterest(state, "标记在看")
				}) : null,
				u(InterestButton, {
					className: "atv-btn atv-btn-secondary",
					label: "看过",
					onClick: () => callbacks.handleOpenInterest(state, "标记看过")
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
	var HeroMeta = ({ info, isTV, leading, year }) => {
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
			children: [
				leading,
				metaParts.map((part) => u("span", {
					class: "atv-meta-dot",
					children: part
				}, part)),
				info.genres.length ? u("span", {
					class: "atv-meta-chips",
					children: info.genres.map((genre) => u("span", {
						class: "atv-chip",
						children: genre
					}, genre))
				}) : null
			]
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
	var HeroSummary = ({ expandNativeSummary, text }) => {
		const teaserRef = A(null);
		const previousTextRef = A(text);
		const summaryRequestRef = A(0);
		const [expanded, setExpanded] = d(false);
		const [summary, setSummary] = d(text);
		const [showToggle, setShowToggle] = d(true);
		const [summaryTransitionKey, setSummaryTransitionKey] = d(0);
		h(() => {
			requestAnimationFrame(() => {
				const teaser = teaserRef.current;
				if (teaser) setShowToggle(teaser.scrollHeight - teaser.clientHeight > 4);
			});
		}, [text]);
		h(() => {
			if (previousTextRef.current !== text) {
				summaryRequestRef.current += 1;
				previousTextRef.current = text;
				setExpanded(false);
				setSummary(text);
				setSummaryTransitionKey((key) => key + 1);
			}
		}, [text]);
		const toggle = async () => {
			if (expanded) {
				summaryRequestRef.current += 1;
				setExpanded(false);
				return;
			}
			setExpanded(true);
			const requestId = summaryRequestRef.current + 1;
			summaryRequestRef.current = requestId;
			const expandedText = await expandNativeSummary?.();
			if (requestId === summaryRequestRef.current && expandedText && expandedText !== summary) {
				setSummary(expandedText);
				setSummaryTransitionKey((key) => key + 1);
			}
		};
		return u("div", {
			class: "atv-hero-summary",
			children: [u("p", {
				class: `atv-hero-teaser${expanded ? "" : " is-clamped"}`,
				ref: teaserRef,
				children: u("span", {
					class: "atv-hero-teaser-content",
					children: summary
				}, summaryTransitionKey)
			}), u("button", {
				class: `atv-hero-more${expanded ? " is-open" : ""}`,
				onClick: () => void toggle(),
				style: { display: showToggle ? void 0 : "none" },
				type: "button",
				children: [u("span", { children: expanded ? "收起" : "展开" }), u(IconChevron, {})]
			})]
		});
	};
	var noop$1 = () => void 0;
	var Hero = ({ callbacks, data, expandNativeSummary, externalRatings = null, firstBroadcastPlatform = null, onOpenPoster = noop$1 }) => u("section", {
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
								leading: firstBroadcastPlatform ? u(FirstBroadcastPlatform, { platform: firstBroadcastPlatform }) : null,
								year: data.year
							}),
							u(RatingPanel, {
								douban: data.rating,
								externalRatings,
								imdbId: data.imdbId
							}),
							u(HeroActions, {
								callbacks,
								state: data.interest
							}),
							data.summary ? u(HeroSummary, {
								expandNativeSummary,
								text: data.summary
							}) : null
						]
					})]
				})
			})
		]
	});
	var useModalRequest = () => {
		const [active, setActive] = d(null);
		return {
			active,
			handleClose: q(() => setActive(null), []),
			handleOpen: q((value) => {
				setActive((previous) => ({
					requestId: (previous?.requestId ?? 0) + 1,
					value
				}));
			}, [])
		};
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
		const statuses = statusEntries(state.hasWatching);
		const activeStatusIndex = statuses.findIndex((entry) => entry.value === status);
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
			u("div", { class: "atv-modal-accent-bar" }),
			u("div", {
				class: "atv-interest-modal-header",
				children: [u("span", {
					class: "atv-interest-modal-header-title",
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
						style: {
							"--atv-interest-status-count": statuses.length,
							"--atv-interest-status-index": activeStatusIndex
						},
						children: [u("div", {
							"aria-hidden": "true",
							class: "atv-interest-modal-status-indicator"
						}), statuses.map((entry) => u("button", {
							"aria-pressed": entry.value === status,
							class: `atv-interest-modal-status${entry.value === status ? " is-active" : ""}`,
							"data-value": entry.value,
							disabled: loading,
							onClick: () => setStatus(entry.value),
							type: "button",
							children: entry.label
						}, entry.value))]
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
	var InterestForm = ({ callbacks, onClose, openRequestId, state }) => u(ModalShell, {
		ariaLabelledBy: "atv-interest-modal-title",
		className: "atv-interest-modal",
		id: "atv-interest-modal",
		onClose,
		openRequestId,
		surfaceClassName: "atv-interest-modal-inner",
		children: u(InterestFormContent, {
			callbacks,
			state
		}, openRequestId)
	});
	var saveOptionsFromForm = (form) => ({
		comment: form.comment,
		rating: form.rating > 0 ? form.rating : void 0
	});
	var useInterestMarking = ({ adapters, loggedIn, onLoginRequired, subjectId }) => {
		const activeInterest = useModalRequest();
		const { post, reload, remove } = adapters;
		const requireLogin = (action) => {
			if (loggedIn) return true;
			onLoginRequired(action);
			return false;
		};
		return {
			callbacks: { handleOpenInterest: (state, action = "标记这部作品") => {
				if (!requireLogin(action)) return;
				activeInterest.handleOpen(state);
			} },
			form: activeInterest.active ? u(InterestForm, {
				callbacks: {
					onRemove: async (status) => {
						const result = await remove(subjectId, status);
						if (result.ok) reload();
						return result;
					},
					onSave: async (form) => {
						const result = await post(subjectId, form.status, saveOptionsFromForm(form));
						if (result.ok) reload();
						return result;
					}
				},
				onClose: activeInterest.handleClose,
				openRequestId: activeInterest.active.requestId,
				state: activeInterest.active.value
			}) : null
		};
	};
	var nativeDialogSelector = ".account_pop.dui-dialog, .account-pop.dui-dialog, .account_pop, .account-form, .login-modal";
	var nativeMaskSelector = ".dui-dialog-msk, .ui-mask, .account-mask";
	var nativeLoginError = "无法载入豆瓣登录组件，请刷新页面后重试。";
	var trustedLoginOrigin = "https://accounts.douban.com";
	var maxAttempts = 24;
	var clearNativeLoginMasks = () => {
		for (const mask of document.querySelectorAll(nativeMaskSelector)) mask.remove();
	};
	var findNativeLoginDialog = () => document.querySelector(nativeDialogSelector);
	var isTrustedLoginIframe = (iframe) => {
		const source = iframe.getAttribute("src");
		if (!source) return false;
		try {
			const url = new URL(source, window.location.href);
			return url.origin === trustedLoginOrigin && !url.username && !url.password && url.pathname.startsWith("/passport/login");
		} catch {
			return false;
		}
	};
	var styleLoginIframe = (iframe) => {
		iframe.title = "豆瓣登录";
		iframe.referrerPolicy = "strict-origin-when-cross-origin";
		iframe.removeAttribute("width");
		iframe.removeAttribute("height");
		iframe.removeAttribute("frameborder");
		iframe.removeAttribute("scrolling");
		iframe.removeAttribute("style");
		iframe.classList.add("atv-login-modal-iframe");
	};
	var prepareNativeLoginIframe = (dialog) => {
		const iframe = dialog.querySelector("iframe");
		if (!iframe) return {
			kind: "error",
			message: nativeLoginError
		};
		const source = iframe.getAttribute("src");
		if (!source || source === "about:blank") return { kind: "pending" };
		if (!isTrustedLoginIframe(iframe)) return {
			kind: "error",
			message: nativeLoginError
		};
		styleLoginIframe(iframe);
		iframe.remove();
		dialog.remove();
		return {
			iframe,
			kind: "ready"
		};
	};
	var findExistingLoginIframe = () => {
		for (const iframe of document.querySelectorAll("iframe[src*='passport/login']")) if (isTrustedLoginIframe(iframe)) {
			styleLoginIframe(iframe);
			iframe.remove();
			return iframe;
		}
		return null;
	};
	var hasAuthenticatedSession = () => document.cookie.split(";").some((cookie) => cookie.trim().startsWith("ck="));
	var mountIframe = (host, iframe, onStateChange, isStopped) => {
		let authenticated = false;
		const sessionTimer = { current: void 0 };
		const onLoad = () => {
			if (!isStopped() && !authenticated) onStateChange({ kind: "ready" });
		};
		const checkSession = () => {
			if (isStopped() || authenticated || !hasAuthenticatedSession()) return;
			authenticated = true;
			if (sessionTimer.current !== void 0) window.clearInterval(sessionTimer.current);
			onStateChange({ kind: "authenticated" });
			window.location.reload();
		};
		host.replaceChildren(iframe);
		iframe.addEventListener("load", onLoad, { once: true });
		onStateChange({ kind: "mounted" });
		sessionTimer.current = window.setInterval(checkSession, 300);
		requestAnimationFrame(() => {
			if (!isStopped()) iframe.focus();
		});
		return () => {
			iframe.removeEventListener("load", onLoad);
			if (sessionTimer.current !== void 0) window.clearInterval(sessionTimer.current);
		};
	};
	var preventNavigation = (event) => {
		if (event.target instanceof HTMLAnchorElement) event.preventDefault();
	};
	var triggerNativeLoginDialog = () => {
		const triggers = [...document.querySelectorAll(".a_show_login, .j.a_show_login")];
		const trigger = triggers.find((node) => node.offsetParent !== null) ?? triggers[0];
		if (!trigger) return;
		document.addEventListener("click", preventNavigation, { once: true });
		trigger.click();
	};
	var mountNativeLoginFrame = (host, onStateChange) => {
		let stopped = false;
		let retryTimer;
		let stopIframeMount;
		const stop = () => {
			stopped = true;
			if (retryTimer !== void 0) window.clearTimeout(retryTimer);
			stopIframeMount?.();
		};
		const mount = (iframe) => {
			stopIframeMount = mountIframe(host, iframe, onStateChange, () => stopped);
		};
		const attemptMount = (attempt) => {
			if (stopped) return;
			clearNativeLoginMasks();
			const dialog = findNativeLoginDialog();
			if (dialog) {
				const result = prepareNativeLoginIframe(dialog);
				if (result.kind === "ready") {
					mount(result.iframe);
					return;
				}
				if (result.kind === "error") {
					onStateChange(result);
					return;
				}
			}
			const directIframe = findExistingLoginIframe();
			if (directIframe) {
				mount(directIframe);
				return;
			}
			if (attempt === 0) {
				triggerNativeLoginDialog();
				clearNativeLoginMasks();
			}
			if (attempt < maxAttempts) {
				retryTimer = window.setTimeout(() => {
					retryTimer = void 0;
					attemptMount(attempt + 1);
				}, 100);
				return;
			}
			onStateChange({
				kind: "error",
				message: nativeLoginError
			});
		};
		onStateChange({ kind: "loading" });
		attemptMount(0);
		return stop;
	};
	var statusForLoginState = (state) => {
		if (state.kind === "error") return state.message;
		if (state.kind === "loading" || state.kind === "mounted") return "正在载入豆瓣登录组件…";
		return "";
	};
	var LoginModalContent = ({ action, busy, hostRef, iframeReady, status }) => {
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
				class: `atv-login-modal-native${iframeReady ? " is-ready" : ""}`,
				ref: hostRef
			})
		] });
	};
	var LoginModal = ({ action, onClose, openRequestId }) => {
		const hostRef = A(null);
		const [state, setState] = d({ kind: "loading" });
		const busy = state.kind === "loading" || state.kind === "mounted";
		const iframeReady = state.kind === "ready";
		const status = statusForLoginState(state);
		h(() => {
			const host = hostRef.current;
			if (!host) return;
			return mountNativeLoginFrame(host, setState);
		}, []);
		return u(ModalShell, {
			ariaDescribedBy: "atv-login-modal-desc",
			ariaLabelledBy: "atv-login-modal-title",
			className: "atv-login-modal",
			id: "atv-login-modal",
			onClose,
			openRequestId,
			surfaceClassName: "atv-login-modal-inner",
			children: u(LoginModalContent, {
				action,
				busy,
				hostRef,
				iframeReady,
				status
			})
		});
	};
	var CastSection = ({ celebrities }) => celebrities.length ? u(Section, {
		id: "atv-cast",
		title: getSubjectSectionCopy("cast").sectionTitle,
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
		title: getSubjectSectionCopy("media").sectionTitle,
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
		title: getSubjectSectionCopy("recommendations").sectionTitle,
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
		title: getSubjectSectionCopy("series").sectionTitle,
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
	var PROVIDER_HOSTS = {
		amc: ["amc.com"],
		"apple-tv": ["tv.apple.com"],
		bilibili: ["bilibili.com"],
		hbo: ["hbo.com"],
		"hbo-max": ["max.com", "hbomax.com"],
		hulu: ["hulu.com"],
		iqiyi: ["iqiyi.com"],
		netflix: ["netflix.com"],
		"paramount-plus": ["paramountplus.com"],
		"prime-video": ["primevideo.com", "amazon.com"],
		"tencent-video": ["v.qq.com"],
		tubi: ["tubi.tv"],
		vimeo: ["vimeo.com"],
		youku: ["youku.com"],
		youtube: ["youtube.com", "youtu.be"]
	};
	var COMBINED_SVG_BRANDS = new Set([
		"bilibili",
		"iqiyi",
		"tencent-video",
		"youku"
	]);
	var decodeStreamingHref = (href) => {
		try {
			return new URL(href).searchParams.get("url") || href;
		} catch {
			return href;
		}
	};
	var hostMatches = (href, brand) => {
		const decoded = decodeStreamingHref(href);
		const hosts = PROVIDER_HOSTS[brand.key] ?? [];
		try {
			const host = new URL(decoded).hostname.replace(/^www\./u, "");
			return hosts.some((providerHost) => host.endsWith(providerHost));
		} catch {
			return hosts.some((providerHost) => decoded.includes(providerHost));
		}
	};
	var resolveStreamingProvider = (item) => {
		const provider = findPlatformBrandByContainedName(item.name) ?? PLATFORM_BRANDS.find((brand) => hostMatches(item.href, brand));
		if (provider) {
			const { Icon, color, colorMode, key, label, surface } = provider;
			return {
				Icon,
				color,
				colorMode,
				combinedSvg: COMBINED_SVG_BRANDS.has(key) || void 0,
				key,
				label,
				surface
			};
		}
		return {
			color: UNKNOWN_PROVIDER_COLOR,
			key: "unknown",
			label: item.name
		};
	};
	var StreamingLogo = ({ colorMode, fallbackLabel, Icon, imgSrc, surface = "dark" }) => {
		if (imgSrc) return u("img", {
			alt: "",
			class: "atv-stream-vendor-icon",
			src: imgSrc
		});
		return u("span", {
			"aria-hidden": "true",
			class: `atv-stream-logo${colorMode === "intrinsic" ? " is-intrinsic" : " is-catalog"} is-surface-${surface}`,
			children: Icon ? u(Icon, {}) : u("span", {
				class: "atv-stream-logo-fallback",
				children: fallbackLabel.trim().at(0) || u(IconPlay, {})
			})
		});
	};
	var StreamingSection = ({ streaming }) => streaming.length ? u(Section, {
		id: "atv-stream",
		title: getSubjectSectionCopy("streaming").sectionTitle,
		children: u("div", {
			class: "atv-stream-row",
			children: streaming.map((item) => {
				const provider = resolveStreamingProvider(item);
				const style = { "--atv-stream-brand": provider.color };
				return u("a", {
					class: `atv-stream-card${provider.combinedSvg ? " atv-stream-card-combined" : ""} is-surface-${provider.surface ?? "dark"}`,
					"data-provider": provider.key,
					href: item.href,
					rel: "noopener",
					style,
					target: "_blank",
					children: provider.combinedSvg && provider.Icon ? u(provider.Icon, {}) : u(S, { children: [u(StreamingLogo, {
						colorMode: provider.colorMode,
						fallbackLabel: provider.label,
						Icon: provider.Icon,
						imgSrc: provider.Icon ? void 0 : item.iconUrl,
						surface: provider.surface
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
			title: getSubjectSectionCopy(isTV ? "tvReviews" : "movieReviews").sectionTitle,
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
	var allowedTags = new Set([
		"a",
		"b",
		"blockquote",
		"br",
		"cite",
		"code",
		"del",
		"div",
		"em",
		"footer",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"hr",
		"img",
		"li",
		"ol",
		"p",
		"pre",
		"q",
		"s",
		"small",
		"span",
		"strong",
		"sub",
		"sup",
		"table",
		"tbody",
		"td",
		"th",
		"thead",
		"tr",
		"u",
		"ul"
	]);
	var dangerousTags = new Set([
		"embed",
		"iframe",
		"link",
		"meta",
		"object",
		"script",
		"style"
	]);
	var allowedImgAttrs = new Set([
		"src",
		"alt",
		"width",
		"height"
	]);
	var allowedTableCellAttrs = new Set([
		"colspan",
		"rowspan",
		"scope"
	]);
	var sanitizeReviewHtml = (html) => {
		const doc = new DOMParser().parseFromString(html, "text/html");
		for (const element of doc.body.querySelectorAll("*")) {
			if (dangerousTags.has(element.tagName.toLowerCase())) {
				element.remove();
				continue;
			}
			if (!allowedTags.has(element.tagName.toLowerCase())) {
				element.replaceWith(...element.childNodes);
				continue;
			}
			for (const attribute of element.attributes) {
				const tagName = element.tagName.toLowerCase();
				const safeHref = tagName === "a" && attribute.name === "href" && /^(?:https?:|\/|#)/iu.test(attribute.value.trim());
				const allowedImgAttr = tagName === "img" && allowedImgAttrs.has(attribute.name);
				const allowedTableCellAttr = (tagName === "th" || tagName === "td") && allowedTableCellAttrs.has(attribute.name);
				const allowedClass = attribute.name === "class";
				if (!safeHref && !allowedImgAttr && !allowedTableCellAttr && !allowedClass) element.removeAttribute(attribute.name);
			}
		}
		return doc.body.innerHTML;
	};
	var readNativeReviewContent = (rid) => {
		const numericId = reviewNumericId(rid);
		const fullContent = document.querySelector(`[id="${rid}"]`)?.querySelector(`#review_${numericId}_full .review-content`);
		const text = (fullContent?.textContent ?? "").trim();
		return fullContent && text ? sanitizeReviewHtml(fullContent.innerHTML) : null;
	};
	var fetchReviewContent = async (rid) => {
		const numericId = reviewNumericId(rid);
		const response = await fetch(`https://movie.douban.com/review/${numericId}/`);
		if (!response.ok) return null;
		const html = await response.text();
		const content = new DOMParser().parseFromString(html, "text/html").querySelector(".review-content");
		return content ? sanitizeReviewHtml(content.innerHTML) : null;
	};
	var useReviewContent = (rid) => {
		const [state, setState] = d(() => {
			const nativeHtml = readNativeReviewContent(rid);
			return nativeHtml ? {
				html: nativeHtml,
				status: "loaded"
			} : {
				html: null,
				status: "loading"
			};
		});
		h(() => {
			const nativeHtml = readNativeReviewContent(rid);
			if (nativeHtml) {
				setState({
					html: nativeHtml,
					status: "loaded"
				});
				return;
			}
			let cancelled = false;
			setState({
				html: null,
				status: "loading"
			});
			const loadReview = async () => {
				try {
					const html = await fetchReviewContent(rid);
					if (cancelled) return;
					if (!html) {
						setState({
							html: null,
							status: "error"
						});
						return;
					}
					setState({
						html,
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
		if (status === "loaded") return "atv-review-modal-body is-loaded";
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
			u("div", { class: "atv-modal-accent-bar" }),
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
	var ReviewModal = ({ canVote, onClose, openRequestId, onVoteStateChange, onVote, review, voteState }) => u(ModalShell, {
		ariaLabelledBy: "atv-review-modal-title",
		className: "atv-review-modal",
		id: "atv-review-modal",
		onClose,
		openRequestId,
		surfaceClassName: "atv-review-modal-scroll",
		children: u(ReviewModalContent, {
			canVote,
			onVote,
			onVoteStateChange,
			review,
			voteState
		})
	});
	var CACHE_DURATION_MS = 120 * 1e3;
	var subjectSuggestionCache = new Map();
	var subjectPathPattern = /^\/subject\/(?<subjectId>\d+)\/?$/u;
	var normalizeSubjectQuery = (query) => query.trim().replaceAll(/\s+/gu, " ");
	var isRecord = (value) => typeof value === "object" && value !== null;
	var optionalText = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
	var validImageUrl = (value) => {
		if (typeof value !== "string") return null;
		try {
			const url = new URL(value);
			return url.protocol === "https:" && url.hostname.endsWith(".doubanio.com") ? value : null;
		} catch {
			return null;
		}
	};
	var validSubjectUrl = (value, id) => {
		if (typeof value !== "string") return null;
		try {
			const url = new URL(value);
			const subjectId = subjectPathPattern.exec(url.pathname)?.groups?.subjectId;
			return url.protocol === "https:" && url.hostname === "movie.douban.com" && subjectId === id ? value : null;
		} catch {
			return null;
		}
	};
	var toSubjectSuggestion = (value) => {
		if (!isRecord(value)) return null;
		const id = optionalText(value.id);
		const title = optionalText(value.title);
		if (!id || !/^\d+$/u.test(id) || !title) return null;
		const url = validSubjectUrl(value.url, id);
		if (!url) return null;
		return {
			episode: optionalText(value.episode),
			id,
			imageUrl: validImageUrl(value.img),
			originalTitle: optionalText(value.sub_title),
			title,
			url,
			year: optionalText(value.year)
		};
	};
	var parseSubjectSuggestions = (value) => {
		if (!Array.isArray(value)) return [];
		return value.flatMap((candidate) => {
			const suggestion = toSubjectSuggestion(candidate);
			return suggestion ? [suggestion] : [];
		});
	};
	var fetchSubjectSuggestions = async (query, signal) => {
		const normalizedQuery = normalizeSubjectQuery(query);
		if (!normalizedQuery) return [];
		const cached = subjectSuggestionCache.get(normalizedQuery);
		if (cached && cached.expiresAt > Date.now()) return cached.suggestions;
		const response = await fetch(`/j/subject_suggest?q=${encodeURIComponent(normalizedQuery)}`, { signal });
		if (!response.ok) throw new Error("Douban subject suggestions request failed.");
		const suggestions = parseSubjectSuggestions(await response.json());
		subjectSuggestionCache.set(normalizedQuery, {
			expiresAt: Date.now() + CACHE_DURATION_MS,
			suggestions
		});
		return suggestions;
	};
	var SearchIcon = () => u("svg", {
		"aria-hidden": "true",
		height: "16",
		viewBox: "0 0 16 16",
		width: "16",
		children: [u("circle", {
			cx: "6.75",
			cy: "6.75",
			fill: "none",
			r: "4.5",
			stroke: "currentColor",
			"stroke-width": "1.7"
		}), u("path", {
			d: "m10.1 10.1 3.15 3.15",
			fill: "none",
			stroke: "currentColor",
			"stroke-linecap": "round",
			"stroke-width": "1.7"
		})]
	});
	var suggestionMetadata = (suggestion) => {
		const details = [suggestion.year];
		if (suggestion.episode) details.push(`共 ${suggestion.episode} 集`);
		return details.filter(Boolean).join(" · ");
	};
	var SuggestionRow = ({ active, index, onOpen, suggestion }) => {
		const metadata = suggestionMetadata(suggestion);
		return u("button", {
			"aria-selected": active,
			class: `atv-subject-suggestion${active ? " is-active" : ""}`,
			id: `atv-subject-suggestion-${suggestion.id}`,
			onClick: () => onOpen(suggestion),
			role: "option",
			type: "button",
			children: [
				u("span", {
					class: "atv-subject-suggestion-poster",
					"aria-hidden": "true",
					children: suggestion.imageUrl ? u("img", {
						alt: "",
						loading: "lazy",
						src: suggestion.imageUrl
					}) : null
				}),
				u("span", {
					class: "atv-subject-suggestion-copy",
					children: [u("span", {
						class: "atv-subject-suggestion-title",
						children: [suggestion.title, metadata ? u("span", {
							class: "atv-subject-suggestion-metadata",
							children: metadata
						}) : null]
					}), suggestion.originalTitle ? u("span", {
						class: "atv-subject-suggestion-original",
						children: suggestion.originalTitle
					}) : null]
				}),
				u("span", {
					class: "atv-subject-suggestion-marker",
					"aria-hidden": "true"
				}),
				u("span", {
					class: "atv-screen-reader-only",
					children: ["候选 ", index + 1]
				})
			]
		});
	};
	var suggestionListId = "atv-subject-suggestion-list";
	var isTextInputTarget = (target) => target instanceof Element && target.closest("input, textarea, select, [contenteditable]") !== null;
	var nativeSearchUrl = (query) => `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(query)}`;
	var QUERY_DEBOUNCE_MS = 300;
	var MAX_SUGGESTIONS = 5;
	var useSubjectSuggestionRequest = (normalizedQuery) => {
		const [request, setRequest] = d({ status: "idle" });
		h(() => {
			if (!normalizedQuery) {
				setRequest({ status: "idle" });
				return;
			}
			const controller = new AbortController();
			setRequest({
				query: normalizedQuery,
				status: "loading"
			});
			const requestSuggestions = async () => {
				try {
					const receivedSuggestions = await fetchSubjectSuggestions(normalizedQuery, controller.signal);
					if (!controller.signal.aborted) setRequest({
						query: normalizedQuery,
						status: "ready",
						suggestions: receivedSuggestions.slice(0, MAX_SUGGESTIONS)
					});
				} catch {
					if (!controller.signal.aborted) setRequest({
						query: normalizedQuery,
						status: "failed"
					});
				}
			};
			const timeout = window.setTimeout(() => {
				requestSuggestions();
			}, QUERY_DEBOUNCE_MS);
			return () => {
				window.clearTimeout(timeout);
				controller.abort();
			};
		}, [normalizedQuery]);
		return request;
	};
	var SubjectSwitcher = ({ onOpenChange }) => {
		const [isOpen, setIsOpen] = d(false);
		const [query, setQuery] = d("");
		const [activeIndex, setActiveIndex] = d(-1);
		const inputRef = A(null);
		const rootRef = A(null);
		const normalizedQuery = normalizeSubjectQuery(query);
		const request = useSubjectSuggestionRequest(normalizedQuery);
		const requestMatchesQuery = request.status !== "idle" && request.query === normalizedQuery;
		const displayedRequest = normalizedQuery && !requestMatchesQuery ? {
			query: normalizedQuery,
			status: "loading"
		} : request;
		const suggestions = displayedRequest.status === "ready" ? displayedRequest.suggestions : [];
		const activeSuggestion = suggestions[activeIndex] ?? null;
		const hasResultsPanel = Boolean(normalizedQuery) && displayedRequest.status !== "idle";
		const showFallback = displayedRequest.status === "failed" || displayedRequest.status === "ready" && !suggestions.length;
		const closeSwitcher = q(() => {
			setActiveIndex(-1);
			setIsOpen(false);
			setQuery("");
		}, []);
		const openSwitcher = q(() => {
			setIsOpen(true);
		}, []);
		const openInNewTab = q((url) => {
			window.open(url, "_blank", "noopener");
			closeSwitcher();
		}, [closeSwitcher]);
		const openSuggestion = q((suggestion) => openInNewTab(suggestion.url), [openInNewTab]);
		const submitSearch = q(() => {
			if (normalizedQuery) openInNewTab(nativeSearchUrl(normalizedQuery));
		}, [normalizedQuery, openInNewTab]);
		h(() => onOpenChange?.(isOpen), [isOpen, onOpenChange]);
		h(() => {
			if (isOpen) inputRef.current?.focus();
		}, [isOpen]);
		h(() => {
			const onShortcut = (event) => {
				if (event.key !== "/" || event.altKey || event.ctrlKey || event.metaKey || isTextInputTarget(event.target)) return;
				event.preventDefault();
				openSwitcher();
			};
			window.addEventListener("keydown", onShortcut);
			return () => window.removeEventListener("keydown", onShortcut);
		}, [openSwitcher]);
		h(() => {
			if (!isOpen) return;
			const onPointerDown = (event) => {
				if (event.target instanceof Node && !rootRef.current?.contains(event.target)) closeSwitcher();
			};
			document.addEventListener("pointerdown", onPointerDown);
			return () => document.removeEventListener("pointerdown", onPointerDown);
		}, [closeSwitcher, isOpen]);
		const onInputKeyDown = (event) => {
			if (event.key === "ArrowDown" && suggestions.length) {
				event.preventDefault();
				setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
				return;
			}
			if (event.key === "ArrowUp" && suggestions.length) {
				event.preventDefault();
				setActiveIndex((current) => current <= 0 ? suggestions.length - 1 : current - 1);
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				if (activeSuggestion) openSuggestion(activeSuggestion);
				else submitSearch();
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				closeSwitcher();
			}
		};
		return u("div", {
			class: `atv-subject-switcher${isOpen ? " is-open" : ""}`,
			ref: rootRef,
			children: isOpen ? u("div", {
				class: "atv-subject-switcher-expanded",
				children: [
					u("label", {
						class: "atv-screen-reader-only",
						htmlFor: "atv-subject-switcher-input",
						children: "搜索电影、剧集"
					}),
					u("span", {
						class: "atv-subject-switcher-search-icon",
						"aria-hidden": "true",
						children: u(SearchIcon, {})
					}),
					u("input", {
						"aria-activedescendant": activeSuggestion ? `atv-subject-suggestion-${activeSuggestion.id}` : void 0,
						"aria-autocomplete": "list",
						"aria-controls": hasResultsPanel ? suggestionListId : void 0,
						"aria-expanded": hasResultsPanel,
						class: "atv-subject-switcher-input",
						id: "atv-subject-switcher-input",
						onInput: (event) => {
							setActiveIndex(-1);
							setQuery(event.currentTarget.value);
						},
						onKeyDown: onInputKeyDown,
						placeholder: "搜索电影、剧集",
						ref: inputRef,
						role: "combobox",
						type: "search",
						value: query
					}),
					u("button", {
						"aria-label": "关闭作品搜索",
						class: "atv-subject-switcher-close",
						onClick: closeSwitcher,
						type: "button",
						children: "Esc"
					}),
					hasResultsPanel ? u("div", {
						class: `atv-subject-suggestion-rail${activeIndex >= 0 ? " is-keyboard-navigating" : ""}`,
						id: suggestionListId,
						role: suggestions.length ? "listbox" : "status",
						children: [
							displayedRequest.status === "loading" ? u("div", {
								class: "atv-subject-suggestion-skeletons",
								"aria-label": "正在搜索作品",
								children: [
									u("span", {}),
									u("span", {}),
									u("span", {})
								]
							}) : null,
							displayedRequest.status === "ready" && suggestions.length ? suggestions.map((suggestion, index) => u(SuggestionRow, {
								active: index === activeIndex,
								index,
								onOpen: openSuggestion,
								suggestion
							}, suggestion.id)) : null,
							showFallback ? u("button", {
								class: "atv-subject-search-fallback",
								onClick: submitSearch,
								type: "button",
								children: [
									"在豆瓣搜索「",
									normalizedQuery,
									"」"
								]
							}) : null
						]
					}) : null
				]
			}) : u("button", {
				"aria-label": "搜索作品",
				class: "atv-subject-switcher-trigger",
				onClick: openSwitcher,
				type: "button",
				children: [u(SearchIcon, {}), u("span", { children: "搜索作品" })]
			})
		});
	};
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
	var SubjectPage = ({ data, runtime }) => {
		const activeComment = useModalRequest();
		const activeReview = useModalRequest();
		const activeMediaModal = useModalRequest();
		const [subjectSwitcherOpen, setSubjectSwitcherOpen] = d(false);
		const loginAction = useModalRequest();
		const commentVotes = useVoteState(data.comments, commentVoteStrategy);
		const { avatarUrls } = runtime;
		const reviewVotes = useVoteState(data.reviews, reviewVoteStrategy);
		const handleCommentVoteStateChange = commentVotes.setVoteState;
		const handleReviewVoteStateChange = reviewVotes.setVoteState;
		const interestMarking = useInterestMarking({
			adapters: runtime.actions.interestMarking,
			loggedIn: data.interest.loggedIn,
			onLoginRequired: loginAction.handleOpen,
			subjectId: data.subjectId
		});
		const canVote = () => {
			if (!data.interest.loggedIn) {
				loginAction.handleOpen("给短评点有用");
				return false;
			}
			return true;
		};
		const canReviewVote = () => {
			if (!data.interest.loggedIn) {
				loginAction.handleOpen("给影评投票");
				return false;
			}
			return true;
		};
		return u(S, { children: [
			u(StickyNav, {
				...runtime.navigation,
				subjectSwitcher: u(SubjectSwitcher, { onOpenChange: setSubjectSwitcherOpen }),
				subjectSwitcherOpen,
				title: data.title
			}),
			u(Hero, {
				callbacks: interestMarking.callbacks,
				data: toHeroData(data),
				expandNativeSummary: runtime.actions.expandNativeSummary,
				externalRatings: runtime.externalRatings,
				firstBroadcastPlatform: runtime.firstBroadcastPlatform,
				onOpenPoster: (src, alt) => activeMediaModal.handleOpen({
					alt,
					src,
					type: "poster"
				})
			}),
			u(StreamingSection, { streaming: data.streaming }),
			u(SeriesSection, {
				items: runtime.series,
				moreLink: runtime.seriesMoreLink
			}),
			u(CastSection, { celebrities: data.celebrities }),
			u(PhotosSection, {
				data: {
					photos: data.photos,
					subjectId: data.subjectId,
					trailers: data.trailers
				},
				onOpenPoster: (src, alt) => activeMediaModal.handleOpen({
					alt,
					src,
					type: "poster"
				}),
				onOpenVideo: (trailer) => activeMediaModal.handleOpen({
					trailer,
					type: "video"
				})
			}),
			u(CommentsSection, {
				avatarUrls,
				canVote,
				comments: commentVotes.mergeVoteStates(data.comments),
				getVoteState: commentVotes.getVoteState,
				onOpen: activeComment.handleOpen,
				onVoteStateChange: handleCommentVoteStateChange,
				onVote: runtime.actions.handleCommentVote,
				subjectId: data.subjectId
			}),
			u(ReviewsSection, {
				canVote: canReviewVote,
				getVoteState: reviewVotes.getVoteState,
				isTV: data.isTV,
				onOpen: activeReview.handleOpen,
				onVoteStateChange: handleReviewVoteStateChange,
				onVote: runtime.actions.handleReviewVote,
				reviews: reviewVotes.mergeVoteStates(data.reviews),
				subjectId: data.subjectId
			}),
			u(DiscussionsSection, { discussions: data.discussions }),
			u(RecommendationsSection, { recommendations: data.recommendations }),
			u(DetailsSection, { data: {
				awards: data.awards,
				info: data.info,
				isTV: data.isTV
			} }),
			u("div", { class: "atv-footer-spacer" }),
			activeComment.active ? u(CommentModal, {
				canVote,
				comment: {
					...commentVotes.mergeVoteState(activeComment.active.value),
					avatar: avatarUrls.get(activeComment.active.value.link) || activeComment.active.value.avatar
				},
				onClose: activeComment.handleClose,
				openRequestId: activeComment.active.requestId,
				onVoteStateChange: handleCommentVoteStateChange,
				onVote: runtime.actions.handleCommentVote,
				voteState: commentVotes.getVoteState(activeComment.active.value)
			}) : null,
			activeReview.active ? u(ReviewModal, {
				canVote: canReviewVote,
				onClose: activeReview.handleClose,
				onVoteStateChange: handleReviewVoteStateChange,
				onVote: runtime.actions.handleReviewVote,
				openRequestId: activeReview.active.requestId,
				review: reviewVotes.mergeVoteState(activeReview.active.value),
				voteState: reviewVotes.getVoteState(activeReview.active.value)
			}) : null,
			activeMediaModal.active?.value.type === "poster" ? u(PosterModal, {
				alt: activeMediaModal.active.value.alt,
				onClose: activeMediaModal.handleClose,
				openRequestId: activeMediaModal.active.requestId,
				src: activeMediaModal.active.value.src
			}) : null,
			activeMediaModal.active?.value.type === "video" ? u(TrailerModal, {
				onClose: activeMediaModal.handleClose,
				openRequestId: activeMediaModal.active.requestId,
				trailer: activeMediaModal.active.value.trailer
			}) : null,
			loginAction.active ? u(LoginModal, {
				action: loginAction.active.value,
				onClose: loginAction.handleClose,
				openRequestId: loginAction.active.requestId
			}) : null,
			interestMarking.form
		] });
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
	var avatarCache = createCache("dp:avatar-cache", 1800 * 1e3);
	var avatarSelectors = [
		"#profile .pic img",
		".user-face",
		"img[src*='/icon/']"
	];
	var extractProfileAvatar = (html) => {
		const profile = new DOMParser().parseFromString(html, "text/html");
		for (const selector of avatarSelectors) {
			const image = profile.querySelector(selector);
			if (!image) continue;
			const source = image.src || image.dataset.src || image.dataset.original || "";
			if (source) return source;
		}
		return "";
	};
	var profileLinks = (comments) => [...new Set(comments.flatMap(({ link }) => link ? [link] : []))];
	var fetchAvatarUrls = async (links, referrer) => {
		const urls = new Map();
		const missing = [];
		for (const link of links) {
			const cached = avatarCache.get(link);
			if (cached) urls.set(link, cached);
			else missing.push(link);
		}
		if (missing.length === 0) return urls;
		const fetched = await Promise.all(missing.map(async (link) => {
			try {
				return {
					link,
					url: extractProfileAvatar(await gmGet(link, referrer))
				};
			} catch {
				return {
					link,
					url: ""
				};
			}
		}));
		for (const { link, url } of fetched) {
			if (url) avatarCache.set(link, url);
			urls.set(link, url);
		}
		return urls;
	};
	var useAvatarUrls = (comments, doc) => {
		const [urls, setUrls] = d(() => new Map());
		h(() => {
			let active = true;
			const links = profileLinks(comments);
			if (links.length === 0) {
				setUrls(new Map());
				return () => {
					active = false;
				};
			}
			(async () => {
				const nextUrls = await fetchAvatarUrls(links, doc.location.href);
				if (active) setUrls(nextUrls);
			})();
			return () => {
				active = false;
			};
		}, [comments, doc]);
		return urls;
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
	var useExternalRatings = (imdbId, isTV, doc) => {
		const [external, setExternal] = d(null);
		h(() => {
			if (!imdbId) {
				setExternal(null);
				return;
			}
			let cancelled = false;
			const loadRatings = async () => {
				const ratings = await resolveAll(buildContext(imdbId, isTV, doc));
				if (!cancelled) setExternal(ratings);
			};
			loadRatings();
			return () => {
				cancelled = true;
			};
		}, [
			doc,
			imdbId,
			isTV
		]);
		return external;
	};
	var extractFirstBroadcastPlatform = (doc) => {
		const label = [...doc.querySelectorAll("label")].find((candidate) => candidate.textContent?.trim() === "电视台");
		if (!label?.htmlFor) return null;
		return [...doc.querySelectorAll("input")].find((candidate) => candidate.id === label.htmlFor)?.value.trim() || null;
	};
	var fetchFirstBroadcastPlatform = async (subjectId, referer = location.href) => {
		if (!subjectId) return null;
		try {
			const html = await gmGet(`https://movie.douban.com/subject/${encodeURIComponent(subjectId)}/edit`, referer);
			return extractFirstBroadcastPlatform(new DOMParser().parseFromString(html, "text/html"));
		} catch {
			return null;
		}
	};
	var platformCache = new Map();
	var platformRequests = new Map();
	var loadFirstBroadcastPlatform = (subjectId) => {
		if (platformCache.has(subjectId)) return Promise.resolve(platformCache.get(subjectId) ?? null);
		const inFlight = platformRequests.get(subjectId);
		if (inFlight) return inFlight;
		const request = (async () => {
			try {
				const platform = await fetchFirstBroadcastPlatform(subjectId);
				platformCache.set(subjectId, platform);
				return platform;
			} finally {
				platformRequests.delete(subjectId);
			}
		})();
		platformRequests.set(subjectId, request);
		return request;
	};
	var useFirstBroadcastPlatform = (subjectId, loggedIn) => {
		const [platform, setPlatform] = d(null);
		h(() => {
			if (!loggedIn || !subjectId) {
				setPlatform(null);
				return;
			}
			let active = true;
			(async () => {
				const value = await loadFirstBroadcastPlatform(subjectId);
				if (active) setPlatform(value);
			})();
			return () => {
				active = false;
			};
		}, [loggedIn, subjectId]);
		return platform;
	};
	var useStickyNavigation = (doc, sections) => {
		const [activeSectionId, setActiveSectionId] = d("");
		const [visible, setVisible] = d(false);
		const [scrolling, setScrolling] = d(false);
		const lastVisibleRef = A(false);
		h(() => {
			const view = doc.defaultView ?? window;
			let scrollTimer;
			const handleScroll = () => {
				const isVisible = view.scrollY > 300;
				if (isVisible !== lastVisibleRef.current) {
					lastVisibleRef.current = isVisible;
					setVisible(isVisible);
				}
				setScrolling(true);
				view.clearTimeout(scrollTimer);
				scrollTimer = view.setTimeout(() => setScrolling(false), 150);
			};
			view.addEventListener("scroll", handleScroll, { passive: true });
			handleScroll();
			return () => {
				view.removeEventListener("scroll", handleScroll);
				view.clearTimeout(scrollTimer);
			};
		}, [doc]);
		h(() => {
			const view = doc.defaultView ?? window;
			const elements = new Map();
			for (const section of sections) {
				const element = doc.querySelector(`#${section.id}`);
				if (element) elements.set(section.id, element);
			}
			let pending = false;
			const pick = () => {
				let activeId = "";
				let bestScore = -Infinity;
				for (const section of sections) {
					const element = elements.get(section.id);
					if (!element) continue;
					const rect = element.getBoundingClientRect();
					const visibleTop = Math.max(rect.top, 56);
					const visibleBottom = Math.min(rect.bottom, view.innerHeight * .55);
					const score = Math.max(0, visibleBottom - visibleTop);
					if (score > bestScore) {
						activeId = section.id;
						bestScore = score;
					}
				}
				setActiveSectionId(activeId);
				pending = false;
			};
			const observer = new view.IntersectionObserver(() => {
				if (pending) return;
				pending = true;
				view.requestAnimationFrame(pick);
			}, { threshold: [
				0,
				.25,
				.5
			] });
			for (const element of elements.values()) observer.observe(element);
			pick();
			return () => observer.disconnect();
		}, [doc, sections]);
		return {
			activeSectionId,
			onJump: q((sectionId) => {
				const prefersReducedMotion = (doc.defaultView ?? window).matchMedia("(prefers-reduced-motion: reduce)").matches;
				doc.querySelector(`#${sectionId}`)?.scrollIntoView({
					behavior: prefersReducedMotion ? "auto" : "smooth",
					block: "start"
				});
			}, [doc]),
			scrolling,
			sections,
			visible
		};
	};
	var reloadPage = () => {
		location.reload();
	};
	var SubjectPageRuntime = ({ data, doc }) => {
		const [series, setSeries] = d(data.series);
		const avatarUrls = useAvatarUrls(data.comments, doc);
		const externalRatings = useExternalRatings(data.info.imdb || null, data.isTV, doc);
		const firstBroadcastPlatform = useFirstBroadcastPlatform(data.subjectId, data.interest.loggedIn);
		const navigation = useStickyNavigation(doc, T(() => computeNavSections({
			...data,
			series
		}), [data, series]));
		h(() => watchSeries(setSeries, doc), [doc]);
		return u(SubjectPage, {
			data,
			runtime: {
				actions: {
					expandNativeSummary: () => expandNativeSummary(doc),
					handleCommentVote: (cid) => postVote(cid, data.subjectId),
					handleReviewVote: (rid, type) => postReviewVote(rid, type, data.subjectId),
					interestMarking: {
						post: postInterest,
						reload: reloadPage,
						remove: removeInterest
					}
				},
				avatarUrls,
				externalRatings,
				firstBroadcastPlatform,
				navigation,
				series,
				seriesMoreLink: extractSeriesMoreLink(doc)
			}
		});
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
		const root = doc.createElement("div");
		root.id = "atv-douban-root";
		R(u(SubjectPageRuntime, {
			data,
			doc
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
