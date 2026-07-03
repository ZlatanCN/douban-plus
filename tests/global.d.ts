/**
 * Type augmentation for test globals.
 *
 * These types make `GM_xmlhttpRequest` accessible on `globalThis` for tests
 * that install the mock via `installMockGM()`. The types are imported from
 * vite-plugin-monkey's `$` module which provides `GmXmlhttpRequestType`.
 */

import type { GmXmlhttpRequestType } from "$";

declare global {
  var GM_xmlhttpRequest: GmXmlhttpRequestType | undefined;
}
