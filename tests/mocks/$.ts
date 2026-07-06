/* ── Mock $ virtual module for vitest ──────────────────── */
/* vite-plugin-monkey provides $ as a virtual module with   */
/* monkey context (GM_xmlhttpRequest, GM_addStyle, etc.).   */
/* In tests, globalThis.GM_xmlhttpRequest is set by         */
/* vi.hoisted() in the requesting test file BEFORE this     */
/* module loads, so reading globalThis here is safe.        */

type GmXhrFn = (opts: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: string;
  onerror: () => void;
  onload: (r: { responseText: string }) => void;
}) => void;

const xhr = (globalThis as { GM_xmlhttpRequest?: GmXhrFn }).GM_xmlhttpRequest;

if (!xhr) {
  throw new Error(
    "[douban-plus/test] globalThis.GM_xmlhttpRequest not set — " +
      "tests must use vi.hoisted() to install the mock before importing request.ts"
  );
}

const GM_xmlhttpRequest: GmXhrFn = xhr;

export { GM_xmlhttpRequest };
