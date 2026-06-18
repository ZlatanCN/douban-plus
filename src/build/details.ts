/* ── Info Details Section Builder ────────────────────── */

import { el } from "../components";
import { ICON_ARROW, RE_IMDB_LINK } from "../constants";
import type { Award, DoubanData } from "../types";
import { buildSectionHeader } from "./sections";

const linksValue = (arr: { text: string; href?: string }[]): HTMLElement => {
  const wrap = el("div", { className: "atv-info-value" });
  for (let i = 0; i < arr.length; i += 1) {
    const it = arr[i];
    if (i > 0) {
      wrap.append(document.createTextNode(" / "));
    }
    if (it.href) {
      wrap.append(
        el("a", {
          href: it.href,
          rel: "noopener",
          target: "_blank",
          text: it.text,
        })
      );
    } else {
      wrap.append(document.createTextNode(it.text));
    }
  }
  return wrap;
};

const textValue = (txt: string): HTMLElement =>
  el("div", { className: "atv-info-value", text: txt });

const buildImdbRow = (imdb: string): HTMLElement => {
  const wrap = el("div", { className: "atv-info-value" });
  if (RE_IMDB_LINK.test(imdb)) {
    wrap.append(
      el(
        "a",
        {
          href: `https://www.imdb.com/title/${imdb}/`,
          rel: "noopener",
          target: "_blank",
          text: imdb,
        },
        [el("span", { html: ICON_ARROW })]
      )
    );
  } else {
    wrap.textContent = imdb;
  }
  return wrap;
};

const addTimeRows = (
  isTV: boolean,
  info: DoubanData["info"],
  addRow: (label: string, node: HTMLElement) => void
): void => {
  if (isTV) {
    if (info.firstAired) {
      addRow("首播", textValue(info.firstAired));
    } else if (info.releaseDate) {
      addRow("首播", textValue(info.releaseDate));
    }
    if (info.seasons) {
      addRow("季数", textValue(info.seasons));
    }
    if (info.episodes) {
      addRow("集数", textValue(info.episodes));
    }
    if (info.episodeRuntime) {
      addRow("单集片长", textValue(info.episodeRuntime));
    }
  } else {
    if (info.releaseDate) {
      addRow("上映日期", textValue(info.releaseDate));
    }
    if (info.runtime) {
      addRow("片长", textValue(info.runtime));
    }
  }
};

const buildAwards = (awards: Award[], grid: HTMLElement): void => {
  for (const a of awards) {
    const value = el("div", { className: "atv-info-value" });
    if (a.name) {
      value.append(el("div", { text: a.name }));
    }
    if (a.person) {
      const personLine = el("div", {
        attrs: {
          style: "font-size:13px;color:var(--atv-text-tertiary);margin-top:2px",
        },
      });
      if (a.personLink) {
        personLine.append(
          el("a", {
            href: a.personLink,
            rel: "noopener",
            target: "_blank",
            text: a.person,
          })
        );
      } else {
        personLine.textContent = a.person;
      }
      value.append(personLine);
    }
    const label = el("div", {
      attrs: { style: "color:var(--atv-rating-gold)" },
      className: "atv-info-label",
    });
    if (a.orgLink) {
      label.append(
        el("a", {
          attrs: { style: "color:inherit" },
          href: a.orgLink,
          rel: "noopener",
          target: "_blank",
          text: a.org,
        })
      );
    } else {
      label.textContent = a.org;
    }
    grid.append(label);
    grid.append(value);
  }
};

const buildDetails = (data: DoubanData): HTMLElement | null => {
  const sec = el("section", { className: "atv-section", id: "atv-info" });
  sec.append(buildSectionHeader("详细信息"));
  const grid = el("div", { className: "atv-info-grid" });

  const addRow = (label: string, valueNode: HTMLElement): void => {
    grid.append(el("div", { className: "atv-info-label", text: label }));
    grid.append(valueNode);
  };

  const { info } = data;

  if (info.director?.length) {
    addRow("导演", linksValue(info.director));
  }
  if (info.writers?.length) {
    addRow("编剧", linksValue(info.writers));
  }
  if (info.cast?.length) {
    addRow("主演", linksValue(info.cast));
  }
  if (info.genres?.length) {
    addRow("类型", textValue(info.genres.join(" / ")));
  }
  if (info.country) {
    addRow("制片国家/地区", textValue(info.country));
  }
  if (info.language) {
    addRow("语言", textValue(info.language));
  }

  addTimeRows(data.isTV, info, addRow);

  if (info.aliases) {
    addRow("又名", textValue(info.aliases));
  }
  if (info.imdb) {
    addRow("IMDb", buildImdbRow(info.imdb));
  }

  if (data.awards?.length) {
    buildAwards(data.awards, grid);
  }

  if (!grid.children.length) {
    return null;
  }
  sec.append(grid);
  return sec;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildDetails };
