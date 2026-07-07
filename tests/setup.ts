const createMemoryStorage = (): Storage => {
  const entries = new Map<string, string>();

  return {
    clear: () => {
      entries.clear();
    },
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
  };
};

const installStorageGlobal = (
  name: "localStorage" | "sessionStorage",
  storage: Storage
): void => {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: storage,
    writable: true,
  });
  Object.defineProperty(window, name, {
    configurable: true,
    value: storage,
    writable: true,
  });
};

installStorageGlobal("localStorage", createMemoryStorage());
installStorageGlobal("sessionStorage", createMemoryStorage());
