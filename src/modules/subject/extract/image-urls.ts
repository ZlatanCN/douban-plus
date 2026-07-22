/* ── Image URL Upgrade Helpers ────────────────────────── */

/**
 * Upgrade poster CDN URL from standard to HD.
 * Replaces "s_ratio_poster" with "l_ratio_poster".
 */
const upgradePoster = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }
  return encodeURI(
    url
      .replace("/s_ratio_poster/", "/l_ratio_poster/")
      .replace("s_ratio_poster", "l_ratio_poster")
  );
};

/**
 * Upgrade photo CDN URL from standard to HD.
 * Replaces "/sqxs/" → "/large/" and "/m/" → "/l/".
 */
const upgradePhoto = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }
  return encodeURI(url.replace("/sqxs/", "/large/").replace("/m/", "/l/"));
};

/**
 * Replace Douban's square crop with a proportion-preserving rail thumbnail.
 */
const thumbnailPhoto = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }

  return encodeURI(url.replace("/sqxs/", "/photo/"));
};

/* ── Exports ─────────────────────────────────────────── */

export { thumbnailPhoto, upgradePhoto, upgradePoster };
