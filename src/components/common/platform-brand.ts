import type { ComponentType, JSX } from "preact";

import {
  LogoAbc,
  LogoAmc,
  LogoAppleTv,
  LogoBbc,
  LogoBilibili,
  LogoBilibiliCombined,
  LogoCbs,
  LogoCctv,
  LogoChannel4,
  LogoCw,
  LogoDiscoveryPlus,
  LogoDisneyPlus,
  LogoFox,
  LogoFx,
  LogoHbo,
  LogoHboMax,
  LogoHulu,
  LogoIqiyi,
  LogoIqiyiCombined,
  LogoItvx,
  LogoMangoTv,
  LogoMangoTvCombined,
  LogoNbc,
  LogoNhk,
  LogoShowtime,
  LogoSbs,
  LogoTencentCombined,
  LogoTencentTv,
  LogoTvn,
  LogoUsa,
  LogoNetflix,
  LogoParamountPlus,
  LogoPeacock,
  LogoPrimeVideo,
  LogoTubi,
  LogoVimeo,
  LogoYouku,
  LogoYoukuCombined,
  LogoYouTube,
} from "./icons";

type PlatformBrandKey =
  | "abc"
  | "amc"
  | "apple-tv"
  | "bbc"
  | "bilibili"
  | "cbs"
  | "cctv"
  | "channel-4"
  | "cw"
  | "discovery-plus"
  | "disney-plus"
  | "fox"
  | "fx"
  | "hbo"
  | "hbo-max"
  | "hulu"
  | "iqiyi"
  | "itvx"
  | "mango-tv"
  | "migu"
  | "nbc"
  | "nhk"
  | "netflix"
  | "paramount-plus"
  | "peacock"
  | "prime-video"
  | "sbs"
  | "showtime"
  | "tencent-video"
  | "tubi"
  | "tvn"
  | "usa"
  | "vimeo"
  | "youku"
  | "youtube";

type PlatformBrand = {
  aliases: string[];
  color: string;
  colorMode?: "intrinsic" | "catalog";
  Icon?: ComponentType<JSX.IntrinsicElements["svg"]>;
  heroIcon?: ComponentType<JSX.IntrinsicElements["svg"]>;
  key: PlatformBrandKey;
  label: string;
  presentation?: "wordmark";
  surface: "dark" | "paper";
};

