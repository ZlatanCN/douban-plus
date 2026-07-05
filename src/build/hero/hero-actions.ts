import { el } from "../../components";
import {
  ICON_CHECK,
  ICON_PLAY,
  ICON_STAR_EMPTY,
  ICON_STAR_FULL,
  ICON_THUMB,
} from "../../constants";
import type { HeroCallbacks, InterestState } from "../../types";
import { INTEREST_LABELS } from "../../types";

/* ── makeInterestBtn — single action button ───────────── */

const makeInterestBtn = (
  text: string,
  cls: string,
  onClick: () => void
): HTMLButtonElement => {
  const icon = text === "想看" ? ICON_PLAY : ICON_CHECK;
  const btn = el("button", { attrs: { type: "button" }, className: cls }, [
    el("span", { html: icon }),
    el("span", { text }),
  ]);
  btn.addEventListener("click", onClick);
  return btn;
};

/* ── addWatchingBtn — "在看" for TV series ────────────── */

const addWatchingBtn = (actions: HTMLElement, onClick: () => void): void => {
  const btn = makeInterestBtn("在看", "atv-btn atv-btn-secondary", onClick);
  const seenBtn = actions.lastElementChild;
  if (seenBtn) {
    seenBtn.before(btn);
  } else {
    actions.append(btn);
  }
};

/* ── buildActions — full interest actions panel ───────── */

const buildActions = (
  state: InterestState,
  callbacks: HeroCallbacks
): HTMLElement => {
  const actions = el("div", { className: "atv-actions" });

  if (!state.loggedIn) {
    actions.append(
      makeInterestBtn("想看", "atv-btn atv-btn-primary", callbacks.onWishClick)
    );
    actions.append(
      makeInterestBtn(
        "看过",
        "atv-btn atv-btn-secondary",
        callbacks.onCollectClick
      )
    );
    if (state.hasWatching) {
      addWatchingBtn(actions, callbacks.onWatchingClick);
    }
    return actions;
  }

  if (!state.marked) {
    actions.append(
      makeInterestBtn("想看", "atv-btn atv-btn-primary", () =>
        callbacks.onOpenInterest(state)
      )
    );
    actions.append(
      makeInterestBtn("看过", "atv-btn atv-btn-secondary", () =>
        callbacks.onOpenInterest(state)
      )
    );
    if (state.hasWatching) {
      addWatchingBtn(actions, () => callbacks.onOpenInterest(state));
    }
    return actions;
  }

  const label = INTEREST_LABELS[state.status];

  const header = el("div", { className: "atv-interest-panel-header" });
  header.append(
    el(
      "button",
      {
        attrs: { type: "button" },
        className: [
          "atv-btn",
          "atv-btn-primary",
          "is-active",
          "atv-interest-badge",
        ],
        onclick: () => callbacks.onOpenInterest(state),
      },
      [el("span", { html: ICON_CHECK }), el("span", { text: label })]
    )
  );
  if (state.rating > 0) {
    const starHtml = Array.from({ length: 5 }, (_, i) =>
      i < state.rating ? ICON_STAR_FULL : ICON_STAR_EMPTY
    ).join("");
    header.append(
      el("span", { className: "atv-interest-panel-stars", html: starHtml })
    );
  }
  if (state.date) {
    header.append(
      el("span", { className: "atv-interest-panel-date", text: state.date })
    );
  }

  const panel = el("div", { className: "atv-interest-panel" }, [header]);

  if (state.comment) {
    const commentChildren: (HTMLElement | string)[] = [
      el("span", { text: `"${state.comment}"` }),
    ];
    if (state.usefulCount) {
      const num = state.usefulCount.replaceAll(/\D/gu, "");
      commentChildren.push(
        el("span", { className: "atv-useful-badge" }, [
          el("span", { html: ICON_THUMB }),
          el("span", { text: num }),
        ])
      );
    }
    panel.append(
      el("div", { className: "atv-interest-panel-comment" }, commentChildren)
    );
  }

  actions.append(panel);
  return actions;
};

export { buildActions };
