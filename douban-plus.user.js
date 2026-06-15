// ==UserScript==
// @name         Douban Plus
// @namespace    https://github.com/zhujiayou/douban-appletv-beautify
// @version      1.0.0
// @description  将豆瓣电影/电视剧详情页重塑为 Apple TV+ 风格的高级沉浸式页面，保留豆瓣绿作为强调色
// @author       Sisyphus
// @match        *://movie.douban.com/subject/*
// @run-at       document-end
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const addStyle = (css) => {
    if (typeof GM_addStyle === 'function') return GM_addStyle(css);
    const s = document.createElement('style');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
    return s;
  };

  const ICON_STAR_FULL =
    '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
    '<path fill="currentColor" d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"/>' +
    '</svg>';
  const ICON_STAR_HALF =
    '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
    '<defs><linearGradient id="atvHalfStar"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="currentColor" stop-opacity="0.22"/></linearGradient></defs>' +
    '<path fill="url(#atvHalfStar)" d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"/>' +
    '</svg>';
  const ICON_STAR_EMPTY =
    '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
    '<path fill="currentColor" fill-opacity="0.22" d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"/>' +
    '</svg>';
  const ICON_PLAY =
    '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">' +
    '<path fill="currentColor" d="M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z"/>' +
    '</svg>';
  const ICON_CHECK =
    '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">' +
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2.5 7.5l3 3 6-7"/>' +
    '</svg>';
  const ICON_CHEVRON =
    '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M2.5 4l3.5 4 3.5-4"/>' +
    '</svg>';
  const ICON_ARROW =
    '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5"/>' +
    '</svg>';
  const ICON_THUMB =
    '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">' +
    '<path fill="currentColor" d="M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z"/>' +
    '</svg>';
  const ICON_FILM_PLACEHOLDER =
    '<svg viewBox="0 0 64 96" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><linearGradient id="atvFilmGrad" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#2c2c2e"/><stop offset="100%" stop-color="#1c1c1e"/>' +
    '</linearGradient></defs>' +
    '<rect width="64" height="96" fill="url(#atvFilmGrad)"/>' +
    '<g fill="rgba(255,255,255,0.12)">' +
    '<rect x="4" y="6" width="6" height="6" rx="1"/><rect x="4" y="18" width="6" height="6" rx="1"/>' +
    '<rect x="4" y="30" width="6" height="6" rx="1"/><rect x="4" y="42" width="6" height="6" rx="1"/>' +
    '<rect x="4" y="54" width="6" height="6" rx="1"/><rect x="4" y="66" width="6" height="6" rx="1"/>' +
    '<rect x="4" y="78" width="6" height="6" rx="1"/>' +
    '<rect x="54" y="6" width="6" height="6" rx="1"/><rect x="54" y="18" width="6" height="6" rx="1"/>' +
    '<rect x="54" y="30" width="6" height="6" rx="1"/><rect x="54" y="42" width="6" height="6" rx="1"/>' +
    '<rect x="54" y="54" width="6" height="6" rx="1"/><rect x="54" y="66" width="6" height="6" rx="1"/>' +
    '<rect x="54" y="78" width="6" height="6" rx="1"/>' +
    '</g>' +
    '<path d="M26 38l14 10-14 10z" fill="rgba(255,255,255,0.28)"/>' +
    '</svg>';

  const CSS = `
:root {}
body > #wrapper { display: none !important; }
body { background: #000 !important; margin: 0 !important; padding: 0 !important; }
#db-global-nav, #db-nav-movie { display: none !important; }
[id^="dale_"], [class*="dale_"] { display: none !important; }

#atv-douban-root {
  --atv-bg-primary: #000000;
  --atv-bg-secondary: #1c1c1e;
  --atv-bg-tertiary: #2c2c2e;
  --atv-bg-elevated: rgba(255,255,255,0.06);
  --atv-text-primary: #ffffff;
  --atv-text-secondary: rgba(255,255,255,0.72);
  --atv-text-tertiary: rgba(255,255,255,0.45);
  --atv-accent: #41be5d;
  --atv-accent-bright: #4cd97a;
  --atv-accent-glow: rgba(65,190,93,0.35);
  --atv-rating-gold: #ffb800;
  --atv-border-subtle: rgba(255,255,255,0.08);
  --atv-border-medium: rgba(255,255,255,0.16);
  --atv-radius-sm: 8px;
  --atv-radius-md: 12px;
  --atv-radius-lg: 16px;
  --atv-radius-xl: 24px;

  position: relative;
  background: var(--atv-bg-primary);
  color: var(--atv-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", "Microsoft YaHei", Inter, system-ui, sans-serif;
  font-feature-settings: "ss01", "cv11";
  line-height: 1.5;
  min-height: 100vh;
  opacity: 0;
  animation: atv-fadein 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards;
}

@keyframes atv-fadein { from { opacity: 0; } to { opacity: 1; } }
@keyframes atv-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

#atv-douban-root *, #atv-douban-root *::before, #atv-douban-root *::after { box-sizing: border-box; }
#atv-douban-root a { color: inherit; text-decoration: none; }
#atv-douban-root a:hover { background: transparent; }
#atv-douban-root img { display: block; max-width: 100%; }

/* ---------- Sticky nav ---------- */
.atv-stickynav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 9999;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 max(28px, 5vw);
  box-sizing: border-box;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  background: rgba(10,10,12,0.72);
  border-bottom: 1px solid var(--atv-border-subtle);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", "Microsoft YaHei", Inter, system-ui, sans-serif;
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
  transition: opacity 280ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
.atv-stickynav.is-visible { opacity: 1; transform: none; pointer-events: auto; }
.atv-stickynav-title {
  font-size: 16px; font-weight: 600;
  color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 0 1 auto; min-width: 0;
}
.atv-stickynav-jumps { display: flex; gap: 24px; flex: 0 0 auto; }
.atv-stickynav-jumps a {
  font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
  transition: color 200ms ease;
  cursor: pointer;
}
.atv-stickynav-jumps a:hover { color: var(--atv-accent-bright); }
@media (max-width: 768px) {
  .atv-stickynav-title { font-size: 14px; }
  .atv-stickynav-jumps { gap: 14px; }
  .atv-stickynav-jumps a { font-size: 12px; }
}

/* ---------- Hero ---------- */
.atv-hero {
  position: relative;
  min-height: 72vh;
  display: flex;
  align-items: flex-end;
  padding: 132px max(28px, 5vw) 56px;
  overflow: hidden;
  isolation: isolate;
}
.atv-hero-bg {
  position: absolute; inset: -8%;
  background-size: cover; background-position: center 22%;
  filter: blur(60px) saturate(1.25) brightness(0.78);
  transform: scale(1.25);
  z-index: -4;
}
.atv-hero-vignette {
  position: absolute; inset: 0; z-index: -3;
  background: radial-gradient(120% 90% at 70% 30%, transparent 0%, rgba(0,0,0,0.55) 100%);
}
.atv-hero-overlay-x {
  position: absolute; inset: 0; z-index: -2;
  background: linear-gradient(to right, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 32%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.35) 100%);
}
.atv-hero-overlay-y {
  position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 55%, #000 100%);
}
.atv-hero-inner {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  gap: 56px;
  align-items: flex-start;
}
.atv-poster-card {
  flex: 0 0 auto;
  width: 360px;
  aspect-ratio: 2 / 3;
  border-radius: var(--atv-radius-lg);
  overflow: hidden;
  background: var(--atv-bg-tertiary);
  box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px var(--atv-border-subtle) inset;
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.atv-poster-card:hover { transform: scale(1.03); }
.atv-poster-card img { width: 100%; height: 100%; object-fit: cover; }
.atv-poster-placeholder { width: 100%; height: 100%; }

.atv-hero-info { flex: 1 1 auto; min-width: 0; }
.atv-hero-title {
  font-size: clamp(44px, 5.5vw, 72px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0 0 8px;
  color: #fff;
  text-shadow: 0 2px 20px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.3);
}
.atv-hero-orig {
  font-size: clamp(18px, 1.6vw, 22px);
  font-weight: 400;
  color: var(--atv-text-secondary);
  opacity: 0.85;
  letter-spacing: -0.01em;
  margin-bottom: 22px;
}
.atv-hero-meta {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--atv-text-secondary);
  margin-bottom: 24px;
}
.atv-meta-dot { display: inline-flex; align-items: center; }
.atv-meta-dot + .atv-meta-dot::before {
  content: "·"; margin-right: 14px; color: var(--atv-text-tertiary);
}
.atv-meta-chips { display: inline-flex; flex-wrap: wrap; gap: 8px; }
.atv-chip {
  display: inline-flex; align-items: center;
  padding: 4px 11px;
  border-radius: 999px;
  background: var(--atv-bg-elevated);
  border: 1px solid var(--atv-border-subtle);
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--atv-text-secondary);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.atv-rating-row {
  display: flex; align-items: center; gap: 18px;
  margin-bottom: 28px;
}
.atv-rating-score {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
.atv-rating-meta { display: flex; flex-direction: column; gap: 6px; }
.atv-rating-stars { display: inline-flex; gap: 2px; color: var(--atv-rating-gold); }
.atv-rating-stars svg { display: block; }
.atv-rating-count {
  font-size: 13px; font-weight: 500;
  color: var(--atv-text-tertiary);
  letter-spacing: 0.02em;
}
.atv-rating-empty {
  font-size: 14px;
  color: var(--atv-text-tertiary);
  letter-spacing: 0.03em;
}

.atv-actions { display: flex; gap: 12px; margin-bottom: 26px; flex-wrap: wrap; }
.atv-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 14px; font-weight: 600; letter-spacing: 0.01em;
  border: none;
  cursor: pointer;
  transition: transform 200ms ease, background 200ms ease, box-shadow 200ms ease, color 200ms ease;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.atv-btn-primary {
  background: var(--atv-accent);
  color: #fff;
  box-shadow: 0 8px 24px var(--atv-accent-glow);
}
.atv-btn-primary:hover { background: var(--atv-accent-bright); transform: translateY(-1px); }
.atv-btn-secondary {
  background: var(--atv-bg-elevated);
  color: var(--atv-text-primary);
  border: 1px solid var(--atv-border-medium);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.atv-btn-secondary:hover { background: rgba(255,255,255,0.12); transform: translateY(-1px); }
.atv-btn.is-active {
  background: var(--atv-accent);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 20px var(--atv-accent-glow);
}

.atv-hero-teaser {
  font-size: 15px;
  line-height: 1.75;
  color: var(--atv-text-secondary);
  max-width: 660px;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 12px;
}
.atv-hero-teaser.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.atv-hero-more {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--atv-accent-bright);
  letter-spacing: 0.02em;
  background: none; border: none; padding: 0;
  cursor: pointer; font-family: inherit;
}
.atv-hero-more:hover { color: var(--atv-accent); }
.atv-hero-more svg { transition: transform 220ms ease; }
.atv-hero-more.is-open svg { transform: rotate(180deg); }

/* ---------- Section ---------- */
.atv-section {
  padding: 52px max(28px, 5vw);
  max-width: 1280px;
  margin: 0 auto;
  animation: atv-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.atv-section + .atv-section { padding-top: 0; }
.atv-section-h {
  display: flex; align-items: center;
  font-size: 24px; font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 24px;
  position: relative;
  padding-left: 16px;
}
.atv-section-h::before {
  content: "";
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%);
  width: 4px; height: 24px;
  background: var(--atv-accent);
  border-radius: 2px;
}
.atv-section-h-row {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 16px; margin-bottom: 24px;
}
.atv-section-h-row .atv-section-h { margin-bottom: 0; }
.atv-section-more {
  flex: 0 0 auto;
  font-size: 14px; font-weight: 500;
  color: var(--atv-text-tertiary);
  letter-spacing: 0.02em;
  transition: color 200ms ease;
  white-space: nowrap;
}
.atv-section-more:hover { color: var(--atv-accent-bright); }

/* ---------- Carousel ---------- */
.atv-carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 4px 4px 16px;
  margin: 0 -4px;
}
.atv-carousel::-webkit-scrollbar { display: none; }
.atv-carousel { scrollbar-width: none; }

/* ---------- Cast ---------- */
.atv-cast-card {
  flex: 0 0 132px;
  scroll-snap-align: start;
  text-align: center;
  cursor: pointer;
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.atv-cast-card:hover { transform: translateY(-3px); }
.atv-cast-avatar {
  width: 132px; height: 132px;
  border-radius: 50%;
  background-size: cover; background-position: center top;
  background-color: var(--atv-bg-tertiary);
  border: 2px solid transparent;
  transition: transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
.atv-cast-card:hover .atv-cast-avatar {
  transform: scale(1.05);
  border-color: var(--atv-accent);
  box-shadow: 0 8px 24px var(--atv-accent-glow);
}
.atv-cast-name {
  margin-top: 14px;
  font-size: 15px; font-weight: 600;
  color: var(--atv-text-primary);
  line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.atv-cast-role {
  margin-top: 4px;
  font-size: 13px; font-weight: 400;
  color: var(--atv-text-tertiary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---------- Photos ---------- */
.atv-photos { gap: 12px; }
.atv-photo-tile {
  flex: 0 0 320px;
  aspect-ratio: 16 / 9;
  scroll-snap-align: start;
  border-radius: var(--atv-radius-md);
  overflow: hidden;
  background: var(--atv-bg-tertiary);
  cursor: pointer;
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms ease;
}
.atv-photo-tile img { width: 100%; height: 100%; object-fit: cover; }
.atv-photo-tile:hover { transform: scale(1.02); filter: brightness(1.1); }

/* ---------- Recommendations ---------- */
.atv-recs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 24px;
}
.atv-rec-card { cursor: pointer; }
.atv-rec-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--atv-radius-sm);
  overflow: hidden;
  background: var(--atv-bg-tertiary);
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms ease;
}
.atv-rec-poster img { width: 100%; height: 100%; object-fit: cover; }
.atv-rec-card:hover .atv-rec-poster {
  transform: scale(1.05);
  box-shadow: 0 12px 40px var(--atv-accent-glow);
}
.atv-rec-title {
  margin-top: 12px;
  font-size: 14px; font-weight: 500;
  color: var(--atv-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ---------- Info grid ---------- */
.atv-info-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  row-gap: 16px;
  column-gap: 32px;
}
.atv-info-label {
  font-size: 14px; font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--atv-text-tertiary);
  padding-top: 2px;
}
.atv-info-value {
  font-size: 15px; font-weight: 400;
  color: var(--atv-text-primary);
  line-height: 1.6;
  word-break: break-word;
}
.atv-info-value a { color: var(--atv-text-primary); border-bottom: 1px solid var(--atv-border-medium); transition: color 200ms ease, border-color 200ms ease; }
.atv-info-value a:hover { color: var(--atv-accent-bright); border-color: var(--atv-accent-bright); }

/* ---------- Streaming ---------- */
.atv-stream-row { display: flex; flex-wrap: wrap; gap: 12px; }
.atv-stream-card {
  display: inline-flex; align-items: center; gap: 10px;
  height: 52px;
  padding: 0 20px;
  border-radius: var(--atv-radius-md);
  background: var(--atv-bg-elevated);
  border: 1px solid var(--atv-border-medium);
  color: var(--atv-text-primary);
  font-size: 15px; font-weight: 600; letter-spacing: 0.01em;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}
.atv-stream-card:hover {
  transform: translateY(-2px);
  background: rgba(65,190,93,0.14);
  border-color: var(--atv-accent);
  box-shadow: 0 10px 28px var(--atv-accent-glow);
}
.atv-stream-card .atv-stream-arrow {
  display: inline-flex; color: var(--atv-accent-bright);
  transition: transform 220ms ease;
}
.atv-stream-card:hover .atv-stream-arrow { transform: translateX(3px); }

/* ---------- Comments ---------- */
.atv-comments {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
.atv-comment-card {
  display: flex; flex-direction: column;
  background: var(--atv-bg-secondary);
  border: 1px solid var(--atv-border-subtle);
  border-radius: var(--atv-radius-md);
  padding: 20px;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), border-color 260ms ease;
}
.atv-comment-card:hover { transform: translateY(-2px); border-color: var(--atv-border-medium); }
.atv-comment-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.atv-comment-avatar {
  flex: 0 0 auto;
  width: 40px; height: 40px;
  border-radius: 50%;
  background-size: cover; background-position: center;
  background-color: var(--atv-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; font-weight: 600; color: #fff;
  overflow: hidden;
}
.atv-comment-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.atv-comment-author {
  font-size: 14px; font-weight: 600; color: var(--atv-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.atv-comment-stars { display: inline-flex; gap: 1px; color: var(--atv-rating-gold); }
.atv-comment-stars svg { display: block; }
.atv-comment-body {
  font-size: 15px; line-height: 1.6;
  color: var(--atv-text-secondary);
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1 1 auto;
  margin: 0 0 14px;
}
.atv-comment-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  font-size: 12px; font-weight: 500;
  color: var(--atv-text-tertiary);
  letter-spacing: 0.02em;
}
.atv-comment-votes { display: inline-flex; align-items: center; gap: 5px; }

/* ---------- Poster Modal ---------- */
.atv-poster-card { cursor: pointer; }
.atv-modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.92);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 300ms ease;
}
.atv-modal-overlay.is-open { opacity: 1; pointer-events: auto; }
.atv-modal-img {
  max-width: 90vw; max-height: 90vh;
  border-radius: var(--atv-radius-lg);
  box-shadow: 0 40px 80px rgba(0,0,0,0.75);
  transform: scale(0.92);
  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
  object-fit: contain;
}
.atv-modal-overlay.is-open .atv-modal-img { transform: scale(1); }
.atv-modal-close {
  position: fixed; top: 24px; right: 24px; z-index: 10001;
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 200ms ease, border-color 200ms ease;
}
.atv-modal-close:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.3); }
.atv-modal-close svg { display: block; }

/* ---------- Footer spacer ---------- */
.atv-footer-spacer { height: 64px; }

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .atv-hero { padding: 104px 24px 48px; min-height: 64vh; }
  .atv-hero-inner { flex-direction: column; align-items: flex-start; gap: 28px; }
  .atv-poster-card { width: 220px; }
  .atv-section { padding: 44px 24px; }
  .atv-info-grid { grid-template-columns: 160px 1fr; column-gap: 24px; }
}
@media (max-width: 768px) {
  .atv-hero { min-height: 56vh; padding: 88px 20px 40px; }
  .atv-poster-card { width: 180px; }
  .atv-section { padding: 36px 20px; }
  .atv-info-grid { grid-template-columns: 1fr; row-gap: 4px; }
  .atv-info-label { padding-top: 16px; }
  .atv-recs { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 18px; }
  .atv-cast-card { flex-basis: 104px; }
  .atv-cast-avatar { width: 104px; height: 104px; }
  .atv-photo-tile { flex-basis: 260px; }
  .atv-rating-score { font-size: 44px; }
  .atv-comments { grid-template-columns: 1fr; }
}
`;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const safeText = (el) => (el ? (el.textContent || '').trim() : '');

  const upgradePoster = (url) => {
    if (!url) return null;
    return url
      .replace('/s_ratio_poster/', '/l_ratio_poster/')
      .replace('s_ratio_poster', 'l_ratio_poster');
  };

  const upgradePhoto = (url) => {
    if (!url) return null;
    return url.replace('/sqxs/', '/large/').replace('/m/', '/l/');
  };

  const collectInfoTextAfter = (labelEl) => {
    if (!labelEl) return '';
    let out = '';
    let n = labelEl.nextSibling;
    while (n) {
      if (n.nodeType === 1 && n.classList && n.classList.contains('pl')) break;
      if (n.nodeType === 1 && n.tagName === 'BR') break;
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeType === 1) out += (n.textContent || '');
      n = n.nextSibling;
    }
    return out.replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
  };

  const findLabel = (infoRoot, label) => {
    if (!infoRoot) return null;
    const spans = $$('span.pl', infoRoot);
    for (const s of spans) {
      const t = (s.textContent || '').replace(/[:：\s]/g, '');
      if (t === label) return s;
    }
    return null;
  };

  const collectLinksAfter = (labelEl) => {
    if (!labelEl) return [];
    const out = [];
    let n = labelEl.nextSibling;
    while (n) {
      if (n.nodeType === 1 && n.classList && n.classList.contains('pl')) break;
      if (n.nodeType === 1 && n.tagName === 'BR') break;
      if (n.nodeType === 1) {
        const anchors = n.tagName === 'A' ? [n] : $$('a', n);
        for (const a of anchors) {
          const t = (a.textContent || '').trim();
          if (t) out.push({ text: t, href: a.href || '' });
        }
      }
      n = n.nextSibling;
    }
    return out;
  };

  function extractTitle() {
    const h1 = $('#content h1');
    const reviewed = $('span[property="v:itemreviewed"]', h1);
    const full = safeText(reviewed) || safeText(h1).replace(/\(\d{4}\)\s*$/, '').trim();
    let primary = full;
    let original = '';
    const idx = full.search(/\s+/);
    if (idx > 0) {
      primary = full.slice(0, idx).trim();
      original = full.slice(idx).trim();
    }
    return { full, primary, original };
  }

  function extractYear() {
    const yEl = $('#content h1 .year');
    const raw = safeText(yEl);
    const m = raw.match(/(\d{4})/);
    return m ? m[1] : '';
  }

  function extractPoster() {
    const img = $('#mainpic img') || $('a.nbgnbg img');
    if (!img) return null;
    const src = img.src || img.getAttribute('data-src') || '';
    return upgradePoster(src);
  }

  function extractRating() {
    const scoreEl = $('strong.rating_num') || $('strong[property="v:average"]');
    const raw = safeText(scoreEl);
    const score = raw ? parseFloat(raw) : NaN;
    if (!score || isNaN(score) || score <= 0) return null;
    const votesEl = $('span[property="v:votes"]') || $('.rating_people span');
    const count = votesEl ? parseInt(safeText(votesEl).replace(/\D/g, ''), 10) || 0 : 0;
    return { score, count };
  }

  function extractSummary() {
    const summary = $('span[property="v:summary"]');
    if (!summary) return null;
    let txt = (summary.textContent || '').trim();
    txt = txt.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return txt || null;
  }

  function extractInfo() {
    const info = $('#info');
    const out = {
      director: [], writers: [], cast: [], genres: [],
      country: '', language: '', releaseDate: '', firstAired: '',
      runtime: '', episodes: '', seasons: '', episodeRuntime: '',
      aliases: '', imdb: '',
    };
    if (!info) return out;

    const directorL = findLabel(info, '导演');
    out.director = collectLinksAfter(directorL);

    const writersL = findLabel(info, '编剧');
    out.writers = collectLinksAfter(writersL);

    const starringEls = $$('a[rel="v:starring"]', info);
    if (starringEls.length) {
      out.cast = starringEls.map((a) => ({ text: (a.textContent || '').trim(), href: a.href || '' })).filter((x) => x.text);
    } else {
      const castL = findLabel(info, '主演');
      out.cast = collectLinksAfter(castL);
    }

    const genreEls = $$('span[property="v:genre"]', info);
    out.genres = genreEls.map((e) => (e.textContent || '').trim()).filter(Boolean);

    const countryL = findLabel(info, '制片国家/地区');
    out.country = collectInfoTextAfter(countryL);

    const langL = findLabel(info, '语言');
    out.language = collectInfoTextAfter(langL);

    const relEls = $$('span[property="v:initialReleaseDate"]', info);
    if (relEls.length) {
      out.releaseDate = relEls.map((e) => (e.textContent || '').trim()).filter(Boolean).join(' / ');
    }

    const firstL = findLabel(info, '首播');
    if (firstL) out.firstAired = collectInfoTextAfter(firstL);

    const runEls = $$('span[property="v:runtime"]', info);
    if (runEls.length) out.runtime = runEls.map((e) => (e.textContent || '').trim()).filter(Boolean).join(' / ');

    const epL = findLabel(info, '集数');
    if (epL) out.episodes = collectInfoTextAfter(epL);
    const seasonL = findLabel(info, '季数');
    if (seasonL) {
      const sel = $('#season', info);
      if (sel) {
        const opt = sel.options[sel.selectedIndex];
        out.seasons = opt ? (opt.textContent || '').trim() : collectInfoTextAfter(seasonL);
      } else {
        out.seasons = collectInfoTextAfter(seasonL);
      }
    }
    const epRunL = findLabel(info, '单集片长');
    if (epRunL) out.episodeRuntime = collectInfoTextAfter(epRunL);

    const aliasL = findLabel(info, '又名');
    out.aliases = collectInfoTextAfter(aliasL);

    const imdbL = findLabel(info, 'IMDb');
    if (imdbL) {
      const raw = collectInfoTextAfter(imdbL);
      const m = raw.match(/(tt\d+)/);
      out.imdb = m ? m[1] : raw;
    }

    return out;
  }

  function extractCelebrities() {
    return $$('#celebrities li.celebrity').map((li) => {
      const nameEl = $('.info .name a', li) || $('.info .name', li);
      const roleEl = $('.info .role', li);
      const avatarEl = $('.avatar', li);
      let avatar = '';
      if (avatarEl) {
        const bg = avatarEl.getAttribute('style') || '';
        const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (m) avatar = m[1];
      }
      return {
        name: safeText(nameEl),
        role: safeText(roleEl),
        avatar,
        link: nameEl && nameEl.tagName === 'A' ? nameEl.href : '',
      };
    }).filter((c) => c.name);
  }

  function extractPhotos() {
    return $$('#related-pic .related-pic-bd img').map((img) => {
      const thumb = img.src || img.getAttribute('data-src') || '';
      const a = img.closest('a');
      return {
        thumbUrl: thumb,
        hdUrl: upgradePhoto(thumb),
        link: a ? a.href : '',
      };
    }).filter((p) => p.thumbUrl);
  }

  function extractRecommendations() {
    return $$('.recommendations-bd dl').map((dl) => {
      const linkEl = $('dt a', dl);
      const imgEl = $('dt a img', dl);
      const titleEl = $('dd a', dl);
      return {
        title: safeText(titleEl),
        poster: imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '',
        link: linkEl ? linkEl.href : '',
      };
    }).filter((r) => r.title);
  }

  function extractSubjectId() {
    const m = location.pathname.match(/subject\/(\d+)/);
    return m ? m[1] : '';
  }

  function extractComments() {
    const items = $$('#hot-comments .comment-item');
    const out = [];
    for (const item of items) {
      const authorEl = $('.comment-info a', item);
      const name = safeText(authorEl);
      if (!name) continue;
      const shortEl = $('.short', item) || $('.comment-content', item);
      const content = safeText(shortEl);
      if (!content) continue;
      const ratingEl = $('[class*="allstar"]', item);
      let stars = 0;
      let ratingWord = '';
      if (ratingEl) {
        const rm = (ratingEl.className || '').match(/allstar(\d{2})/);
        if (rm) stars = parseInt(rm[1], 10) / 10;
        ratingWord = ratingEl.getAttribute('title') || '';
      }
      const timeEl = $('.comment-time', item);
      const time = timeEl ? (timeEl.getAttribute('title') || safeText(timeEl)) : '';
      const votesEl = $('.vote-count', item) || $('.votes', item);
      const votes = votesEl ? parseInt(safeText(votesEl).replace(/\D/g, ''), 10) || 0 : 0;
      const avatarImg = $('.avatar img', item);
      let avatar = '';
      if (avatarImg) avatar = avatarImg.src || avatarImg.getAttribute('data-original') || avatarImg.getAttribute('data-src') || '';
      out.push({
        name,
        link: authorEl && authorEl.tagName === 'A' ? authorEl.href : '',
        content,
        stars,
        ratingWord,
        time,
        votes,
        avatar,
      });
    }
    return out;
  }

  function extractAwards() {
    return $$('ul.award').map((ul) => {
      const lis = $$('li', ul);
      const orgEl = lis[0] ? $('a', lis[0]) : null;
      const org = lis[0] ? safeText(lis[0]) : '';
      const name = lis[1] ? safeText(lis[1]) : '';
      const personEl = lis[2] ? $('a', lis[2]) : null;
      const person = lis[2] ? safeText(lis[2]) : '';
      return {
        org,
        orgLink: orgEl ? orgEl.href : '',
        name,
        person,
        personLink: personEl ? personEl.href : '',
      };
    }).filter((a) => a.org);
  }

  function extractStreaming() {
    const seen = new Set();
    const out = [];
    const isRealUrl = (h) => /^https?:\/\//.test(h || '');
    const playBtns = $$('a.playBtn');
    for (const a of playBtns) {
      const name = (a.getAttribute('data-cn') || a.textContent || '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, href: isRealUrl(a.href) ? a.href : '', proxyEl: a });
    }
    for (const a of $$('a')) {
      if (!/online-video/.test(a.href || '')) continue;
      const name = (a.getAttribute('data-cn') || a.textContent || '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, href: isRealUrl(a.href) ? a.href : '', proxyEl: a });
    }
    return out;
  }

  function findInterestButtons() {
    const result = { wish: null, collect: null };
    const root = $('#interest_sect_level') || $('#interest_sectl');
    const anchors = root ? $$('a', root) : [];
    for (const a of anchors) {
      const t = (a.textContent || '').trim();
      if (!result.wish && /想看/.test(t)) result.wish = a;
      if (!result.collect && /看过/.test(t)) result.collect = a;
    }
    if (!result.wish || !result.collect) {
      const all = $$('#interest_sectl a');
      for (const a of all) {
        const t = (a.textContent || '').trim();
        if (!result.wish && /^想看$/.test(t)) result.wish = a;
        if (!result.collect && /^看过$/.test(t)) result.collect = a;
      }
    }
    return result;
  }

  function isInterestActive(anchor) {
    if (!anchor) return false;
    const cls = (anchor.className || '') + ' ' + ((anchor.parentElement && anchor.parentElement.className) || '');
    return /done|active|on\b|j_a\b/.test(cls);
  }

  const el = (tag, opts) => {
    const node = document.createElement(tag);
    if (!opts) return node;
    if (opts.className) node.className = opts.className;
    if (opts.id) node.id = opts.id;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.href != null) node.href = opts.href;
    if (opts.src != null) node.src = opts.src;
    if (opts.alt != null) node.alt = opts.alt;
    if (opts.attrs) for (const k in opts.attrs) node.setAttribute(k, opts.attrs[k]);
    if (opts.style) for (const k in opts.style) node.style[k] = opts.style[k];
    if (opts.target != null) node.target = opts.target;
    if (opts.rel != null) node.rel = opts.rel;
    return node;
  };

  function renderStars(score, opts) {
    const o = opts || {};
    const wrap = el('span', { className: o.className || 'atv-rating-stars' });
    const out = o.outOfFive ? score : score / 2;
    for (let i = 1; i <= 5; i++) {
      let svg;
      if (out >= i - 0.25) svg = ICON_STAR_FULL;
      else if (out >= i - 0.75) svg = ICON_STAR_HALF;
      else svg = ICON_STAR_EMPTY;
      wrap.appendChild(el('span', { html: svg }));
    }
    return wrap;
  }

  function openPosterModal(src, alt) {
    const old = document.getElementById('atv-poster-modal');
    if (old) old.remove();

    const overlay = el('div', { className: 'atv-modal-overlay', id: 'atv-poster-modal' });
    const img = el('img', { className: 'atv-modal-img', src: src, alt: alt || '' });
    img.referrerPolicy = 'no-referrer';

    const close = el('button', {
      className: 'atv-modal-close',
      attrs: { type: 'button' },
      html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
    });

    const dismiss = () => {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 350);
    };
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', handler); }
    });

    overlay.appendChild(img);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('is-open'));
  }

  function buildHero(data) {
    const hero = el('section', { className: 'atv-hero' });

    if (data.poster) {
      const bg = el('div', { className: 'atv-hero-bg' });
      bg.style.backgroundImage = 'url("' + encodeURI(data.poster) + '")';
      hero.appendChild(bg);
    } else {
      hero.appendChild(el('div', { className: 'atv-hero-bg', style: { background: 'radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)' } }));
    }
    hero.appendChild(el('div', { className: 'atv-hero-vignette' }));
    hero.appendChild(el('div', { className: 'atv-hero-overlay-x' }));
    hero.appendChild(el('div', { className: 'atv-hero-overlay-y' }));

    const inner = el('div', { className: 'atv-hero-inner' });

    const card = el('div', { className: 'atv-poster-card' });
    if (data.poster) {
      const img = el('img', { src: data.poster, alt: data.title.primary || '' });
      img.referrerPolicy = 'no-referrer';
      img.onerror = function () {
        card.innerHTML = '';
        const ph = el('div', { className: 'atv-poster-placeholder', html: ICON_FILM_PLACEHOLDER });
        card.appendChild(ph);
      };
      card.appendChild(img);
    } else {
      card.appendChild(el('div', { className: 'atv-poster-placeholder', html: ICON_FILM_PLACEHOLDER }));
    }
    card.addEventListener('click', () => { if (data.poster) openPosterModal(data.poster, data.title.primary || ''); });
    inner.appendChild(card);

    const info = el('div', { className: 'atv-hero-info' });

    const title = el('h1', { className: 'atv-hero-title', text: data.title.primary || data.title.full });
    info.appendChild(title);
    if (data.title.original) {
      info.appendChild(el('div', { className: 'atv-hero-orig', text: data.title.original }));
    }

    const meta = el('div', { className: 'atv-hero-meta' });
    const metaParts = [];
    if (data.year) metaParts.push(data.year);
    if (data.isTV) {
      const seg = [];
      if (data.info.seasons) seg.push(data.info.seasons + (/\d$/.test(data.info.seasons) ? '季' : ''));
      if (data.info.episodes) seg.push(data.info.episodes + (/\d$/.test(data.info.episodes) ? '集' : ''));
      if (seg.length) metaParts.push(seg.join(' · '));
      else if (data.info.episodeRuntime) metaParts.push(data.info.episodeRuntime);
    } else if (data.info.runtime) {
      metaParts.push(data.info.runtime);
    }
    if (data.info.country) metaParts.push(data.info.country);
    for (const part of metaParts) {
      meta.appendChild(el('span', { className: 'atv-meta-dot', text: part }));
    }
    if (data.info.genres && data.info.genres.length) {
      const chips = el('span', { className: 'atv-meta-chips' });
      for (const g of data.info.genres) {
        chips.appendChild(el('span', { className: 'atv-chip', text: g }));
      }
      meta.appendChild(chips);
    }
    info.appendChild(meta);

    const ratingRow = el('div', { className: 'atv-rating-row' });
    if (data.rating) {
      ratingRow.appendChild(el('div', { className: 'atv-rating-score', text: data.rating.score.toFixed(1) }));
      const ratingMeta = el('div', { className: 'atv-rating-meta' });
      ratingMeta.appendChild(renderStars(data.rating.score));
      const countTxt = data.rating.count
        ? '评价 ' + data.rating.count.toLocaleString('en-US')
        : '已评分';
      ratingMeta.appendChild(el('div', { className: 'atv-rating-count', text: countTxt }));
      ratingRow.appendChild(ratingMeta);
    } else {
      ratingRow.appendChild(el('div', { className: 'atv-rating-empty', text: '暂无评分' }));
    }
    info.appendChild(ratingRow);

    const actions = el('div', { className: 'atv-actions' });
    const interest = findInterestButtons();
    const wishBtn = el('button', { className: 'atv-btn atv-btn-primary', attrs: { type: 'button' } });
    wishBtn.appendChild(el('span', { html: ICON_PLAY }));
    wishBtn.appendChild(el('span', { text: '想看' }));
    if (isInterestActive(interest.wish)) wishBtn.classList.add('is-active');
    wishBtn.addEventListener('click', () => {
      if (interest.wish) interest.wish.click();
    });
    actions.appendChild(wishBtn);

    const seenBtn = el('button', { className: 'atv-btn atv-btn-secondary', attrs: { type: 'button' } });
    seenBtn.appendChild(el('span', { html: ICON_CHECK }));
    seenBtn.appendChild(el('span', { text: '看过' }));
    if (isInterestActive(interest.collect)) seenBtn.classList.add('is-active');
    seenBtn.addEventListener('click', () => {
      if (interest.collect) interest.collect.click();
    });
    actions.appendChild(seenBtn);

    info.appendChild(actions);

    if (data.summary) {
      const teaser = el('p', { className: 'atv-hero-teaser is-clamped', text: data.summary });
      info.appendChild(teaser);
      const more = el('button', { className: 'atv-hero-more', attrs: { type: 'button' } });
      const moreLabel = el('span', { text: '展开' });
      more.appendChild(moreLabel);
      more.appendChild(el('span', { html: ICON_CHEVRON }));
      more.addEventListener('click', () => {
        const open = teaser.classList.toggle('is-clamped') === false;
        more.classList.toggle('is-open', open);
        moreLabel.textContent = open ? '收起' : '展开';
      });
      requestAnimationFrame(() => {
        const overflowing = teaser.scrollHeight - teaser.clientHeight > 4;
        if (!overflowing) more.style.display = 'none';
      });
      info.appendChild(more);
    }

    inner.appendChild(info);
    hero.appendChild(inner);
    return hero;
  }

  function buildSectionHeader(text) {
    return el('h2', { className: 'atv-section-h', text });
  }

  function buildSectionHeaderRow(text, moreText, moreHref) {
    const row = el('div', { className: 'atv-section-h-row' });
    row.appendChild(buildSectionHeader(text));
    if (moreText && moreHref) {
      row.appendChild(el('a', { className: 'atv-section-more', text: moreText, href: moreHref, target: '_blank', rel: 'noopener' }));
    }
    return row;
  }

  function buildStreaming(data) {
    if (!data.streaming || !data.streaming.length) return null;
    const sec = el('section', { className: 'atv-section', id: 'atv-stream' });
    sec.appendChild(buildSectionHeader('在哪儿看'));
    const row = el('div', { className: 'atv-stream-row' });
    for (const s of data.streaming) {
      let card;
      if (s.href) {
        card = el('a', { className: 'atv-stream-card', href: s.href, target: '_blank', rel: 'noopener' });
      } else {
        card = el('button', { className: 'atv-stream-card', attrs: { type: 'button' } });
        const proxy = s.proxyEl;
        card.addEventListener('click', () => { if (proxy) proxy.click(); });
      }
      card.appendChild(el('span', { text: s.name }));
      card.appendChild(el('span', { className: 'atv-stream-arrow', html: ICON_ARROW }));
      row.appendChild(card);
    }
    sec.appendChild(row);
    return sec;
  }

  function buildComments(data) {
    if (!data.comments || !data.comments.length) return null;
    const sec = el('section', { className: 'atv-section', id: 'atv-comments' });
    const allHref = data.subjectId
      ? 'https://movie.douban.com/subject/' + data.subjectId + '/comments?status=P'
      : '';
    sec.appendChild(buildSectionHeaderRow('热门短评', allHref ? '查看全部 →' : '', allHref));
    const grid = el('div', { className: 'atv-comments' });
    for (const c of data.comments) {
      const card = el('div', { className: 'atv-comment-card' });

      const top = el('div', { className: 'atv-comment-top' });
      const avatar = el('div', { className: 'atv-comment-avatar' });
      if (c.avatar) {
        avatar.style.backgroundImage = 'url("' + encodeURI(c.avatar) + '")';
      } else {
        avatar.textContent = (c.name || '?').slice(0, 1).toUpperCase();
      }
      top.appendChild(avatar);

      const metaCol = el('div', { className: 'atv-comment-meta' });
      const author = el(c.link ? 'a' : 'div', { className: 'atv-comment-author', text: c.name });
      if (c.link) { author.href = c.link; author.target = '_blank'; author.rel = 'noopener'; }
      metaCol.appendChild(author);
      if (c.stars > 0) {
        metaCol.appendChild(renderStars(c.stars, { outOfFive: true, className: 'atv-comment-stars' }));
      }
      top.appendChild(metaCol);
      card.appendChild(top);

      card.appendChild(el('div', { className: 'atv-comment-body', text: c.content }));

      const foot = el('div', { className: 'atv-comment-foot' });
      foot.appendChild(el('span', { text: c.time || '' }));
      if (c.votes > 0) {
        const votes = el('span', { className: 'atv-comment-votes' });
        votes.appendChild(el('span', { className: 'atv-stream-arrow', html: ICON_THUMB }));
        votes.appendChild(el('span', { text: c.votes.toLocaleString('en-US') }));
        foot.appendChild(votes);
      }
      card.appendChild(foot);

      grid.appendChild(card);
    }
    sec.appendChild(grid);
    return sec;
  }

  function buildCast(data) {
    if (!data.celebrities || !data.celebrities.length) return null;
    const sec = el('section', { className: 'atv-section', id: 'atv-cast' });
    sec.appendChild(buildSectionHeader('演职员'));
    const carousel = el('div', { className: 'atv-carousel' });
    for (const c of data.celebrities) {
      const card = el(c.link ? 'a' : 'div', { className: 'atv-cast-card' });
      if (c.link) { card.href = c.link; card.target = '_blank'; card.rel = 'noopener'; }
      const av = el('div', { className: 'atv-cast-avatar' });
      if (c.avatar) av.style.backgroundImage = 'url("' + encodeURI(c.avatar) + '")';
      card.appendChild(av);
      card.appendChild(el('div', { className: 'atv-cast-name', text: c.name }));
      if (c.role) card.appendChild(el('div', { className: 'atv-cast-role', text: c.role }));
      carousel.appendChild(card);
    }
    sec.appendChild(carousel);
    return sec;
  }

  function buildPhotos(data) {
    if (!data.photos || !data.photos.length) return null;
    const sec = el('section', { className: 'atv-section', id: 'atv-photos' });
    sec.appendChild(buildSectionHeader('剧照'));
    const carousel = el('div', { className: 'atv-carousel atv-photos' });
    for (const p of data.photos) {
      const tile = el(p.link ? 'a' : 'div', { className: 'atv-photo-tile' });
      if (p.link) { tile.href = p.link; tile.target = '_blank'; tile.rel = 'noopener'; }
      const img = el('img', { src: p.hdUrl || p.thumbUrl, alt: '剧照' });
      img.referrerPolicy = 'no-referrer';
      img.loading = 'lazy';
      img.onerror = function () { if (p.thumbUrl && img.src !== p.thumbUrl) img.src = p.thumbUrl; };
      tile.appendChild(img);
      carousel.appendChild(tile);
    }
    sec.appendChild(carousel);
    return sec;
  }

  function buildRecs(data) {
    if (!data.recommendations || !data.recommendations.length) return null;
    const sec = el('section', { className: 'atv-section', id: 'atv-recs' });
    sec.appendChild(buildSectionHeader('相似作品'));
    const grid = el('div', { className: 'atv-recs' });
    for (const r of data.recommendations) {
      const card = el(r.link ? 'a' : 'div', { className: 'atv-rec-card' });
      if (r.link) { card.href = r.link; card.target = '_blank'; card.rel = 'noopener'; }
      const posterWrap = el('div', { className: 'atv-rec-poster' });
      if (r.poster) {
        const img = el('img', { src: r.poster, alt: r.title });
        img.referrerPolicy = 'no-referrer';
        img.loading = 'lazy';
        img.onerror = function () {
          posterWrap.innerHTML = '';
          posterWrap.appendChild(el('div', { className: 'atv-poster-placeholder', html: ICON_FILM_PLACEHOLDER }));
        };
        posterWrap.appendChild(img);
      } else {
        posterWrap.appendChild(el('div', { className: 'atv-poster-placeholder', html: ICON_FILM_PLACEHOLDER }));
      }
      card.appendChild(posterWrap);
      card.appendChild(el('div', { className: 'atv-rec-title', text: r.title }));
      grid.appendChild(card);
    }
    sec.appendChild(grid);
    return sec;
  }

  function buildDetails(data) {
    const sec = el('section', { className: 'atv-section', id: 'atv-info' });
    sec.appendChild(buildSectionHeader('详细信息'));
    const grid = el('div', { className: 'atv-info-grid' });

    const linksValue = (arr) => {
      const wrap = el('div', { className: 'atv-info-value' });
      arr.forEach((it, i) => {
        if (i > 0) wrap.appendChild(document.createTextNode(' / '));
        if (it.href) {
          const a = el('a', { href: it.href, text: it.text, target: '_blank', rel: 'noopener' });
          wrap.appendChild(a);
        } else {
          wrap.appendChild(document.createTextNode(it.text));
        }
      });
      return wrap;
    };
    const textValue = (txt) => el('div', { className: 'atv-info-value', text: txt });
    const addRow = (label, valueNode) => {
      grid.appendChild(el('div', { className: 'atv-info-label', text: label }));
      grid.appendChild(valueNode);
    };

    const info = data.info;
    if (info.director && info.director.length) addRow('导演', linksValue(info.director));
    if (info.writers && info.writers.length) addRow('编剧', linksValue(info.writers));
    if (info.cast && info.cast.length) addRow('主演', linksValue(info.cast));
    if (info.genres && info.genres.length) addRow('类型', textValue(info.genres.join(' / ')));
    if (info.country) addRow('制片国家/地区', textValue(info.country));
    if (info.language) addRow('语言', textValue(info.language));

    if (data.isTV) {
      if (info.firstAired) addRow('首播', textValue(info.firstAired));
      else if (info.releaseDate) addRow('首播', textValue(info.releaseDate));
      if (info.seasons) addRow('季数', textValue(info.seasons));
      if (info.episodes) addRow('集数', textValue(info.episodes));
      if (info.episodeRuntime) addRow('单集片长', textValue(info.episodeRuntime));
    } else {
      if (info.releaseDate) addRow('上映日期', textValue(info.releaseDate));
      if (info.runtime) addRow('片长', textValue(info.runtime));
    }

    if (info.aliases) addRow('又名', textValue(info.aliases));
    if (info.imdb) {
      const wrap = el('div', { className: 'atv-info-value' });
      if (/^tt\d+$/.test(info.imdb)) {
        wrap.appendChild(el('a', {
          href: 'https://www.imdb.com/title/' + info.imdb + '/',
          text: info.imdb,
          target: '_blank',
          rel: 'noopener',
        }));
      } else {
        wrap.textContent = info.imdb;
      }
      addRow('IMDb', wrap);
    }

    if (data.awards && data.awards.length) {
      for (const a of data.awards) {
        const value = el('div', { className: 'atv-info-value' });
        if (a.name) {
          value.appendChild(el('div', { text: a.name }));
        }
        if (a.person) {
          const personLine = el('div', { attrs: { style: 'font-size:13px;color:var(--atv-text-tertiary);margin-top:2px' } });
          if (a.personLink) {
            personLine.appendChild(el('a', { text: a.person, href: a.personLink, target: '_blank', rel: 'noopener' }));
          } else {
            personLine.textContent = a.person;
          }
          value.appendChild(personLine);
        }
        const label = el('div', { className: 'atv-info-label', attrs: { style: 'color:var(--atv-rating-gold)' } });
        if (a.orgLink) {
          label.appendChild(el('a', { text: a.org, href: a.orgLink, target: '_blank', rel: 'noopener', attrs: { style: 'color:inherit' } }));
        } else {
          label.textContent = a.org;
        }
        grid.appendChild(label);
        grid.appendChild(value);
      }
    }

    if (!grid.children.length) return null;
    sec.appendChild(grid);
    return sec;
  }

  function buildStickyNav(data, jumps) {
    const nav = el('nav', { className: 'atv-stickynav' });
    nav.appendChild(el('div', { className: 'atv-stickynav-title', text: data.title.primary || data.title.full }));
    const wrap = el('div', { className: 'atv-stickynav-jumps' });
    for (const j of jumps) {
      const a = el('a', { href: '#' + j.id, text: j.label });
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const t = document.getElementById(j.id);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      wrap.appendChild(a);
    }
    nav.appendChild(wrap);
    return nav;
  }

  // ============================================================
  // ============================================================
  function render() {
    if (document.getElementById('atv-douban-root')) return;
    if (!$('#content h1')) {
      console.warn('[ATV-Douban] 未找到主内容节点，跳过美化');
      return;
    }

    addStyle(CSS);

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
        isTV,
      };
    } catch (err) {
      console.warn('[ATV-Douban] 数据提取失败：', err);
      return;
    }

    const root = el('div', { id: 'atv-douban-root' });
    document.title = (data.title.primary || data.title.full) + (data.year ? ' (' + data.year + ')' : '') + ' · 豆瓣';

    const jumps = [];
    if (data.streaming && data.streaming.length) jumps.push({ id: 'atv-stream', label: '在哪儿看' });
    if (data.celebrities.length) jumps.push({ id: 'atv-cast', label: '演职员' });
    if (data.photos.length) jumps.push({ id: 'atv-photos', label: '剧照' });
    if (data.comments && data.comments.length) jumps.push({ id: 'atv-comments', label: '短评' });
    if (data.recommendations.length) jumps.push({ id: 'atv-recs', label: '相似作品' });
    jumps.push({ id: 'atv-info', label: '详情' });

    const stickyNav = buildStickyNav(data, jumps);

    root.appendChild(buildHero(data));
    const stream = buildStreaming(data); if (stream) root.appendChild(stream);
    const cast = buildCast(data); if (cast) root.appendChild(cast);
    const photos = buildPhotos(data); if (photos) root.appendChild(photos);
    const comments = buildComments(data); if (comments) root.appendChild(comments);
    const recs = buildRecs(data); if (recs) root.appendChild(recs);
    const details = buildDetails(data); if (details) root.appendChild(details);
    root.appendChild(el('div', { className: 'atv-footer-spacer' }));

    document.body.insertBefore(root, document.body.firstChild);
    document.body.appendChild(stickyNav);

    const reveal = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      stickyNav.classList.toggle('is-visible', y > 300);
    };
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
  }

  // ============================================================
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
})();
