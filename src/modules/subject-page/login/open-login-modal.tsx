import { openImperativeModal } from "@/components/modal";

import { LoginModal } from "./login-modal";
import { clearNativeLoginMasks } from "./native-login-frame";

type LoginModalOptions = {
  action: string;
  returnUrl?: string;
};

const openLoginModal = (options: LoginModalOptions): void => {
  void options.returnUrl;

  clearNativeLoginMasks();
  openImperativeModal({
    content: (close) => <LoginModal action={options.action} onClose={close} />,
    id: "atv-login-modal",
    onClose: clearNativeLoginMasks,
  });
};

export { openLoginModal };
export type { LoginModalOptions };
