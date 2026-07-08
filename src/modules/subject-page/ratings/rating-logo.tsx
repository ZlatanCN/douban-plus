import type { JSX } from "preact";

import {
  LogoDouban,
  LogoImdb,
  LogoMetacritic,
  LogoRT,
} from "../../../components/common/icons";

const LOGO_MAP: Record<string, JSX.Element> = {
  douban: <LogoDouban />,
  imdb: <LogoImdb />,
  metacritic: <LogoMetacritic />,
  rt: <LogoRT />,
};

interface RatingLogoProps {
  name: keyof typeof LOGO_MAP;
}

const RatingLogo = ({ name }: RatingLogoProps) => (
  <div class="atv-rating-panel-logo">{LOGO_MAP[name]}</div>
);

export { RatingLogo, LOGO_MAP };
export type { RatingLogoProps };
