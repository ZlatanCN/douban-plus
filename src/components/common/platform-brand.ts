import type { ComponentType, JSX } from "preact";

import {
  LogoAppleTv,
  LogoBilibiliCombined,
  LogoHbo,
  LogoHboMax,
  LogoIqiyiCombined,
  LogoNetflix,
  LogoParamountPlus,
  LogoTencentCombined,
  LogoTubi,
  LogoVimeo,
  LogoYoukuCombined,
  LogoYouTube,
} from "./icons";

type PlatformBrandKey =
  | "apple-tv"
  | "bilibili"
  | "hbo"
  | "hbo-max"
  | "iqiyi"
  | "migu"
  | "netflix"
  | "paramount-plus"
  | "tencent-video"
  | "tubi"
  | "vimeo"
  | "youku"
  | "youtube";

type PlatformBrand = {
  aliases: string[];
  color: string;
  Icon?: ComponentType<JSX.IntrinsicElements["svg"]>;
  key: PlatformBrandKey;
  label: string;
};

const PLATFORM_BRANDS: PlatformBrand[] = [
  {
    Icon: LogoBilibiliCombined,
    aliases: ["哔哩哔哩", "bilibili", "b站", "b 站"],
    color: "#FF5588",
    key: "bilibili",
    label: "哔哩哔哩",
  },
  {
    Icon: LogoIqiyiCombined,
    aliases: ["爱奇艺", "iqiyi", "iQIYI"],
    color: "#00DC5A",
    key: "iqiyi",
    label: "爱奇艺",
  },
  {
    Icon: LogoTencentCombined,
    aliases: ["腾讯视频", "tencent video"],
    color: "#00A2FF",
    key: "tencent-video",
    label: "腾讯视频",
  },
  {
    Icon: LogoYoukuCombined,
    aliases: ["优酷", "youku"],
    color: "#00A6FF",
    key: "youku",
    label: "优酷",
  },
  {
    aliases: ["咪咕视频", "咪咕", "migu"],
    color: "#F04B23",
    key: "migu",
    label: "咪咕视频",
  },
  {
    Icon: LogoNetflix,
    aliases: ["netflix"],
    color: "#E50914",
    key: "netflix",
    label: "Netflix",
  },
  {
    Icon: LogoYouTube,
    aliases: ["youtube", "youtube tv"],
    color: "#FF0000",
    key: "youtube",
    label: "YouTube",
  },
  {
    Icon: LogoAppleTv,
    aliases: ["apple tv", "apple tv+"],
    color: "#F5F5F7",
    key: "apple-tv",
    label: "Apple TV",
  },
  {
    Icon: LogoHbo,
    aliases: ["hbo"],
    color: "#F5F5F7",
    key: "hbo",
    label: "HBO",
  },
  {
    Icon: LogoHboMax,
    aliases: ["hbo max", "max"],
    color: "#8A7CFF",
    key: "hbo-max",
    label: "HBO Max",
  },
  {
    Icon: LogoParamountPlus,
    aliases: ["paramount+"],
    color: "#0064FF",
    key: "paramount-plus",
    label: "Paramount+",
  },
  {
    Icon: LogoTubi,
    aliases: ["tubi"],
    color: "#7408FF",
    key: "tubi",
    label: "Tubi",
  },
  {
    Icon: LogoVimeo,
    aliases: ["vimeo"],
    color: "#1AB7EA",
    key: "vimeo",
    label: "Vimeo",
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
