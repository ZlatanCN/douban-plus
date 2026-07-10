/* ── GM_xmlhttpRequest Mock ────────────────────────────── */
/* Provides a mock for GM_xmlhttpRequest on globalThis.     */

import { vi } from "vitest";

/**
 * Default mock response factory — returns a simple JSON response.
 * Uses `new Response()` to avoid structural mismatch with happy-dom's
 * Response class (which has private fields).
 */
const createMockResponse = (overrides: Partial<Response> = {}): Response => {
  const response = new Response(null, {
    headers:
      overrides.headers ?? new Headers({ "content-type": "application/json" }),
    status: overrides.status ?? 200,
    statusText: overrides.statusText ?? "OK",
  });
  return Object.defineProperties(response, {
    clone: { value: overrides.clone ?? (() => createMockResponse(overrides)) },
    ok: { value: overrides.ok ?? true },
    redirected: { value: overrides.redirected ?? false },
    type: { value: overrides.type ?? "basic" },
    url: { value: overrides.url ?? "https://api.douban.com/" },
  });
};

/**
 * Install a mock GM_xmlhttpRequest on globalThis.
 * The mock ignores most params and returns a successful empty response.
 *
 * In tests that need real GM_xmlhttpRequest behavior, override
 * globalThis.GM_xmlhttpRequest before calling the function under test.
 *
 * @returns The mock instance for additional configuration (/assertion)
 */
type GmXhrParams = Parameters<
  NonNullable<typeof globalThis.GM_xmlhttpRequest>
>[0];

const installMockGM = (): ReturnType<typeof vi.fn> => {
  const mockFn = vi
    .fn<(details: GmXhrParams) => void>()
    .mockImplementation((_details): void => {
      // Default no-op — tests that need real responses should override
    });
  globalThis.GM_xmlhttpRequest = mockFn as unknown as NonNullable<
    typeof globalThis.GM_xmlhttpRequest
  >;
  return mockFn;
};

/**
 * Cleanup: remove the mock GM_xmlhttpRequest from globalThis.
 */
const cleanupMockGM = (): void => {
  globalThis.GM_xmlhttpRequest = undefined;
};

export { cleanupMockGM, createMockResponse, installMockGM };
