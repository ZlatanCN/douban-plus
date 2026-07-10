import { useEffect, useState } from "preact/hooks";

import { fetchAvatarUrls } from "@/api/avatar";
import type { Comment } from "@/types";

const useAvatarUrls = (comments: Comment[]): Map<string, string> => {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    let active = true;
    const links = comments.map((comment) => comment.link).filter(Boolean);
    if (links.length === 0) {
      setUrls(new Map());
      return () => {
        active = false;
      };
    }

    void (async () => {
      const nextUrls = await fetchAvatarUrls(links);
      if (active) {
        setUrls(nextUrls);
      }
    })();

    return () => {
      active = false;
    };
  }, [comments]);

  return urls;
};

export { useAvatarUrls };
