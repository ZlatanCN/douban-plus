import { openLoginModal } from "../modules/subject-page/login";

interface AccountGateOptions {
  loggedIn: boolean;
  openPrompt?: (action: string) => void;
}

interface AccountGate {
  requireLogin: (action: string) => boolean;
}

const createAccountGate = (options: AccountGateOptions): AccountGate => {
  const openPrompt =
    options.openPrompt ??
    ((action: string): void => {
      openLoginModal({ action });
    });

  const requireLogin = (action: string): boolean => {
    if (options.loggedIn) {
      return true;
    }
    openPrompt(action);
    return false;
  };

  return { requireLogin };
};

export { createAccountGate };
export type { AccountGate, AccountGateOptions };
