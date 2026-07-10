type AccountGateOptions = {
  loggedIn: boolean;
  openPrompt?: (action: string) => void;
};

type AccountGate = {
  requireLogin: (action: string) => boolean;
};

const createAccountGate = (options: AccountGateOptions): AccountGate => {
  const requireLogin = (action: string): boolean => {
    if (options.loggedIn) {
      return true;
    }
    options.openPrompt?.(action);
    return false;
  };

  return { requireLogin };
};

export { createAccountGate };
export type { AccountGate, AccountGateOptions };
