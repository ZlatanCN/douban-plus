import { render } from "preact";

import { LoginModal } from "./login-modal";
import { clearNativeLoginMasks } from "./native-login-frame";

type LoginModalOptions = {
  action: string;
  returnUrl?: string;
};

const openLoginModal = (options: LoginModalOptions): void => {
  void options.returnUrl;

  document.querySelector("#atv-login-modal")?.remove();
  clearNativeLoginMasks();

  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const host = document.createElement("div");
  document.body.append(host);

  const close = (): void => {
    clearNativeLoginMasks();
    render(null, host);
    host.remove();
    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  };

  render(<LoginModal action={options.action} onClose={close} />, host);
};

export { openLoginModal };
export type { LoginModalOptions };
