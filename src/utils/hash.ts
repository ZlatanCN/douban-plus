/* ── String Hash Utility ─────────────────────────────── */

/**
 * Deterministic string hash (DJB2-like with mod 1_000_000_007).
 */
const hashStr = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + (str.codePointAt(i) ?? 0)) % 1_000_000_007;
  }
  return h;
};

/* ── Exports ─────────────────────────────────────────── */

export { hashStr };
