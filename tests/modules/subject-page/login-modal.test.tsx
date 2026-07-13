import { setTimeout as delay } from "node:timers/promises";

import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginModal } from "@/modules/subject-page/login/login-modal";
import { mountNativeLoginFrame } from "@/modules/subject-page/login/native-login-frame";
import type { NativeLoginAdoptionState } from "@/modules/subject-page/login/native-login-frame";

import { renderIntoRoot } from "../../helpers/render";

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
      (_host: HTMLElement, onStateChange) => {
        onStateChange({ kind: "mounted" });
        onStateChange({ kind: "ready" });
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

  it("clears loading status only after the adoption lifecycle is ready", async () => {
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

  it("shows loading status until the lifecycle reports progress", async () => {
    mockMountNativeLoginFrame.mockImplementation(
      (_host: HTMLElement, _onStateChange) => () => {}
    );
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(<LoginModal action="测试" onClose={onClose} />);
    await flushEffects();

    const status = root.querySelector<HTMLElement>(".atv-login-modal-status");
    expect(status).not.toBeNull();
    expect(status?.hidden).toBeFalsy();
    expect(status?.textContent).toBe("正在载入豆瓣登录组件…");
  });

  it("renders a lifecycle failure without knowing its host implementation", async () => {
    mockMountNativeLoginFrame.mockImplementation(
      (_host: HTMLElement, onStateChange) => {
        const failure: NativeLoginAdoptionState = {
          kind: "error",
          message: "无法载入豆瓣登录组件，请刷新页面后重试。",
        };
        onStateChange(failure);
        return () => {};
      }
    );
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(<LoginModal action="测试" onClose={onClose} />);
    await flushEffects();

    const status = root.querySelector<HTMLElement>(".atv-login-modal-status");
    expect(status?.textContent).toBe(
      "无法载入豆瓣登录组件，请刷新页面后重试。"
    );
    expect(
      root.querySelector(".atv-login-modal-native")?.getAttribute("aria-busy")
    ).toBe("false");
  });

  it("cancels the adoption lifecycle when the modal unmounts", async () => {
    const stop = vi.fn<() => void>();
    mockMountNativeLoginFrame.mockReturnValue(stop);
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(<LoginModal action="测试" onClose={onClose} />);
    await flushEffects();

    render(null, root);

    expect(stop).toHaveBeenCalledOnce();
  });
});
