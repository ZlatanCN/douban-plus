import type { ComponentChildren } from "preact";

import { RE_SEASON_SUFFIX } from "@/modules/subject/constants";
import type { InfoBlock } from "@/modules/subject/domain";

type HeroMetaProps = {
  info: Pick<
    InfoBlock,
    "country" | "episodeRuntime" | "episodes" | "genres" | "runtime" | "seasons"
  >;
  isTV: boolean;
  leading?: ComponentChildren;
  year: string;
};

const HeroMeta = ({ info, isTV, leading, year }: HeroMetaProps) => {
  const metaParts: string[] = [];

  if (year) {
    metaParts.push(year);
  }
  if (isTV) {
    const episodeParts: string[] = [];
    if (info.seasons) {
      episodeParts.push(
        info.seasons + (RE_SEASON_SUFFIX.test(info.seasons) ? "季" : "")
      );
    }
    if (info.episodes) {
      episodeParts.push(
        info.episodes + (RE_SEASON_SUFFIX.test(info.episodes) ? "集" : "")
      );
    }
    if (episodeParts.length) {
      metaParts.push(episodeParts.join(" · "));
    } else if (info.episodeRuntime) {
      metaParts.push(info.episodeRuntime);
    }
  } else if (info.runtime) {
    metaParts.push(info.runtime);
  }
  if (info.country) {
    metaParts.push(info.country);
  }

  return (
    <div class="atv-hero-meta">
      {leading}
      {metaParts.map((part) => (
        <span class="atv-meta-dot" key={part}>
          {part}
        </span>
      ))}
      {info.genres.length ? (
        <span class="atv-meta-chips">
          {info.genres.map((genre) => (
            <span class="atv-chip" key={genre}>
              {genre}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
};

export { HeroMeta };
export type { HeroMetaProps };
