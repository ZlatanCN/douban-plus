import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeData,
  mockGmXmlHttpRequest,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime cleanup", () => {
  setupSubjectRuntimeHooks();

  it("finishes the RT loading state when the Wikidata request times out", async () => {
    mockNetwork((url) =>
      url.includes("wikidata.org/w/api.php")
        ? "timeout"
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
    expect(
      mockGmXmlHttpRequest.mock.calls
        .filter(([request]) => request.url?.includes("wikidata.org"))
        .every(([request]) => request.timeout === 8000)
    ).toBeTruthy();
  });

  it("cleans up the late-series observer when the runtime unmounts", async () => {
    document.body.innerHTML = '<div id="series-items"></div>';
    const disconnect = vi.fn<() => void>();
    const observe = vi.fn<() => void>();
    vi.stubGlobal(
      "MutationObserver",
      class {
        disconnect = disconnect;
        observe = observe;
      }
    );
    const root = document.createElement("div");

    render(<SubjectPageRuntime data={makeData()} doc={document} />, root);
    await vi.waitFor(() =>
      expect(observe.mock.calls.length).toBeGreaterThan(0)
    );
    const observerCount = observe.mock.calls.length;
    render(null, root);

    await vi.waitFor(() =>
      expect(disconnect).toHaveBeenCalledTimes(observerCount)
    );
  });
});
