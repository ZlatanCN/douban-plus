import { afterEach, describe, expect, it, vi } from "vitest";

import { openImperativeModal } from "@/components/modal";
import { openInterestModal } from "@/modules/subject-page/interest";
import { openLoginModal } from "@/modules/subject-page/login";
import type { InterestState, ModalCallbacks } from "@/types";

const INTEREST_STATE: InterestState = {
  ck: "token",
  comment: "",
  date: "",
  hasWatching: false,
  loggedIn: true,
  marked: false,
  rating: 0,
  status: "none",
  tags: [],
  usefulCount: "",
};

const INTEREST_CALLBACKS: ModalCallbacks = {
  onRemove: () => Promise.resolve({ ok: true }),
  onSave: () => Promise.resolve({ ok: true }),
};

const openTestModal = (
  id: string,
  label: string,
  onClose?: () => void
): void => {
  openImperativeModal({
    content: (close) => (
      <div id={id}>
        <span>{label}</span>
        <button onClick={close} type="button">
          Close
        </button>
      </div>
    ),
    id,
    onClose,
  });
};

describe("imperative modal lifecycle", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  describe(openImperativeModal, () => {
    it("replaces only an existing modal with the same id", () => {
      openTestModal("first-modal", "first");
      const first = document.querySelector("#first-modal");
      openTestModal("second-modal", "second");
      openTestModal("first-modal", "replacement");

      expect(document.body.contains(first)).toBeFalsy();
      expect(document.querySelector("#second-modal")?.textContent).toContain(
        "second"
      );
      expect(document.querySelector("#first-modal")?.textContent).toContain(
        "replacement"
      );
    });

    it("runs adapter cleanup before unmounting and restores focus", () => {
      const trigger = document.createElement("button");
      document.body.append(trigger);
      trigger.focus();
      const onClose = vi.fn<() => void>(() => {
        expect(document.querySelector("#test-modal")).not.toBeNull();
      });

      openTestModal("test-modal", "test", onClose);
      document.querySelector<HTMLButtonElement>("#test-modal button")?.click();

      expect(onClose).toHaveBeenCalledOnce();
      expect(document.querySelector("#test-modal")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it("ignores a stale close after replacing a modal with the same id", () => {
      let closeFirst!: () => void;
      const firstCleanup = vi.fn<() => void>();
      openImperativeModal({
        content: (close) => {
          closeFirst = close;
          return <div id="test-modal">first</div>;
        },
        id: "test-modal",
        onClose: firstCleanup,
      });
      const replacementCleanup = vi.fn<() => void>();
      openTestModal("test-modal", "replacement", replacementCleanup);
      expect(firstCleanup).toHaveBeenCalledOnce();

      closeFirst();

      expect(firstCleanup).toHaveBeenCalledOnce();
      expect(replacementCleanup).not.toHaveBeenCalled();
      expect(document.querySelector("#test-modal")?.textContent).toContain(
        "replacement"
      );
    });

    it("restores the original trigger after replacing an open modal", () => {
      const trigger = document.createElement("button");
      document.body.append(trigger);
      trigger.focus();
      openTestModal("test-modal", "first");
      document.querySelector<HTMLButtonElement>("#test-modal button")?.focus();
      openTestModal("test-modal", "replacement");
      document.querySelector<HTMLButtonElement>("#test-modal button")?.click();

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe(openInterestModal, () => {
    it("restores focus to the trigger after the modal closes", () => {
      vi.useFakeTimers();
      /* eslint-disable promise/prefer-await-to-callbacks -- browser API is callback-based. */
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (callback: FrameRequestCallback): number => {
          callback(0);
          return 0;
        }
      );
      /* eslint-enable promise/prefer-await-to-callbacks */
      const trigger = document.createElement("button");
      document.body.append(trigger);
      trigger.focus();

      openInterestModal(INTEREST_STATE, INTEREST_CALLBACKS);
      document
        .querySelector<HTMLButtonElement>(
          "#atv-interest-modal .atv-modal-close"
        )
        ?.click();
      vi.advanceTimersByTime(400);

      expect(document.querySelector("#atv-interest-modal")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe(openLoginModal, () => {
    it("cleans native masks and restores focus after close", () => {
      vi.useFakeTimers();
      /* eslint-disable promise/prefer-await-to-callbacks -- browser API is callback-based. */
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (callback: FrameRequestCallback): number => {
          callback(0);
          return 0;
        }
      );
      /* eslint-enable promise/prefer-await-to-callbacks */
      const trigger = document.createElement("button");
      document.body.append(trigger);
      trigger.focus();

      openLoginModal({ action: "投票" });
      const nativeMask = document.createElement("div");
      nativeMask.className = "ui-mask";
      document.body.append(nativeMask);
      document
        .querySelector<HTMLButtonElement>("#atv-login-modal .atv-modal-close")
        ?.click();
      vi.advanceTimersByTime(400);

      expect(document.querySelector(".ui-mask")).toBeNull();
      expect(document.querySelector("#atv-login-modal")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
