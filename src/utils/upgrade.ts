/* ── Image URL Upgrade Helpers ────────────────────────── */

/**
 * Upgrade poster CDN URL from standard to HD.
 * Replaces "s_ratio_poster" with "l_ratio_poster".
 */
const upgradePoster = (url: string | null | undefined): string | null => {
  if (!url) {
    return null;
  }
  return url
    .replace("/s_ratio_poster/", "/l_ratio_poster/")
    .replace("s_ratio_poster", "l_ratio_poster");
};

/**
 * Upgrade photo CDN URL from standard to HD.
 * Replaces "/sqxs/" → "/large/" and "/m/" → "/l/".
 */
const upgradePhoto = (url: string | null | undefined): string | null => {
  if (!url) {
    return null;
  }
  return url.replace("/sqxs/", "/large/").replace("/m/", "/l/");
};

/* ── Exports ─────────────────────────────────────────── */

export { upgradePhoto, upgradePoster };
