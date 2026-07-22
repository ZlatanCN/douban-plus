import type { JSX } from "preact";

import {
  LogoDouban,
  LogoImdb,
  LogoMetacritic,
  LogoRT,
} from "@/shared/components/common/icons";

const LOGO_MAP: Record<string, JSX.Element> = {
  douban: <LogoDouban />,
  imdb: <LogoImdb />,
  metacritic: <LogoMetacritic />,
  rt: <LogoRT />,
};

type RatingLogoProps = {
  name: keyof typeof LOGO_MAP;
};

const RatingLogo = ({ name }: RatingLogoProps) => (
  <div class="atv-rating-panel-logo">{LOGO_MAP[name]}</div>
);

export { RatingLogo };
export type { RatingLogoProps };
