import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SubjectSuggestion } from "@/api/subject-suggestions";

import {
  cleanupSwitcherTests,
  fetchSuggestions,
  inputQuery,
  openSwitcher,
  renderSwitcher,
  suggestion,
  SubjectSwitcher,
} from "./subject-switcher-test-support";

describe(SubjectSwitcher, () => {
  beforeEach(() => {
    fetchSuggestions.mockReset();
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    cleanupSwitcherTests();
  });

  it("mounts returned catalog rows in a results group after loading", async () => {
    const pendingSuggestions = Promise.withResolvers<SubjectSuggestion[]>();
    fetchSuggestions.mockReturnValueOnce(pendingSuggestions.promise);
    const root = renderSwitcher();

    await openSwitcher(root);
    await inputQuery(root, "权力");
    await vi.waitFor(() => {
      expect(fetchSuggestions).toHaveBeenCalledOnce();
    });

    expect(root.querySelector(".atv-subject-suggestion-results")).toBeNull();

    pendingSuggestions.resolve([suggestion]);

    await vi.waitFor(() => {
      expect(
        root.querySelector(".atv-subject-suggestion-results")?.textContent
      ).toContain("权力的游戏 第一季");
    });
  });
});
