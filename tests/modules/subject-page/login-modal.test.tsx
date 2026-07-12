import { setTimeout as delay } from "node:timers/promises";

import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginModal } from "@/modules/subject-page/login/login-modal";
import { mountNativeLoginFrame } from "@/modules/subject-page/login/native-login-frame";

import { renderIntoRoot } from "../../helpers/render";

// Mock mountNativeLoginFrame to isolate the component's state management
// from the real function's complex polling/DOM interactions.
vi.mock(
  import("../../../src/modules/subject-page/login/native-login-frame"),
  () => ({
    mountNativeLoginFrame: vi.fn<typeof mountNativeLoginFrame>(),
  })
);

const mockMountNativeLoginFrame = vi.mocked(mountNativeLoginFrame);
const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  await delay(0);
  await Promise.resolve();
};

describe(LoginModal, () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockMountNativeLoginFrame.mockReset();
    mockMountNativeLoginFrame.mockImplementation(
      (_host: HTMLElement, callbacks) => {
        callbacks.onMount();
        callbacks.onLoad();
        return () => {};
      }
    );

    /* eslint-disable promise/prefer-await-to-callbacks -- callback-based APIs */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears loading status only after the native iframe loads", async () => {
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(<LoginModal action="测试" onClose={onClose} />);
    await flushEffects();

    const status = root.querySelector<HTMLElement>(".atv-login-modal-status");
    expect(status).not.toBeNull();
    expect(mockMountNativeLoginFrame).toHaveBeenCalledOnce();
    expect(status?.hidden).toBeTruthy();
    expect(root.querySelector(".atv-login-modal-native")?.classList).toContain(
      "is-ready"
    );
  });

  it("shows loading status while iframe is being mounted", async () => {
    // Override the mock: don't call onReady to simulate loading state.
    mockMountNativeLoginFrame.mockImplementation(
      // `callbacks` is deliberately unused to simulate pending load.
      (_host: HTMLElement, _callbacks) => () => {}
    );

    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(<LoginModal action="测试" onClose={onClose} />);
    await flushEffects();

    const status = root.querySelector<HTMLElement>(".atv-login-modal-status");
    expect(status).not.toBeNull();
    expect(status?.hidden).toBeFalsy();
    expect(status?.textContent).toBe("正在载入豆瓣登录组件…");
  });

  it("cancels the native login mount when the modal unmounts", async () => {
    const stop = vi.fn<() => void>();
    mockMountNativeLoginFrame.mockReturnValue(stop);
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(<LoginModal action="测试" onClose={onClose} />);
    await flushEffects();

    render(null, root);

    expect(stop).toHaveBeenCalledOnce();
  });
});
