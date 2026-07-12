import type { ComponentType, JSX } from "preact";

import {
  LogoAmc,
  LogoAppleTv,
  LogoBilibiliCombined,
  LogoDisneyPlus,
  LogoHbo,
  LogoHboMax,
  LogoHulu,
  LogoIqiyiCombined,
  LogoNetflix,
  LogoParamountPlus,
  LogoPrimeVideo,
  LogoTencentCombined,
  LogoTubi,
  LogoVimeo,
  LogoYoukuCombined,
  LogoYouTube,
} from "./icons";

type PlatformBrandKey =
  | "amc"
  | "apple-tv"
  | "bilibili"
  | "disney-plus"
  | "hbo"
  | "hbo-max"
  | "hulu"
  | "iqiyi"
  | "migu"
  | "netflix"
  | "paramount-plus"
  | "prime-video"
  | "tencent-video"
  | "tubi"
  | "vimeo"
  | "youku"
  | "youtube";

type PlatformBrand = {
  aliases: string[];
  color: string;
  colorMode?: "intrinsic" | "catalog";
  Icon?: ComponentType<JSX.IntrinsicElements["svg"]>;
  key: PlatformBrandKey;
  label: string;
  presentation?: "wordmark";
  surface: "dark" | "paper";
};

const PLATFORM_BRANDS: PlatformBrand[] = [
  {
    Icon: LogoAmc,
    aliases: ["amc"],
    color: "#000000",
    key: "amc",
    label: "AMC",
    surface: "paper",
  },
  {
    Icon: LogoDisneyPlus,
    aliases: ["disney+", "disney plus", "disneyplus"],
    color: "#113CCF",
    key: "disney-plus",
    label: "Disney+",
    presentation: "wordmark",
    surface: "dark",
  },
  {
    Icon: LogoBilibiliCombined,
    aliases: ["哔哩哔哩", "bilibili", "b站", "b 站"],
    color: "#FF5588",
    colorMode: "intrinsic",
    key: "bilibili",
    label: "哔哩哔哩",
    surface: "dark",
  },
  {
    Icon: LogoPrimeVideo,
    aliases: ["prime video", "primevideo"],
    color: "#00A8E1",
    colorMode: "intrinsic",
    key: "prime-video",
    label: "Prime Video",
    presentation: "wordmark",
    surface: "paper",
  },
  {
    Icon: LogoIqiyiCombined,
    aliases: ["爱奇艺", "iqiyi", "iQIYI"],
    color: "#00DC5A",
    colorMode: "intrinsic",
    key: "iqiyi",
    label: "爱奇艺",
    surface: "dark",
  },
  {
    Icon: LogoTencentCombined,
    aliases: ["腾讯视频", "tencent video"],
    color: "#00A2FF",
    colorMode: "intrinsic",
    key: "tencent-video",
    label: "腾讯视频",
    surface: "dark",
  },
  {
    Icon: LogoYoukuCombined,
    aliases: ["优酷", "youku"],
    color: "#00A6FF",
    colorMode: "intrinsic",
    key: "youku",
    label: "优酷",
    surface: "dark",
  },
  {
    aliases: ["咪咕视频", "咪咕", "migu"],
    color: "#F04B23",
    key: "migu",
    label: "咪咕视频",
    surface: "dark",
  },
  {
    Icon: LogoHulu,
    aliases: ["hulu"],
    color: "#1CE783",
    colorMode: "intrinsic",
    key: "hulu",
    label: "Hulu",
    presentation: "wordmark",
    surface: "dark",
  },
  {
    Icon: LogoNetflix,
    aliases: ["netflix"],
    color: "#E50914",
    colorMode: "intrinsic",
    key: "netflix",
    label: "Netflix",
    surface: "dark",
  },
  {
    Icon: LogoYouTube,
    aliases: ["youtube", "youtube tv"],
    color: "#FF0000",
    key: "youtube",
    label: "YouTube",
    surface: "dark",
  },
  {
    Icon: LogoAppleTv,
    aliases: ["apple tv", "apple tv+"],
    color: "#F5F5F7",
    key: "apple-tv",
    label: "Apple TV",
    surface: "dark",
  },
  {
    Icon: LogoHbo,
    aliases: ["hbo"],
    color: "#F5F5F7",
    key: "hbo",
    label: "HBO",
    surface: "dark",
  },
  {
    Icon: LogoHboMax,
    aliases: ["hbo max", "max"],
    color: "#8A7CFF",
    key: "hbo-max",
    label: "HBO Max",
    surface: "dark",
  },
  {
    Icon: LogoParamountPlus,
    aliases: ["paramount+"],
    color: "#0064FF",
    key: "paramount-plus",
    label: "Paramount+",
    surface: "dark",
  },
  {
    Icon: LogoTubi,
    aliases: ["tubi"],
    color: "#7408FF",
    key: "tubi",
    label: "Tubi",
    surface: "dark",
  },
  {
    Icon: LogoVimeo,
    aliases: ["vimeo"],
    color: "#1AB7EA",
    key: "vimeo",
    label: "Vimeo",
    surface: "dark",
  },
];

const normalizePlatformName = (value: string): string =>
  value.toLowerCase().replaceAll(/\s+/gu, "");

const findPlatformBrandByExactName = (value: string): PlatformBrand | null => {
  const normalized = normalizePlatformName(value);
  return (
    PLATFORM_BRANDS.find((brand) =>
      brand.aliases.some((alias) => normalizePlatformName(alias) === normalized)
    ) ?? null
  );
};

const findPlatformBrandByContainedName = (
  value: string
): PlatformBrand | null => {
  const normalized = normalizePlatformName(value);
  return (
    PLATFORM_BRANDS.find((brand) =>
      brand.aliases.some((alias) =>
        normalized.includes(normalizePlatformName(alias))
      )
    ) ?? null
  );
};

export {
  findPlatformBrandByContainedName,
  findPlatformBrandByExactName,
  normalizePlatformName,
  PLATFORM_BRANDS,
};
export type { PlatformBrand, PlatformBrandKey };
