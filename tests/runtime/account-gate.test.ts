import { describe, expect, it, vi } from "vitest";

import { createAccountGate } from "../../src/runtime/account-gate";

describe("createAccountGate", () => {
  it("allows account-gated actions when logged in", () => {
    const openPrompt = vi.fn();
    const gate = createAccountGate({ loggedIn: true, openPrompt });

    expect(gate.requireLogin("给短评点有用")).toBe(true);
    expect(openPrompt).not.toHaveBeenCalled();
  });

  it("opens the login prompt and blocks the action when logged out", () => {
    const openPrompt = vi.fn();
    const gate = createAccountGate({ loggedIn: false, openPrompt });

    expect(gate.requireLogin("给影评投票")).toBe(false);
    expect(openPrompt).toHaveBeenCalledWith("给影评投票");
  });
});
