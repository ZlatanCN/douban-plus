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

const handleAnimationCancellation = (error: unknown): void => {
  if (error instanceof Error && error.name === "AbortError") {
    return;
  }
  throw error;
};

const animationConstructors = new Set(
  [globalThis.Animation, window.Animation].filter(
    (constructor): constructor is typeof Animation => constructor !== undefined
  )
);

for (const animationConstructor of animationConstructors) {
  const cancelAnimation = animationConstructor.prototype.cancel;
  animationConstructor.prototype.cancel = function cancel(): void {
    // Animation.cancel() is synchronous; attach a handler before it rejects `finished`.
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    void this.finished.catch(handleAnimationCancellation);
    cancelAnimation.call(this);
  };
}
