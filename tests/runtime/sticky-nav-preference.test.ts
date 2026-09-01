import { describe, expect, it, vi } from "vitest";

import { createStickyNavPreference } from "@/shared/runtime/sticky-nav-preference";
import type { StickyNavPreferenceApi } from "@/shared/runtime/sticky-nav-preference";

type MenuCommand = {
  caption: string;
  id: string;
  onClick: () => void;
};

const makeApi = (storedValue?: unknown) => {
  let value = storedValue;
  const commands: MenuCommand[] = [];
  const getValue = vi.fn<StickyNavPreferenceApi["getValue"]>();
  const unregisterMenuCommand =
    vi.fn<StickyNavPreferenceApi["unregisterMenuCommand"]>();
  const setValue = vi.fn<StickyNavPreferenceApi["setValue"]>();
  const registerMenuCommand =
    vi.fn<StickyNavPreferenceApi["registerMenuCommand"]>();

  getValue.mockImplementation((_key: string, defaultValue: unknown) =>
    Promise.resolve(value === undefined ? defaultValue : value)
  );
  setValue.mockImplementation((_key, nextValue) => {
    value = nextValue;
    return Promise.resolve();
  });
  registerMenuCommand.mockImplementation((caption, onClick) => {
    const id = `menu-${commands.length + 1}`;
    commands.push({ caption, id, onClick });
    return id;
  });
  unregisterMenuCommand.mockImplementation((id) => {
    const index = commands.findIndex((command) => command.id === id);
    if (index !== -1) {
      commands.splice(index, 1);
    }
  });

  return {
    api: {
      getValue,
      registerMenuCommand,
      setValue,
      unregisterMenuCommand,
    },
    commands,
    getValue,
    registerMenuCommand,
    setValue,
    unregisterMenuCommand,
  };
};

describe("sticky nav visibility preference", () => {
  it("loads a valid mode and marks the active menu choice", async () => {
    const { api, commands, getValue } = makeApi("always");
    const preference = createStickyNavPreference(api);

    await expect(preference.initialize()).resolves.toBe("always");

    expect(getValue).toHaveBeenCalledWith(expect.any(String), "auto");
    expect(commands.map(({ caption }) => caption)).toStrictEqual([
      "顶部导航：自动显示",
      "顶部导航：始终显示（当前）",
    ]);
  });

  it("falls back to auto when the stored mode is invalid or unavailable", async () => {
    const invalid = makeApi("unsupported");
    const unavailable = makeApi();
    unavailable.getValue.mockRejectedValue(new Error("storage unavailable"));

    await expect(
      createStickyNavPreference(invalid.api).initialize()
    ).resolves.toBe("auto");
    await expect(
      createStickyNavPreference(unavailable.api).initialize()
    ).resolves.toBe("auto");
  });

  it("updates subscribers immediately and persists the selected mode", async () => {
    const { api, commands, setValue, unregisterMenuCommand } = makeApi();
    const preference = createStickyNavPreference(api);
    const listener = vi.fn<(mode: "auto" | "always") => void>();

    await preference.initialize();
    const unsubscribe = preference.subscribe(listener);
    expect(commands.map(({ caption }) => caption)).toStrictEqual([
      "顶部导航：自动显示（当前）",
      "顶部导航：始终显示",
    ]);
    commands[1]?.onClick();

    expect(preference.getMode()).toBe("always");
    expect(listener).toHaveBeenLastCalledWith("always");
    await vi.waitFor(() => {
      expect(setValue).toHaveBeenCalledWith(expect.any(String), "always");
      expect(commands.map(({ caption }) => caption)).toStrictEqual([
        "顶部导航：自动显示",
        "顶部导航：始终显示（当前）",
      ]);
    });
    expect(unregisterMenuCommand).toHaveBeenCalledWith(expect.any(String));

    unsubscribe();
    await preference.setMode("auto");
    expect(listener).toHaveBeenLastCalledWith("always");
  });

  it("keeps the latest menu state when refreshes overlap", async () => {
    const { api, commands, registerMenuCommand } = makeApi();
    const preference = createStickyNavPreference(api);

    await preference.initialize();
    registerMenuCommand.mockImplementation((caption, onClick) => {
      const id = `async-${commands.length + 1}`;
      commands.push({ caption, id, onClick });
      return Promise.resolve(id);
    });

    await Promise.all([
      preference.setMode("always"),
      preference.setMode("auto"),
    ]);

    expect(commands.map(({ caption }) => caption)).toStrictEqual([
      "顶部导航：自动显示（当前）",
      "顶部导航：始终显示",
    ]);
  });
});
