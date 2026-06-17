/* ── Info Details Section Builder ────────────────────── */

import { el } from "../components/dom-factory";
import { ICON_ARROW, RE_IMDB_LINK } from "../constants";
import type { DoubanData } from "../types";
import { buildSectionHeader } from "./sections";

function buildDetails(data: DoubanData): HTMLElement | null {
  const sec = el("section", { className: "atv-section", id: "atv-info" });
  sec.appendChild(buildSectionHeader("详细信息"));
  const grid = el("div", { className: "atv-info-grid" });

  const linksValue = (
    arr: Array<{ text: string; href?: string }>
  ): HTMLElement => {
    const wrap = el("div", { className: "atv-info-value" });
    arr.forEach((it, i) => {
      if (i > 0) {
        wrap.appendChild(document.createTextNode(" / "));
      }
      if (it.href) {
        wrap.appendChild(
          el("a", {
            href: it.href,
            text: it.text,
            target: "_blank",
            rel: "noopener",
          })
        );
      } else {
        wrap.appendChild(document.createTextNode(it.text));
      }
    });
    return wrap;
  };

  const textValue = (txt: string): HTMLElement =>
    el("div", { className: "atv-info-value", text: txt });

  const addRow = (label: string, valueNode: HTMLElement): void => {
    grid.appendChild(
      el("div", { className: "atv-info-label", text: label })
    );
    grid.appendChild(valueNode);
  };

  const info = data.info;

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

  if (data.isTV) {
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

  if (info.aliases) {
    addRow("又名", textValue(info.aliases));
  }
  if (info.imdb) {
    const wrap = el("div", { className: "atv-info-value" });
    if (RE_IMDB_LINK.test(info.imdb)) {
      wrap.appendChild(
        el(
          "a",
          {
            href: `https://www.imdb.com/title/${info.imdb}/`,
            text: info.imdb,
            target: "_blank",
            rel: "noopener",
          },
          [el("span", { html: ICON_ARROW })]
        )
      );
    } else {
      wrap.textContent = info.imdb;
    }
    addRow("IMDb", wrap);
  }

  if (data.awards?.length) {
    for (const a of data.awards) {
      const value = el("div", { className: "atv-info-value" });
      if (a.name) {
        value.appendChild(el("div", { text: a.name }));
      }
      if (a.person) {
        const personLine = el("div", {
          attrs: {
            style:
              "font-size:13px;color:var(--atv-text-tertiary);margin-top:2px",
          },
        });
        if (a.personLink) {
          personLine.appendChild(
            el("a", {
              text: a.person,
              href: a.personLink,
              target: "_blank",
              rel: "noopener",
            })
          );
        } else {
          personLine.textContent = a.person;
        }
        value.appendChild(personLine);
      }
      const label = el("div", {
        className: "atv-info-label",
        attrs: { style: "color:var(--atv-rating-gold)" },
      });
      if (a.orgLink) {
        label.appendChild(
          el("a", {
            text: a.org,
            href: a.orgLink,
            target: "_blank",
            rel: "noopener",
            attrs: { style: "color:inherit" },
          })
        );
      } else {
        label.textContent = a.org;
      }
      grid.appendChild(label);
      grid.appendChild(value);
    }
  }

  if (!grid.children.length) {
    return null;
  }
  sec.appendChild(grid);
  return sec;
}

/* ── Exports ──────────────────────────────────────────── */

export { buildDetails };
