import { useEffect, useRef, useState } from "preact/hooks";

import { ModalCloseButton, ModalShell } from "@/components/modal/index";
import { useModalClose } from "@/components/modal/modal-close-context";

import { mountNativeLoginFrame } from "./native-login-frame";

type LoginModalProps = {
  action: string;
  onClose: () => void;
};

const LoginModalContent = ({
  action,
  busy,
  hostRef,
  status,
}: {
  action: string;
  busy: boolean;
  hostRef: { current: HTMLDivElement | null };
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
        class="atv-login-modal-native"
        ref={hostRef}
      />
    </>
  );
};

const LoginModal = ({ action, onClose }: LoginModalProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("正在载入豆瓣登录组件…");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    mountNativeLoginFrame(host, (message) => {
      setStatus(message);
      setBusy(false);
      host.setAttribute("aria-busy", "false");
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const hasIframe = hostRef.current?.querySelector("iframe");
      if (!hasIframe) {
        return;
      }
      const hasSession = document.cookie
        .split(";")
        .some((cookie) => cookie.trim().startsWith("ck="));
      if (hasSession) {
        clearInterval(timer);
        onClose();
        window.location.reload();
      }
    }, 300);

    return () => clearInterval(timer);
  }, [onClose]);

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
        status={status}
      />
    </ModalShell>
  );
};

export { LoginModal };
export type { LoginModalProps };
