import { useEffect, useRef, useState } from "preact/hooks";

import { ModalCloseButton, ModalShell } from "@/components/modal";
import { useModalClose } from "@/components/modal/modal-close-context";

import { mountNativeLoginFrame } from "./native-login-frame";
import type { NativeLoginAdoptionState } from "./native-login-frame";

type LoginModalProps = {
  action: string;
  onClose: () => void;
};

const statusForLoginState = (state: NativeLoginAdoptionState): string => {
  if (state.kind === "error") {
    return state.message;
  }
  if (state.kind === "loading" || state.kind === "mounted") {
    return "正在载入豆瓣登录组件…";
  }
  return "";
};

const LoginModalContent = ({
  action,
  busy,
  hostRef,
  iframeReady,
  status,
}: {
  action: string;
  busy: boolean;
  hostRef: { current: HTMLDivElement | null };
  iframeReady: boolean;
  status: string;
}) => {
  const handleClose = useModalClose();
  return (
    <>
      <div class="atv-modal-accent-bar atv-login-modal-accent" />
      <ModalCloseButton
        ariaLabel="关闭登录弹窗"
        className="atv-login-modal-close"
        onClick={handleClose}
        size={18}
      />
      <h2 class="atv-login-modal-title" id="atv-login-modal-title">
        登录豆瓣后继续
      </h2>
      <p class="atv-login-modal-desc" id="atv-login-modal-desc">
        {`登录后才能${action}。`}
      </p>
      <p aria-live="polite" class="atv-login-modal-status" hidden={!status}>
        {status}
      </p>
      <div
        aria-busy={busy ? "true" : "false"}
        class={`atv-login-modal-native${iframeReady ? " is-ready" : ""}`}
        ref={hostRef}
      />
    </>
  );
};

const LoginModal = ({ action, onClose }: LoginModalProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<NativeLoginAdoptionState>({
    kind: "loading",
  });
  const busy = state.kind === "loading" || state.kind === "mounted";
  const iframeReady = state.kind === "ready";
  const status = statusForLoginState(state);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    return mountNativeLoginFrame(host, setState);
  }, []);

  return (
    <ModalShell
      ariaDescribedBy="atv-login-modal-desc"
      ariaLabelledBy="atv-login-modal-title"
      className="atv-login-modal"
      id="atv-login-modal"
      onClose={onClose}
      surfaceClassName="atv-login-modal-inner"
    >
      <LoginModalContent
        action={action}
        busy={busy}
        hostRef={hostRef}
        iframeReady={iframeReady}
        status={status}
      />
    </ModalShell>
  );
};

export { LoginModal };
export type { LoginModalProps };
