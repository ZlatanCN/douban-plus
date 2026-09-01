type StickyNavVisibilityMode = "always" | "auto";
type MenuCommandId = string | number;

type StickyNavPreferenceApi = {
  getValue: (key: string, defaultValue: unknown) => Promise<unknown>;
  registerMenuCommand: (
    caption: string,
    onClick: () => void
  ) => MenuCommandId | Promise<MenuCommandId>;
  setValue: (key: string, value: StickyNavVisibilityMode) => Promise<void>;
  unregisterMenuCommand: (id: MenuCommandId) => void | Promise<void>;
};

type StickyNavPreference = {
  getMode: () => StickyNavVisibilityMode;
  initialize: () => Promise<StickyNavVisibilityMode>;
  setMode: (mode: StickyNavVisibilityMode) => Promise<void>;
  subscribe: (listener: (mode: StickyNavVisibilityMode) => void) => () => void;
};

const DEFAULT_MODE: StickyNavVisibilityMode = "auto";
const STORAGE_KEY = "douban-plus.sticky-nav.visibility";

const isStickyNavVisibilityMode = (
  value: unknown
): value is StickyNavVisibilityMode => value === "always" || value === "auto";

const getUserscriptApi = (): StickyNavPreferenceApi | undefined => {
  const userscriptGlobal = globalThis as typeof globalThis & {
    GM?: StickyNavPreferenceApi;
  };
  const gm = userscriptGlobal.GM;
  if (
    !gm ||
    typeof gm.getValue !== "function" ||
    typeof gm.setValue !== "function" ||
    typeof gm.registerMenuCommand !== "function" ||
    typeof gm.unregisterMenuCommand !== "function"
  ) {
    return undefined;
  }

  return {
    getValue: gm.getValue,
    registerMenuCommand: gm.registerMenuCommand,
    setValue: gm.setValue,
    unregisterMenuCommand: gm.unregisterMenuCommand,
  };
};

const createStickyNavPreference = (
  api: StickyNavPreferenceApi | undefined
): StickyNavPreference => {
  let mode: StickyNavVisibilityMode = DEFAULT_MODE;
  let initialization: Promise<StickyNavVisibilityMode> | undefined;
  let menuCommandIds: MenuCommandId[] = [];
  let menuRefreshVersion = 0;
  const listeners = new Set<(nextMode: StickyNavVisibilityMode) => void>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener(mode);
    }
  };

  const unregisterMenuCommand = async (id: MenuCommandId): Promise<boolean> => {
    try {
      await api?.unregisterMenuCommand(id);
      return true;
    } catch {
      // Menu cleanup is optional; the next registration still reflects the mode.
      return false;
    }
  };

  const registerMenuCommands = async (
    onSelect: (nextMode: StickyNavVisibilityMode) => void
  ): Promise<void> => {
    if (api) {
      menuRefreshVersion += 1;
      const refreshVersion = menuRefreshVersion;
      const previousIds = menuCommandIds;
      const cleanupResults = await Promise.all(
        previousIds.map(unregisterMenuCommand)
      );
      if (!cleanupResults.every(Boolean)) {
        return;
      }
      menuCommandIds = [];

      const ids = await Promise.all(
        (["auto", "always"] as const).map(async (option) => {
          try {
            return await api.registerMenuCommand(
              `顶部导航：${option === "auto" ? "自动显示" : "始终显示"}${mode === option ? "（当前）" : ""}`,
              () => onSelect(option)
            );
          } catch {
            // Menu registration is optional; navigation still works without it.
            return null;
          }
        })
      );
      const registeredIds = ids.filter(
        (id): id is MenuCommandId => id !== null
      );
      if (refreshVersion === menuRefreshVersion) {
        menuCommandIds = registeredIds;
      } else {
        await Promise.all(registeredIds.map(unregisterMenuCommand));
      }
    }
  };

  const setMode = async (nextMode: StickyNavVisibilityMode): Promise<void> => {
    if (mode !== nextMode) {
      mode = nextMode;
      notify();
      await registerMenuCommands((option) => {
        setMode(option);
      });
    }
    if (!api) {
      return;
    }
    try {
      await api.setValue(STORAGE_KEY, nextMode);
    } catch {
      // Preference persistence is optional; the current page already updated.
    }
  };

  const initialize = (): Promise<StickyNavVisibilityMode> => {
    if (initialization) {
      return initialization;
    }
    initialization = (async () => {
      if (api) {
        try {
          const storedMode = await api.getValue(STORAGE_KEY, DEFAULT_MODE);
          mode = isStickyNavVisibilityMode(storedMode)
            ? storedMode
            : DEFAULT_MODE;
        } catch {
          mode = DEFAULT_MODE;
        }
        await registerMenuCommands((option) => {
          setMode(option);
        });
      }
      notify();
      return mode;
    })();
    return initialization;
  };

  const subscribe = (
    listener: (nextMode: StickyNavVisibilityMode) => void
  ): (() => void) => {
    listeners.add(listener);
    listener(mode);
    return () => listeners.delete(listener);
  };

  return {
    getMode: () => mode,
    initialize,
    setMode,
    subscribe,
  };
};

const stickyNavPreference = createStickyNavPreference(getUserscriptApi());

export { createStickyNavPreference, stickyNavPreference };
export type { StickyNavPreferenceApi, StickyNavVisibilityMode };
