/* ── DOM Query Helpers ────────────────────────────────── */

const $ = <T extends Element = Element>(
  selector: string,
  ctx?: ParentNode
): T | null => (ctx ?? document).querySelector<T>(selector);

const $$ = <T extends Element = Element>(
  selector: string,
  ctx?: ParentNode
): T[] => [...(ctx ?? document).querySelectorAll<T>(selector)];

const safeText = (el?: Node | null): string =>
  el ? (el.textContent ?? "").trim() : "";

/* ── Exports ─────────────────────────────────────────── */

export { $, $$, safeText };
