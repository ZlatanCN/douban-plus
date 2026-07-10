/* ── GM_xmlhttpRequest Mock ────────────────────────────── */
/* Provides a mock for GM_xmlhttpRequest on globalThis.     */

import { vi } from "vitest";

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

export { cleanupMockGM, installMockGM };
