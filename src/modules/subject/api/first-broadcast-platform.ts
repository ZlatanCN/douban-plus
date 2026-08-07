import { gmGet } from "@/shared/utils/request";

const extractFirstBroadcastPlatform = (doc: Document): string | null => {
  const label = [...doc.querySelectorAll("label")].find(
    (candidate) => candidate.textContent?.trim() === "电视台"
  );
  if (!label?.htmlFor) {
    return null;
  }

  const input = [...doc.querySelectorAll<HTMLInputElement>("input")].find(
    (candidate) => candidate.id === label.htmlFor
  );
  const platform = input?.value.trim();
  return platform || null;
};

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

export { extractFirstBroadcastPlatform, fetchFirstBroadcastPlatform };