const PLATFORM_BRANDS: PlatformBrand[] = [
  {
    Icon: LogoAbc,
    aliases: [
      "abc",
      "abc电视台",
      "abc 电视台",
      "american broadcasting company",
    ],
    color: "#07111E",
    key: "abc",
    label: "ABC",
    surface: "dark",
  },
  {
    Icon: LogoAmc,
    aliases: ["amc"],
    color: "#ffffff",
    key: "amc",
    label: "AMC",
    surface: "dark",
  },
  {
    Icon: LogoDiscoveryPlus,
    aliases: ["discovery+", "discovery plus", "discoveryplus"],
    color: "#34A65C",
    colorMode: "intrinsic",
    key: "discovery-plus",
    label: "Discovery+",
    surface: "dark",
  },
  {
    Icon: LogoDisneyPlus,
    aliases: ["disney+", "disney plus", "disneyplus"],
    color: "#113CCF",
    key: "disney-plus",
    label: "Disney+",
    surface: "dark",
  },
  {
    Icon: LogoBilibiliCombined,
    aliases: ["哔哩哔哩", "bilibili", "b站", "b 站"],
    color: "#00A1D6",
    colorMode: "intrinsic",
    heroIcon: LogoBilibili,
    key: "bilibili",
    label: "哔哩哔哩",
    surface: "dark",
  },
  {
    Icon: LogoBbc,
    aliases: ["bbc", "bbc电视台", "bbc 电视台"],
    color: "#ffffff",
    key: "bbc",
    label: "BBC",
    presentation: "wordmark",
    surface: "dark",
  },
  {
    Icon: LogoPrimeVideo,
    aliases: ["prime video", "primevideo"],
    color: "#0779ff",
    key: "prime-video",
    label: "Prime Video",
    surface: "dark",
  },
  {
    Icon: LogoIqiyiCombined,
    aliases: ["爱奇艺", "iqiyi", "iQIYI"],
    color: "#00DC5A",
    colorMode: "intrinsic",
    heroIcon: LogoIqiyi,
    key: "iqiyi",
    label: "爱奇艺",
    presentation: "wordmark",
    surface: "dark",
  },
  {
    Icon: LogoTencentCombined,
    aliases: ["腾讯视频", "tencent video", "tencent tv", "wetv"],
    color: "#00A2FF",
    colorMode: "intrinsic",
    heroIcon: LogoTencentTv,
    key: "tencent-video",
    label: "腾讯视频",
    surface: "dark",
  },
  {
    Icon: LogoYoukuCombined,
    aliases: ["优酷", "youku"],
    color: "#00A6FF",
    colorMode: "intrinsic",
    heroIcon: LogoYouku,
    key: "youku",
    label: "优酷",
    surface: "dark",
  },
  {
    Icon: LogoMangoTvCombined,
    aliases: ["芒果TV", "芒果台", "mango tv", "mgtv", "湖南卫视/芒果TV"],
    color: "#FF5F00",
    colorMode: "intrinsic",
    heroIcon: LogoMangoTv,
    key: "mango-tv",
    label: "芒果TV",
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
    Icon: LogoNbc,
    aliases: ["nbc"],
    color: "#6e55dc",
    colorMode: "intrinsic",
    key: "nbc",
    label: "NBC",
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
    aliases: ["paramount+", "Paramount Network"],
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
  {
    Icon: LogoCbs,
    aliases: ["cbs"],
    color: "#033963",
    key: "cbs",
    label: "CBS",
    surface: "dark",
  },
  {
    Icon: LogoCctv,
    aliases: ["cctv", "中国中央电视台", "央视", "中央电视台"],
    color: "#E80413",
    colorMode: "intrinsic",
    key: "cctv",
    label: "CCTV",
    presentation: "wordmark",
    surface: "dark",
  },
  {
    Icon: LogoFox,
    aliases: ["fox"],
    color: "#FF5027",
    colorMode: "intrinsic",
    key: "fox",
    label: "FOX",
    surface: "dark",
  },
  {
    Icon: LogoFx,
    aliases: ["fx"],
    color: "#ffffff",
    key: "fx",
    label: "FX",
    surface: "dark",
  },
  {
    Icon: LogoShowtime,
    aliases: ["showtime", "sho"],
    color: "#B10000",
    key: "showtime",
    label: "Showtime",
    surface: "dark",
  },
  {
    Icon: LogoPeacock,
    aliases: ["peacock", "peacock tv"],
    color: "#0066FF",
    key: "peacock",
    label: "Peacock",
    surface: "dark",
  },
  {
    Icon: LogoCw,
    aliases: ["cw", "the cw"],
    color: "#ff4500",
    key: "cw",
    label: "The CW",
    surface: "dark",
  },
  {
    Icon: LogoItvx,
    aliases: ["itv", "itvx", "itv x"],
    color: "#DEEB52",
    key: "itvx",
    label: "ITVX",
    surface: "dark",
  },
  {
    Icon: LogoChannel4,
    aliases: ["channel 4", "channel4", "ch4"],
    color: "#AAFF89",
    key: "channel-4",
    label: "Channel 4",
    surface: "dark",
  },
  {
    Icon: LogoSbs,
    aliases: ["sbs", "sbs korea", "서울방송"],
    color: "#005293",
    key: "sbs",
    label: "SBS",
    surface: "dark",
  },
  {
    Icon: LogoTvn,
    aliases: ["tvn", "tv n"],
    color: "#E80328",
    key: "tvn",
    label: "tvN",
    surface: "dark",
  },
  {
    Icon: LogoNhk,
    aliases: ["nhk", "日本放送協会"],
    color: "#808080",
    key: "nhk",
    label: "NHK",
    surface: "dark",
  },
  {
    Icon: LogoUsa,
    aliases: ["usa", "usa network"],
    color: "#f83837",
    key: "usa",
    label: "USA",
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
