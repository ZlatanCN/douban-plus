import { describe, expect, it, vi } from "vitest";

import { createAccountGate } from "@/runtime/account-gate";

describe(createAccountGate, () => {
  it("allows account-gated actions when logged in", () => {
    const openPrompt = vi.fn<(action: string) => void>();
    const gate = createAccountGate({ loggedIn: true, openPrompt });

    expect(gate.requireLogin("给短评点有用")).toBeTruthy();
    expect(openPrompt).not.toHaveBeenCalled();
  });

  it("opens the login prompt and blocks the action when logged out", () => {
    const openPrompt = vi.fn<(action: string) => void>();
    const gate = createAccountGate({ loggedIn: false, openPrompt });

    expect(gate.requireLogin("给影评投票")).toBeFalsy();
    expect(openPrompt).toHaveBeenCalledWith("给影评投票");
  });
});
