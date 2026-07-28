const LOGIN_FRAME_STYLE_ID = "atv-login-frame-theme";

const LOGIN_FRAME_CSS = `
:root {
  color-scheme: dark;
  --atv-login-bg: #1c1c1e;
  --atv-login-bg-elevated: rgba(255, 255, 255, 0.06);
  --atv-login-border: rgba(255, 255, 255, 0.12);
  --atv-login-border-strong: rgba(65, 190, 93, 0.32);
  --atv-login-text: #ffffff;
  --atv-login-text-muted: rgba(255, 255, 255, 0.64);
  --atv-login-text-faint: rgba(255, 255, 255, 0.42);
  --atv-login-accent: #41be5d;
  --atv-login-accent-bright: #4cd97a;
  --atv-login-danger: #ff6b6b;
}

html,
body {
  box-sizing: border-box !important;
  min-width: 0 !important;
  margin: 0 !important;
  color: var(--atv-login-text) !important;
  background: var(--atv-login-bg) !important;
}

*,
*::before,
*::after {
  box-sizing: inherit !important;
}

body,
button,
input,
select,
textarea {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", "Microsoft YaHei", Inter, system-ui, sans-serif !important;
}

a,
a:link,
a:visited {
  color: var(--atv-login-accent) !important;
  text-decoration: none !important;
  background: transparent !important;
}

a:hover,
a:active {
  color: var(--atv-login-accent-bright) !important;
  background: transparent !important;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--atv-login-accent) !important;
  outline-offset: 2px !important;
}

.account-body,
.account-main,
.account-form,
.login-wrap,
.login-box {
  box-sizing: border-box !important;
  max-width: 100% !important;
  color: var(--atv-login-text) !important;
  background: transparent !important;
  box-shadow: none !important;
}

.account-body {
  width: 100% !important;
  min-width: 0 !important;
  padding: 0 0 10px !important;
}

.account-body-tabs,
.account-tabcon-start,
.account-tabcon-quick,
.account-quick,
.account-form {
  width: 100% !important;
}

.account-body-tabs {
  margin-bottom: 16px !important;
}

.account-body-tabs ul,
.account-tab,
.tab-start,
.tab-quick {
  border-color: var(--atv-login-border) !important;
}

.account-tab a,
.account-tab span,
.account-tab-phone,
.account-tab-account,
.account-tab-scan {
  color: var(--atv-login-text-muted) !important;
  background: transparent !important;
  transition:
    color 180ms ease,
    border-color 180ms ease !important;
}

.account-tab a.on,
.account-tab span.on,
.account-tab-phone.on,
.account-tab-account.on,
.account-tab-scan.on,
.account-tab .active {
  color: var(--atv-login-text) !important;
  border-color: var(--atv-login-accent) !important;
}

.account-tab-switch,
.account-tab-switch-icon,
.quick.icon-switch,
.start.icon-switch {
  filter: saturate(0.4) brightness(1.8) !important;
}

.account-form-tips,
.account-form-error,
.account-form-err,
.account-error,
.error,
.tips,
.tip {
  line-height: 1.5 !important;
}

.account-form-tips {
  color: var(--atv-login-text-muted) !important;
}

.account-form-error,
.account-form-err,
.account-error,
.error {
  color: var(--atv-login-danger) !important;
}

.account-form-field,
.account-form-field-phone,
.account-form-field-code,
.account-form-field-password,
.account-form-field-submit {
  box-sizing: border-box !important;
}

.account-form-field,
.account-form-field-phone,
.account-form-field-code,
.account-form-field-password,
.global-phone-input-input {
  min-height: 44px !important;
  color: var(--atv-login-text) !important;
  background: var(--atv-login-bg-elevated) !important;
  border-color: var(--atv-login-border) !important;
  border-radius: 10px !important;
}

.account-form-field:focus-within,
.account-form-field-phone:focus-within,
.account-form-field-code:focus-within,
.account-form-field-password:focus-within,
.global-phone-input-input:focus-within {
  border-color: var(--atv-login-border-strong) !important;
  box-shadow: 0 0 0 3px rgba(65, 190, 93, 0.12) !important;
}

.account-form-field input,
.account-form-field-phone input,
.account-form-field-code input,
.account-form-field-password input,
.global-phone-input-input input,
input[type="text"],
input[type="password"],
input[type="tel"],
input[type="phone"] {
  min-height: 42px !important;
  color: var(--atv-login-text) !important;
  caret-color: var(--atv-login-accent) !important;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.account-form-field input::placeholder,
.account-form-field-phone input::placeholder,
.account-form-field-code input::placeholder,
.account-form-field-password input::placeholder,
input::placeholder {
  color: var(--atv-login-text-faint) !important;
}

.account-form-field-area-code,
.account-form-field-label,
.account-form-raw,
.account-form-tip,
.account-form-tips,
.account-form-ft,
.account-form-3rd,
.account-form-3rd-hd,
.global-phone-input-area {
  color: var(--atv-login-text-muted) !important;
}

.account-form-field-area-code,
.global-phone-input-area,
.account-form-field-code {
  border-color: var(--atv-login-border) !important;
}

.account-form-field-submit .btn,
.account-form-field-submit button,
.account-form-field-submit input[type="submit"],
.btn,
.btn-phone,
.btn-account,
.btn-submit,
.btn-account {
  color: #fff !important;
  background: var(--atv-login-accent) !important;
  border-color: var(--atv-login-accent) !important;
  border-radius: 999px !important;
  box-shadow: 0 10px 26px rgba(65, 190, 93, 0.24) !important;
}

.account-form-field-submit .btn:hover,
.account-form-field-submit button:hover,
.account-form-field-submit input[type="submit"]:hover,
.btn:hover,
.btn-phone:hover,
.btn-account:hover,
.btn-submit:hover,
.btn-account:hover {
  color: #fff !important;
  background: var(--atv-login-accent-bright) !important;
  border-color: var(--atv-login-accent-bright) !important;
}

.account-form-3rd,
.account-form-ft {
  border-color: var(--atv-login-border) !important;
}

.account-form-3rd a,
.account-form-3rd .link-3rd,
.link-3rd-wx,
.link-3rd-wb,
.link-3rd-qq {
  background-color: rgba(255, 255, 255, 0.06) !important;
  border-color: var(--atv-login-border) !important;
  filter: grayscale(1) brightness(1.4) !important;
}

.account-quick,
.account-quick .qrcode,
.account-quick .qr-code,
.account-quick img,
.qrcode,
.qr-code {
  color: var(--atv-login-text-muted) !important;
  background-color: transparent !important;
  border-color: var(--atv-login-border) !important;
}

.account-quick img,
.qrcode img,
.qr-code img {
  border-radius: 12px !important;
}

@media (max-width: 380px) {
  .account-body {
    padding-right: 0 !important;
    padding-left: 0 !important;
  }

  .account-form-field,
  .account-form-field-phone,
  .account-form-field-code,
  .account-form-field-password,
  .global-phone-input-input {
    border-radius: 9px !important;
  }
}
`;

type LoginFrameLocation = Pick<Location, "hostname" | "pathname">;

const isDoubanLoginFrame = (
  loc: LoginFrameLocation = window.location
): boolean =>
  loc.hostname === "accounts.douban.com" &&
  loc.pathname.startsWith("/passport/login");

const installLoginFrameTheme = (doc: Document = document): void => {
  if (doc.querySelector(`#${LOGIN_FRAME_STYLE_ID}`)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = LOGIN_FRAME_STYLE_ID;
  style.textContent = LOGIN_FRAME_CSS;
  (doc.head ?? doc.documentElement).append(style);
};

export { installLoginFrameTheme, isDoubanLoginFrame };
