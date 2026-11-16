type MenuCommandId = number | string;
type RatingDiagnosticsApi = {
  getValue: (key: string, defaultValue: unknown) => Promise<unknown>;
  registerMenuCommand: (
    caption: string,
    onClick: () => void
  ) => MenuCommandId | Promise<MenuCommandId>;
  setValue: (key: string, value: boolean) => Promise<void>;
  unregisterMenuCommand: (id: MenuCommandId) => void | Promise<void>;
  setClipboard?: (text: string, type?: string) => void | Promise<void>;
};

const getUserscriptApi = (): RatingDiagnosticsApi | undefined => {
  const globals = globalThis as typeof globalThis & {
    GM?: RatingDiagnosticsApi;
    GM_setClipboard?: (text: string, type?: string) => void;
  };
  const gm = globals.GM;
  if (
    !gm ||
    typeof gm.getValue !== "function" ||
    typeof gm.setValue !== "function" ||
    typeof gm.registerMenuCommand !== "function" ||
    typeof gm.unregisterMenuCommand !== "function"
  ) {
    return undefined;
  }
  const { setClipboard: gmClipboard } = gm;
  let setClipboard: RatingDiagnosticsApi["setClipboard"];
  if (typeof gmClipboard === "function") {
    setClipboard = gmClipboard;
  } else if (typeof globals.GM_setClipboard === "function") {
    setClipboard = globals.GM_setClipboard;
  }
  return {
    getValue: gm.getValue,
    registerMenuCommand: gm.registerMenuCommand,
    setValue: gm.setValue,
    unregisterMenuCommand: gm.unregisterMenuCommand,
    ...(setClipboard ? { setClipboard } : {}),
  };
};

export { getUserscriptApi };
export type { MenuCommandId, RatingDiagnosticsApi };
