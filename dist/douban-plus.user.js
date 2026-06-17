// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/ZlatanCN/douban-plus
// @version      1.0.1
// @author       Gabriel Zhu
// @description  将豆瓣电影/电视剧详情页重塑为 Apple TV+ 风格的高级沉浸式页面，保留豆瓣绿作为强调色
// @license      MIT
// @match        *://movie.douban.com/subject/*
// @grant        GM_addStyle
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
	_css(":root {\n  --atv-bg-primary: #000000;\n  --atv-bg-secondary: #1c1c1e;\n  --atv-bg-tertiary: #2c2c2e;\n  --atv-bg-elevated: rgba(255, 255, 255, 0.06);\n  --atv-text-primary: #ffffff;\n  --atv-text-secondary: rgba(255, 255, 255, 0.72);\n  --atv-text-tertiary: rgba(255, 255, 255, 0.45);\n  --atv-accent: #41be5d;\n  --atv-accent-bright: #4cd97a;\n  --atv-accent-glow: rgba(65, 190, 93, 0.35);\n  --atv-rating-gold: #ffb800;\n  --atv-border-subtle: rgba(255, 255, 255, 0.08);\n  --atv-border-medium: rgba(255, 255, 255, 0.16);\n  --atv-radius-sm: 8px;\n  --atv-radius-md: 12px;\n  --atv-radius-lg: 16px;\n  --atv-radius-xl: 24px;\n}\n\nbody > #wrapper {\n  display: none !important;\n}\nbody {\n  padding: 0 !important;\n  margin: 0 !important;\n  background: #000 !important;\n}\n#db-global-nav,\n#db-nav-movie {\n  display: none !important;\n}\n[id^=\"dale_\"],\n[class*=\"dale_\"] {\n  display: none !important;\n}\n\n#atv-douban-root {\n  position: relative;\n  min-height: 100vh;\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  font-feature-settings: \"ss01\", \"cv11\";\n  line-height: 1.5;\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-primary);\n  opacity: 0;\n  animation: atv-fadein 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards;\n}\n\n@keyframes atv-fadein {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@keyframes atv-rise {\n  from {\n    opacity: 0;\n    transform: translateY(14px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n#atv-douban-root *,\n#atv-douban-root *::before,\n#atv-douban-root *::after {\n  box-sizing: border-box;\n}\n#atv-douban-root a {\n  color: inherit;\n  text-decoration: none;\n}\n#atv-douban-root a:hover {\n  background: transparent;\n}\n#atv-douban-root img {\n  display: block;\n  max-width: 100%;\n}\n\n/* ---------- Sticky nav ---------- */\n.atv-stickynav {\n  position: fixed;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: 9999;\n  box-sizing: border-box;\n  display: flex;\n  gap: 24px;\n  align-items: center;\n  justify-content: space-between;\n  height: 56px;\n  padding: 0 max(28px, 5vw);\n  font-family:\n    -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"PingFang SC\",\n    \"Helvetica Neue\", \"Microsoft YaHei\", Inter, system-ui, sans-serif;\n  pointer-events: none;\n  background: rgba(10, 10, 12, 0.72);\n  border-bottom: 1px solid var(--atv-border-subtle);\n  opacity: 0;\n  -webkit-backdrop-filter: saturate(180%) blur(20px);\n  backdrop-filter: saturate(180%) blur(20px);\n  transform: translateY(-100%);\n  transition:\n    opacity 280ms ease,\n    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-stickynav.is-visible {\n  pointer-events: auto;\n  opacity: 1;\n  transform: none;\n}\n.atv-stickynav-title {\n  flex: 0 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 16px;\n  font-weight: 600;\n  color: #fff;\n  white-space: nowrap;\n}\n.atv-stickynav-jumps {\n  display: flex;\n  flex: 0 0 auto;\n  gap: 24px;\n}\n.atv-stickynav-jumps a {\n  font-size: 14px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.7);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  cursor: pointer;\n  transition: color 200ms ease;\n}\n.atv-stickynav-jumps a:hover {\n  color: var(--atv-accent-bright);\n  background: transparent;\n}\n@media (max-width: 768px) {\n  .atv-stickynav-title {\n    font-size: 14px;\n  }\n  .atv-stickynav-jumps {\n    gap: 14px;\n  }\n  .atv-stickynav-jumps a {\n    font-size: 12px;\n  }\n}\n\n/* ---------- Hero ---------- */\n.atv-hero {\n  position: relative;\n  display: flex;\n  align-items: flex-end;\n  min-height: 75vh;\n  padding: 132px max(28px, 5vw) 56px;\n  overflow: visible;\n  isolation: isolate;\n}\n.atv-hero-bg {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -4;\n  height: 75vh;\n  overflow: hidden;\n  background: #000;\n}\n.atv-hero-still {\n  position: absolute;\n  inset: 0;\n  background-repeat: no-repeat;\n  background-position: center 30%;\n  background-size: cover;\n  transform: scale(1.04);\n  backface-visibility: hidden;\n  will-change: transform, opacity;\n}\n.atv-hero-still.is-thumb {\n  filter: blur(12px) saturate(1.12) brightness(0.84);\n  transform: scale(1.14);\n}\n.atv-hero-still.is-hd {\n  opacity: 0;\n  filter: saturate(1.08) brightness(0.88);\n  transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.atv-hero-still.is-hd.is-loaded {\n  opacity: 1;\n  animation: atv-kenburns 22s ease-out forwards;\n}\n.atv-hero-still.is-poster {\n  background-position: center 22%;\n  filter: blur(60px) saturate(1.25) brightness(0.78);\n  transform: scale(1.25);\n}\n@keyframes atv-kenburns {\n  from {\n    transform: scale(1) translate(0, 0);\n  }\n  to {\n    transform: scale(1.1) translate(-1.8%, -1.2%);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .atv-hero-still.is-hd.is-loaded {\n    transform: scale(1.04);\n    animation: none;\n  }\n}\n.atv-hero-vignette {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -3;\n  height: 75vh;\n  background: radial-gradient(\n    120% 90% at 70% 30%,\n    transparent 0%,\n    rgba(0, 0, 0, 0.55) 100%\n  );\n}\n.atv-hero-overlay-x {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -2;\n  height: 75vh;\n  background: linear-gradient(\n    to right,\n    rgba(0, 0, 0, 0.96) 0%,\n    rgba(0, 0, 0, 0.82) 32%,\n    rgba(0, 0, 0, 0.5) 62%,\n    rgba(0, 0, 0, 0.35) 100%\n  );\n}\n.atv-hero-overlay-y {\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  z-index: -1;\n  height: 75vh;\n  background: linear-gradient(\n    to bottom,\n    rgba(0, 0, 0, 0.45) 0%,\n    transparent 28%,\n    transparent 55%,\n    #000 100%\n  );\n}\n.atv-hero-inner {\n  display: flex;\n  gap: 56px;\n  align-items: flex-start;\n  width: 100%;\n  max-width: 1100px;\n  margin: 0 auto;\n}\n.atv-poster-card {\n  flex: 0 0 auto;\n  width: 360px;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-lg);\n  box-shadow:\n    0 24px 60px rgba(0, 0, 0, 0.6),\n    0 0 0 1px var(--atv-border-subtle) inset;\n  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-poster-card:hover {\n  transform: scale(1.03);\n}\n.atv-poster-card img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.atv-poster-placeholder {\n  width: 100%;\n  height: 100%;\n}\n\n.atv-hero-info {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n.atv-hero-title {\n  margin: 0 0 8px;\n  font-size: clamp(44px, 5.5vw, 72px);\n  font-weight: 700;\n  line-height: 1.05;\n  color: #fff;\n  letter-spacing: -0.02em;\n  text-shadow:\n    0 2px 20px rgba(0, 0, 0, 0.7),\n    0 0 60px rgba(0, 0, 0, 0.3);\n}\n.atv-hero-orig {\n  margin-bottom: 22px;\n  font-size: clamp(18px, 1.6vw, 22px);\n  font-weight: 400;\n  color: var(--atv-text-secondary);\n  letter-spacing: -0.01em;\n  opacity: 0.85;\n}\n.atv-hero-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px 14px;\n  align-items: center;\n  margin-bottom: 24px;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}\n.atv-meta-dot {\n  display: inline-flex;\n  align-items: center;\n}\n.atv-meta-dot + .atv-meta-dot::before {\n  margin-right: 14px;\n  color: var(--atv-text-tertiary);\n  content: \"·\";\n}\n.atv-meta-chips {\n  display: inline-flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n.atv-chip {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 11px;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-secondary);\n  text-transform: none;\n  letter-spacing: 0.02em;\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: 999px;\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n\n.atv-rating-row {\n  display: flex;\n  gap: 18px;\n  align-items: center;\n  margin-bottom: 28px;\n}\n.atv-rating-score {\n  font-family:\n    \"SF Pro Display\", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;\n  font-size: 56px;\n  font-weight: 700;\n  line-height: 1;\n  letter-spacing: -0.03em;\n}\n.atv-rating-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n.atv-rating-stars {\n  display: inline-flex;\n  gap: 2px;\n  color: var(--atv-rating-gold);\n}\n.atv-rating-stars svg {\n  display: block;\n}\n.atv-rating-count {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n.atv-rating-empty {\n  font-size: 14px;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.03em;\n}\n\n.atv-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-bottom: 26px;\n}\n.atv-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  height: 44px;\n  padding: 0 22px;\n  border-radius: 999px;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  border: none;\n  cursor: pointer;\n  transition:\n    transform 200ms ease,\n    background 200ms ease,\n    box-shadow 200ms ease,\n    color 200ms ease;\n  font-family: inherit;\n  -webkit-tap-highlight-color: transparent;\n}\n.atv-btn-primary {\n  color: #fff;\n  background: var(--atv-accent);\n  box-shadow: 0 8px 24px var(--atv-accent-glow);\n}\n.atv-btn-primary:hover {\n  background: var(--atv-accent-bright);\n  transform: translateY(-1px);\n}\n.atv-btn-secondary {\n  color: var(--atv-text-primary);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n.atv-btn-secondary:hover {\n  background: rgba(255, 255, 255, 0.12);\n  transform: translateY(-1px);\n}\n.atv-btn.is-active {\n  color: #fff;\n  background: var(--atv-accent);\n  border-color: transparent;\n  box-shadow: 0 6px 20px var(--atv-accent-glow);\n}\n\n.atv-hero-teaser {\n  max-width: 660px;\n  margin: 0 0 12px;\n  font-size: 15px;\n  line-height: 1.75;\n  color: var(--atv-text-secondary);\n  word-break: break-word;\n  white-space: pre-wrap;\n}\n.atv-hero-teaser.is-clamped {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n  -webkit-line-clamp: 3;\n}\n.atv-hero-more {\n  display: inline-flex;\n  gap: 6px;\n  align-items: center;\n  padding: 0;\n  font-family: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--atv-accent-bright);\n  letter-spacing: 0.02em;\n  cursor: pointer;\n  background: none;\n  border: none;\n}\n.atv-hero-more:hover {\n  color: var(--atv-accent);\n}\n.atv-hero-more svg {\n  transition: transform 220ms ease;\n}\n.atv-hero-more.is-open svg {\n  transform: rotate(180deg);\n}\n\n/* ---------- Section ---------- */\n.atv-section {\n  max-width: 1280px;\n  padding: 52px max(28px, 5vw);\n  margin: 0 auto;\n  scroll-margin-top: 64px;\n  animation: atv-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;\n}\n.atv-section + .atv-section {\n  padding-top: 0;\n}\n.atv-section-h {\n  position: relative;\n  display: flex;\n  align-items: center;\n  padding-left: 16px;\n  margin: 0 0 24px;\n  font-size: 24px;\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}\n.atv-section-h::before {\n  position: absolute;\n  top: 50%;\n  left: 0;\n  width: 4px;\n  height: 24px;\n  content: \"\";\n  background: var(--atv-accent);\n  border-radius: 2px;\n  transform: translateY(-50%);\n}\n.atv-section-h-row {\n  display: flex;\n  gap: 16px;\n  align-items: baseline;\n  justify-content: space-between;\n  margin-bottom: 24px;\n}\n.atv-section-h-row .atv-section-h {\n  margin-bottom: 0;\n}\n.atv-section-more {\n  flex: 0 0 auto;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  transition: color 200ms ease;\n}\n.atv-section-more:hover {\n  color: var(--atv-accent-bright);\n}\n\n/* ---------- Carousel ---------- */\n.atv-carousel {\n  display: flex;\n  gap: 16px;\n  overflow-x: auto;\n  scroll-snap-type: x mandatory;\n  scroll-behavior: smooth;\n  padding: 4px 4px 16px;\n  margin: 0 -4px;\n}\n.atv-carousel::-webkit-scrollbar {\n  display: none;\n}\n.atv-carousel {\n  scrollbar-width: none;\n}\n\n/* ---------- Page scrollbar ---------- */\n:root {\n  color-scheme: dark;\n}\n::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n}\n::-webkit-scrollbar-track {\n  background: #1c1c1e;\n}\n::-webkit-scrollbar-thumb {\n  background: #3a3a3c;\n  border-radius: 3px;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: #48484a;\n}\n::-webkit-scrollbar-corner {\n  background: transparent;\n}\n* {\n  scrollbar-color: #3a3a3c #1c1c1e;\n  scrollbar-width: thin;\n}\n\n/* ---------- Cast ---------- */\n.atv-cast-card {\n  flex: 0 0 132px;\n  text-align: center;\n  cursor: pointer;\n  scroll-snap-align: start;\n  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-cast-card:hover {\n  transform: translateY(-3px);\n}\n.atv-cast-avatar {\n  width: 132px;\n  height: 132px;\n  background-color: var(--atv-bg-tertiary);\n  background-position: center top;\n  background-size: cover;\n  border: 2px solid transparent;\n  border-radius: 50%;\n  transition:\n    transform 300ms ease,\n    border-color 300ms ease,\n    box-shadow 300ms ease;\n}\n.atv-cast-card:hover .atv-cast-avatar {\n  border-color: var(--atv-accent);\n  box-shadow: 0 8px 24px var(--atv-accent-glow);\n  transform: scale(1.05);\n}\n.atv-cast-name {\n  margin-top: 14px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.3;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n.atv-cast-role {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  margin-top: 4px;\n  overflow: hidden;\n  -webkit-line-clamp: 2;\n  font-size: 13px;\n  font-weight: 400;\n  line-height: 1.35;\n  color: var(--atv-text-tertiary);\n}\n\n/* ---------- Photos ---------- */\n.atv-photos {\n  gap: 12px;\n}\n.atv-photo-tile {\n  flex: 0 0 320px;\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n  cursor: pointer;\n  scroll-snap-align: start;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    filter 300ms ease;\n}\n.atv-photo-tile img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.atv-photo-tile:hover {\n  filter: brightness(1.1);\n  transform: scale(1.02);\n}\n\n/* ---------- Recommendations ---------- */\n.atv-recs {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));\n  gap: 24px;\n}\n.atv-rec-card {\n  cursor: pointer;\n}\n.atv-rec-poster {\n  width: 100%;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  background: var(--atv-bg-tertiary);\n  border-radius: var(--atv-radius-sm);\n  transition:\n    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),\n    box-shadow 300ms ease;\n}\n.atv-rec-poster img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n.atv-rec-card:hover .atv-rec-poster {\n  box-shadow: 0 12px 40px var(--atv-accent-glow);\n  transform: scale(1.05);\n}\n.atv-rec-title {\n  margin-top: 12px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n\n/* ---------- Info grid ---------- */\n.atv-info-grid {\n  display: grid;\n  grid-template-columns: 200px 1fr;\n  row-gap: 16px;\n  column-gap: 32px;\n}\n.atv-info-label {\n  padding-top: 2px;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n.atv-info-value {\n  font-size: 15px;\n  font-weight: 400;\n  line-height: 1.6;\n  color: var(--atv-text-primary);\n  word-break: break-word;\n}\n.atv-info-value a {\n  color: var(--atv-text-primary);\n  border-bottom: 1px solid var(--atv-border-medium);\n  transition:\n    color 200ms ease,\n    border-color 200ms ease;\n}\n.atv-info-value a:hover {\n  color: var(--atv-accent-bright);\n  border-color: var(--atv-accent-bright);\n}\n\n/* ---------- Streaming ---------- */\n.atv-stream-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.atv-stream-card {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  height: 52px;\n  padding: 0 20px;\n  border-radius: var(--atv-radius-md);\n  background: var(--atv-bg-elevated);\n  border: 1px solid var(--atv-border-medium);\n  color: var(--atv-text-primary);\n  font-size: 15px;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n  font-family: inherit;\n  -webkit-tap-highlight-color: transparent;\n  cursor: pointer;\n  transition:\n    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),\n    background 220ms ease,\n    border-color 220ms ease,\n    box-shadow 220ms ease;\n}\n.atv-stream-card:hover {\n  background: rgba(65, 190, 93, 0.14);\n  border-color: var(--atv-accent);\n  box-shadow: 0 10px 28px var(--atv-accent-glow);\n  transform: translateY(-2px);\n}\n.atv-stream-card .atv-stream-arrow {\n  display: inline-flex;\n  color: var(--atv-accent-bright);\n  transition: transform 220ms ease;\n}\n.atv-stream-card:hover .atv-stream-arrow {\n  transform: translateX(3px);\n}\n\n/* ---------- Comments ---------- */\n.atv-comments {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 18px;\n}\n.atv-comment-card {\n  display: flex;\n  flex-direction: column;\n  padding: 20px;\n  background: var(--atv-bg-secondary);\n  border: 1px solid var(--atv-border-subtle);\n  border-radius: var(--atv-radius-md);\n  transition:\n    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),\n    border-color 260ms ease;\n}\n.atv-comment-card:hover {\n  border-color: var(--atv-border-medium);\n  transform: translateY(-2px);\n}\n.atv-comment-top {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  margin-bottom: 14px;\n}\n.atv-comment-avatar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: 40px;\n  height: 40px;\n  overflow: hidden;\n  font-size: 17px;\n  font-weight: 600;\n  color: #fff;\n  background-color: var(--atv-accent);\n  background-position: center;\n  background-size: cover;\n  border-radius: 50%;\n}\n.atv-comment-meta {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n.atv-comment-author {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--atv-text-primary);\n  white-space: nowrap;\n}\n.atv-comment-stars {\n  display: inline-flex;\n  gap: 1px;\n  color: var(--atv-rating-gold);\n}\n.atv-comment-stars svg {\n  display: block;\n}\n.atv-comment-body {\n  display: -webkit-box;\n  flex: 1 1 auto;\n  -webkit-box-orient: vertical;\n  margin: 0 0 14px;\n  overflow: hidden;\n  -webkit-line-clamp: 4;\n  font-size: 15px;\n  line-height: 1.6;\n  color: var(--atv-text-secondary);\n  word-break: break-word;\n}\n.atv-comment-foot {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--atv-text-tertiary);\n  letter-spacing: 0.02em;\n}\n.atv-comment-votes {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n}\n\n/* ---------- Poster Modal ---------- */\n.atv-poster-card {\n  cursor: pointer;\n}\n.atv-modal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  pointer-events: none;\n  background: rgba(0, 0, 0, 0.92);\n  opacity: 0;\n  -webkit-backdrop-filter: blur(40px);\n  backdrop-filter: blur(40px);\n  transition: opacity 300ms ease;\n}\n.atv-modal-overlay.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n.atv-modal-img {\n  max-width: 90vw;\n  max-height: 90vh;\n  object-fit: contain;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.75);\n  transform: scale(0.92);\n  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);\n}\n.atv-modal-overlay.is-open .atv-modal-img {\n  transform: scale(1);\n}\n.atv-modal-close {\n  position: fixed;\n  top: 24px;\n  right: 24px;\n  z-index: 10001;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  color: #fff;\n  cursor: pointer;\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  border-radius: 50%;\n  transition:\n    background 200ms ease,\n    border-color 200ms ease;\n}\n.atv-modal-close:hover {\n  background: rgba(255, 255, 255, 0.16);\n  border-color: rgba(255, 255, 255, 0.3);\n}\n.atv-modal-close svg {\n  display: block;\n}\n\n/* ---------- Footer spacer ---------- */\n.atv-footer-spacer {\n  height: 64px;\n}\n\n/* ---------- Responsive ---------- */\n@media (max-width: 1024px) {\n  .atv-hero {\n    min-height: 64vh;\n    padding: 104px 24px 48px;\n  }\n  .atv-hero-inner {\n    flex-direction: column;\n    gap: 28px;\n    align-items: flex-start;\n  }\n  .atv-poster-card {\n    width: 220px;\n  }\n  .atv-section {\n    padding: 44px 24px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 160px 1fr;\n    column-gap: 24px;\n  }\n}\n@media (max-width: 768px) {\n  .atv-hero {\n    min-height: 56vh;\n    padding: 88px 20px 40px;\n  }\n  .atv-poster-card {\n    width: 180px;\n  }\n  .atv-section {\n    padding: 36px 20px;\n  }\n  .atv-info-grid {\n    grid-template-columns: 1fr;\n    row-gap: 4px;\n  }\n  .atv-info-label {\n    padding-top: 16px;\n  }\n  .atv-recs {\n    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n    gap: 18px;\n  }\n  .atv-cast-card {\n    flex-basis: 104px;\n  }\n  .atv-cast-avatar {\n    width: 104px;\n    height: 104px;\n  }\n  .atv-photo-tile {\n    flex-basis: 260px;\n  }\n  .atv-rating-score {\n    font-size: 44px;\n  }\n  .atv-comments {\n    grid-template-columns: 1fr;\n  }\n}\n");
	var $ = (selector, ctx) => (ctx ?? document).querySelector(selector);
	var $$ = (selector, ctx) => Array.from((ctx ?? document).querySelectorAll(selector));
	var safeText = (el) => el ? (el.textContent ?? "").trim() : "";
	function extractAwards() {
		return $$("ul.award").map((ul) => {
			const lis = $$("li", ul);
			const orgEl = lis[0] ? $("a", lis[0]) : null;
			const org = lis[0] ? safeText(lis[0]) : "";
			const name = lis[1] ? safeText(lis[1]) : "";
			const personEl = lis[2] ? $("a", lis[2]) : null;
			const person = lis[2] ? safeText(lis[2]) : "";
			return {
				org,
				orgLink: orgEl ? orgEl.href : "",
				name,
				person,
				personLink: personEl ? personEl.href : ""
			};
		}).filter((a) => a.org);
	}
	var RE_SLASH_SEP = /\s*\/\s*/g;
	var RE_WS_GLOBAL = /\s+/g;
	var RE_COLON_WS = /[:：\s]/g;
	var RE_YEAR_TRAIL = /\(\d{4}\)\s*$/;
	var RE_WS = /\s+/;
	var RE_YEAR = /(\d{4})/;
	var RE_NON_DIGIT = /\D/g;
	var RE_WS_NL = /\s+\n/g;
	var RE_HSPACE = /[ \t]+/g;
	var RE_NL_MULTI = /\n{3,}/g;
	var RE_IMDB_ID = /(tt\d+)/;
	var RE_BG_URL = /url\(["']?([^"')]+)["']?\)/;
	var RE_SUBJECT_ID = /subject\/(\d+)/;
	var RE_ALLSTAR = /allstar(\d{2})/;
	var RE_HTTP = /^https?:\/\//;
	var RE_ONLINE_VIDEO = /online-video/;
	var RE_WISH = /想看/;
	var RE_COLLECT = /看过/;
	var RE_WISH_EXACT = /^想看$/;
	var RE_COLLECT_EXACT = /^看过$/;
	var RE_INTEREST_ACTIVE = /done|active|on\b|j_a\b/;
	var RE_IMDB_LINK = /^tt\d+$/;
	var RE_SEASON_SUFFIX = /\d$/;
	var RE_PLAY_SOURCES = /sources\[(\d+)\]\s*=\s*\[\s*\{play_link:\s*"([^"]+)"/g;
	var RE_SOURCES_SCRIPT = /\bsources\s*\[/;
	var ICON_STAR_FULL = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z\"/></svg>";
	var ICON_STAR_HALF = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><defs><linearGradient id=\"atvHalfStar\"><stop offset=\"50%\" stop-color=\"currentColor\"/><stop offset=\"50%\" stop-color=\"currentColor\" stop-opacity=\"0.22\"/></linearGradient></defs><path fill=\"url(#atvHalfStar)\" d=\"M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z\"/></svg>";
	var ICON_STAR_EMPTY = "<svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" aria-hidden=\"true\"><path fill=\"currentColor\" fill-opacity=\"0.22\" d=\"M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z\"/></svg>";
	var ICON_PLAY = "<svg viewBox=\"0 0 14 14\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z\"/></svg>";
	var ICON_CHECK = "<svg viewBox=\"0 0 14 14\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.5 7.5l3 3 6-7\"/></svg>";
	var ICON_CHEVRON = "<svg viewBox=\"0 0 12 12\" width=\"10\" height=\"10\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.5 4l3.5 4 3.5-4\"/></svg>";
	var ICON_ARROW = "<svg viewBox=\"0 0 16 16\" width=\"15\" height=\"15\" aria-hidden=\"true\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5\"/></svg>";
	var ICON_THUMB = "<svg viewBox=\"0 0 16 16\" width=\"13\" height=\"13\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z\"/></svg>";
	var ICON_FILM_PLACEHOLDER = "<svg viewBox=\"0 0 64 96\" width=\"100%\" height=\"100%\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"atvFilmGrad\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#2c2c2e\"/><stop offset=\"100%\" stop-color=\"#1c1c1e\"/></linearGradient></defs><rect width=\"64\" height=\"96\" fill=\"url(#atvFilmGrad)\"/><g fill=\"rgba(255,255,255,0.12)\"><rect x=\"4\" y=\"6\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"18\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"30\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"42\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"54\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"66\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"78\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"6\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"18\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"30\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"42\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"54\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"66\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"54\" y=\"78\" width=\"6\" height=\"6\" rx=\"1\"/></g><path d=\"M26 38l14 10-14 10z\" fill=\"rgba(255,255,255,0.28)\"/></svg>";
	var upgradePoster = (url) => {
		if (!url) return null;
		return url.replace("/s_ratio_poster/", "/l_ratio_poster/").replace("s_ratio_poster", "l_ratio_poster");
	};
	var upgradePhoto = (url) => {
		if (!url) return null;
		return url.replace("/sqxs/", "/large/").replace("/m/", "/l/");
	};
	function extractTitle() {
		const h1 = $("#content h1");
		const full = safeText($("span[property=\"v:itemreviewed\"]", h1 ?? void 0)) || safeText(h1).replace(RE_YEAR_TRAIL, "").trim();
		let primary = full;
		let original = "";
		const idx = full.search(RE_WS);
		if (idx > 0) {
			primary = full.slice(0, idx).trim();
			original = full.slice(idx).trim();
		}
		return {
			full,
			primary,
			original
		};
	}
	function extractYear() {
		const m = safeText($("#content h1 .year")).match(RE_YEAR);
		return m ? m[1] : "";
	}
	function extractPoster() {
		const img = $("#mainpic img") || $("a.nbgnbg img");
		if (!img) return null;
		return upgradePoster(img.src || img.getAttribute("data-src") || "");
	}
	function extractSubjectId() {
		const m = location.pathname.match(RE_SUBJECT_ID);
		return m ? m[1] : "";
	}
	function findLabel(root, label) {
		if (!root) return null;
		const spans = $$("span.pl", root);
		for (const s of spans) if ((s.textContent || "").replace(RE_COLON_WS, "") === label) return s;
		return null;
	}
	function collectInfoTextAfter(root, label, trim) {
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
	}
	function collectLinksAfter(root, label) {
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
						text: t,
						href: a.href || ""
					});
				}
			}
			n = n.nextSibling;
		}
		return out;
	}
	function extractInfo() {
		const info = $("#info");
		const out = {
			director: [],
			writers: [],
			cast: [],
			genres: [],
			country: "",
			language: "",
			releaseDate: "",
			firstAired: "",
			runtime: "",
			episodes: "",
			seasons: "",
			episodeRuntime: "",
			aliases: "",
			imdb: ""
		};
		if (!info) return out;
		out.director = collectLinksAfter(info, "导演");
		out.writers = collectLinksAfter(info, "编剧");
		const starringEls = $$("a[rel=\"v:starring\"]", info);
		if (starringEls.length) out.cast = starringEls.map((a) => ({
			text: (a.textContent || "").trim(),
			href: a.href || ""
		})).filter((x) => x.text);
		else out.cast = collectLinksAfter(info, "主演");
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
	}
	function extractCelebrities() {
		return $$("#celebrities li.celebrity").map((li) => {
			const nameEl = $(".info .name a", li) ?? $(".info .name", li);
			const roleEl = $(".info .role", li);
			const avatarEl = $(".avatar", li);
			let avatar = "";
			if (avatarEl) {
				const m = (avatarEl.getAttribute("style") || "").match(RE_BG_URL);
				if (m) avatar = m[1];
			}
			return {
				name: safeText(nameEl),
				role: safeText(roleEl),
				avatar,
				link: nameEl && nameEl.tagName === "A" ? nameEl.href : ""
			};
		}).filter((c) => c.name);
	}
	function extractPhotos() {
		return $$("#related-pic .related-pic-bd img").map((img) => {
			const thumb = img.src || img.getAttribute("data-src") || "";
			const a = img.closest("a");
			return {
				thumbUrl: thumb,
				hdUrl: upgradePhoto(thumb) || "",
				link: a ? a.href : ""
			};
		}).filter((p) => p.thumbUrl);
	}
	function extractRating() {
		const raw = safeText($("strong.rating_num") || $("strong[property=\"v:average\"]"));
		const score = raw ? Number.parseFloat(raw) : NaN;
		if (!score || Number.isNaN(score) || score <= 0) return null;
		const votesEl = $("span[property=\"v:votes\"]") || $(".rating_people span");
		return {
			score,
			count: votesEl ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0 : 0
		};
	}
	function extractSummary() {
		const summary = $("span[property=\"v:summary\"]");
		if (!summary) return null;
		let txt = (summary.textContent || "").trim();
		txt = txt.replace(RE_WS_NL, "\n").replace(RE_HSPACE, " ").replace(RE_NL_MULTI, "\n\n").trim();
		return txt || null;
	}
	function extractRecommendations() {
		return $$(".recommendations-bd dl").map((dl) => {
			const linkEl = $("dt a", dl);
			const imgEl = $("dt a img", dl);
			return {
				title: safeText($("dd a", dl)),
				poster: imgEl ? imgEl.src || imgEl.getAttribute("data-src") || "" : "",
				link: linkEl ? linkEl.href : ""
			};
		}).filter((r) => r.title);
	}
	function extractComments() {
		const items = $$("#hot-comments .comment-item");
		const out = [];
		for (const item of items) {
			const authorEl = $(".comment-info a", item);
			const name = safeText(authorEl);
			if (!name) continue;
			const content = safeText($(".short", item) ?? $(".comment-content", item));
			if (!content) continue;
			const ratingEl = $("[class*=\"allstar\"]", item);
			let stars = 0;
			let ratingWord = "";
			if (ratingEl) {
				const rm = (ratingEl.className || "").match(RE_ALLSTAR);
				if (rm) stars = Number.parseInt(rm[1], 10) / 10;
				ratingWord = ratingEl.getAttribute("title") || "";
			}
			const timeEl = $(".comment-time", item);
			const time = timeEl ? timeEl.getAttribute("title") || safeText(timeEl) : "";
			const votesEl = $(".vote-count", item) ?? $(".votes", item);
			const votes = votesEl ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0 : 0;
			const avatarImg = $(".avatar img", item);
			let avatar = "";
			if (avatarImg) avatar = avatarImg.src || avatarImg.getAttribute("data-original") || avatarImg.getAttribute("data-src") || "";
			out.push({
				name,
				link: authorEl && authorEl.tagName === "A" ? authorEl.href : "",
				content,
				stars,
				ratingWord,
				time,
				votes,
				avatar
			});
		}
		return out;
	}
	function parsePlaySources() {
		const srcScript = $$("script:not([src])").find((s) => RE_SOURCES_SCRIPT.test(s.textContent || ""));
		if (!srcScript) return {};
		const txt = srcScript.textContent;
		const map = {};
		let m = RE_PLAY_SOURCES.exec(txt);
		while (m) {
			const sourceId = m[1];
			const playLink = m[2].replace(/&amp;/g, "&");
			if (!map[sourceId]) map[sourceId] = playLink;
			m = RE_PLAY_SOURCES.exec(txt);
		}
		return map;
	}
	function extractStreaming() {
		const seen = new Set();
		const out = [];
		const isRealUrl = (h) => RE_HTTP.test(h || "");
		const sourcesMap = parsePlaySources();
		const playBtns = $$("a.playBtn");
		for (const a of playBtns) {
			const name = (a.getAttribute("data-cn") || a.textContent || "").trim();
			if (!name || seen.has(name)) continue;
			seen.add(name);
			let href = a.href;
			if (!isRealUrl(href)) {
				const sourceId = a.getAttribute("data-source");
				if (sourceId && sourcesMap[sourceId]) href = sourcesMap[sourceId];
				else continue;
			}
			out.push({
				name,
				href
			});
		}
		for (const a of $$("a")) {
			if (!RE_ONLINE_VIDEO.test(a.href || "")) continue;
			const name = (a.getAttribute("data-cn") || a.textContent || "").trim();
			if (!name || seen.has(name)) continue;
			seen.add(name);
			if (isRealUrl(a.href)) out.push({
				name,
				href: a.href
			});
		}
		return out;
	}
	function findInterestButtons() {
		const result = {
			wish: null,
			collect: null
		};
		const root = $("#interest_sect_level") || $("#interest_sectl");
		const anchors = root ? $$("a", root) : [];
		for (const a of anchors) {
			const t = (a.textContent || "").trim();
			if (!result.wish && RE_WISH.test(t)) result.wish = a;
			if (!result.collect && RE_COLLECT.test(t)) result.collect = a;
		}
		if (!(result.wish && result.collect)) {
			const all = $$("#interest_sectl a");
			for (const a of all) {
				const t = (a.textContent || "").trim();
				if (!result.wish && RE_WISH_EXACT.test(t)) result.wish = a;
				if (!result.collect && RE_COLLECT_EXACT.test(t)) result.collect = a;
			}
		}
		return result;
	}
	function isInterestActive(anchor) {
		if (!anchor) return false;
		const cls = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
		return RE_INTEREST_ACTIVE.test(cls);
	}
	function el(tag, attrs, children) {
		const node = document.createElement(tag);
		if (attrs) {
			if (attrs.className) node.className = Array.isArray(attrs.className) ? attrs.className.join(" ") : attrs.className;
			else if (attrs.class) node.className = Array.isArray(attrs.class) ? attrs.class.join(" ") : attrs.class;
			if (attrs.id != null) node.id = attrs.id;
			if (attrs.textContent != null) node.textContent = attrs.textContent;
			if (attrs.text != null) node.textContent = attrs.text;
			if (attrs.html != null) node.innerHTML = attrs.html;
			if (attrs.href != null) node.setAttribute("href", attrs.href);
			if (attrs.src != null) node.setAttribute("src", attrs.src);
			if (attrs.alt != null) node.setAttribute("alt", attrs.alt);
			if (attrs.target != null) node.setAttribute("target", attrs.target);
			if (attrs.rel != null) node.setAttribute("rel", attrs.rel);
			if (attrs.type != null) node.setAttribute("type", attrs.type);
			if (attrs.attrs) for (const k of Object.keys(attrs.attrs)) node.setAttribute(k, attrs.attrs[k]);
			if (attrs.style) for (const k of Object.keys(attrs.style)) node.style.setProperty(k, attrs.style[k]);
			if (attrs.onclick) node.addEventListener("click", attrs.onclick);
		}
		if (children) for (const child of children) if (typeof child === "string") node.appendChild(document.createTextNode(child));
		else node.appendChild(child);
		return node;
	}
	function renderStars(score, opts) {
		const o = opts || {};
		const wrap = el("span", { className: o.className || "atv-rating-stars" });
		const out = o.outOfFive ? score : score / 2;
		for (let i = 1; i <= 5; i++) {
			let svg;
			if (out >= i - .25) svg = ICON_STAR_FULL;
			else if (out >= i - .75) svg = ICON_STAR_HALF;
			else svg = ICON_STAR_EMPTY;
			wrap.appendChild(el("span", { html: svg }));
		}
		return wrap;
	}
	function openPosterModal(src, alt) {
		const old = document.getElementById("atv-poster-modal");
		if (old) old.remove();
		const overlay = el("div", {
			className: "atv-modal-overlay",
			id: "atv-poster-modal"
		});
		const img = el("img", {
			className: "atv-modal-img",
			src,
			alt: alt || ""
		});
		const close = el("button", {
			className: "atv-modal-close",
			attrs: { type: "button" },
			html: "<svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M6 6l12 12M18 6l-12 12\"/></svg>"
		});
		const dismiss = () => {
			overlay.classList.remove("is-open");
			document.body.style.overflow = "";
			setTimeout(() => {
				if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
			}, 350);
		};
		close.addEventListener("click", dismiss);
		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) dismiss();
		});
		document.addEventListener("keydown", function handler(e) {
			if (e.key === "Escape") {
				dismiss();
				document.removeEventListener("keydown", handler);
			}
		});
		overlay.appendChild(img);
		overlay.appendChild(close);
		document.body.appendChild(overlay);
		document.body.style.overflow = "hidden";
		requestAnimationFrame(() => overlay.classList.add("is-open"));
	}
	var hashStr = (str) => {
		let h = 0;
		for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000000007;
		return h;
	};
	function pickStill(photos, seed) {
		if (!photos?.length) return null;
		return photos[hashStr(String(seed || "")) % photos.length];
	}
	function buildHeroBg(data) {
		const bg = el("div", { className: "atv-hero-bg" });
		const still = pickStill(data.photos, data.subjectId);
		if (still?.hdUrl) {
			const thumb = el("div", { className: "atv-hero-still is-thumb" });
			thumb.style.backgroundImage = `url("${encodeURI(still.thumbUrl || still.hdUrl)}")`;
			bg.appendChild(thumb);
			const hd = el("div", { className: "atv-hero-still is-hd" });
			hd.setAttribute("aria-hidden", "true");
			bg.appendChild(hd);
			const loader = new Image();
			loader.onload = () => {
				hd.style.backgroundImage = `url("${encodeURI(still.hdUrl)}")`;
				requestAnimationFrame(() => hd.classList.add("is-loaded"));
			};
			loader.onerror = (e) => {
				console.error("[Hero] HD still FAILED:", still.hdUrl, e);
				if (still.thumbUrl && still.thumbUrl !== still.hdUrl) {
					hd.style.backgroundImage = `url("${encodeURI(still.thumbUrl)}")`;
					requestAnimationFrame(() => hd.classList.add("is-loaded"));
				}
			};
			loader.src = still.hdUrl;
			return bg;
		}
		if (data.poster) {
			const poster = el("div", { className: "atv-hero-still is-poster" });
			poster.style.backgroundImage = `url("${encodeURI(data.poster)}")`;
			bg.appendChild(poster);
			return bg;
		}
		bg.style.background = "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)";
		return bg;
	}
	function buildHero(data) {
		const hero = el("section", { className: "atv-hero" });
		hero.appendChild(buildHeroBg(data));
		hero.appendChild(el("div", { className: "atv-hero-vignette" }));
		hero.appendChild(el("div", { className: "atv-hero-overlay-x" }));
		hero.appendChild(el("div", { className: "atv-hero-overlay-y" }));
		const inner = el("div", { className: "atv-hero-inner" });
		const card = el("div", { className: "atv-poster-card" });
		if (data.poster) {
			const img = el("img", {
				src: data.poster,
				alt: data.title.primary || ""
			});
			img.onerror = (e) => {
				console.error("[buildHero] Poster card img FAILED:", data.poster, e);
				card.innerHTML = "";
				const ph = el("div", {
					className: "atv-poster-placeholder",
					html: ICON_FILM_PLACEHOLDER
				});
				card.appendChild(ph);
			};
			card.appendChild(img);
		} else card.appendChild(el("div", {
			className: "atv-poster-placeholder",
			html: ICON_FILM_PLACEHOLDER
		}));
		card.addEventListener("click", () => {
			if (data.poster) openPosterModal(data.poster, data.title.primary || "");
		});
		inner.appendChild(card);
		const info = el("div", { className: "atv-hero-info" });
		const title = el("h1", {
			className: "atv-hero-title",
			text: data.title.primary || data.title.full
		});
		info.appendChild(title);
		if (data.title.original) info.appendChild(el("div", {
			className: "atv-hero-orig",
			text: data.title.original
		}));
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
		for (const part of metaParts) meta.appendChild(el("span", {
			className: "atv-meta-dot",
			text: part
		}));
		if (data.info.genres?.length) {
			const chips = el("span", { className: "atv-meta-chips" });
			for (const g of data.info.genres) chips.appendChild(el("span", {
				className: "atv-chip",
				text: g
			}));
			meta.appendChild(chips);
		}
		info.appendChild(meta);
		const ratingRow = el("div", { className: "atv-rating-row" });
		if (data.rating) {
			ratingRow.appendChild(el("div", {
				className: "atv-rating-score",
				text: data.rating.score.toFixed(1)
			}));
			const ratingMeta = el("div", { className: "atv-rating-meta" });
			ratingMeta.appendChild(renderStars(data.rating.score));
			const countTxt = data.rating.count ? `评价 ${data.rating.count.toLocaleString("en-US")}` : "已评分";
			ratingMeta.appendChild(el("div", {
				className: "atv-rating-count",
				text: countTxt
			}));
			ratingRow.appendChild(ratingMeta);
		} else ratingRow.appendChild(el("div", {
			className: "atv-rating-empty",
			text: "暂无评分"
		}));
		info.appendChild(ratingRow);
		const actions = el("div", { className: "atv-actions" });
		const interest = findInterestButtons();
		const wishBtn = el("button", {
			className: "atv-btn atv-btn-primary",
			attrs: { type: "button" }
		});
		wishBtn.appendChild(el("span", { html: ICON_PLAY }));
		wishBtn.appendChild(el("span", { text: "想看" }));
		if (isInterestActive(interest.wish)) wishBtn.classList.add("is-active");
		wishBtn.addEventListener("click", () => {
			if (interest.wish) interest.wish.click();
		});
		actions.appendChild(wishBtn);
		const seenBtn = el("button", {
			className: "atv-btn atv-btn-secondary",
			attrs: { type: "button" }
		});
		seenBtn.appendChild(el("span", { html: ICON_CHECK }));
		seenBtn.appendChild(el("span", { text: "看过" }));
		if (isInterestActive(interest.collect)) seenBtn.classList.add("is-active");
		seenBtn.addEventListener("click", () => {
			if (interest.collect) interest.collect.click();
		});
		actions.appendChild(seenBtn);
		info.appendChild(actions);
		if (data.summary) {
			const teaser = el("p", {
				className: "atv-hero-teaser is-clamped",
				text: data.summary
			});
			info.appendChild(teaser);
			const more = el("button", {
				className: "atv-hero-more",
				attrs: { type: "button" }
			});
			const moreLabel = el("span", { text: "展开" });
			more.appendChild(moreLabel);
			more.appendChild(el("span", { html: ICON_CHEVRON }));
			more.addEventListener("click", () => {
				const open = teaser.classList.toggle("is-clamped") === false;
				more.classList.toggle("is-open", open);
				moreLabel.textContent = open ? "收起" : "展开";
			});
			requestAnimationFrame(() => {
				if (!(teaser.scrollHeight - teaser.clientHeight > 4)) more.style.display = "none";
			});
			info.appendChild(more);
		}
		inner.appendChild(info);
		hero.appendChild(inner);
		return hero;
	}
	function buildSectionHeader(text) {
		return el("h2", {
			className: "atv-section-h",
			text
		});
	}
	function buildSectionHeaderRow(text, moreText, moreHref) {
		const row = el("div", { className: "atv-section-h-row" });
		row.appendChild(buildSectionHeader(text));
		if (moreText && moreHref) row.appendChild(el("a", {
			className: "atv-section-more",
			text: moreText,
			href: moreHref,
			target: "_blank",
			rel: "noopener"
		}));
		return row;
	}
	function buildStreaming(data) {
		if (!data.streaming?.length) return null;
		const sec = el("section", {
			className: "atv-section",
			id: "atv-stream"
		});
		sec.appendChild(buildSectionHeader("在哪儿看"));
		const row = el("div", { className: "atv-stream-row" });
		for (const s of data.streaming) {
			const card = el("a", {
				className: "atv-stream-card",
				href: s.href,
				target: "_blank",
				rel: "noopener"
			});
			card.appendChild(el("span", { text: s.name }));
			card.appendChild(el("span", {
				className: "atv-stream-arrow",
				html: ICON_ARROW
			}));
			row.appendChild(card);
		}
		sec.appendChild(row);
		return sec;
	}
	function buildComments(data) {
		if (!data.comments?.length) return null;
		const sec = el("section", {
			className: "atv-section",
			id: "atv-comments"
		});
		const allHref = data.subjectId ? "https://movie.douban.com/subject/" + data.subjectId + "/comments?status=P" : "";
		sec.appendChild(buildSectionHeaderRow("热门短评", allHref ? "查看全部 →" : "", allHref));
		const grid = el("div", { className: "atv-comments" });
		for (const c of data.comments) {
			const card = el("div", { className: "atv-comment-card" });
			const top = el("div", { className: "atv-comment-top" });
			const avatar = el("div", { className: "atv-comment-avatar" });
			if (c.avatar) avatar.style.backgroundImage = `url("${encodeURI(c.avatar)}")`;
			else avatar.textContent = (c.name || "?").slice(0, 1).toUpperCase();
			top.appendChild(avatar);
			const metaCol = el("div", { className: "atv-comment-meta" });
			const author = el(c.link ? "a" : "div", {
				className: "atv-comment-author",
				text: c.name,
				href: c.link || void 0,
				target: c.link ? "_blank" : void 0,
				rel: c.link ? "noopener" : void 0
			});
			metaCol.appendChild(author);
			if (c.stars > 0) metaCol.appendChild(renderStars(c.stars, {
				outOfFive: true,
				className: "atv-comment-stars"
			}));
			top.appendChild(metaCol);
			card.appendChild(top);
			card.appendChild(el("div", {
				className: "atv-comment-body",
				text: c.content
			}));
			const foot = el("div", { className: "atv-comment-foot" });
			foot.appendChild(el("span", { text: c.time || "" }));
			if (c.votes > 0) {
				const votes = el("span", { className: "atv-comment-votes" });
				votes.appendChild(el("span", {
					className: "atv-stream-arrow",
					html: ICON_THUMB
				}));
				votes.appendChild(el("span", { text: c.votes.toLocaleString("en-US") }));
				foot.appendChild(votes);
			}
			card.appendChild(foot);
			grid.appendChild(card);
		}
		sec.appendChild(grid);
		return sec;
	}
	function buildCast(data) {
		if (!data.celebrities?.length) return null;
		const sec = el("section", {
			className: "atv-section",
			id: "atv-cast"
		});
		sec.appendChild(buildSectionHeader("演职员"));
		const carousel = el("div", { className: "atv-carousel" });
		for (const c of data.celebrities) {
			const card = el(c.link ? "a" : "div", {
				className: "atv-cast-card",
				href: c.link || void 0,
				target: c.link ? "_blank" : void 0,
				rel: c.link ? "noopener" : void 0
			});
			const av = el("div", { className: "atv-cast-avatar" });
			if (c.avatar) av.style.backgroundImage = `url("${encodeURI(c.avatar)}")`;
			card.appendChild(av);
			card.appendChild(el("div", {
				className: "atv-cast-name",
				text: c.name
			}));
			if (c.role) card.appendChild(el("div", {
				className: "atv-cast-role",
				text: c.role
			}));
			carousel.appendChild(card);
		}
		sec.appendChild(carousel);
		return sec;
	}
	function buildPhotos(data) {
		if (!data.photos?.length) return null;
		const sec = el("section", {
			className: "atv-section",
			id: "atv-photos"
		});
		sec.appendChild(buildSectionHeader("剧照"));
		const carousel = el("div", { className: "atv-carousel atv-photos" });
		for (const p of data.photos) {
			const tile = el(p.link ? "a" : "div", p.link ? {
				className: "atv-photo-tile",
				href: p.link,
				target: "_blank",
				rel: "noopener"
			} : { className: "atv-photo-tile" });
			const img = el("img", {
				src: p.hdUrl || p.thumbUrl,
				alt: "剧照"
			});
			img.loading = "lazy";
			img.onerror = () => {
				if (p.thumbUrl && img.src !== p.thumbUrl) img.src = p.thumbUrl;
			};
			tile.appendChild(img);
			carousel.appendChild(tile);
		}
		sec.appendChild(carousel);
		return sec;
	}
	function buildRecs(data) {
		if (!data.recommendations?.length) return null;
		const sec = el("section", {
			className: "atv-section",
			id: "atv-recs"
		});
		sec.appendChild(buildSectionHeader("相似作品"));
		const grid = el("div", { className: "atv-recs" });
		for (const r of data.recommendations) {
			const card = el(r.link ? "a" : "div", { className: "atv-rec-card" });
			if (r.link && card instanceof HTMLAnchorElement) {
				card.href = r.link;
				card.target = "_blank";
				card.rel = "noopener";
			}
			const posterWrap = el("div", { className: "atv-rec-poster" });
			if (r.poster) {
				const img = el("img", {
					src: r.poster,
					alt: r.title
				});
				img.loading = "lazy";
				img.onerror = () => {
					posterWrap.innerHTML = "";
					posterWrap.appendChild(el("div", {
						className: "atv-poster-placeholder",
						html: ICON_FILM_PLACEHOLDER
					}));
				};
				posterWrap.appendChild(img);
			} else posterWrap.appendChild(el("div", {
				className: "atv-poster-placeholder",
				html: ICON_FILM_PLACEHOLDER
			}));
			card.appendChild(posterWrap);
			card.appendChild(el("div", {
				className: "atv-rec-title",
				text: r.title
			}));
			grid.appendChild(card);
		}
		sec.appendChild(grid);
		return sec;
	}
	function buildDetails(data) {
		const sec = el("section", {
			className: "atv-section",
			id: "atv-info"
		});
		sec.appendChild(buildSectionHeader("详细信息"));
		const grid = el("div", { className: "atv-info-grid" });
		const linksValue = (arr) => {
			const wrap = el("div", { className: "atv-info-value" });
			arr.forEach((it, i) => {
				if (i > 0) wrap.appendChild(document.createTextNode(" / "));
				if (it.href) wrap.appendChild(el("a", {
					href: it.href,
					text: it.text,
					target: "_blank",
					rel: "noopener"
				}));
				else wrap.appendChild(document.createTextNode(it.text));
			});
			return wrap;
		};
		const textValue = (txt) => el("div", {
			className: "atv-info-value",
			text: txt
		});
		const addRow = (label, valueNode) => {
			grid.appendChild(el("div", {
				className: "atv-info-label",
				text: label
			}));
			grid.appendChild(valueNode);
		};
		const info = data.info;
		if (info.director?.length) addRow("导演", linksValue(info.director));
		if (info.writers?.length) addRow("编剧", linksValue(info.writers));
		if (info.cast?.length) addRow("主演", linksValue(info.cast));
		if (info.genres?.length) addRow("类型", textValue(info.genres.join(" / ")));
		if (info.country) addRow("制片国家/地区", textValue(info.country));
		if (info.language) addRow("语言", textValue(info.language));
		if (data.isTV) {
			if (info.firstAired) addRow("首播", textValue(info.firstAired));
			else if (info.releaseDate) addRow("首播", textValue(info.releaseDate));
			if (info.seasons) addRow("季数", textValue(info.seasons));
			if (info.episodes) addRow("集数", textValue(info.episodes));
			if (info.episodeRuntime) addRow("单集片长", textValue(info.episodeRuntime));
		} else {
			if (info.releaseDate) addRow("上映日期", textValue(info.releaseDate));
			if (info.runtime) addRow("片长", textValue(info.runtime));
		}
		if (info.aliases) addRow("又名", textValue(info.aliases));
		if (info.imdb) {
			const wrap = el("div", { className: "atv-info-value" });
			if (RE_IMDB_LINK.test(info.imdb)) wrap.appendChild(el("a", {
				href: `https://www.imdb.com/title/${info.imdb}/`,
				text: info.imdb,
				target: "_blank",
				rel: "noopener"
			}, [el("span", { html: ICON_ARROW })]));
			else wrap.textContent = info.imdb;
			addRow("IMDb", wrap);
		}
		if (data.awards?.length) for (const a of data.awards) {
			const value = el("div", { className: "atv-info-value" });
			if (a.name) value.appendChild(el("div", { text: a.name }));
			if (a.person) {
				const personLine = el("div", { attrs: { style: "font-size:13px;color:var(--atv-text-tertiary);margin-top:2px" } });
				if (a.personLink) personLine.appendChild(el("a", {
					text: a.person,
					href: a.personLink,
					target: "_blank",
					rel: "noopener"
				}));
				else personLine.textContent = a.person;
				value.appendChild(personLine);
			}
			const label = el("div", {
				className: "atv-info-label",
				attrs: { style: "color:var(--atv-rating-gold)" }
			});
			if (a.orgLink) label.appendChild(el("a", {
				text: a.org,
				href: a.orgLink,
				target: "_blank",
				rel: "noopener",
				attrs: { style: "color:inherit" }
			}));
			else label.textContent = a.org;
			grid.appendChild(label);
			grid.appendChild(value);
		}
		if (!grid.children.length) return null;
		sec.appendChild(grid);
		return sec;
	}
	function buildStickyNav(data) {
		const nav = el("nav", { className: "atv-stickynav" });
		nav.appendChild(el("div", {
			className: "atv-stickynav-title",
			text: data.title.primary || data.title.full
		}));
		const jumps = [];
		if (data.streaming.length > 0) jumps.push({
			id: "atv-stream",
			label: "在哪儿看"
		});
		if (data.celebrities.length > 0) jumps.push({
			id: "atv-cast",
			label: "演职员"
		});
		if (data.photos.length > 0) jumps.push({
			id: "atv-photos",
			label: "剧照"
		});
		if (data.comments.length > 0) jumps.push({
			id: "atv-comments",
			label: "短评"
		});
		if (data.recommendations.length > 0) jumps.push({
			id: "atv-recs",
			label: "相似作品"
		});
		jumps.push({
			id: "atv-info",
			label: "详情"
		});
		const wrap = el("div", { className: "atv-stickynav-jumps" });
		for (const j of jumps) {
			const a = el("a", {
				href: `#${j.id}`,
				text: j.label
			});
			a.addEventListener("click", (e) => {
				e.preventDefault();
				const t = document.getElementById(j.id);
				if (t) t.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			});
			wrap.appendChild(a);
		}
		nav.appendChild(wrap);
		return nav;
	}
	function render() {
		if (document.getElementById("atv-douban-root")) return;
		if (!document.querySelector("#content h1")) {
			console.warn("[ATV-Douban] 未找到内容区域，跳过渲染");
			return;
		}
		let data;
		try {
			const info = extractInfo();
			const isTV = !!(info.episodes || info.seasons || info.episodeRuntime || info.firstAired);
			data = {
				subjectId: extractSubjectId(),
				title: extractTitle(),
				year: extractYear(),
				poster: extractPoster(),
				rating: extractRating(),
				summary: extractSummary(),
				info,
				celebrities: extractCelebrities(),
				photos: extractPhotos(),
				recommendations: extractRecommendations(),
				comments: extractComments(),
				awards: extractAwards(),
				streaming: extractStreaming(),
				isTV
			};
		} catch (err) {
			console.warn("[ATV-Douban] 数据提取失败：", err);
			return;
		}
		const root = el("div", { id: "atv-douban-root" });
		document.title = (data.title.primary || data.title.full) + (data.year ? ` (${data.year})` : "") + " · 豆瓣";
		const stickyNav = buildStickyNav(data);
		root.appendChild(buildHero(data));
		const streaming = buildStreaming(data);
		if (streaming) root.appendChild(streaming);
		const cast = buildCast(data);
		if (cast) root.appendChild(cast);
		const photos = buildPhotos(data);
		if (photos) root.appendChild(photos);
		const comments = buildComments(data);
		if (comments) root.appendChild(comments);
		const recs = buildRecs(data);
		if (recs) root.appendChild(recs);
		const details = buildDetails(data);
		if (details) root.appendChild(details);
		root.appendChild(el("div", { className: "atv-footer-spacer" }));
		document.body.insertBefore(root, document.body.firstChild);
		document.body.appendChild(stickyNav);
		const reveal = () => {
			const y = window.scrollY || window.pageYOffset || 0;
			stickyNav.classList.toggle("is-visible", y > 300);
		};
		window.addEventListener("scroll", reveal, { passive: true });
		reveal();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
	else render();
})();
