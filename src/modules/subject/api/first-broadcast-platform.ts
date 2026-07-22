import { extractFirstBroadcastPlatform } from "@/modules/subject/extract/first-broadcast-platform";
import { gmGet } from "@/shared/utils/request";

const fetchFirstBroadcastPlatform = async (
  subjectId: string,
  referer: string = location.href
): Promise<string | null> => {
  if (!subjectId) {
    return null;
  }

  try {
    const html = await gmGet(
      `https://movie.douban.com/subject/${encodeURIComponent(subjectId)}/edit`,
      referer
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    return extractFirstBroadcastPlatform(doc);
  } catch {
    return null;
  }
};

export { fetchFirstBroadcastPlatform };
